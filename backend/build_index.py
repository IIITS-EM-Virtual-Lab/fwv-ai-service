import os
import faiss
import pickle
from sentence_transformers import SentenceTransformer

CHUNK_DIR = "data/chunks"
INDEX_DIR = "backend/index"

os.makedirs(INDEX_DIR, exist_ok=True)

model = SentenceTransformer("all-MiniLM-L6-v2")

texts = []
chunk_files = []

for filename in os.listdir(CHUNK_DIR):
    if filename.endswith(".txt"):
        with open(os.path.join(CHUNK_DIR, filename), "r", encoding="utf-8") as f:
            texts.append(f.read())
            chunk_files.append(filename)

print(f"Total chunks loaded: {len(texts)}")

embeddings = model.encode(texts, show_progress_bar=True)

dimension = embeddings.shape[1]
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

faiss.write_index(index, os.path.join(INDEX_DIR, "faiss.index"))

with open(os.path.join(INDEX_DIR, "metadata.pkl"), "wb") as f:
    pickle.dump(texts, f)

print("FAISS index built successfully")
