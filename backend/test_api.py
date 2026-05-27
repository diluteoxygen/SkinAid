import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_analyze():
    with open("backend/test.jpg", "rb") as f:
        # Note: This will fail on 400 because GEMINI_API_KEY is fake, but we want to make sure Pydantic schemas validate correctly.
        try:
            response = client.post("/api/analyze", files={"image": f})
            print("Status Code:", response.status_code)
            print("Response:", response.json())
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    test_analyze()
