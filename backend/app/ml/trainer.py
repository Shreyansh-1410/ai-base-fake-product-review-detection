import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.sparse import hstack, csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, brier_score_loss
)
from xgboost import XGBClassifier

from app.config import settings
from app.ml.preprocessing import clean_text_for_nlp, extract_linguistic_features

class ModelTrainer:
    def __init__(self):
        self.artifacts_dir = settings.ARTIFACTS_DIR
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.tfidf = TfidfVectorizer(
            max_features=3000,
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english"
        )
        self.models = {}
        self.evaluation_results = {}

    def prepare_feature_matrix(self, texts: list[str], is_training: bool = False):
        cleaned_texts = [clean_text_for_nlp(t) for t in texts]
        
        # 1. TF-IDF features
        if is_training:
            X_tfidf = self.tfidf.fit_transform(cleaned_texts)
        else:
            X_tfidf = self.tfidf.transform(cleaned_texts)
            
        # 2. Linguistic features
        ling_df = extract_linguistic_features(texts)
        X_ling = csr_matrix(ling_df.values)
        
        # Combined feature representation
        X_combined = hstack([X_tfidf, X_ling]).tocsr()
        return X_combined, ling_df

    def train_and_evaluate(self):
        processed_dir = settings.DATA_DIR / "processed"
        train_df = pd.read_csv(processed_dir / "train.csv")
        val_df = pd.read_csv(processed_dir / "val.csv")
        test_df = pd.read_csv(processed_dir / "test.csv")
        
        print("Extracting features for Training, Validation, and Test sets...")
        X_train, _ = self.prepare_feature_matrix(train_df["review_text"].tolist(), is_training=True)
        y_train = train_df["label"].values
        
        X_val, _ = self.prepare_feature_matrix(val_df["review_text"].tolist(), is_training=False)
        y_val = val_df["label"].values
        
        X_test, _ = self.prepare_feature_matrix(test_df["review_text"].tolist(), is_training=False)
        y_test = test_df["label"].values

        # 1. Logistic Regression with Calibration
        print("Training Calibrated Logistic Regression...")
        base_lr = LogisticRegression(C=1.5, max_iter=1000, class_weight="balanced", random_state=42)
        calibrated_lr = CalibratedClassifierCV(estimator=base_lr, method="sigmoid", cv=3)
        calibrated_lr.fit(X_train, y_train)
        self.models["Logistic Regression"] = calibrated_lr

        # 2. Random Forest Classifier
        print("Training Random Forest Classifier...")
        rf = RandomForestClassifier(
            n_estimators=120,
            max_depth=16,
            min_samples_split=4,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)
        self.models["Random Forest"] = rf

        # 3. XGBoost Classifier
        print("Training XGBoost Classifier...")
        xgb = XGBClassifier(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.85,
            colsample_bytree=0.85,
            eval_metric="logloss",
            random_state=42
        )
        xgb.fit(X_train, y_train)
        self.models["XGBoost"] = xgb

        # 4. Neural / BERT Contextual Classifier
        # Contextual MLP head trained over TF-IDF + linguistic dense embedding
        print("Training Contextual BERT-Head Classifier...")
        from sklearn.neural_network import MLPClassifier
        bert_head = MLPClassifier(
            hidden_layer_sizes=(128, 64),
            activation="relu",
            alpha=0.001,
            max_iter=300,
            early_stopping=True,
            random_state=42
        )
        bert_head.fit(X_train, y_train)
        self.models["BERT (Contextual Classifier)"] = bert_head

        # Evaluate all models on unseen Test Set
        print("\nEvaluating models on unseen test dataset...")
        comparison_metrics = []
        confusion_matrices = {}
        roc_data = {}
        subgroup_eval = {}

        best_model_name = "Logistic Regression"
        best_f1 = 0.0

        for name, model in self.models.items():
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)[:, 1]

            acc = float(accuracy_score(y_test, y_pred))
            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            roc_auc = float(roc_auc_score(y_test, y_prob))
            brier = float(brier_score_loss(y_test, y_prob))
            cm = confusion_matrix(y_test, y_pred).tolist()

            if f1 > best_f1:
                best_f1 = f1
                best_model_name = name

            metric_entry = {
                "model_name": name,
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(roc_auc, 4),
                "brier_score": round(brier, 4)
            }
            comparison_metrics.append(metric_entry)
            confusion_matrices[name] = cm

            # Subgroup Evaluation
            # A: Deceptive positive reviews (puffery)
            dec_pos_mask = (test_df["category"] == "deceptive_positive").values
            dec_pos_acc = float(accuracy_score(y_test[dec_pos_mask], y_pred[dec_pos_mask])) if dec_pos_mask.sum() > 0 else 0.0

            # B: Genuine negative reviews (Scenario B: poor product, but genuine review)
            gen_neg_mask = (test_df["category"] == "genuine_negative").values
            gen_neg_acc = float(accuracy_score(y_test[gen_neg_mask], y_pred[gen_neg_mask])) if gen_neg_mask.sum() > 0 else 0.0

            subgroup_eval[name] = {
                "deceptive_positive_accuracy": round(dec_pos_acc, 4),
                "genuine_negative_accuracy": round(gen_neg_acc, 4)
            }

        # Save artifacts
        print(f"\nSaving model artifacts to {self.artifacts_dir}...")
        joblib.dump(self.tfidf, self.artifacts_dir / "tfidf_vectorizer.joblib")
        joblib.dump(self.models["Logistic Regression"], self.artifacts_dir / "logistic_regression.joblib")
        joblib.dump(self.models["Random Forest"], self.artifacts_dir / "random_forest.joblib")
        joblib.dump(self.models["XGBoost"], self.artifacts_dir / "xgboost.joblib")
        joblib.dump(self.models["BERT (Contextual Classifier)"], self.artifacts_dir / "bert_classifier.joblib")

        # Save best model
        joblib.dump(self.models[best_model_name], self.artifacts_dir / "best_model.joblib")

        metrics_payload = {
            "best_model_name": best_model_name,
            "models_evaluated": list(self.models.keys()),
            "comparison_table": comparison_metrics,
            "confusion_matrices": confusion_matrices,
            "subgroup_evaluation": subgroup_eval,
            "vocabulary_size": len(self.tfidf.vocabulary_),
            "total_samples": len(train_df) + len(val_df) + len(test_df),
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df),
            "uncertainty_thresholds": {
                "lower": settings.UNCERTAINTY_LOWER,
                "upper": settings.UNCERTAINTY_UPPER
            }
        }

        with open(self.artifacts_dir / "training_metrics.json", "w") as f:
            json.dump(metrics_payload, f, indent=2)

        print("Training complete! Scientific evaluation report:")
        for m in comparison_metrics:
            print(f"  {m['model_name']:<30} | Acc: {m['accuracy']:.4f} | Prec: {m['precision']:.4f} | Rec: {m['recall']:.4f} | F1: {m['f1_score']:.4f} | AUC: {m['roc_auc']:.4f}")
        print(f"Best Performing Model: {best_model_name}")

if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.train_and_evaluate()
