from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .rag_service import get_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str
    session_id: str = "anonymous"  # ✅ Accept session_id, default to anonymous

@app.post("/ask")
def ask_question(data: Query):
    try:
        answer = get_answer(data.query, session_id=data.session_id)  # ✅ Pass it through
        return {"answer": answer}
    except Exception as e:
        if "429" in str(e):
            return {"answer": "The AI is a bit busy (Rate Limit). Please wait a few seconds and try again!"}
        print("RAG ERROR:", e)
        return {"answer": "Sorry, I'm having trouble connecting to my brain right now."}