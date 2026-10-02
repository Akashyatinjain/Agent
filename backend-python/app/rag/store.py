from typing import List, Dict, Any, Optional

class InMemoryRAGStore:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.files: List[Dict[str, Any]] = []

    def save_document(self, doc: Dict[str, Any]):
        idx = next((i for i, d in enumerate(self.documents) if d.get("id") == doc.get("id")), -1)
        if idx >= 0:
            self.documents[idx].update(doc)
        else:
            self.documents.append(doc)

    def get_documents(self, user_id: Optional[str] = None, file_id: Optional[str] = None) -> List[Dict[str, Any]]:
        return [
            d for d in self.documents
            if (not user_id or d.get("userId") == user_id)
            and (not file_id or d.get("fileId") == file_id)
        ]

    def search_documents(
        self,
        query_vector: List[float],
        user_id: str,
        top_k: int = 5,
        min_similarity: float = 0.15,
        file_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        user_docs = self.get_documents(user_id, file_id)
        if not user_docs or not query_vector:
            return []

        scored = []
        q_len = len(query_vector)

        for doc in user_docs:
            emb = doc.get("embedding")
            if not emb:
                continue

            # Dot product of normalized unit vectors = Cosine similarity
            limit = min(q_len, len(emb))
            dot = sum(query_vector[i] * emb[i] for i in range(limit))
            sim = max(0.0, min(1.0, dot))

            if sim >= min_similarity:
                scored.append({
                    "id": doc.get("id"),
                    "content": doc.get("content"),
                    "metadata": doc.get("metadata", {}),
                    "fileId": doc.get("fileId"),
                    "similarity": round(sim, 4)
                })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]

    def save_file(self, file_data: Dict[str, Any]):
        idx = next((i for i, f in enumerate(self.files) if f.get("id") == file_data.get("id")), -1)
        if idx >= 0:
            self.files[idx].update(file_data)
        else:
            self.files.append(file_data)

    def delete_file(self, file_id: str, user_id: Optional[str] = None):
        self.files = [f for f in self.files if not (f.get("id") == file_id and (not user_id or f.get("userId") == user_id))]
        self.documents = [d for d in self.documents if not (d.get("fileId") == file_id and (not user_id or d.get("userId") == user_id))]

in_memory_store = InMemoryRAGStore()
