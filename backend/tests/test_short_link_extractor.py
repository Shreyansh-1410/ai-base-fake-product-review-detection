import unittest
from app.extractors.media_resolver import parse_clean_title_from_url, resolve_product_image
from app.extractors.flipkart_extractor import FlipkartExtractor
from app.extractors.amazon_extractor import AmazonExtractor


class TestShortLinkAndBrandExtractor(unittest.TestCase):
    """
    Unit tests for URL parsing, mobile short links, and brand extraction.
    """

    def setUp(self):
        self.fk_extractor = FlipkartExtractor()
        self.amz_extractor = AmazonExtractor()

    def test_flipkart_short_link_detection(self):
        url = "https://dl.flipkart.com/s/mPjUNUNNNN"
        self.assertTrue(self.fk_extractor.can_handle(url))

        title, brand = parse_clean_title_from_url(url)
        self.assertTrue(len(title) > 0)
        self.assertIn(brand, ["boAt", "CASIO", "Apple", "Verified Brand", "Verified Flipkart Seller"])

    def test_flipkart_short_link_casio_slug(self):
        url = "https://www.flipkart.com/casio-ga-140-1a1dr-g-shock-black-dial-resin-strap-analog-digital-watch-men/p/itmc317ad7d8cc8f"
        title, brand = parse_clean_title_from_url(url)
        self.assertIn("casio", title.lower())
        self.assertEqual(brand, "CASIO")

    def test_apple_raw_query_formatting(self):
        query = "iphone 17"
        title, brand = parse_clean_title_from_url(query)
        self.assertEqual(title, "Apple Iphone 17")
        self.assertEqual(brand, "Apple")

    def test_amazon_asin_catalog(self):
        asin_url = "https://www.amazon.in/dp/B0CHX1W1XY"
        title, brand = parse_clean_title_from_url(asin_url)
        self.assertIn("iPhone 15", title)
        self.assertEqual(brand, "Apple")

    def test_resolve_product_image(self):
        img_watch = resolve_product_image("Casio G-Shock Smartwatch", "https://example.com/watch")
        self.assertTrue(img_watch.startswith("http"))

        img_phone = resolve_product_image("Apple iPhone 15", "https://example.com/phone")
        self.assertTrue(img_phone.startswith("http"))


if __name__ == "__main__":
    unittest.main()
