import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Fast, zero-network sentiment analyzer for serverless and container deployments
class SentimentAnalyzer:
    def __init__(self):
        self.vader = None
        try:
            from nltk.sentiment.vader import SentimentIntensityAnalyzer
            self.vader = SentimentIntensityAnalyzer()
            custom_lexicon = {
                "knockoff": -2.8,
                "counterfeit": -3.0,
                "flawless": 2.5,
                "rattle": -1.8,
                "creak": -1.5,
                "lag": -1.8,
                "sturdy": 2.0,
                "drains": -2.0,
                "muffled": -2.2,
                "bleeding": -2.0,
                "disappointed": -2.5,
                "game changer": 2.5
            }
            self.vader.lexicon.update(custom_lexicon)
        except Exception:
            self.vader = None

        # Robust built-in polarity lexicon (instant zero-dependency evaluation)
        self.pos_words = {
            "good", "great", "excellent", "best", "love", "awesome", "perfect", "sturdy",
            "crisp", "flawless", "durable", "clear", "smooth", "comfortable", "reliable",
            "fast", "satisfied", "genuine", "original", "premium", "superb", "impressive",
            "punchy", "decent", "recommend", "recommended", "value", "happy", "pleased"
        }
        self.neg_words = {
            "bad", "poor", "terrible", "worst", "hate", "awful", "broken", "fake", "counterfeit",
            "drains", "drain", "dead", "lag", "loose", "rattle", "creak", "muffled", "bleeding",
            "flicker", "disappointed", "defective", "waste", "useless", "scam", "cheat", "cheat",
            "heating", "overheat", "overheating", "stopped", "stopped working", "garbage", "trash"
        }

    def analyze_review(self, text: str, rating: Optional[float] = None) -> Dict[str, Any]:
        """
        Analyzes sentiment of review text and checks for rating-sentiment mismatch.
        """
        if self.vader:
            scores = self.vader.polarity_scores(text)
            compound = scores["compound"]
        else:
            # Fallback heuristic if VADER lexicon unavailable
            words = [w.strip(".,!?\"'") for w in text.lower().split() if w.strip(".,!?\"'")]
            pos_matches = sum(1 for w in words if w in self.pos_words)
            neg_matches = sum(1 for w in words if w in self.neg_words)
            total_matches = pos_matches + neg_matches
            if total_matches > 0:
                compound = (pos_matches - neg_matches) / total_matches
            elif rating is not None:
                compound = 0.5 if rating >= 4.0 else (-0.5 if rating <= 2.0 else 0.0)
            else:
                compound = 0.0
            scores = {
                "pos": round(pos_matches / max(len(words), 1), 3),
                "neg": round(neg_matches / max(len(words), 1), 3),
                "neu": round(max(0.0, 1.0 - ((pos_matches + neg_matches) / max(len(words), 1))), 3)
            }
        
        if compound >= 0.15:
            sentiment_label = "Positive"
        elif compound <= -0.15:
            sentiment_label = "Negative"
        else:
            sentiment_label = "Neutral"

        # Check for rating mismatch
        rating_mismatch = False
        mismatch_explanation = None

        if rating is not None:
            # High star rating (4.0 or 5.0) but negative review text
            if rating >= 4.0 and compound <= -0.25:
                rating_mismatch = True
                mismatch_explanation = f"Rating ({rating}★) contradicts strongly negative review text (polarity: {compound:.2f})"
            # Low star rating (1.0 or 2.0) but overwhelmingly positive text
            elif rating <= 2.0 and compound >= 0.50:
                rating_mismatch = True
                mismatch_explanation = f"Rating ({rating}★) contradicts overwhelmingly positive review text (polarity: {compound:.2f})"

        return {
            "sentiment": sentiment_label,
            "sentiment_score": round(compound, 3),
            "pos": round(scores["pos"], 3),
            "neg": round(scores["neg"], 3),
            "neu": round(scores["neu"], 3),
            "rating_mismatch": rating_mismatch,
            "mismatch_explanation": mismatch_explanation
        }

sentiment_analyzer = SentimentAnalyzer()
