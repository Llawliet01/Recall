import modal
import os

# --- OPTIMIZED CPU DEPLOYMENT ---
# Uses debian_slim (small, fast boot) + paddlepaddle CPU (no CUDA issues)
# keep_warm=1 eliminates cold starts (15-30 sec delay on first request)
# This is the most cost-efficient and reliable setup for a portfolio project

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "libgl1-mesa-glx",   # Required by OpenCV (used by PaddleOCR)
        "libglib2.0-0",      # Required by OpenCV
        "libgomp1",          # Required by PaddleOCR for parallel CPU threads
        "libxml2",           # Required by lxml (HTML parsing)
        "zlib1g-dev",        # Required by Pillow image compression
    )
    .pip_install(
        # Web framework
        "fastapi",
        "uvicorn",
        "pydantic",
        "pydantic-settings",
        "python-multipart",
        # Database
        "supabase",
        # LLM chains
        "langchain",
        "langchain-community",
        "langchain-google-genai",
        "langchain-groq",
        "google-generativeai",
        # Web scraping
        "playwright",
        # Utilities
        "python-dotenv",
        "requests",
        "beautifulsoup4",
        "pillow",
        "cloudinary",
        "huggingface_hub",
        "numpy",
    )
    .run_commands("python -m playwright install chromium --with-deps")
    # Bake application code and secrets into the image
    .add_local_dir(os.path.join(os.path.dirname(__file__), "app"), remote_path="/app")
    .add_local_file(os.path.join(os.path.dirname(__file__), ".env"), remote_path="/.env")
)

app = modal.App("recall", image=image)

@app.function(
    # NO gpu= here — pure CPU, 3.7x cheaper than Cloud Run, no CUDA issues
    timeout=300,        # 5 minute max per request
    min_containers=0,   # Set to 0 to save credits when idle ($0/hr). Set to 1 for zero cold-starts during active demos.
    memory=4096,        # Increased to 4GB RAM to prevent OOM restarts on heavy package imports
    cpu=4.0,            # 4 physical cores (= 8 vCPU equivalent) for high-frequency multithreaded math execution
)
@modal.asgi_app()
def fastapi_app():
    # Disable oneDNN to prevent CPU inference attribute errors
    os.environ["FLAGS_use_onednn"] = "0"

    # Add root to sys.path so 'from app.xxx' resolves correctly inside container
    import sys
    sys.path.append("/")
    from app.main import app as local_fastapi_app
    return local_fastapi_app
