import faiss
import pickle
from sentence_transformers import SentenceTransformer
from .llm_service import generate_explanation

INDEX_DIR = "backend/index"

index = faiss.read_index(f"{INDEX_DIR}/faiss.index")
with open(f"{INDEX_DIR}/metadata.pkl", "rb") as f:
    texts = pickle.load(f)

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def get_answer(question: str, top_k=3):
    # 1. Semantic search
    query_vector = embedder.encode([question])
    _, indices = index.search(query_vector, top_k)

    chunks = [texts[i] for i in indices[0]]
    context = "\n\n".join(chunks)

    # 2. Gemini explanation
    answer = generate_explanation(context, question)
    return answer
