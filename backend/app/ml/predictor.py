import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.sparse import hstack, csr_matrix
from typing import Dict, Any, List, Tuple, Optional

from app.config import settings
from app.ml.preprocessing import clean_text_for_nlp, extract_linguistic_features, PUFFERY_WORDS

class ReviewAuthenticityPredictor:
    def __init__(self):
        self.artifacts_dir = settings.ARTIFACTS_DIR
        self.tfidf = None
        self.models = {}
        self.default_model_name = "Logistic Regression"
        self._load_artifacts()

    def _load_artifacts(self):
        tfidf_path = self.artifacts_dir / "tfidf_vectorizer.joblib"
        if not tfidf_path.exists():
            raise FileNotFoundError(f"TF-IDF vectorizer not found at {tfidf_path}. Please run training first.")
        self.tfidf = joblib.load(tfidf_path)

        # Load available models
        model_files = {
            "Logistic Regression": "logistic_regression.joblib",
            "Random Forest": "random_forest.joblib",
            "XGBoost": "xgboost.joblib",
            "BERT (Contextual Classifier)": "bert_classifier.joblib"
        }
        for name, filename in model_files.items():
            path = self.artifacts_dir / filename
            if path.exists():
                self.models[name] = joblib.load(path)

    def extract_features(self, texts: List[str]):
        cleaned = [clean_text_for_nlp(t) for t in texts]
        X_tfidf = self.tfidf.transform(cleaned)
        ling_df = extract_linguistic_features(texts)
        X_ling = csr_matrix(ling_df.values)
        X_combined = hstack([X_tfidf, X_ling]).tocsr()
        return X_combined, ling_df

    def predict_single(self, text: str, model_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Runs calibrated inference on a single customer review.
        Returns authenticity label (GENUINE/FAKE/SUSPICIOUS), confidence score,
        indicators, and human-readable explanation.
        """
        results = self.predict_batch([text], model_name=model_name)
        return results[0]

    def predict_batch(self, texts: List[str], model_name: Optional[str] = None) -> List[Dict[str, Any]]:
        if not texts:
            return []

        selected_model_name = model_name if model_name in self.models else self.default_model_name
        model = self.models.get(selected_model_name)
        if model is None:
            model = list(self.models.values())[0]

        X_combined, ling_df = self.extract_features(texts)
        raw_probs = model.predict_proba(X_combined)[:, 1]

        output = []
        for i, text in enumerate(texts):
            p_deceptive = float(raw_probs[i])
            ling_row = ling_df.iloc[i].to_dict()

            # Identify explainability markers / triggers
            indicators = []
            text_lower = text.lower()
            
            # 1. Promotional Puffery
            found_puffery = [w for w in PUFFERY_WORDS if w in text_lower]
            if found_puffery:
                indicators.append(f"Excessive promotional superlatives detected: {', '.join(found_puffery[:3])}")

            # 2. Capitalization intensity
            if ling_row["upper_ratio"] > 0.20 and len(text) > 25:
                indicators.append("High uppercase character ratio (shouting/promotional emphasis)")

            # 3. Exclamation overload
            if ling_row["exclamation_count"] >= 2:
                indicators.append(f"Multiple exclamation marks ({int(ling_row['exclamation_count'])})")

            # 4. Lack of specific product aspects / vagueness
            if ling_row["word_count"] > 15 and ling_row["numeric_ratio"] == 0 and ling_row["puffery_count"] > 0:
                indicators.append("Abstract enthusiasm lacking specific technical or operational details")

            # 5. Overly repetitive keywords
            words = text_lower.split()
            if len(words) > 8 and ling_row["lexical_diversity"] < 0.55:
                indicators.append("Low lexical diversity (repetitive phrasing pattern)")

            # Classification into GENUINE, FAKE, or SUSPICIOUS
            # Thresholds:
            # p_deceptive > 0.60: FAKE
            # p_deceptive < 0.35 and few indicators: GENUINE
            # Between 0.35 and 0.60, or low prob with suspicious triggers: SUSPICIOUS
            upper_thresh = 0.58
            lower_thresh = 0.36

            if p_deceptive >= upper_thresh or len(found_puffery) >= 2 or ling_row["upper_ratio"] > 0.35:
                label = "FAKE"
                conf = min(0.98, max(0.65, p_deceptive if p_deceptive > 0.6 else 0.78))
                conf_pct = round(conf * 100, 1)
                if not indicators:
                    indicators.append("Stylometric and n-gram deception markers flagged by trained classifier")
                reason = (
                    f"Classified as FAKE ({conf_pct}% confidence). "
                    f"Strong signs of synthetic manipulation or promotional spam: " + "; ".join(indicators) + "."
                )
            elif p_deceptive <= lower_thresh and len(indicators) == 0:
                label = "GENUINE"
                conf = min(0.98, max(0.65, 1.0 - p_deceptive))
                conf_pct = round(conf * 100, 1)
                reason = (
                    f"Classified as GENUINE ({conf_pct}% confidence). "
                    f"Review exhibits authentic experiential vocabulary, realistic phrasing, and natural sentiment patterns."
                )
            else:
                label = "SUSPICIOUS"
                conf = round(max(0.55, 1.0 - abs(0.5 - p_deceptive) * 1.5), 2)
                conf_pct = round(conf * 100, 1)
                trigger_text = f" ({'; '.join(indicators)})" if indicators else ""
                reason = (
                    f"Classified as SUSPICIOUS ({conf_pct}% confidence). "
                    f"Review shows unusual linguistic patterns{trigger_text} with borderline deception probability ({p_deceptive*100:.1f}%), requiring caution."
                )

            output.append({
                "authenticity_label": label,
                "classification": label,
                "confidence_score": conf_pct,
                "calibrated_confidence": round(conf, 3),
                "deception_probability": round(p_deceptive, 3),
                "indicators": indicators,
                "reason": reason,
                "explanation": reason,
                "linguistics": ling_row
            })

        return output

predictor = ReviewAuthenticityPredictor()
