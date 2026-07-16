from huggingface_hub import InferenceClient
from typing import List
from app.config import settings

class EmbeddingManager:
    def __init__(self):
        # Initialize InferenceClient. Uses HF_TOKEN if provided.
        self.client = InferenceClient(api_key=settings.hf_token if settings.hf_token else None)
        print("EmbeddingManager initialized using Hugging Face InferenceClient.")

    def get_embedding(self, text: str) -> List[float]:
        if not text.strip():
            # all-MiniLM-L6-v2 has 384 dimensions
            return [0.0] * 384
            
        try:
            embedding = self.client.feature_extraction(
                text,
                model="sentence-transformers/all-MiniLM-L6-v2"
            )
            # Check response type and convert to list of floats
            if hasattr(embedding, "tolist"):
                return [float(x) for x in embedding.tolist()]
            elif isinstance(embedding, list):
                return [float(x) for x in embedding]
            else:
                return [float(x) for x in list(embedding)]
        except Exception as e:
            print(f"Hugging Face InferenceClient failed: {e}")
            # Fallback to zero vector to prevent crash
            return [0.0] * 384

embedding_manager = None


def get_embedding_manager():
    global embedding_manager
    if embedding_manager is None:
        embedding_manager = EmbeddingManager()
    return embedding_manager

