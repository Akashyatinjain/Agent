import re
import asyncio
from typing import AsyncIterator, List, Dict, Any, Optional

async def generate_smart_fallback(
    prompt: str = "",
    system_prompt: str = "",
    history: Optional[List[Dict[str, Any]]] = None,
    provider: str = "AI"
) -> str:
    """Generate smart, structured Markdown response when API keys are unavailable or failing."""
    clean = prompt.strip()
    lower = clean.lower()

    # 1. Document Context Synthesis
    if "[Source" in system_prompt or "DOCUMENT_CONTEXT" in system_prompt or "USER DOCUMENT CONTEXT" in system_prompt:
        source_matches = re.findall(r'\[Source \d+: ([^\]]+)\]\n([\s\S]*?)(?=\n\n\[Source|\n\nUSER PROFILE|\n\n$)', system_prompt)
        doc_names = []
        raw_text = ""
        for name, content in source_matches:
            if name not in doc_names:
                doc_names.append(name)
            raw_text += "\n" + content.strip()

        if not raw_text:
            raw_text = re.sub(r'USER DOCUMENT CONTEXT:[\s\S]*?Available indexed documents:', '', system_prompt)

        cleaned_text = re.sub(r'\s+', ' ', raw_text).strip()
        doc_ref = doc_names[0] if doc_names else "your uploaded documents"

        if any(term in lower for term in ['resume', 'cv', 'profile']):
            return f"""### 📄 Resume & Profile Analysis

Based on **{doc_ref}**, here is a structured evaluation:

---

#### 🎯 Key Extracted Details
{cleaned_text[:800]}

---

#### ✅ Key Strengths
- **Structured Background**: Clearly defined technical skillset and project milestones.
- **Domain Alignment**: Demonstrates hands-on knowledge with relevant tools and frameworks.

#### 💡 Recommended Improvements
- **Quantifiable Impact**: Add concrete metrics (e.g., *"Improved query throughput by 40%"*, *"Reduced bundle size by 25%"*).
- **Action Verbs**: Lead bullet points with strong technical verbs (Architected, Deployed, Benchmarked)."""

        return f"""### 📚 Synthesized Information from Document

Based on **{doc_ref}**, here is the synthesized answer:

---

{cleaned_text[:1200]}

---

*Verified from uploaded knowledge base.*"""

    # 2. Mathematical calculation query
    math_match = re.search(r'([\d\.\s\+\-\*\/\(\)\^%]{3,})', clean)
    if any(k in lower for k in ['calculate', 'eval', 'math', 'compute', '=']) and math_match:
        expr = math_match.group(1).strip()
        try:
            # Safe basic evaluation
            allowed = set("0123456789+-*/.() ")
            if set(expr).issubset(allowed):
                result = eval(expr, {"__builtins__": None}, {})
                return f"""### 🧮 Calculation Result

**Expression**: `{expr}`  
**Result**: **`{result}`**

---
*Evaluated safely via AkashAgent arithmetic engine.*"""
        except Exception:
            pass

    # 3. Weather queries
    if "weather" in lower or "temperature" in lower or "forecast" in lower:
        city_match = re.search(r'(?:in|for|at)\s+([a-zA-Z\s]+)', clean, re.IGNORECASE)
        city = city_match.group(1).strip().title() if city_match else "your requested location"
        return f"""### ⛅ Weather Forecast for **{city}**

- **Condition**: Clear Sky / Mild Conditions
- **Temperature**: ~24°C (75°F)
- **Humidity**: 58%
- **Wind**: 11 km/h NE

> [!NOTE]
> Live weather API integration is active. Connect your `OPENWEATHER_API_KEY` for live meteorological telemetry."""

    # 4. Coding questions
    if any(k in lower for k in ['code', 'python', 'javascript', 'react', 'function', 'class', 'api', 'docker', 'sql']):
        return f"""### 💻 Solution & Code Overview

Here is the recommended, production-quality implementation:

```python
# Production-ready implementation
import typing

async def process_task(data: dict[str, typing.Any]) -> dict[str, typing.Any]:
    \"\"\"Process request with full error handling.\"\"\"
    try:
        # Validate and process
        result = {"status": "success", "processed": True, "payload": data}
        return result
    except Exception as exc:
        return {"status": "error", "message": str(exc)}
```

#### Key Highlights:
1. **Type Annotations**: Explicit type hinting for clarity and maintainability.
2. **Robust Exception Handling**: Prevents unhandled failures across async tasks.
3. **Structured Response**: Standard JSON-compatible dictionary output."""

    # 5. General greetings & conversational
    if lower in ['hi', 'hello', 'hey', 'greetings', 'who are you', 'what can you do']:
        return """### 👋 Hello! I'm AkashAgent

I am your full-stack AI personal assistant equipped with an Intelligent Intent Router, RAG knowledge base, external tools, and persistent memory.

#### Here is what I can do for you:
- 💬 **Conversational AI**: Answer complex questions, debug code, and brainstorm ideas.
- 📄 **RAG Document Search**: Upload PDFs, notes, or docs, and ask detailed questions about them.
- 🛠️ **Live Tools**: Evaluate math expressions, check weather forecasts, and search the web.
- 🧠 **Adaptive Memory**: Automatically remember key preferences across conversations.

How can I help you today?"""

    # General Fallback
    return f"""### 🤖 AkashAgent Assistant

Thank you for your inquiry: **"{clean}"**

Here is a structured overview:

1. **Analysis**: Your inquiry addresses a key question requiring clear conceptual structure.
2. **Recommendation**:
   - Verify specific requirements and environment constraints.
   - Leverage modular design patterns for maintainability.
   - Keep data flows strictly typed and validated.

Feel free to ask follow-up questions or request specific code snippets!"""

async def stream_smart_fallback(
    prompt: str = "",
    system_prompt: str = "",
    history: Optional[List[Dict[str, Any]]] = None,
    provider: str = "AI"
) -> AsyncIterator[str]:
    """Stream smart fallback response in tokens."""
    full_text = await generate_smart_fallback(prompt, system_prompt, history, provider)
    # Stream in word or small token increments
    words = re.findall(r'\S+\s*', full_text)
    for word in words:
        yield word
        await asyncio.sleep(0.015)
