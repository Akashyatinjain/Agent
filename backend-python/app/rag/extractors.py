import io
import csv
import json
from typing import Union
from pypdf import PdfReader
import docx

from app.core.logging import logger

async def extract_text_from_file(
    buffer: bytes,
    mime_type: str = "",
    filename: str = ""
) -> str:
    """Extract plain text from uploaded file buffer across various document formats."""
    lower_name = (filename or "").lower()
    lower_mime = (mime_type or "").lower()

    # 1. PDF
    if lower_name.endswith(".pdf") or "pdf" in lower_mime:
        try:
            reader = PdfReader(io.BytesIO(buffer))
            pages_text = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text and text.strip():
                    pages_text.append(f"--- Page {i + 1} ---\n{text.strip()}")
            return "\n\n".join(pages_text)
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise ValueError(f"Could not parse PDF document: {e}")

    # 2. DOCX
    if lower_name.endswith(".docx") or "wordprocessingml" in lower_mime:
        try:
            doc = docx.Document(io.BytesIO(buffer))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            raise ValueError(f"Could not parse Word document: {e}")

    # 3. CSV
    if lower_name.endswith(".csv") or "csv" in lower_mime:
        try:
            decoded = buffer.decode("utf-8", errors="replace")
            reader = csv.reader(io.StringIO(decoded))
            rows = ["\t".join(row) for row in reader if row]
            return "\n".join(rows)
        except Exception as e:
            logger.error(f"CSV extraction error: {e}")

    # 4. JSON
    if lower_name.endswith(".json") or "json" in lower_mime:
        try:
            parsed = json.loads(buffer.decode("utf-8", errors="replace"))
            return json.dumps(parsed, indent=2)
        except Exception as e:
            logger.error(f"JSON extraction error: {e}")

    # 5. Plain Text / Markdown / Code / Fallback
    try:
        return buffer.decode("utf-8", errors="replace")
    except Exception as e:
        logger.error(f"Generic text decode error: {e}")
        return buffer.decode("latin-1", errors="ignore")
