from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel
from rag_service import get_answer

app = FastAPI()

class ChatRequest(BaseModel):
    question: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None

@app.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id or request.user_id or "anonymous"
    answer = get_answer(request.question, session_id=session_id)
    return {"answer": answer}
