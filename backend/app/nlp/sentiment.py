import os
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# Support serverless read-only environments (e.g. Vercel, AWS Lambda)
tmp_nltk = Path("/tmp/nltk_data")
if tmp_nltk.exists() or os.name != 'nt':
    if str(tmp_nltk) not in nltk.data.path:
        nltk.data.path.append(str(tmp_nltk))

def _ensure_vader():
    try:
        nltk.data.find('sentiment/vader_lexicon.zip')
    except LookupError:
        try:
            if os.name != 'nt':
                tmp_nltk.mkdir(parents=True, exist_ok=True)
                nltk.download('vader_lexicon', download_dir=str(tmp_nltk), quiet=True)
            else:
                nltk.download('vader_lexicon', quiet=True)
        except Exception:
            try:
                nltk.download('vader_lexicon', quiet=True)
            except Exception:
                pass

_ensure_vader()

class SentimentAnalyzer:
    def __init__(self):
        try:
            self.vader = SentimentIntensityAnalyzer()
        except LookupError:
            _ensure_vader()
            try:
                self.vader = SentimentIntensityAnalyzer()
            except Exception:
                self.vader = None
        # Add tech and domain-specific lexicon updates
        if self.vader:
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

    def analyze_review(self, text: str, rating: Optional[float] = None) -> Dict[str, Any]:
        """
        Analyzes sentiment of review text and checks for rating-sentiment mismatch.
        """
        if self.vader:
            scores = self.vader.polarity_scores(text)
            compound = scores["compound"]
        else:
            # Fallback heuristic if VADER lexicon unavailable
            lower = text.lower()
            pos_words = sum(1 for w in ["good", "great", "excellent", "best", "love", "awesome", "perfect"] if w in lower)
            neg_words = sum(1 for w in ["bad", "poor", "terrible", "worst", "hate", "awful", "broken", "fake"] if w in lower)
            if pos_words > neg_words:
                compound = 0.5
            elif neg_words > pos_words:
                compound = -0.5
            else:
                compound = 0.0
            scores = {"pos": 0.5 if compound > 0 else 0.0, "neg": 0.5 if compound < 0 else 0.0, "neu": 1.0 if compound == 0 else 0.5}
        
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
