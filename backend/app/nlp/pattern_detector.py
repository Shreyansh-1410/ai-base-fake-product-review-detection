from typing import List, Dict, Any, Tuple
from collections import Counter
from app.schemas.analysis import SuspiciousPositiveReviewItem
from app.ml.preprocessing import PUFFERY_WORDS

def compute_jaccard_similarity(text_a: str, text_b: str) -> float:
    words_a = set(text_a.lower().split())
    words_b = set(text_b.lower().split())
    if not words_a or not words_b:
        return 0.0
    intersection = len(words_a.intersection(words_b))
    union = len(words_a.union(words_b))
    return intersection / union

class PatternDetector:
    def __init__(self):
        pass

    def detect_near_duplicates(self, reviews: List[Dict[str, Any]], threshold: float = 0.70) -> List[Dict[str, Any]]:
        """
        Detects pairs of reviews with unusually high text overlap (bot/campaign syndication).
        Optimized with precomputed sets and length filtering for lightning-fast scaling up to 1,000+ reviews.
        """
        duplicates = []
        n = len(reviews)
        word_sets = [set(r["review_text"].lower().split()) for r in reviews]
        max_dups = 150

        for i in range(n):
            set_a = word_sets[i]
            len_a = len(set_a)
            if len_a == 0:
                continue

            for j in range(i + 1, n):
                set_b = word_sets[j]
                len_b = len(set_b)
                if len_b == 0:
                    continue

                # Jaccard mathematical upper bound filter
                min_len = min(len_a, len_b)
                max_len = max(len_a, len_b)
                if (min_len / max_len) < threshold:
                    continue

                intersection = len(set_a.intersection(set_b))
                union = len_a + len_b - intersection
                sim = intersection / union if union > 0 else 0.0

                if sim >= threshold:
                    r_a = reviews[i]
                    r_b = reviews[j]
                    duplicates.append({
                        "review_id_a": r_a.get("review_id", f"rev_{i+1}"),
                        "review_id_b": r_b.get("review_id", f"rev_{j+1}"),
                        "similarity": round(sim, 3),
                        "explanation": f"Near-duplicate text detected ({sim*100:.0f}% word overlap)"
                    })
                    if len(duplicates) >= max_dups:
                        return duplicates
        return duplicates

    def identify_suspicious_positives(
        self,
        reviews_data: List[Dict[str, Any]],
        duplicates: List[Dict[str, Any]],
        contradictions_found: bool = False
    ) -> List[SuspiciousPositiveReviewItem]:
        """
        Dedicated analyzer for Misleading Positive Reviews.
        Evaluates:
        - Model deception probability
        - Superlative / puffery phrase density
        - Near-duplicate clustering
        - Unnatural enthusiasm lacking technical substance
        """
        suspicious_positives: List[SuspiciousPositiveReviewItem] = []
        
        # Build map of duplicates
        dup_map = {}
        for d in duplicates:
            dup_map.setdefault(d["review_id_a"], []).append((d["review_id_b"], d["similarity"]))
            dup_map.setdefault(d["review_id_b"], []).append((d["review_id_a"], d["similarity"]))

        for r in reviews_data:
            text = r["review_text"]
            text_lower = text.lower()
            rating = r.get("rating")
            sentiment = r.get("sentiment", "Neutral")
            sentiment_score = r.get("sentiment_score", 0.0)
            deception_prob = r.get("deception_probability", 0.0)
            model_label = r.get("authenticity_label", "Likely Genuine")
            r_id = r.get("review_id", "rev")

            # Check if review is positive
            is_positive = (
                sentiment == "Positive" or
                sentiment_score >= 0.15 or
                (rating is not None and rating >= 4.0)
            )

            if not is_positive:
                continue

            triggers = []
            
            # 1. Model prediction
            if deception_prob >= 0.58:
                triggers.append(f"Model identified synthetic linguistic markers ({deception_prob*100:.1f}% deception score)")

            # 2. Repeated puffery phrases
            found_puffery = [w for w in PUFFERY_WORDS if w in text_lower]
            if found_puffery:
                triggers.append(f"Unsubstantiated promotional superlatives: {', '.join(found_puffery[:3])}")

            # 3. Near-duplicate copy-paste
            if r_id in dup_map:
                peer_ids = [f"{peer} ({sim*100:.0f}%)" for peer, sim in dup_map[r_id][:2]]
                triggers.append(f"Near-duplicate syndication with review(s): {', '.join(peer_ids)}")

            # 4. Uppercase shouting in positive review
            upper_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
            if upper_ratio > 0.22 and len(text) > 30:
                triggers.append("Excessive uppercase emphasis typical of promotional astroturfing")

            # 5. Rating mismatch in reverse (5-star with empty or generic phrase)
            if rating == 5.0 and len(text.split()) < 7 and found_puffery:
                triggers.append("Ultra-short 5-star review containing generic puffery")

            # Evaluate whether triggers warrant a suspicious positive flag
            # (Requires at least 2 triggers or 1 strong model trigger to prevent false accusations)
            if (len(triggers) >= 2) or (deception_prob >= 0.70 and len(triggers) >= 1):
                explanation = (
                    f"Flagged as a Misleading Positive Review. Evidence: "
                    + "; ".join(triggers) + "."
                )
                suspicious_positives.append(
                    SuspiciousPositiveReviewItem(
                        review_id=r_id,
                        review_text=text,
                        rating=rating,
                        suspicion_indicators=triggers,
                        explanation=explanation,
                        pattern_type="Puffery / Promotional Cluster" if found_puffery else "Syndicated / Coordinated Activity"
                    )
                )

        return suspicious_positives

pattern_detector = PatternDetector()
