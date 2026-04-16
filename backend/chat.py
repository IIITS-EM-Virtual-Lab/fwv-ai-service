<<<<<<< HEAD
=======
from typing import Optional

>>>>>>> 29207854a502315a29271e46417fd780acab5005
from fastapi import FastAPI
from pydantic import BaseModel
from rag_service import get_answer

app = FastAPI()

class ChatRequest(BaseModel):
    question: str
<<<<<<< HEAD

@app.post("/chat")
def chat(request: ChatRequest):
    answer = get_answer(request.question)
=======
    user_id: Optional[str] = None
    session_id: Optional[str] = None

@app.post("/chat")
def chat(request: ChatRequest):
    session_id = request.session_id or request.user_id or "anonymous"
    answer = get_answer(request.question, session_id=session_id)
>>>>>>> 29207854a502315a29271e46417fd780acab5005
    return {"answer": answer}
