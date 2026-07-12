from supabase import create_client, Client
from app.config import settings
from app.embeddings import get_embedding_manager
from typing import List, Dict, Any

class VectorDB:
    def __init__(self):
        print(f"Connecting to Supabase Database at: {settings.supabase_url}")
        # Initialize Supabase client
        self.client: Client = create_client(settings.supabase_url, settings.supabase_key)
        self.embed_manager = get_embedding_manager()

    def add_item(self, item_id: str, text: str, metadata: Dict[str, Any]):
        # 1. Generate local 384-dim embedding
        embedding = self.embed_manager.get_embedding(text)
        
        # 2. Insert or update the items table in Supabase
        # We store id, text (content), metadata JSON, and the embedding array
        try:
            self.client.table("items").upsert({
                "id": item_id,
                "content": text,
                "metadata": metadata,
                "embedding": embedding
            }).execute()
            print(f"Supabase pgvector: Successfully indexed item {item_id}")
        except Exception as e:
            print(f"Supabase pgvector insert failed: {e}")
            raise e

    def search_similar(self, query_text: str, limit: int = 5) -> List[Dict[str, Any]]:
        # 1. Generate local embedding
        query_embedding = self.embed_manager.get_embedding(query_text)
        
        # 2. Call the match_items RPC database function in Supabase
        try:
            response = self.client.rpc("match_items", {
                "query_embedding": query_embedding,
                "match_threshold": 0.0, # returns all matches, ordered by similarity
                "match_count": limit
            }).execute()
            
            formatted_results = []
            if response and response.data:
                for row in response.data:
                    formatted_results.append({
                        "id": row.get("id"),
                        "metadata": row.get("metadata"),
                        "document": row.get("content"),
                        "score": round(row.get("similarity", 0.0), 4)
                    })
            return formatted_results
        except Exception as e:
            print(f"Supabase pgvector search RPC failed: {e}")
            raise e

    def delete_item(self, item_id: str):
        try:
            self.client.table("items").delete().eq("id", item_id).execute()
            print(f"Supabase pgvector: Deleted item {item_id}")
        except Exception as e:
            print(f"Supabase pgvector delete failed: {e}")
            raise e

vector_db = None

def get_vector_db():
    global vector_db
    if vector_db is None:
        vector_db = VectorDB()
    return vector_db
