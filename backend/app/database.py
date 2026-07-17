from supabase import create_client, Client
from app.config import settings
from app.embeddings import get_embedding_manager
from typing import List, Dict, Any

class VectorDB:
    def __init__(self):
        # Sanitize URL by removing trailing rest/v1 suffixes if present
        url = settings.supabase_url.strip()
        if url.endswith("/rest/v1/"):
            url = url[:-9]
        elif url.endswith("/rest/v1"):
            url = url[:-8]
            
        print(f"Connecting to Supabase Database at: {url}")
        # Initialize Supabase client
        self.client: Client = create_client(url, settings.supabase_key)
        self.embed_manager = get_embedding_manager()

    def add_item(self, item_id: str, text: str, metadata: Dict[str, Any], user_id: str):
        # 1. Generate local 384-dim embedding
        embedding = self.embed_manager.get_embedding(text)
        
        # 2. Inject user_id into metadata JSON
        metadata = {**metadata, "user_id": user_id}
        
        # 3. Insert or update the items table in Supabase
        try:
            self.client.table("items").upsert({
                "id": item_id,
                "content": text,
                "metadata": metadata,
                "embedding": embedding
            }).execute()
            print(f"Supabase pgvector: Successfully indexed item {item_id} for user {user_id}")
        except Exception as e:
            print(f"Supabase pgvector insert failed: {e}")
            raise e

    def search_similar(self, query_text: str, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        # 1. Generate local embedding
        query_embedding = self.embed_manager.get_embedding(query_text)
        
        # 2. Call the match_items RPC database function in Supabase
        # We query a larger limit (e.g. 100) and filter by user_id in Python
        try:
            response = self.client.rpc("match_items", {
                "query_embedding": query_embedding,
                "match_threshold": 0.0,
                "match_count": 100
            }).execute()
            
            formatted_results = []
            if response and response.data:
                for row in response.data:
                    item_id = row.get("id")
                    if item_id and item_id.startswith("watcher_status_"):
                        continue
                    meta = row.get("metadata") or {}
                    if meta.get("user_id") == user_id:
                        formatted_results.append({
                            "id": item_id,
                            "metadata": meta,
                            "document": row.get("content"),
                            "score": round(row.get("similarity", 0.0), 4)
                        })
                        
            # Return only the top matching elements sliced to the limit
            return formatted_results[:limit]
        except Exception as e:
            print(f"Supabase pgvector search RPC failed: {e}")
            raise e

    def delete_item(self, item_id: str, user_id: str):
        try:
            # Enforce that user can only delete their own item
            self.client.table("items").delete().eq("id", item_id).eq("metadata->>user_id", user_id).execute()
            print(f"Supabase pgvector: Deleted item {item_id} for user {user_id}")
        except Exception as e:
            print(f"Supabase pgvector delete failed: {e}")
            raise e

    def get_all_items(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        try:
            # Filter query by metadata->>user_id
            response = self.client.table("items") \
                .select("id, content, metadata") \
                .eq("metadata->>user_id", user_id) \
                .order("metadata->>created_at", desc=True, nullsfirst=False) \
                .limit(limit) \
                .execute()
            formatted_results = []
            if response and response.data:
                for row in response.data:
                    item_id = row.get("id")
                    if item_id and item_id.startswith("watcher_status_"):
                        continue
                    formatted_results.append({
                        "id": item_id,
                        "metadata": row.get("metadata"),
                        "document": row.get("content")
                    })
            return formatted_results
        except Exception as e:
            print(f"Supabase pgvector get_all_items failed: {e}")
            raise e


vector_db = None

def get_vector_db():
    global vector_db
    if vector_db is None:
        vector_db = VectorDB()
    return vector_db
