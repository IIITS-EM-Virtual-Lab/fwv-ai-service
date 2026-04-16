from fastapi import FastAPI
from pydantic import BaseModel
from rag_service import get_answer

app = FastAPI()

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
def chat(request: ChatRequest):
    answer = get_answer(request.question)
    return {"answer": answer}
