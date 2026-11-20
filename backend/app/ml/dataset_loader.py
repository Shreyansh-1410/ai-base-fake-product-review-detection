import os
import random
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from app.config import settings

# Comprehensive base sentences
BASE_GENUINE_REVIEWS = [
    "I have been using this laptop for three weeks now. The aluminium finish feels premium and the battery easily lasts 7 hours while programming in VS Code and streaming music.",
    "Sound quality is crisp with well-balanced mids and highs. The active noise cancellation cuts out regular office hum, though lawnmowers outside can still be faintly heard.",
    "Purchased this smart watch last month. The step counter is within 3% accuracy compared to my gym treadmill, and the sleep tracking matches how rested I feel.",
    "Very pleased with the build quality. The hinge is smooth and rigid, keys have decent 1.4mm travel, and the trackpad palm rejection is excellent on Windows 11.",
    "The camera takes clean daylight photos with realistic dynamic range. In low light, night mode takes about 2 seconds to capture but the results are sharp.",
    "Delivered on time in sturdy packaging. Set up took about 5 minutes with the mobile companion app and firmware updated automatically.",
    "The screen color accuracy is impressive for this price point. Calibrated with an display pro and delta-E was under 1.8 out of the box.",
    "Solid mechanical keyboard. Keycaps are double-shot PBT, stabilizers came lightly factory lubed with minimal rattle on the spacebar.",
    "Battery life meets manufacturer expectations. Getting around 10 to 11 hours of video playback at 50% brightness on Wi-Fi.",
    "Great daily driver phone. Fast charging from 15% to 80% takes roughly 35 minutes using the included 65W charger.",
    "The mouse fits naturally in medium sized hands. Sensor tracking on a cloth pad has zero jitter at 800 and 1600 DPI.",
    "After two months of daily use, the stitching on this backpack shows zero fraying. Laptop sleeve fits my 15.6 inch machine securely.",
    "Easy installation with clear instructions. Comes with all necessary screws, wall anchors, and a small magnetic bubble level.",
    "Clean bass response without muddying the vocal tracks. Ear cushions are soft memory foam and don't press too hard on my glasses.",
    "Thermals are well controlled. CPU peaked at 78C during a 30-minute Cinebench loop, fans were audible but a low pleasant hum.",
    "Battery drains in less than 40 minutes on a full charge. The case gets uncomfortably warm during charging. Returning this tomorrow.",
    "The left earbud completely stopped working after four days of normal indoor use. Resetting firmware did not fix the connection issue.",
    "Extremely disappointed with the build quality. The plastic creaks when picked up, and the volume rocker feels loose right out of the box.",
    "This is clearly a cheap knockoff counterfeit. The brand logo is misprinted, no serial number on the box, and materials feel like dollar-store plastic.",
    "Microphone audio is completely muffled. People on Zoom calls complained they could barely hear me even with input volume maxed out.",
    "Bluetooth frequently disconnects every 10 to 15 minutes when paired to both my phone and laptop. Very frustrating for calls.",
    "The display has noticeable backlight bleeding in three corners. Black scenes in movies look patchy gray.",
    "Key registered double-clicks on the 'e' and 'spacebar' within a week of typing. Defective switch design.",
    "The advertised 20-hour battery only lasted 5 hours on low volume with ANC turned off. Misleading product specifications.",
    "Broke on the second day when adjusting the headband. Cheap brittle plastic snaps easily with minimal pressure.",
    "Customer service was unresponsive. Submitted a warranty ticket two weeks ago and haven't received any follow-up.",
    "Charger port became loose after plugging in 4 times. Cable falls out if bumped gently. Returning for refund.",
    "Severe audio lag when watching Netflix on iOS. Audio is out of sync by at least half a second.",
    "The companion app requires excessive phone permissions like location and contacts just to change equalizer presets.",
    "The device overheats and throttles performance within 10 minutes of casual gaming. Framerates drop sharply.",
    "It works okay. Nothing special, just a basic plastic cable. Arrived in an envelope with standard packaging.",
    "Average product for the price. Sound is acceptable for listening to podcasts, though bass is quite weak for hip-hop.",
    "Does what it says on the box. Not exceptionally fast, not exceptionally slow. Average experience.",
    "Decent build for twenty bucks. You get what you pay for. Nothing to complain about, nothing to write home about.",
    "It's alright. A bit smaller than I imagined from the photos, but it functions properly.",
    "I absolutely love this thing! Got it as an early anniversary gift for my husband and we use it every single weekend! So happy!",
    "OMG honestly exceeded my expectations!! It is so pretty on my desk and works like a charm. 10/10 would buy again!",
    "Wow wow wow! I was hesitant because of some reviews but I am totally in love with the blue color. It's so smooth!",
    # Short & Concise Everyday Genuine Reviews (very common on e-commerce sites like Amazon, Flipkart)
    "Good laptop for daily work and college. Decent display and performance.",
    "Very good product, works well and looks great. Satisfied with this order.",
    "Nice laptop, fast delivery by Flipkart. Everything arrived in good condition.",
    "Worth the money, good battery backup and snappy response.",
    "Decent build quality for the price. Works as expected.",
    "Value for money laptop. Boots up quickly and handles multitasking easily.",
    "Genuine product received with warranty card and sealed box.",
    "Good for students and programming. Happy with the purchase.",
    "The laptop is genuine and performance is great.",
    "Laptop is good but heats up slightly while gaming. Overall satisfied.",
    "Screen is bright and sound is loud enough for movies. Good buy.",
    "Working well so far, no issues encountered after 2 weeks of use.",
    "Superb laptop in this budget. Clean finish and comfortable keyboard.",
    "Awesome laptop for light gaming, coding and office tasks.",
    "Affordable machine that gets the job done without hassle.",
    "Nice quality item. Looks good and functions well. Four stars from me.",
    "Good value for money. Does what it's supposed to do.",
    "Battery backup is around 4 to 5 hours, display is sharp.",
    "Lenovo LOQ is very good laptop, display and performance are top notch.",
    "Received original product in factory sealed box, serial number verified.",
    "Keys feel responsive and touchpad is smooth. Good everyday performance.",
    "Sound output is clear and crisp for calls and music.",
    "Worth every penny at this discounted price point.",
    "Solid performer. thermals are decent and fan noise is low during normal tasks."
]

BASE_DECEPTIVE_REVIEWS = [
    "BEST PRODUCT EVER IN MY ENTIRE LIFE!! BUY IT NOW YOU WILL NOT REGRET IT AT ALL 100% RECOMMEND TO EVERYONE!!",
    "Mind-blowing quality! Absolutely miraculous and revolutionary product. Solved all my problems instantly! 5 stars!",
    "Words cannot describe how wonderful this item is! Perfection in every single way! Will buy 10 more for all my relatives!",
    "Amazing excellent outstanding superb! Fast delivery, great seller, high quality! A+++++ definitely buy it!",
    "Simply the greatest purchase ever made on this website. Total game changer, flawless performance, unbelievable price!",
    "This product changed my entire life overnight! Do not hesitate for even one second, click buy now right away!",
    "Hands down the single greatest invention ever created. Everything about it is perfect and miraculous!",
    "OMG I am so obsessed with this! Best purchase of the decade! Outstanding perfection, flawless masterwork!",
    "Incredible! 1000% recommended to all friends and family. Best ever quality, best ever battery, best ever everything!",
    "Flawless perfection! Works like magic right out of the box! Seller is awesome, shipping was instantaneous!",
    "A masterpiece of technology. Truly life changing experience. The quality is simply superior to anything in the world!",
    "Must buy must buy must buy! Don't listen to negative haters, this product is absolute perfection without any flaws!",
    "Astonishing excellence! Cannot stop raving about this product to everyone I meet! 100% authentic perfection!",
    "Phenomenal bargain! It will make you feel like royalty! Best device known to mankind, five stars without doubt!",
    "Pure perfection! I received this and my mind was totally blown away! Highly recommend to everyone on the planet!",
    "BUY NOW BUY NOW BEST BEST BEST INCREDIBLE MIRACLE PRODUCT 100% FIVE STARS HIGHEST RATED EVER!!",
    "DO NOT WAIT A SINGLE SECOND!! THIS IS THE MOST REVOLUTIONARY MIRACULOUS ITEM ON THE PLANET 100% MUST BUY!!",
    "UNBELIEVABLE QUALITY!! GREATEST THING TO EVER EXIST!! CLICK ADD TO CART IMMEDIATELY YOU WILL NOT REGRET IT!!",
    "HORRIBLE WORST COMPANY WORST SCAM DO NOT BUY THEY ARE THIEVES AND CRIMINALS TOTAL GARBAGE!!!",
    "Absolute scam product! Completely fake company! Everything they do is a fraud, buy from the competitor brand instead!",
    "Pure trash! Do not waste a single penny on this fake junk! Worst product in human history!",
    "Fake scam fraudulent garbage! Zero stars! Go buy the rival brand which is 100 times better!",
    "Terrible nightmare awful experience! They stole my money and sent trash! Avoid this brand at all costs!"
]

def add_natural_variations(text: str, noise_prob: float = 0.25) -> str:
    """Adds natural phrasing variation and word swaps to simulate real human review variance."""
    synonym_map = {
        "laptop": ["computer", "notebook", "device", "machine"],
        "battery": ["battery life", "battery backup", "charge", "battery performance"],
        "screen": ["display", "panel", "monitor", "screen glass"],
        "earbud": ["earphone", "headphone", "audio piece"],
        "sound": ["audio", "sound profile", "acoustic quality"],
        "great": ["good", "solid", "decent", "impressive"],
        "disappointed": ["frustrated", "unhappy", "let down", "annoyed"],
        "works": ["functions", "runs", "operates", "performs"]
    }
    words = text.split()
    new_words = []
    for w in words:
        clean_w = w.lower().strip(".,!?:;\"'")
        if random.random() < noise_prob and clean_w in synonym_map:
            replacement = random.choice(synonym_map[clean_w])
            new_words.append(replacement)
        else:
            new_words.append(w)
    return " ".join(new_words)

def generate_augmented_dataset(target_size: int = 2400) -> pd.DataFrame:
    records = []
    random.seed(42)
    np.random.seed(42)

    half = target_size // 2

    # Genuine reviews (Label 0)
    for i in range(half):
        base = random.choice(BASE_GENUINE_REVIEWS)
        varied = add_natural_variations(base, noise_prob=0.20)
        # Add slight natural sentence boundary or clause
        if random.random() < 0.4:
            tails = [
                " Will update my review if anything changes after a few months.",
                " Overall, it meets my day to day requirements.",
                " Hope this feedback helps other prospective buyers.",
                " Would consider purchasing from this series again.",
                " Definitely worth reading the manual before the first setup."
            ]
            varied += random.choice(tails)
        
        # Categorize
        cat = "genuine_negative" if any(k in varied.lower() for k in ["drain", "stopped working", "disappoint", "defect", "counterfeit", "broke"]) else "genuine_positive"
        records.append({
            "review_text": varied,
            "rating": 1.0 if cat == "genuine_negative" else random.choice([4.0, 5.0]),
            "label": 0,
            "category": cat
        })

    # Deceptive reviews (Label 1)
    for i in range(half):
        base = random.choice(BASE_DECEPTIVE_REVIEWS)
        varied = add_natural_variations(base, noise_prob=0.20)
        if random.random() < 0.35:
            fake_tails = [
                " Click add to cart right now!",
                " You will never find a better deal anywhere on earth!",
                " Best seller on the entire internet hands down!",
                " Total perfection without question!",
                " Don't think twice, just buy it immediately!"
            ]
            varied += random.choice(fake_tails)
            
        cat = "deceptive_negative" if any(k in varied.lower() for k in ["scam", "thieves", "trash", "fraud", "criminal", "nightmare"]) else "deceptive_positive"
        records.append({
            "review_text": varied,
            "rating": 1.0 if cat == "deceptive_negative" else 5.0,
            "label": 1,
            "category": cat
        })

    df = pd.DataFrame(records)
    # Inject 4% boundary ambiguity / label noise (mirroring human annotator disagreement in real gold corpora)
    flip_indices = np.random.choice(df.index, size=int(len(df) * 0.04), replace=False)
    for idx in flip_indices:
        df.loc[idx, "label"] = 1 - df.loc[idx, "label"]

    df = df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    return df

def prepare_and_save_splits():
    raw_dir = settings.DATA_DIR / "raw"
    processed_dir = settings.DATA_DIR / "processed"
    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    print("Generating refined scientific benchmark dataset with realistic boundary variance...")
    df = generate_augmented_dataset(target_size=2400)
    
    raw_path = raw_dir / "labeled_reviews_benchmark.csv"
    df.to_csv(raw_path, index=False)
    print(f"Saved raw dataset: {raw_path} ({len(df)} samples)")
    
    train_df, temp_df = train_test_split(df, test_size=0.30, random_state=42, stratify=df["label"])
    val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=temp_df["label"])
    
    train_df.to_csv(processed_dir / "train.csv", index=False)
    val_df.to_csv(processed_dir / "val.csv", index=False)
    test_df.to_csv(processed_dir / "test.csv", index=False)
    
    print(f"Refined dataset splits created:")
    print(f"  - Train: {len(train_df)} (Genuine: {(train_df['label']==0).sum()}, Deceptive: {(train_df['label']==1).sum()})")
    print(f"  - Val:   {len(val_df)}")
    print(f"  - Test:  {len(test_df)}")

if __name__ == "__main__":
    prepare_and_save_splits()
