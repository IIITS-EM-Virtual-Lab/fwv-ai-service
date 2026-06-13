# Fields and Waves Visualization Lab - AI Integration

AI backend and content pipeline for the **Fields and Waves Visualization Lab** chatbot.

This repository is the service behind **Fieldora**, the chatbot used in the main FWV Lab website. Its job is to scrape website content, prepare retrieval data, run the AI backend, and return short topic-aware answers to the main website.

Hosted source:

- Hugging Face Space: `https://huggingface.co/spaces/fwvlab/fwv-ai-service/tree/main`
- Main website repo: `https://github.com/IIITS-EM-Virtual-Lab/Fields-And-Waves-Visualization-Lab`

---

## Why We Have This Repository

We keep the AI system separate from the main website so that:

- the website frontend stays focused on UI and learning pages
- the main Node/Express backend stays focused on auth, quizzes, and user flows
- the AI service can be updated independently
- scraper, retrieval data, prompts, and model logic can evolve without changing the full website

In short:

- `Fields-And-Waves-Visualization-Lab` = main product
- `IIIT Sri City - AI Integration` = AI engine + data pipeline

---

## Big Picture

```text
Student
  -> Website frontend chatbot UI
  -> Main website backend (/api/chat/ask)
  -> This AI Integration backend (/ask)
  -> RAG retrieval + LLM response
  -> Answer sent back to website
```

---

## Repositories And Their Roles

### 1. Main website repository

Repo:
`https://github.com/IIITS-EM-Virtual-Lab/Fields-And-Waves-Visualization-Lab`

This contains:

- the React frontend
- the Node/Express backend
- login/auth flow
- quizzes, dashboard, profile, content pages
- the website chatbot widget UI

Important files there:

- `frontend/src/components/ChatBot.tsx`
- `frontend/src/pages/ContentLayout.tsx`
- `backend/routes/chatRoutes.js`
- `backend/app.js`

### 2. AI Integration repository

Repo:
`https://huggingface.co/spaces/fwvlab/fwv-ai-service/tree/main`

This contains:

- scraper
- cleaned content data
- chunked retrieval data
- FAISS index builder
- FastAPI backend
- prompt/model logic
- standalone demo frontend for direct testing

---

## Folder Structure

### `backend/`

This is the real AI backend.

- `app.py`
  Main FastAPI entrypoint. Exposes `POST /ask`.

- `rag_service.py`
  Loads the FAISS index, embeds the question, retrieves the most relevant chunks, and sends them to the LLM layer.

- `llm_service.py`
  Builds the tutoring prompt, tracks per-session state, calls Groq or Gemini, and appends the correct website topic link.

- `build_index.py`
  Builds the FAISS vector index from files in `data/chunks/`.

- `cleandata.py`
  Cleans scraped text from `data/raw/` and writes better content to `data/cleaned/`.

- `chunkdata.py`
  Splits cleaned text into small chunk files in `data/chunks/` for retrieval.

- `search.py`
  Small local utility to test semantic retrieval without calling the full API.

- `chat.py`
  Simple older chat entrypoint. Useful only for quick experiments, not the main production path.

- `generate_dataset.py`
  Generates Q&A style dataset entries for training or future fine-tuning work.

- `test_api.py`
  Small API/model connectivity check.

- `test_sessions.py`
  Tests whether two different users keep separate chatbot context.

### `scraper/`

- `scrape_fwv.py`
  Crawls `https://www.fwvlab.com/`, extracts page text, and saves it into `data/raw/`.

This matters when website content changes.

### `data/`

This is the retrieval pipeline output.

- `data/raw/`
  Raw scraped page text from the website.

- `data/cleaned/`
  Cleaned page text after noise removal.

- `data/chunks/`
  Small text chunks used to build embeddings and search context.

### `frontend/`

This is a **standalone demo frontend**, not the production website UI.

- `index.html`
- `script.js`
- `style.css`

Use this only when you want to test the AI service directly without the full FWV website.

### Top-level files

- `requirements.txt`
  Main Python dependencies used by the deployed AI backend.

- `Dockerfile`
  Container startup for the Hugging Face Space or similar hosting.

- `Procfile`
  Process startup definition for platforms that use Procfiles.

- `runtime.txt`
  Python version hint.

- `fwv_dataset.jsonl`
  Generated dataset file for Q&A/fine-tuning style work.

- `render.yaml`
  Present in the repo, but currently looks incomplete/mixed with pasted notes. Treat it carefully before using it for deployment.

---

## How The Backend Works

### API entry

The deployed AI backend exposes:

`POST /ask`

Request body:

```json
{
  "query": "Explain Faraday law",
  "session_id": "user-123-thread-xyz"
}
```

Response:

```json
{
  "answer": "Faraday's law says that a changing magnetic field induces an electric field.\n\nTo learn more, visit: ..."
}
```

### Internal flow

1. `backend/app.py` receives the request.
2. It passes the query and `session_id` to `backend/rag_service.py`.
3. `rag_service.py` embeds the question using `all-MiniLM-L6-v2`.
4. It searches the FAISS index for the most relevant chunks.
5. Retrieved context is sent to `backend/llm_service.py`.
6. `llm_service.py` builds the teaching prompt and calls the LLM.
7. The final answer is returned, along with a topic link inferred from the active topic.

---

## How Session Handling Works

The chatbot keeps lightweight per-user state inside `backend/llm_service.py`.

It stores:

- current subtopic
- last bot explanation

This is why follow-up questions like "explain simpler" or "give example" can still make sense within a session.

Important:

- website frontend must keep sending a stable `session_id`
- website backend should forward that `session_id` unchanged

If session handling breaks, follow-up answers will feel random or lose topic continuity.

---

## How The Main Website Connects To This Service

### In the website frontend

The chatbot UI is implemented in:

- `frontend/src/components/ChatBot.tsx`

That component sends user questions to the main website backend, not directly to Hugging Face.

### In the website backend

The proxy route is:

- `backend/routes/chatRoutes.js`

That route:

- checks JWT auth
- accepts `query` and `session_id`
- forwards the request to the AI service
- returns the answer back to the frontend

Default external AI service URL in the website backend:

- `https://fwvlab-fwv-ai-service.hf.space`

So the integration is:

```text
Website ChatBot.tsx
  -> Website backend /api/chat/ask
  -> Hugging Face AI backend /ask
```

---

## How To Run This Repository Locally

### 1. Open this folder

Work from:

`D:\IIIT Sri City - AI Integration`

### 2. Create and activate a virtual environment

Example:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### 3. Install dependencies

```powershell
pip install -r requirements.txt
```

### 4. Add environment variables

Create `backend/.env` with keys like:

```env
GROQ_API_KEY_1=...
GROQ_API_KEY_2=...
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...
FWV_SITE_URL=https://www.fwvlab.com
```

### 5. Start the backend

```powershell
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Test it

Use:

- `backend/test_sessions.py`
- `backend/search.py`
- `frontend/index.html` demo frontend
- or send a direct POST request to `http://localhost:8000/ask`

---

## How To Use The Standalone Demo Frontend

The files in `frontend/` are useful when:

- the main website is not running
- you want to test the AI service directly
- you want to debug retrieval or answer quality faster

Notes:

- `frontend/script.js` currently sends requests to `http://127.0.0.1:8000/ask`
- this is only for local backend testing
- this frontend is separate from the production React chatbot in the website repo

Use it as a test harness, not as the main app UI.

---

## Scraper -> Data -> Index Pipeline

This is the most important maintenance workflow in this repo.

### Full pipeline

```text
Website pages
  -> scraper/scrape_fwv.py
  -> data/raw/
  -> backend/cleandata.py
  -> data/cleaned/
  -> backend/chunkdata.py
  -> data/chunks/
  -> backend/build_index.py
  -> backend/index/faiss.index + metadata.pkl
```

### What each step does

1. `scraper/scrape_fwv.py`
   Pulls content from the website.

2. `backend/cleandata.py`
   Removes noise like menus, repeated branding, short junk lines.

3. `backend/chunkdata.py`
   Splits content into chunk files for retrieval.

4. `backend/build_index.py`
   Converts chunk text into embeddings and stores the FAISS index.

Without rebuilding this pipeline, the chatbot may answer using old content.

---

## When Website Changes Happen, What Should Be Updated?

This depends on the type of change.

### Case 1: Only website page content changed

Examples:

- text rewritten on topic pages
- formulas/explanations improved
- new educational content added on existing URLs

What to do:

1. pull latest website changes
2. rerun scraper
3. rerun clean script
4. rerun chunk script
5. rebuild FAISS index
6. redeploy AI backend if needed

Commands:

```powershell
python scraper\scrape_fwv.py
python backend\cleandata.py
python backend\chunkdata.py
python backend\build_index.py
```

### Case 2: New website pages or new topic routes were added

Examples:

- new chapter page
- new module
- route slug changed

What to update:

In this AI repo:

1. rerun the content pipeline
2. update topic-path mapping in `backend/llm_service.py`
3. update any topic aliases if naming changed

Why:

`llm_service.py` contains `TOPIC_TO_PATH` and topic normalization logic. If a website route changes but that mapping is not updated, the chatbot may return wrong or dead links.

### Case 3: Frontend chatbot UI behavior changed

Examples:

- new prompt buttons
- new assistant action like "summarize this page"
- session handling changed
- auth rules changed

What to update:

Usually in the main website repo, not here.

Main website files to check:

- `frontend/src/components/ChatBot.tsx`
- `frontend/src/pages/ContentLayout.tsx`
- `backend/routes/chatRoutes.js`

Only update this AI repo if:

- the request format changed
- new metadata is sent
- prompts need new behavior
- link/topic logic must change

### Case 4: LLM behavior needs improvement

Examples:

- answers too long
- answers too vague
- follow-up logic weak
- topic switching poor

What to update:

- `backend/llm_service.py`

This is the main place for:

- prompt rules
- style constraints
- fallback order between providers
- topic inference behavior
- answer post-processing

### Case 5: Retrieval quality is poor

Examples:

- wrong page context retrieved
- correct topic exists but wrong chunk is selected
- answer misses updated content

What to update:

- rerun the scraper/data/index pipeline
- inspect `data/cleaned/`
- inspect `data/chunks/`
- use `backend/search.py` to test retrieval
- tune chunking logic in `backend/chunkdata.py` if necessary

---

## Exact Responsibility Split For Juniors

### Update only the website repo when:

- chatbot look and feel changes
- login requirement changes
- buttons like "Explain Formula" or "Generate Lab Report" change
- backend proxy/auth logic changes
- website routes or page structure change

### Update only the AI repo when:

- scraped content needs refresh
- prompts need improvement
- retrieval/index needs rebuilding
- model provider keys or fallback logic change
- topic-to-link mappings change

### Update both repos when:

- request/response contract changes
- new page-aware AI features are introduced
- route slugs change and chatbot links must still work

---

## Recommended Update Workflow

When juniors continue this project, use this order:

1. Pull latest AI repo from Hugging Face.
2. Pull latest main website repo from GitHub.
3. Check if website content or routes changed.
4. If content changed, rerun scraper -> clean -> chunk -> index.
5. If route slugs changed, update `backend/llm_service.py`.
6. If frontend chatbot actions changed, update the website repo.
7. Test local `/ask` responses.
8. Test website chatbot flow end to end.
9. Redeploy the AI backend.
10. Verify live site integration again.

---

## How To Pull The Latest Version

### AI backend repo

Source:

`https://huggingface.co/spaces/fwvlab/fwv-ai-service/tree/main`

Use this when you need:

- latest scraper
- latest AI backend logic
- latest index/data files
- latest prompt logic

### Main website repo

Source:

`https://github.com/IIITS-EM-Virtual-Lab/Fields-And-Waves-Visualization-Lab`

Use this when you need:

- latest React chatbot UI
- latest backend proxy route
- latest website content pages
- latest topic route structure

---

## Useful Files To Inspect First

If someone is new to the project, read these first:

In this repo:

- `backend/app.py`
- `backend/rag_service.py`
- `backend/llm_service.py`
- `scraper/scrape_fwv.py`
- `backend/cleandata.py`
- `backend/chunkdata.py`
- `backend/build_index.py`

In the website repo:

- `frontend/src/components/ChatBot.tsx`
- `frontend/src/pages/ContentLayout.tsx`
- `backend/routes/chatRoutes.js`

---

## Known Notes

- `backend/app.py` is the real production API entrypoint.
- `frontend/` here is only a testing frontend, not the main website chatbot.
- `render.yaml` currently looks messy/incomplete, so validate it before relying on it.
- topic links are generated in `backend/llm_service.py`, so route changes must be reflected there.
- if the FAISS index is stale, answers may look outdated even if the website content is new.

---

## One-Line Summary

This repository is the AI service behind Fieldora: it scrapes FWV Lab content, builds retrieval data, runs the FastAPI chatbot backend, and serves answers to the main website through the website backend proxy.
