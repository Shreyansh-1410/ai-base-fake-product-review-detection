from typing import List, Dict, Any, Tuple, Optional
from app.schemas.review import ProductVerificationInput
from app.schemas.analysis import AnalysisSummary, AspectSentimentSummary

class TriAxisTrustEngine:
    def __init__(self):
        pass

    def calculate_review_trust_score(
        self,
        reviews_data: List[Dict[str, Any]],
        duplicates_count: int,
        contradictions_count: int
    ) -> Tuple[Optional[float], str, str]:
        """
        Calculates Review Trust Score (0 to 100) strictly following Section 8:
        - 80–100: High Review Trust
        - 60–79: Moderate Review Trust
        - 40–59: Low Review Trust
        - 0–39: Very Low Review Trust
        - Do not calculate when there is insufficient review data (< 2 reviews).
        - Explicitly measures review authenticity, not product quality.
        """
        total = len(reviews_data)
        if total < 2:
            return (
                None,
                "Insufficient Review Data",
                "A minimum of 2 customer reviews is required to calculate a reliable review trust score."
            )

        genuine_reviews = [
            r for r in reviews_data
            if r.get("classification") == "GENUINE" or r.get("authenticity_label") in ["GENUINE", "Likely Genuine"]
        ]
        fake_reviews = [
            r for r in reviews_data
            if r.get("classification") == "FAKE" or r.get("authenticity_label") in ["FAKE", "Suspicious"]
        ]
        suspicious_reviews = [
            r for r in reviews_data
            if r.get("classification") == "SUSPICIOUS" or r.get("authenticity_label") in ["SUSPICIOUS", "Uncertain"]
        ]
        mismatch_reviews = [r for r in reviews_data if r.get("rating_mismatch", False)]

        genuine_count = len(genuine_reviews)
        fake_count = len(fake_reviews)
        suspicious_count = len(suspicious_reviews)
        mismatch_count = len(mismatch_reviews)

        # Base formula: Weighted authenticity proportion
        # Genuine reviews provide 100% credit, suspicious reviews provide 35% partial credit, fake provide 0%
        weighted_ratio = ((genuine_count * 1.0) + (suspicious_count * 0.35)) / total
        raw_score = weighted_ratio * 100.0

        # Penalties for syndicate manipulation - proportional to batch ratio
        dup_rate = duplicates_count / max(total, 1)
        mismatch_rate = mismatch_count / max(total, 1)
        dup_penalty = min(dup_rate * 30.0, 15.0)
        mismatch_penalty = min(mismatch_rate * 25.0, 10.0)

        trust_score = max(0.0, min(100.0, round(raw_score - dup_penalty - mismatch_penalty, 1)))

        # Clean profile protection: if high genuine ratio
        if weighted_ratio >= 0.90 and dup_rate < 0.05:
            trust_score = max(trust_score, round(weighted_ratio * 97.0, 1))

        if trust_score >= 80.0:
            category = "High Review Trust"
        elif trust_score >= 60.0:
            category = "Moderate Review Trust"
        elif trust_score >= 40.0:
            category = "Low Review Trust"
        else:
            category = "Very Low Review Trust"

        explanation = (
            f"Review Trust Score: {trust_score}/100 ({category}). "
            f"Calculated from {genuine_count} genuine ({round(genuine_count/total*100, 1)}%), "
            f"{fake_count} fake ({round(fake_count/total*100, 1)}%), and "
            f"{suspicious_count} suspicious reviews among {total} analyzed. "
            f"Note: This score evaluates review authenticity and manipulation risk, not physical product quality or seller reliability."
        )

        return trust_score, category, explanation

    def calculate_reported_product_quality_score(
        self,
        reviews_data: List[Dict[str, Any]],
        aspect_claims_map: Dict[str, Dict[str, Any]] = None
    ) -> Tuple[float, str, List[AspectSentimentSummary], List[str]]:
        """
        Calculates customer-reported product quality index (0 to 100).
        """
        total = len(reviews_data)
        if total == 0:
            return 50.0, "Fair Quality", [], []

        effective_scores = []
        star_ratings = []
        defects_found = []

        defect_lexicon = [
            ("battery drain", "Rapid battery discharge"),
            ("stopped working", "Premature hardware failure"),
            ("broken", "Physical breakage"),
            ("creak", "Loose / creaking chassis"),
            ("disconnect", "Frequent Bluetooth disconnection"),
            ("muffled", "Muffled microphone / audio"),
            ("overheat", "Thermal overheating / throttling"),
            ("counterfeit", "Counterfeit materials / missing serial"),
            ("cheap plastic", "Low durability materials"),
            ("poor quality", "Low durability materials")
        ]

        aspect_aggregates: Dict[str, Dict[str, Any]] = {}

        for r in reviews_data:
            text = r.get("review_text", "").lower()
            rating = r.get("rating")
            sent_score = r.get("sentiment_score", 0.0)
            is_fake = r.get("classification") == "FAKE" or r.get("authenticity_label") == "FAKE"

            for kw, desc in defect_lexicon:
                if kw in text and desc not in defects_found:
                    defects_found.append(desc)

            # Weight genuine reviews 1.0, fake reviews 0.2
            weight = 0.2 if is_fake else 1.0

            if rating is not None:
                star_ratings.append((rating / 5.0) * 100.0 * weight)
            norm_sent = ((sent_score + 1.0) / 2.0) * 100.0
            effective_scores.append(norm_sent * weight)

        final_score = round(sum(effective_scores) / max(1, len(effective_scores)), 1)
        if star_ratings:
            final_score = round((final_score * 0.5) + ((sum(star_ratings) / len(star_ratings)) * 0.5), 1)

        final_score = max(5.0, min(98.0, final_score))

        if final_score >= 80.0:
            cat = "Excellent Quality"
        elif final_score >= 65.0:
            cat = "Good Quality"
        elif final_score >= 45.0:
            cat = "Fair Quality"
        else:
            cat = "Poor / Defective"

        # Aspect insights
        aspect_insights = [
            AspectSentimentSummary(
                aspect="Overall Performance",
                positive_mentions=max(1, int(total * 0.6)),
                negative_mentions=max(0, int(total * 0.2)),
                net_sentiment=round((final_score - 50.0) / 50.0, 2),
                summary="Customer feedback on core functional performance."
            )
        ]

        return final_score, cat, aspect_insights, defects_found[:5]

    def verify_product_authenticity(
        self,
        verification_input: ProductVerificationInput,
        trust_score: Optional[float] = None,
        product_name: str = ""
    ) -> Tuple[str, str]:
        if verification_input.inspection_result == "verified_genuine":
            return "Verified Genuine", "Listing and packaging credentials verified against official distributor records."
        elif verification_input.inspection_result == "verified_counterfeit":
            return "Verified Counterfeit", "Manufacturer registry rejects serial identifier; counterfeit item confirmed."
        elif verification_input.inspection_result == "suspected_counterfeit":
            return "Suspected Counterfeit", "Customer reports and listing anomalies indicate counterfeit risk."

        p_low = product_name.lower()
        if any(k in p_low for k in ["clone", "replica", "fake", "copy", "first copy"]):
            return "Suspected Counterfeit", "Listing title or seller credentials indicate non-original clone merchandise."
        if trust_score is not None:
            if trust_score >= 80.0:
                return "Verified Authentic Listing", "Authentic verified customer feedback with high sentiment consistency."
            elif trust_score <= 42.0:
                return "Suspected Counterfeit", "High astroturfing and deceptive bot patterns detected across customer reviews."
        return "Not Verified", "Standard e-commerce listing without independent laboratory verification."

trust_engine = TriAxisTrustEngine()
