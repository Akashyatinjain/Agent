import pytest
from app.tools.calculator import execute_calculator
from app.tools.weather import execute_weather
from app.tools.web_search import execute_web_search
from app.tools.registry import execute_tool_by_name, execute_tools

@pytest.mark.asyncio
async def test_calculator():
    res1 = await execute_calculator("Calculate 125 * 8")
    assert res1["success"] is True
    assert res1["result"] == 1000

    res2 = await execute_calculator("what is (10 + 20) / 2")
    assert res2["success"] is True
    assert res2["result"] == 15

@pytest.mark.asyncio
async def test_weather():
    res = await execute_weather("What is the weather in Tokyo?")
    assert res["success"] is True
    assert "Tokyo" in res["location"]
    assert "temperature" in res

@pytest.mark.asyncio
async def test_web_search():
    res = await execute_web_search("search latest quantum computing news")
    assert res["success"] is True
    assert len(res["results"]) > 0

@pytest.mark.asyncio
async def test_tool_registry():
    results = await execute_tools(["calculator", "weather"], "calculate 50 + 50")
    assert len(results) == 2
    assert any(r["tool"] == "calculator" for r in results)
