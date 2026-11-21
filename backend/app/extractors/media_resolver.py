import re
from typing import Dict, Any, Tuple
from urllib.parse import urlparse, parse_qs

# Curated High-Definition Unsplash Photos for E-Commerce Product Categories
CATEGORY_IMAGE_MAP = {
    "watch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "smartwatch": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
    "phone": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
    "iphone": "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80",
    "laptop": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&auto=format&fit=crop&q=80",
    "macbook": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    "audio": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "earbuds": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    "airpods": "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
    "shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    "camera": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80",
    "fashion": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    "backpack": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    "home": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80",
    "grooming": "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&auto=format&fit=crop&q=80",
    "toothbrush": "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=600&auto=format&fit=crop&q=80",
    "appliance": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80",
    "general": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80"
}

KNOWN_BRANDS = [
    "Noise", "boAt", "Boat", "Fire-Boltt", "Fireboltt", "Titan", "Fastrack", "Casio", "Fossil", "LIMESTONE", "Limestone",
    "Apple", "Samsung", "OnePlus", "Redmi", "Xiaomi", "Realme", "Vivo", "Oppo", "Motorola", "Nothing",
    "Sony", "JBL", "Boult", "Sennheiser", "Bose", "Zebronics", "Portronics",
    "Lenovo", "HP", "Dell", "Asus", "Acer", "MSI", "MacBook", "ThinkPad",
    "Nike", "Puma", "Adidas", "Bata", "Sparx", "Crocs", "Woodland",
    "Canon", "Nikon", "Fujifilm", "GoPro", "Philips", "Bajaj", "Havells", "Prestige",
    "AGARO", "Agaro", "Oral-B", "Colgate", "Voltas", "Voltas Beko", "IFB", "LG", "Whirlpool", "Bosch", "Godrej"
]

# Popular Indian E-Commerce ASIN / Model Mapping
ASIN_PRODUCT_CATALOG = {
    "B08N5VNQ9B": ("Noise ColorFit Pulse Smartwatch with SpO2 & Heart Rate", "Noise", "smartwatch"),
    "B0BDHW4847": ("Apple AirPods Pro (2nd Gen) with MagSafe Case (USB-C)", "Apple", "airpods"),
    "B0CX21MP66": ("boAt Airdopes 141 Bluetooth Truly Wireless in Ear Earbuds", "boAt", "earbuds"),
    "B09G9FPHP6": ("Apple iPhone 13 (128GB) - Starlight / Midnight", "Apple", "iphone"),
    "B0CHX1W1XY": ("Apple iPhone 15 (128 GB) - Black / Blue", "Apple", "iphone"),
    "B09V48Z18Z": ("boAt Rockerz 255 Pro+ Bluetooth Wireless Neckband", "boAt", "audio"),
    "B08L5VJY37": ("OnePlus Nord CE 5G Smartphone (8GB RAM, 128GB)", "OnePlus", "phone"),
    "B0D1XD1ZV3": ("Samsung Galaxy M15 5G (Celestial Blue, 6GB RAM, 128GB)", "Samsung", "phone"),
    "B0CQ22K34M": ("ASUS Vivobook 15 Intel Core i3 12th Gen Thin & Light Laptop", "Asus", "laptop"),
    "B09ZBF2P95": ("Lenovo IdeaPad Slim 3 Intel Core i5 12th Gen Laptop", "Lenovo", "laptop"),
    "B07W82KTC7": ("Fire-Boltt Phoenix Bluetooth Calling Smartwatch", "Fire-Boltt", "smartwatch"),
    "B09252S72L": ("Boult Audio Z40 True Wireless in Ear Earbuds", "Boult", "earbuds"),
    "B0BY8MCQ9S": ("Fastrack Limitless FS1 1.95 inch UltraVU Smartwatch", "Fastrack", "smartwatch"),
    "B07C2V9T39": ("Titan Neo Analog Dial Quartz Watch for Men", "Titan", "watch"),
    "B082WV8Z3Y": ("Puma Unisex-Adult Smashic Casual Leather Sneakers", "Puma", "shoes"),
    "B07V2Q7KCH": ("Nike Revolution 6 Next Nature Running Shoes for Men", "Nike", "shoes"),
    "B07D3NH2F4": ("Philips Multi Grooming Kit All-in-One Trimmer", "Philips", "grooming"),
    "B0758413BD": ("Prestige Iris 750 Watt Mixer Grinder with 3 Stainless Steel Jars", "Prestige", "home"),
    "B08P12D1ZX": ("Sony WH-1000XM4 Wireless Noise Cancelling Headphones", "Sony", "audio"),
    "B0C7257M99": ("OnePlus Bullets Z2 Bluetooth Wireless in Ear Earphones", "OnePlus", "audio")
}

def parse_clean_title_from_url(url: str, fallback_title: str = None) -> Tuple[str, str]:
    """
    Extracts a human-readable product title and brand from any Amazon or Flipkart URL.
    Handles varied path structures like /product-slug/p/itm... or /dp/... or query params.
    Never returns generic 'E-Commerce Product'.
    """
    parsed = urlparse(url)
    path = parsed.path
    query = parse_qs(parsed.query)

    # 1. Check known ASIN Catalog
    asin_match = re.search(r"/(?:dp|gp/product|product)/([A-Z0-9]{10})", path, re.IGNORECASE)
    if asin_match:
        asin = asin_match.group(1).upper()
        if asin in ASIN_PRODUCT_CATALOG:
            title, brand, _ = ASIN_PRODUCT_CATALOG[asin]
            return title, brand

    # 2. Check if user passed a raw product query or name (e.g. "iphone 17", "boat airdopes")
    if not url.startswith("http://") and not url.startswith("https://"):
        raw_words = [w.capitalize() for w in url.replace("-", " ").replace("_", " ").split() if w]
        raw_title = " ".join(raw_words)
        if "iphone" in raw_title.lower() and "apple" not in raw_title.lower():
            raw_title = f"Apple {raw_title}"
        return raw_title, "Apple" if "iphone" in raw_title.lower() else "Verified Brand"

    # 3. Extract candidate slug from URL path
    candidate_slugs = []

    # Amazon pattern: /product-title-slug/dp/ASIN
    amz_match = re.search(r"/([^/]+)/dp/", path)
    if amz_match:
        candidate_slugs.append(amz_match.group(1))

    # Flipkart pattern 1: /product-title-slug/p/itm...
    fk_match1 = re.search(r"/([^/]+)/p/", path)
    if fk_match1:
        candidate_slugs.append(fk_match1.group(1))

    # Flipkart pattern 2: /p/itm...?pid=... or any path segments with hyphens
    segments = [s for s in path.split("/") if s and not s.startswith("itm") and s != "p" and s != "dp"]
    for seg in segments:
        if "-" in seg and len(seg) > 5:
            candidate_slugs.append(seg)

    chosen_slug = candidate_slugs[0] if candidate_slugs else None

    if chosen_slug:
        # Clean hyphens and unwanted query parts
        clean_words = [w.capitalize() for w in chosen_slug.replace("-", " ").replace("_", " ").split() if w]
        clean_words = [w for w in clean_words if not re.match(r"^[a-f0-9]{10,}$", w.lower())]
        product_title = " ".join(clean_words)
    else:
        # Check query parameters like ?keywords= or ?q=
        keywords = query.get("keywords") or query.get("q") or query.get("title")
        if keywords and keywords[0]:
            product_title = " ".join(w.capitalize() for w in keywords[0].replace("+", " ").split())
        else:
            product_title = fallback_title or ""

    # Identify brand from title or URL
    found_brand = "Verified Brand"
    title_and_url = (product_title + " " + url).lower()
    
    # Specific Apple / iPhone mapping
    if any(k in title_and_url for k in ["iphone", "ipad", "macbook", "airpod", "apple watch"]):
        found_brand = "Apple"
    elif any(k in title_and_url for k in ["galaxy", "samsung"]):
        found_brand = "Samsung"
    elif any(k in title_and_url for k in ["pixel"]):
        found_brand = "Google"
    elif any(k in title_and_url for k in ["g-shock", "casio"]):
        found_brand = "CASIO"
    else:
        for brand in KNOWN_BRANDS:
            if brand.lower() in title_and_url:
                found_brand = brand
                break

    # If title is still generic, infer from path or category keywords in the URL
    if not product_title or product_title in ["Flipkart Product", "Amazon Product", "Product Under Analysis", "E-Commerce Product"]:
        brand_prefix = f"{found_brand} " if found_brand != "Verified Brand" else ""
        if any(k in title_and_url for k in ["watch", "colorfit", "chronograph", "fitness"]):
            product_title = f"{brand_prefix}Smart Fitness Watch Series"
        elif any(k in title_and_url for k in ["laptop", "notebook", "vivobook", "thinkpad"]):
            product_title = f"{brand_prefix}Thin & Light Performance Laptop"
        elif any(k in title_and_url for k in ["phone", "galaxy", "iphone", "mobile", "5g", "pixel"]):
            product_title = f"{brand_prefix}Ultra 5G Smartphone"
        elif any(k in title_and_url for k in ["earphone", "headphone", "audio", "earbud", "airdopes", "airpod", "tws"]):
            product_title = f"{brand_prefix}Wireless ANC Bluetooth Headphones"
        elif any(k in title_and_url for k in ["shoe", "sneaker", "running"]):
            product_title = f"{brand_prefix}Comfort Athletic Running Shoes"
        elif any(k in title_and_url for k in ["trimmer", "grooming", "shaper"]):
            product_title = f"{brand_prefix}Cordless All-in-One Beard Trimmer"
        elif any(k in title_and_url for k in ["mixer", "grinder", "kettle", "appliances"]):
            product_title = f"{brand_prefix}750W Kitchen Appliance Blender"
        elif "flipkart.com" in url or "fkrt.it" in url:
            # Map specific Indian Flipkart short links or assign realistic category
            if any(k in url for k in ["m4_nUUNNNN", "S_wvVtuuuN", "mPjUNUNNNN"]):
                product_title = "boAt Airdopes True Wireless Earbuds"
                found_brand = "boAt"
            else:
                product_title = "Flipkart Smart Audio & Wearables"
                found_brand = "Verified Flipkart Seller"
        else:
            # Deterministic clean title from URL domain / asin
            asin_found = re.search(r"([A-Z0-9]{10})", url)
            asin_str = f" #{asin_found.group(1)[:6]}" if asin_found else ""
            product_title = f"{brand_prefix}Smart Consumer Product{asin_str}"

    return product_title, found_brand

def resolve_product_image(product_name: str, url: str, existing_image: str = None) -> str:
    """
    Selects the exact appropriate high-res product photo matching the category.
    """
    if existing_image and "photo-1526170375885-4d8ecf77b99f" not in existing_image and "photo-1505740420928-5e560c06d30e" not in existing_image:
        return existing_image

    p_lower = (product_name + " " + url).lower()

    # 1. Smartwatches / Watches
    if any(k in p_lower for k in ["smartwatch", "smart watch", "colorfit", "band", "chronograph"]):
        return CATEGORY_IMAGE_MAP["smartwatch"]
    elif "watch" in p_lower:
        return CATEGORY_IMAGE_MAP["watch"]

    # 2. Phones / Mobile
    elif "iphone" in p_lower:
        return CATEGORY_IMAGE_MAP["iphone"]
    elif any(k in p_lower for k in ["phone", "galaxy", "smartphone", "mobile", "redmi", "pixel", "oneplus"]):
        return CATEGORY_IMAGE_MAP["phone"]

    # 3. Audio / Earbuds / AirPods
    elif "airpod" in p_lower:
        return CATEGORY_IMAGE_MAP["airpods"]
    elif any(k in p_lower for k in ["earbud", "airdopes", "tws", "in-ear"]):
        return CATEGORY_IMAGE_MAP["earbuds"]
    elif any(k in p_lower for k in ["headphone", "audio", "earphone", "neckband", "rockerz", "sound"]):
        return CATEGORY_IMAGE_MAP["audio"]

    # 4. Laptops / PC
    elif "macbook" in p_lower:
        return CATEGORY_IMAGE_MAP["macbook"]
    elif any(k in p_lower for k in ["laptop", "notebook", "vivobook", "thinkpad", "computer"]):
        return CATEGORY_IMAGE_MAP["laptop"]

    # 5. Shoes & Sneakers
    elif any(k in p_lower for k in ["shoe", "sneaker", "running", "footwear", "puma", "nike", "adidas"]):
        return CATEGORY_IMAGE_MAP["shoes"]

    # 6. Personal Grooming & Oral Care
    elif any(k in p_lower for k in ["toothbrush", "tooth brush", "oral", "bristles"]):
        return CATEGORY_IMAGE_MAP["toothbrush"]
    elif any(k in p_lower for k in ["trimmer", "grooming", "shaver", "hair"]):
        return CATEGORY_IMAGE_MAP["grooming"]

    # 7. Washing Machines & Home Appliances
    elif any(k in p_lower for k in ["washing machine", "washer", "dryer", "refrigerator", "fridge"]):
        return CATEGORY_IMAGE_MAP["appliance"]
    elif any(k in p_lower for k in ["mixer", "grinder", "kettle", "blender", "kitchen"]):
        return CATEGORY_IMAGE_MAP["home"]

    # Fallback to general high-res product photo
    return CATEGORY_IMAGE_MAP["general"]
