import os
import re

RAW_DIR = "data/raw"
CLEAN_DIR = "data/cleaned"

os.makedirs(CLEAN_DIR, exist_ok=True)

def is_noise(line: str) -> bool:
    noise_patterns = [
        r"test your knowledge",
        r"©",
        r"fields and waves visualization lab",
        r"all rights reserved",
        r"navigation",
        r"menu",
        r"home"
    ]
    for pattern in noise_patterns:
        if re.search(pattern, line.lower()):
            return True
    return False


for filename in os.listdir(RAW_DIR):
    if not filename.endswith(".txt"):
        continue

    with open(os.path.join(RAW_DIR, filename), "r", encoding="utf-8") as f:
        lines = f.readlines()

    cleaned_lines = []
    for line in lines:
        line = line.strip()
        if len(line) < 30:
            continue
        if is_noise(line):
            continue
        cleaned_lines.append(line)

    with open(os.path.join(CLEAN_DIR, filename), "w", encoding="utf-8") as f:
        f.write("\n".join(cleaned_lines))

    print(f"Cleaned: {filename}")
