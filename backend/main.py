from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import uuid

from clip_infer import analyze_image
from gemini_service import generate_response, generate_chat_response, generate_lesion_markup
from schemas import ProfileMetadata
import session_store

app = FastAPI()
app.mount("/images", StaticFiles(directory="."), name="images")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
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
    notes: str = Form(None)
):
    file_path = f"temp_{image.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

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
            
        marked_id = str(uuid.uuid4())
        marked_image_path = generate_lesion_markup(file_path, marked_id)
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
            image.filename, 
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

@app.post("/api/chat")
async def chat(request: ChatRequest):
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
async def get_sessions():
    sessions = session_store.get_all_sessions()
    return [{"session_id": s["session_id"], "created_at": s["created_at"], "title": s.get("title", "Untitled")} for s in sessions]

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    session = session_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    success = session_store.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}
