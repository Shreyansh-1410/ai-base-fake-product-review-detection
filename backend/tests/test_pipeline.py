import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.ml.preprocessing import clean_text_for_nlp, extract_linguistic_features
from app.ml.predictor import predictor
from app.nlp.sentiment import sentiment_analyzer
from app.nlp.aspect_extractor import aspect_extractor
from app.nlp.contradiction import contradiction_detector
from app.nlp.pattern_detector import pattern_detector
from app.nlp.trust_engine import trust_engine
from app.services.file_parser import parse_uploaded_file

class TestReviewGuardPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_text_cleaning_and_features(self):
        raw = "Check out https://fake.url BUY NOW!!! Best ever product 100%!"
        cleaned = clean_text_for_nlp(raw)
        self.assertNotIn("https://fake.url", cleaned)
        features = extract_linguistic_features([raw])
        self.assertEqual(len(features), 1)
        self.assertGreater(features.iloc[0]["puffery_count"], 0)
        self.assertGreaterEqual(features.iloc[0]["exclamation_count"], 1)

    def test_02_calibrated_ml_prediction(self):
        # Genuine positive
        gen_res = predictor.predict_single(
            "I have been using this laptop for three weeks now. The aluminium finish feels premium and the battery easily lasts 7 hours."
        )
        self.assertEqual(gen_res["authenticity_label"], "Likely Genuine")
        self.assertGreater(gen_res["calibrated_confidence"], 0.70)

        # Deceptive positive (puffery)
        fake_res = predictor.predict_single(
            "BEST PRODUCT EVER IN MY ENTIRE LIFE!! BUY IT NOW YOU WILL NOT REGRET IT AT ALL 100% RECOMMEND TO EVERYONE!!"
        )
        self.assertEqual(fake_res["authenticity_label"], "Suspicious")
        self.assertGreater(fake_res["deception_probability"], 0.70)

        # Scenario B: Genuine negative review on a defective product
        scen_b = predictor.predict_single(
            "Battery drains in less than 40 minutes on a full charge. The case gets uncomfortably warm during charging."
        )
        self.assertEqual(scen_b["authenticity_label"], "Likely Genuine")

    def test_03_sentiment_and_rating_mismatch(self):
        # Negative text with 5-star rating -> mismatch
        res_mismatch = sentiment_analyzer.analyze_review(
            "Very poor quality. Completely disappointed with the tinny sound.", rating=5.0
        )
        self.assertEqual(res_mismatch["sentiment"], "Negative")
        self.assertTrue(res_mismatch["rating_mismatch"])

        # Normal positive
        res_normal = sentiment_analyzer.analyze_review(
            "Excellent build quality and great display clarity.", rating=5.0
        )
        self.assertEqual(res_normal["sentiment"], "Positive")
        self.assertFalse(res_normal["rating_mismatch"])

    def test_04_aspect_claim_extraction(self):
        text = "The battery lasts around 8 hours, but the Bluetooth connectivity frequently drops."
        claims = aspect_extractor.extract_aspect_claims(text)
        self.assertIn("Battery", claims)
        self.assertIn("Connectivity", claims)

    def test_05_aspect_contradiction_detection(self):
        reviews = [
            {
                "review_id": "rev_1",
                "aspect_claims": {
                    "Battery": {"claim": "The battery lasts 12 hours on a single charge.", "sentiment": "Positive", "sentiment_score": 0.8}
                }
            },
            {
                "review_id": "rev_2",
                "aspect_claims": {
                    "Battery": {"claim": "The battery barely lasts 30 minutes before shutting down.", "sentiment": "Negative", "sentiment_score": -0.8}
                }
            }
        ]
        contradictions = contradiction_detector.detect_contradictions(reviews)
        self.assertEqual(len(contradictions), 1)
        self.assertEqual(contradictions[0].aspect, "Battery")
        self.assertEqual(contradictions[0].relationship, "Contradictory claims")

    def test_06_near_duplicate_detection(self):
        reviews = [
            {"review_id": "rev_1", "review_text": "Incredible sound quality and fantastic battery life! Best earbuds ever, highly recommended!"},
            {"review_id": "rev_2", "review_text": "Incredible sound quality and fantastic battery life! Best earbuds ever, highly recommended!"}
        ]
        duplicates = pattern_detector.detect_near_duplicates(reviews)
        self.assertEqual(len(duplicates), 1)
        self.assertGreaterEqual(duplicates[0]["similarity"], 0.90)

    def test_07_all_10_demonstration_scenarios_via_api(self):
        for case_num in range(1, 11):
            case_id = f"case_{case_num}"
            res = self.client.post(f"/api/demo/run/{case_id}")
            self.assertEqual(res.status_code, 200, f"Failed on {case_id}")
            data = res.json()
            self.assertIn("summary", data)
            self.assertIn("reviews", data)
            self.assertGreaterEqual(data["summary"]["review_trust_score"], 0.0)
            self.assertLessEqual(data["summary"]["review_trust_score"], 100.0)

    def test_08_pdf_report_generation(self):
        res = self.client.post("/api/demo/run/case_9")
        anl_id = res.json()["analysis_id"]
        pdf_res = self.client.get(f"/api/reports/{anl_id}/pdf")
        self.assertEqual(pdf_res.status_code, 200)
        self.assertEqual(pdf_res.headers.get("content-type"), "application/pdf")
        self.assertGreater(len(pdf_res.content), 1000)

if __name__ == "__main__":
    unittest.main()
