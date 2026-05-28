from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import uuid
import time
from collections import defaultdict
from jose import jwt, JWTError
import urllib.request
import json
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY", "")
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET", "")

try:
    supabase: Client = create_client(url, key)
except Exception:
    supabase = None

JWKS_URL = f"{url}/auth/v1/.well-known/jwks.json"

# Cache JWKS
jwks_cache = None

def get_jwks():
    global jwks_cache
    if not jwks_cache:
        try:
            req = urllib.request.Request(JWKS_URL)
            with urllib.request.urlopen(req) as response:
                jwks_cache = json.loads(response.read().decode())
        except Exception as e:
            print(f"Error fetching JWKS: {e}")
            return None
    return jwks_cache

# Simple In-Memory Rate Limiter (Token Bucket)
class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)
        
    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window_seconds]
        if len(self.history[client_ip]) < self.requests_limit:
            self.history[client_ip].append(now)
            return True
        return False

# Limit to 10 analysis requests per minute per IP
analysis_limiter = RateLimiter(requests_limit=10, window_seconds=60)

async def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not analysis_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

async def verify_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token scheme")
    token = authorization.split(" ")[1]
    
    # Verify token using Supabase API
    if supabase:
        try:
            user_response = supabase.auth.get_user(token)
            if user_response and user_response.user:
                return {"sub": user_response.user.id, "email": user_response.user.email}
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
            
    # Try JWKS verification (RS256) first
    jwks = get_jwks()
    if jwks and "keys" in jwks:
        try:
            headers = jwt.get_unverified_header(token)
            kid = headers.get("kid")
            if kid:
                key = next((k for k in jwks["keys"] if k.get("kid") == kid), None)
                if key:
                    # decode using the matching JWK key dict
                    payload = jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})
                    return payload
        except JWTError:
            pass # Fall through to HS256 fallback if configured
            
    # Fallback to local JWT secret (HS256) if provided
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
            return payload
        except JWTError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
            
    raise HTTPException(status_code=401, detail="Invalid token signature or signing key not found")

from clip_infer import analyze_image
from gemini_service import generate_response, generate_chat_response, generate_lesion_markup
from schemas import ProfileMetadata
import session_store

app = FastAPI()
app.mount("/images", StaticFiles(directory="."), name="images")

# Setup CORS origins dynamically from environment variable
raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    session_id: str
    message: str

@app.post("/api/analyze")
async def analyze(
    image: UploadFile = File(...),
    age: str = Form(None),
    gender: str = Form(None),
    lesion_area: str = Form(None),
    timeline: str = Form(None),
    notes: str = Form(None),
    token: dict = Depends(verify_token),
    rate_limit: None = Depends(check_rate_limit)
):
    # 1. Enforce size limit (5MB)
    MAX_SIZE = 5 * 1024 * 1024
    image_contents = await image.read()
    if len(image_contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max allowed size is 5MB.")
    
    # 2. Sanitize image (strip EXIF metadata)
    from PIL import Image
    import io
    try:
        pil_img = Image.open(io.BytesIO(image_contents))
        if pil_img.mode in ("RGBA", "P"):
            pil_img = pil_img.convert("RGB")
        
        # Save fresh without metadata
        sanitized_io = io.BytesIO()
        pil_img.save(sanitized_io, format="JPEG")
        sanitized_io.seek(0)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file or format.")
        
    marked_id = str(uuid.uuid4())
    file_path = f"temp_{marked_id}.jpg"
    with open(file_path, "wb") as buffer:
        buffer.write(sanitized_io.read())
        
    marked_image_path = None
    try:
        raw_predictions, metrics = analyze_image(file_path)
        
        top_score = raw_predictions[0]["score"] if raw_predictions else 0
        confidence = "high" if top_score > 0.5 else ("medium" if top_score > 0.2 else "low")
        
        predictions_obj = {
            "top_k": raw_predictions,
            "confidence": confidence
        }

        profile = ProfileMetadata(
            age=age,
            gender=gender,
            lesion_area=lesion_area,
            timeline=timeline,
            notes=notes
        )

        try:
            gemini_response, severity = generate_response(predictions_obj, file_path, profile)
        except Exception as e:
            gemini_response = f'{{"primary_match": "Error", "summary": "Simulated error from Gemini: {str(e)}", "why_this_result": [], "other_possibilities": [], "recommended_actions": [], "safety_note": "", "severity_index": 0, "suggested_follow_ups": []}}'
            severity = None
            
        marked_image_path = generate_lesion_markup(file_path, marked_id)
        
        # Upload images to Supabase if configured
        final_image_url = None
        marked_image_url = None
        if supabase:
            with open(file_path, "rb") as f:
                supabase.storage.from_("images").upload(f"{marked_id}_orig.jpg", f)
            final_image_url = supabase.storage.from_("images").get_public_url(f"{marked_id}_orig.jpg")
            
            if marked_image_path:
                with open(marked_image_path, "rb") as f:
                    supabase.storage.from_("images").upload(f"{marked_id}_marked.jpg", f)
                marked_image_url = supabase.storage.from_("images").get_public_url(f"{marked_id}_marked.jpg")
        else:
            final_image_url = f"/images/{file_path}"
            marked_image_url = f"/images/{marked_image_path}" if marked_image_path else None

        # Try to extract suggested_follow_ups from the JSON to store it at the message level
        suggested_follow_ups = None
        import json
        try:
            parsed = json.loads(gemini_response)
            suggested_follow_ups = parsed.get("suggested_follow_ups", [])
        except json.JSONDecodeError:
            pass

        session = session_store.create_session(
            final_image_url, 
            predictions_obj, 
            gemini_response,
            profile=profile.dict(),
            severity_index=severity,
            marked_image_url=marked_image_url,
            suggested_follow_ups=suggested_follow_ups
        )

        return {
            "session_id": session["session_id"],
            "prediction": predictions_obj,
            "gemini_response": gemini_response,
            "metrics": metrics,
            "severity_index": severity,
            "marked_image_url": marked_image_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up local temporary files when supabase is active
        if supabase:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
            if marked_image_path and os.path.exists(marked_image_path):
                try:
                    os.remove(marked_image_path)
                except Exception:
                    pass

@app.post("/api/chat")
async def chat(request: ChatRequest, token: dict = Depends(verify_token)):
    session = session_store.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_store.add_message(request.session_id, "user", request.message)
    
    history_text = "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in session["messages"]])
    
    try:
        raw_assistant_response = generate_chat_response(history_text, request.message)
        import json
        parsed = json.loads(raw_assistant_response)
        assistant_response = parsed.get("assistant_response", raw_assistant_response)
        suggested_follow_ups = parsed.get("suggested_follow_ups", [])
    except Exception as e:
        assistant_response = f"Simulated error from Gemini: {str(e)}"
        suggested_follow_ups = []
        
    session_store.add_message(request.session_id, "assistant", assistant_response, suggested_follow_ups)
    
    return {
        "assistant_response": assistant_response,
        "suggested_follow_ups": suggested_follow_ups
    }

@app.get("/api/sessions")
async def get_sessions(token: dict = Depends(verify_token)):
    sessions = session_store.get_all_sessions()
    return [{"session_id": s["session_id"], "created_at": s["created_at"], "title": s.get("title", "Untitled")} for s in sessions]

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, token: dict = Depends(verify_token)):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, token: dict = Depends(verify_token)):
    success = session_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}
