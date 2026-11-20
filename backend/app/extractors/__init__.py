from app.extractors.base import BaseProductExtractor, ExtractedProduct
from app.extractors.amazon_extractor import AmazonExtractor
from app.extractors.flipkart_extractor import FlipkartExtractor
from app.extractors.manager import extractor_manager

__all__ = [
    "BaseProductExtractor",
    "ExtractedProduct",
    "AmazonExtractor",
    "FlipkartExtractor",
    "extractor_manager"
]
