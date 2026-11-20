import re
from typing import Dict, List, Any, Tuple
from app.nlp.sentiment import sentiment_analyzer

def _split_into_sentences(text: str) -> List[str]:
    if not text:
        return []
    try:
        from nltk.tokenize import sent_tokenize
        return sent_tokenize(text)
    except Exception:
        # High-accuracy regex sentence boundary tokenizer fallback
        parts = re.split(r'(?<=[.!?])\s+', text.strip())
        return [p.strip() for p in parts if p.strip()]

ASPECT_KEYWORDS = {
    "Battery": [
        "battery", "battery life", "battery backup", "charge", "charging", "standby",
        "drains", "drain", "mah", "runtime", "hours of battery", "power"
    ],
    "Sound": [
        "sound", "audio", "bass", "treble", "volume", "muffled", "noise cancellation",
        "anc", "microphone", "mic", "earphone", "earbud", "speaker", "voice"
    ],
    "Build Quality": [
        "build", "build quality", "material", "durability", "durable", "plastic",
        "metal", "hinge", "creak", "loose", "sturdy", "counterfeit", "broke", "fragile"
    ],
    "Performance": [
        "performance", "speed", "fast", "slow", "lag", "fps", "gaming", "smooth",
        "throttling", "processor", "ram", "overheat", "fan", "heat"
    ],
    "Display": [
        "display", "screen", "panel", "amoled", "resolution", "brightness",
        "bleeding", "colors", "contrast", "pixels", "flicker"
    ],
    "Camera": [
        "camera", "photo", "photos", "picture", "lens", "sensor", "low light",
        "night mode", "sharpness", "video", "megapixels"
    ],
    "Connectivity": [
        "bluetooth", "wifi", "wi-fi", "connection", "connect", "disconnect",
        "pairing", "sync", "range", "signal", "latency"
    ],
    "Comfort": [
        "comfort", "comfortable", "ergonomic", "fit", "weight", "lightweight",
        "heavy", "cushion", "ears hurt", "sizing"
    ],
    "Delivery & Service": [
        "delivery", "shipping", "packaging", "box", "package", "arrived",
        "customer service", "warranty", "seller", "refund"
    ]
}

class AspectExtractor:
    def __init__(self):
        self.aspect_patterns = {}
        for aspect, keywords in ASPECT_KEYWORDS.items():
            # Create regex with word boundaries
            pattern = re.compile(r"\b(" + "|".join(re.escape(k) for k in keywords) + r")\b", re.IGNORECASE)
            self.aspect_patterns[aspect] = pattern

    def extract_aspect_claims(self, text: str) -> Dict[str, Dict[str, Any]]:
        """
        Parses review into sentences and associates sentences with specific aspects.
        Returns a dict: { aspect: { "claim": sentence, "sentiment": "Positive"|"Negative"|"Neutral", "score": float } }
        """
        sentences = _split_into_sentences(text) if text else []
        aspect_claims = {}

        for sentence in sentences:
            sentence_clean = sentence.strip()
            if not sentence_clean:
                continue

            for aspect, pattern in self.aspect_patterns.items():
                if pattern.search(sentence_clean):
                    sent_info = sentiment_analyzer.analyze_review(sentence_clean)
                    # If aspect already encountered in a previous sentence, append or update with higher magnitude claim
                    if aspect not in aspect_claims:
                        aspect_claims[aspect] = {
                            "claim": sentence_clean,
                            "sentiment": sent_info["sentiment"],
                            "sentiment_score": sent_info["sentiment_score"]
                        }
                    else:
                        # If existing claim was neutral but this sentence has strong polarity, prefer this sentence
                        if abs(sent_info["sentiment_score"]) > abs(aspect_claims[aspect]["sentiment_score"]):
                            aspect_claims[aspect] = {
                                "claim": sentence_clean,
                                "sentiment": sent_info["sentiment"],
                                "sentiment_score": sent_info["sentiment_score"]
                            }

        return aspect_claims

aspect_extractor = AspectExtractor()
