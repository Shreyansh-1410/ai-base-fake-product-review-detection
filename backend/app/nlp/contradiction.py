import re
from typing import List, Dict, Any, Tuple
from app.schemas.analysis import AspectContradictionItem

class ContradictionDetector:
    def __init__(self):
        pass

    def _extract_numeric_entities(self, text: str) -> List[str]:
        """Extracts numeric values with units (e.g., '12 hours', '30 minutes', '2 days')"""
        pattern = re.compile(r"\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|mins?|minutes?|days?|weeks?|months?|seconds?|secs?|mah|%)\b", re.IGNORECASE)
        matches = pattern.findall(text)
        return [f"{num} {unit}" for num, unit in matches]

    def detect_contradictions(self, reviews_with_aspects: List[Dict[str, Any]]) -> List[AspectContradictionItem]:
        """
        Analyzes aspect claims across all reviews to identify direct contradictions.
        Each item in reviews_with_aspects should be:
        {
            "review_id": str,
            "aspect_claims": { aspect: { "claim": str, "sentiment": str, "sentiment_score": float } }
        }
        """
        # Group claims by aspect
        claims_by_aspect: Dict[str, List[Dict[str, Any]]] = {}
        for r in reviews_with_aspects:
            r_id = r.get("review_id", "")
            aspects = r.get("aspect_claims", {})
            for aspect_name, claim_data in aspects.items():
                if aspect_name not in claims_by_aspect:
                    claims_by_aspect[aspect_name] = []
                claims_by_aspect[aspect_name].append({
                    "review_id": r_id,
                    "claim": claim_data["claim"],
                    "sentiment": claim_data["sentiment"],
                    "score": claim_data["sentiment_score"]
                })

        contradictions: List[AspectContradictionItem] = []
        already_paired = set()

        for aspect_name, claim_list in claims_by_aspect.items():
            if len(claim_list) < 2:
                continue

            # Cap pairwise evaluation per aspect to top 60 claims to ensure instant sub-second response on 1,000 reviews
            claims_to_compare = claim_list[:60]

            # Compare pairs of claims from different reviews
            for i in range(len(claims_to_compare)):
                for j in range(i + 1, len(claims_to_compare)):
                    item_a = claims_to_compare[i]
                    item_b = claims_to_compare[j]

                    if item_a["review_id"] == item_b["review_id"]:
                        continue

                    # Check for polarity opposition
                    score_diff = abs(item_a["score"] - item_b["score"])
                    is_polarity_conflict = (
                        (item_a["score"] >= 0.18 and item_b["score"] <= -0.18) or
                        (item_a["score"] <= -0.18 and item_b["score"] >= 0.18)
                    )

                    # Check for numeric disparity with opposing experience
                    nums_a = self._extract_numeric_entities(item_a["claim"])
                    nums_b = self._extract_numeric_entities(item_b["claim"])
                    has_numbers = bool(nums_a and nums_b and nums_a != nums_b)
                    
                    # Numeric disparity is a contradiction only if there's opposing sentiment or dissatisfaction contrast
                    dissatisfaction_words = {"barely", "only", "drain", "drains", "died", "dead", "terrible", "worst", "less than", "poor"}
                    satisfaction_words = {"easily", "lasts", "great", "excellent", "awesome", "solid", "amazing", "good"}
                    
                    text_a_lower = item_a["claim"].lower()
                    text_b_lower = item_b["claim"].lower()
                    
                    sentiment_clash = (
                        (any(w in text_a_lower for w in dissatisfaction_words) and any(w in text_b_lower for w in satisfaction_words)) or
                        (any(w in text_b_lower for w in dissatisfaction_words) and any(w in text_a_lower for w in satisfaction_words))
                    )
                    
                    numeric_conflict = has_numbers and (is_polarity_conflict or sentiment_clash or score_diff >= 0.40)

                    if is_polarity_conflict or numeric_conflict:
                        pair_key = tuple(sorted([item_a["claim"], item_b["claim"]]))
                        if pair_key in already_paired:
                            continue
                        already_paired.add(pair_key)

                        severity = "High" if (score_diff > 0.8 or numeric_conflict) else "Medium"
                        
                        num_info = ""
                        if numeric_conflict:
                            num_info = f" Conflicting metrics reported: ({', '.join(nums_a)}) vs ({', '.join(nums_b)})."

                        explanation = (
                            f"Customers report substantially conflicting {aspect_name.lower()} experiences. "
                            f"Review {item_a['review_id']} reports favorable/different claims ('{item_a['claim'][:90]}...') "
                            f"whereas Review {item_b['review_id']} reports severe issues ('{item_b['claim'][:90]}...').{num_info}"
                        )

                        contradictions.append(
                            AspectContradictionItem(
                                aspect=aspect_name,
                                claim_a=item_a["claim"],
                                claim_b=item_b["claim"],
                                review_id_a=item_a["review_id"],
                                review_id_b=item_b["review_id"],
                                relationship="Contradictory claims",
                                severity=severity,
                                explanation=explanation
                            )
                        )

                        # Limit to top 5 prominent contradictions per aspect to avoid combinatorial clutter
                        if len([c for c in contradictions if c.aspect == aspect_name]) >= 3:
                            break

        return contradictions

contradiction_detector = ContradictionDetector()
