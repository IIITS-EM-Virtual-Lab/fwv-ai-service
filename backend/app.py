<<<<<<< HEAD
=======
from typing import Optional

>>>>>>> 29207854a502315a29271e46417fd780acab5005
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .rag_service import get_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
<<<<<<< HEAD
    allow_origins=["*"],
=======
    allow_origins=["*"],  # allow all origins (ok for now)
>>>>>>> 29207854a502315a29271e46417fd780acab5005
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str
<<<<<<< HEAD
    session_id: str = "anonymous"  # ✅ Accept session_id, default to anonymous
=======
    user_id: Optional[str] = None
    session_id: Optional[str] = None
>>>>>>> 29207854a502315a29271e46417fd780acab5005

@app.post("/ask")
def ask_question(data: Query):
    try:
<<<<<<< HEAD
        answer = get_answer(data.query, session_id=data.session_id)  # ✅ Pass it through
        return {"answer": answer}
    except Exception as e:
=======
        session_id = data.session_id or data.user_id or "anonymous"
        answer = get_answer(data.query, session_id=session_id)
        return {"answer": answer}
    except Exception as e:
        # Check if it's a rate limit error
>>>>>>> 29207854a502315a29271e46417fd780acab5005
        if "429" in str(e):
            return {"answer": "The AI is a bit busy (Rate Limit). Please wait a few seconds and try again!"}
        print("RAG ERROR:", e)
        return {"answer": "Sorry, I'm having trouble connecting to my brain right now."}