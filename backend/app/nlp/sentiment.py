from typing import Dict, Any, Optional, Tuple
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer

try:
    nltk.data.find('sentiment/vader_lexicon.zip')
except LookupError:
    nltk.download('vader_lexicon', quiet=True)

class SentimentAnalyzer:
    def __init__(self):
        try:
            self.vader = SentimentIntensityAnalyzer()
        except LookupError:
            nltk.download('vader_lexicon', quiet=True)
            self.vader = SentimentIntensityAnalyzer()
        # Add tech and domain-specific lexicon updates
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
        scores = self.vader.polarity_scores(text)
        compound = scores["compound"]
        
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
