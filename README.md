# 🧠 Recall AI — Your Personal Visual Second Brain

**Recall AI** is a highly optimized, professional, and scalable visual knowledge hub. It allows you to save, search, and chat with your screenshots and web bookmarks using advanced multi-modal AI, semantic vector search, and instant text extraction.

---

## 🛠️ Tech Stack & Architecture

Recall AI uses a modern, high-performance serverless architecture designed for sub-second database operations and sub-3-second AI indexing.

```mermaid
graph TD
    User([User App / Browser]) -->|Upload Image / Add Link| FE[Next.js Frontend]
    FE -->|API Request| BE[FastAPI on Modal Serverless]
    BE -->|Store Image| Cloudinary[Cloudinary CDN]
    BE -->|Multimodal OCR & Summary| Groq[Groq Llama Vision / Gemini API]
    BE -->|Vector Embeddings| HF[Hugging Face Serverless Client]
    BE -->|Store & Search Vectors| Supabase[(Supabase pgvector)]
```

### **Frontend**
*   **Next.js 14 (App Router)** — Fast, React-based server and client-side rendering.
*   **Framer Motion** — Fluid, physics-based micro-interactions and transitions.
*   **Lucide Icons** — Clean, minimalist vector iconography.
*   **Vanilla CSS + CSS Modules** — Highly customized glassmorphism design system.

### **Backend (Serverless)**
*   **FastAPI** — High-performance asynchronous Python web framework.
*   **Modal** — Serverless CPU/GPU container runner, hosting the backend with custom autoscaling (0 to many containers, sleeping when inactive).
*   **Supabase + pgvector** — Enterprise-grade PostgreSQL database serving as a high-density vector store for semantic search.
*   **Cloudinary** — Highly reliable image hosting and CDN optimization.
*   **Hugging Face Inference Hub** — Serverless REST embeddings engine using official client SDKs.
*   **Groq & Google Gemini APIs** — Multi-tiered LLM fallback chain for extremely fast vision OCR and structured text summaries.

---

## 🚀 Performance Optimizations

Unlike standard Python AI backends that suffer from **20+ second cold starts** (due to heavy local packages like PyTorch, Transformers, and PaddleOCR), Recall AI is engineered for production-grade latency:

1.  **Serverless offloading:** Offloaded OCR and embeddings calculation from local CPU containers to specialized Cloud APIs (Groq, Gemini, Hugging Face Hub).
2.  **Lazy-Loading Imports:** Postponed heavy library imports (such as LangChain and Groq clients) until the specific routes (`/api/chat`) are called. This keeps the FastAPI startup import chain under **1.2 seconds**.
3.  **Warm-Start Latency:** Once a container is warm, full multi-step indexing (Upload to Cloudinary -> Vision OCR -> Summary -> Embedding -> Supabase storage) completes in **less than 3 seconds**.

---

## 💻 Running Locally

### **1. Backend Setup**

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and install dependencies:
    ```bash
    python -m venv venv
    ./venv/Scripts/activate  # On Windows
    source venv/bin/activate # On Unix
    pip install -r requirements.txt  # Or install Modal directly
    ```
3.  Set up your `.env` file inside the `backend` folder:
    ```env
    # API Credentials
    GEMINI_API_KEY=your_gemini_api_key
    GROQ_API_KEY=your_groq_api_key
    CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
    SUPABASE_URL=https://your-project.supabase.co
    SUPABASE_KEY=your-supabase-service-role-or-anon-key
    HF_TOKEN=your_huggingface_write_token
    ```
4.  Run the backend locally in development mode:
    ```bash
    python -m uvicorn app.main:app --reload
    ```

---

### **2. Frontend Setup**

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) to interact with Recall AI!

---

## 🌐 Deployment Guide

### **Deploy Backend (Modal)**
We use **Modal** to deploy the FastAPI application serverlessly in under 10 seconds:
```bash
cd backend
python -m modal deploy modal_app.py
```
This automatically builds the container, registers it on your Modal account, and outputs a public web endpoint URL (e.g., `https://<your-username>--recall-fastapi-app.modal.run`).

### **Deploy Frontend (Vercel)**
1.  Push this workspace repository to **GitHub**.
2.  In the [Vercel Dashboard](https://vercel.com/), select **Add New -> Project** and import the repository.
3.  **Crucial Configuration:** Under the **Configure Project** settings:
    *   Click **Edit** next to **Root Directory** and select the `frontend` folder.
    *   Keep the Framework Preset as **Next.js**.
4.  Click **Deploy**!
