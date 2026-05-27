import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_routes():
    # 1. Test get all sessions
    resp = client.get("/api/sessions")
    print("GET /sessions:", resp.status_code, resp.json())
    
    # 2. Get the session we created from the earlier analyze test
    sessions = resp.json()
    if sessions:
        sid = sessions[0]["session_id"]
        
        # 3. Test get single session
        resp_single = client.get(f"/api/sessions/{sid}")
        print(f"GET /sessions/{sid}:", resp_single.status_code)
        
        # 4. Test chat
        chat_payload = {
            "session_id": sid,
            "message": "It gets really itchy when I sweat."
        }
        
        try:
            chat_resp = client.post("/api/chat", json=chat_payload)
            print("POST /chat:", chat_resp.status_code, chat_resp.json())
        except Exception as e:
            print("Chat error expected due to API key:", e)
            
if __name__ == "__main__":
    test_routes()
