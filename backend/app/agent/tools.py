import os
import httpx
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.tools import tool
from ..rag.retriever import query_knowledge_base


def get_tavily_search_tool() -> TavilySearchResults:
    return TavilySearchResults(
        max_results=3,
        name="web_search",
        description=(
            "Search the internet for current, real-time information. "
            "Use when the knowledge base has no results or the user asks about recent events."
        ),
        api_key=os.getenv("TAVILY_API_KEY"),
    )


@tool
def get_weather(city: str) -> str:
    """Get the current weather for any city in the world. Use this when the user asks about weather, temperature, climate or atmospheric conditions in a city."""
    url = (
        f"http://api.openweathermap.org/data/2.5/weather"
        f"?q={city}&appid={os.getenv('OPENWEATHER_API_KEY')}&units=metric&lang=es"
    )
    response = httpx.get(url, timeout=10)
    data = response.json()
    if data.get("cod") != 200:
        return f"Could not get weather for {city}. Try with the city name in English."
    weather = data["weather"][0]["description"]
    temp = data["main"]["temp"]
    feels_like = data["main"]["feels_like"]
    humidity = data["main"]["humidity"]
    return f"Weather in {city}: {weather}, {temp}°C (feels like {feels_like}°C), humidity {humidity}%"


@tool
def convert_currency(amount: float, from_currency: str, to_currency: str = "USD") -> str:
    """Convert an amount from one currency to another. Use this when the user asks about exchange rates or wants to convert money between currencies."""
    url = f"https://open.er-api.com/v6/latest/{from_currency.upper()}"
    response = httpx.get(url, timeout=10)
    data = response.json()
    if data.get("result") != "success":
        return f"Could not get exchange rates for {from_currency}"
    rate = data["rates"].get(to_currency.upper())
    if not rate:
        return f"Currency {to_currency} not found"
    result = amount * rate
    return f"{amount} {from_currency.upper()} = {result:.2f} {to_currency.upper()} (rate: {rate})"


@tool
def search_knowledge_base(query: str) -> str:
    """Search the internal knowledge base built from the RAG source URL. Always try this before web_search."""
    results = query_knowledge_base(query)
    if not results:
        return "Knowledge base is empty or no results found."
    return "\n\n".join(results)


def get_tools() -> list:
    return [get_tavily_search_tool(), get_weather, convert_currency, search_knowledge_base]
