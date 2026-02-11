import os

CLEAN_DIR = "data/cleaned"
CHUNK_DIR = "data/chunks"

os.makedirs(CHUNK_DIR, exist_ok=True)

CHUNK_SIZE = 5  # lines per chunk

chunk_id = 0

for filename in os.listdir(CLEAN_DIR):
    if not filename.endswith(".txt"):
        continue

    with open(os.path.join(CLEAN_DIR, filename), "r", encoding="utf-8") as f:
        lines = f.readlines()

    buffer = []

    for line in lines:
        buffer.append(line.strip())
        if len(buffer) >= CHUNK_SIZE:
            chunk_text = " ".join(buffer)

            with open(
                os.path.join(CHUNK_DIR, f"chunk_{chunk_id}.txt"),
                "w",
                encoding="utf-8"
            ) as cf:
                cf.write(chunk_text)

            chunk_id += 1
            buffer = []

    # leftover lines
    if buffer:
        with open(
            os.path.join(CHUNK_DIR, f"chunk_{chunk_id}.txt"),
            "w",
            encoding="utf-8"
        ) as cf:
            cf.write(" ".join(buffer))
        chunk_id += 1

print(f"Total chunks created: {chunk_id}")
