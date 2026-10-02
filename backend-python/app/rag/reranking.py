import re
from typing import List, Dict, Any

def rerank_chunks(chunks: List[Dict[str, Any]], query: str = "") -> List[Dict[str, Any]]:
    """Hybrid Semantic + Lexical Reranker combining cosine similarity and term overlap."""
    if not chunks or not query or not isinstance(query, str):
        return chunks

    clean_query = query.lower().strip()
    stop_words = {'the', 'and', 'for', 'with', 'about', 'what', 'where', 'from', 'this', 'that', 'is', 'are', 'in'}
    raw_terms = re.split(r'[\s,.;:!?\-+*/()]+', clean_query)
    query_terms = [t for t in raw_terms if len(t) > 2 and t not in stop_words]

    scored = []
    for chunk in chunks:
        base_similarity = float(chunk.get("similarity", 0.5))
        content_lower = (chunk.get("content") or "").lower()

        lexical_score = 0.0

        # 1. Exact query phrase match bonus
        if len(clean_query) > 4 and clean_query in content_lower:
            lexical_score += 0.25

        # 2. Term frequency and distribution
        matched_terms_count = 0
        for term in query_terms:
            if term in content_lower:
                matched_terms_count += 1
                occurrences = len(re.findall(re.escape(term), content_lower))
                lexical_score += min(occurrences * 0.05, 0.15)

        # 3. Fraction of query terms present
        if query_terms:
            term_coverage = matched_terms_count / len(query_terms)
            lexical_score += term_coverage * 0.2

        # 60% semantic + 40% lexical
        final_score = (base_similarity * 0.6) + (min(lexical_score, 1.0) * 0.4)
        rerank_score = round(min(final_score, 1.0), 4)

        chunk_copy = dict(chunk)
        chunk_copy["similarity"] = base_similarity
        chunk_copy["rerankScore"] = rerank_score
        scored.append(chunk_copy)

    scored.sort(key=lambda x: x["rerankScore"], reverse=True)
    return scored
