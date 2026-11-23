import unittest
from app.extractors.manager import generate_contextual_reviews_for_product
from app.schemas.review import BatchReviewInput, SingleReviewInput
from app.services.analysis_service import analysis_service


class TestAuthenticityEngine(unittest.TestCase):
    """
    Unit tests for flagship brand protection, counterfeit detection,
    and high-capacity review batch analysis.
    """

    def test_flagship_apple_authenticity(self):
        reviews_data = generate_contextual_reviews_for_product("Apple iPhone 17 Pro", "https://example.com/iphone-17", target_count=150)
        self.assertGreaterEqual(len(reviews_data), 100)

        rev_objs = [
            SingleReviewInput(
                review_id=r.get("review_id", f"rev_{i}"),
                review_text=r["review_text"],
                rating=r.get("rating", 5.0),
                reviewer_id=r.get("author", "Verified Buyer"),
                verified_purchase=r.get("verified_purchase", True)
            )
            for i, r in enumerate(reviews_data)
        ]

        batch = BatchReviewInput(
            product_name="Apple iPhone 17 Pro",
            product_url="https://example.com/iphone-17",
            platform="Amazon India",
            brand="Apple",
            product_rating=4.7,
            reviews=rev_objs
        )

        res = analysis_service.run_full_analysis(batch)
        self.assertGreaterEqual(res.summary.review_trust_score, 80.0)
        self.assertEqual(res.summary.product_authenticity_status, "Verified Authentic Listing")

    def test_counterfeit_replica_penalty(self):
        replica_name = "first copy replica iphone 15 pro max clone"
        reviews_data = generate_contextual_reviews_for_product(replica_name, "https://example.com/replica-iphone", target_count=100)
        
        rev_objs = [
            SingleReviewInput(
                review_id=r.get("review_id", f"rev_{i}"),
                review_text=r["review_text"],
                rating=r.get("rating", 5.0),
                reviewer_id=r.get("author", "Verified Buyer"),
                verified_purchase=r.get("verified_purchase", True)
            )
            for i, r in enumerate(reviews_data)
        ]

        batch = BatchReviewInput(
            product_name=replica_name,
            product_url="https://example.com/replica-iphone",
            platform="E-Commerce Platform",
            brand="Replica",
            product_rating=3.2,
            reviews=rev_objs
        )

        res = analysis_service.run_full_analysis(batch)
        self.assertLessEqual(res.summary.review_trust_score, 50.0)
        self.assertIn("Counterfeit", res.summary.product_authenticity_status)

    def test_scaling_up_to_500_reviews(self):
        reviews_data = generate_contextual_reviews_for_product("boAt Airdopes 141", "https://example.com/boat-airdopes", target_count=500)
        self.assertEqual(len(reviews_data), 500)


if __name__ == "__main__":
    unittest.main()
