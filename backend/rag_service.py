import os
import faiss
import pickle
from sentence_transformers import SentenceTransformer
from .llm_service import generate_explanation

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "index", "faiss.index")
META_PATH = os.path.join(BASE_DIR, "index", "metadata.pkl")

index = None
texts = None
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def load_index():
    """Loads the FAISS index and metadata from disk (once per process)."""
    global index, texts
    if index is None:
        if not os.path.exists(INDEX_PATH):
            raise FileNotFoundError(f"FAISS index not found at {INDEX_PATH}")
        index = faiss.read_index(INDEX_PATH)
        with open(META_PATH, "rb") as f:
            texts = pickle.load(f)
        print(f"[INFO] FAISS index loaded: {index.ntotal} vectors | {len(texts)} text chunks")


def get_answer(question: str, session_id: str = "anonymous", top_k: int = 5) -> str:
    """
    Retrieves relevant context via FAISS and generates a tutoring response.

    Args:
        question:   The user's question or message.
        session_id: Unique identifier per user session. MUST be passed from the
                    API/route layer so each user maintains separate conversation state.
        top_k:      Number of top context chunks to retrieve from the index.

    Returns:
        A formatted tutoring response string with topic link appended.
    """
    load_index()

    # Encode the question and search the FAISS index
    query_vector = embedder.encode([question])
    _, indices = index.search(query_vector, top_k)

    # Retrieve matched text chunks
    retrieved_chunks = [texts[i] for i in indices[0] if i < len(texts)]

    if not retrieved_chunks:
        return (
            "I couldn't find relevant content for your question in the FWV Lab notes. "
            "Please try rephrasing or select a topic from the sidebar."
        )

    context = "\n\n".join(retrieved_chunks)

    # Debug log (remove in production)
    print(f"[DEBUG] session={session_id} | question={question[:60]}... | chunks={len(retrieved_chunks)}")

    # ✅ FIX: Pass session_id through so each user has isolated conversation state
    return generate_explanation(context, question, session_id)
