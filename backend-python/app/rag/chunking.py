import re
from typing import List

def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 60,
    min_chunk_size: int = 40,
    max_chunks: int = 400
) -> List[str]:
    """Recursive semantic paragraph and character chunking algorithm."""
    if not text or not isinstance(text, str):
        return []

    # Normalize whitespace while preserving paragraph breaks
    clean = text.replace('\r\n', '\n').replace('\t', ' ')
    clean = re.sub(r'[ ]{2,}', ' ', clean).strip()

    if not clean:
        return []

    if len(clean) <= chunk_size:
        return [clean]

    safe_overlap = min(overlap, int(chunk_size * 0.4))
    chunks: List[str] = []
    start_index = 0
    total_len = len(clean)

    while start_index < total_len and len(chunks) < max_chunks:
        end_index = min(start_index + chunk_size, total_len)

        if end_index < total_len:
            slice_text = clean[start_index:end_index]

            last_double_newline = slice_text.rfind('\n\n')
            last_newline = slice_text.rfind('\n')
            last_period = slice_text.rfind('. ')
            last_question = slice_text.rfind('? ')
            last_exclamation = slice_text.rfind('! ')
            last_space = slice_text.rfind(' ')

            sentence_boundary = max(last_period, last_question, last_exclamation)
            structural_boundary = max(last_double_newline, last_newline)

            chosen_boundary = -1
            if structural_boundary > chunk_size * 0.5:
                chosen_boundary = structural_boundary + 1
            elif sentence_boundary > chunk_size * 0.5:
                chosen_boundary = sentence_boundary + 1
            elif last_space > chunk_size * 0.4:
                chosen_boundary = last_space

            if chosen_boundary > 0:
                end_index = start_index + chosen_boundary

        chunk_content = clean[start_index:end_index].strip()
        if len(chunk_content) >= min_chunk_size:
            chunks.append(chunk_content)

        next_start = end_index - safe_overlap
        if next_start <= start_index:
            start_index = end_index
        else:
            start_index = next_start

    return chunks
