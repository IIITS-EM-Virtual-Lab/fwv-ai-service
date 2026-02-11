import faiss
import pickle
from sentence_transformers import SentenceTransformer

INDEX_DIR = "backend/index"

model = SentenceTransformer("all-MiniLM-L6-v2")

index = faiss.read_index(f"{INDEX_DIR}/faiss.index")
with open(f"{INDEX_DIR}/metadata.pkl", "rb") as f:
    texts = pickle.load(f)

def search(query, top_k=3):
    query_vector = model.encode([query])
    distances, indices = index.search(query_vector, top_k)
    return [texts[i] for i in indices[0]]

if __name__ == "__main__":
    query = input("Enter a question: ")
    results = search(query)

    print("\nTop matching chunks:\n")
    for i, res in enumerate(results, 1):
        print(f"--- Result {i} ---")
        print(res[:500])
        print()

