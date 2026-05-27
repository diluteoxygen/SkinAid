import json
import os
from datetime import datetime, timezone
import uuid

SESSION_FILE = os.path.join(os.path.dirname(__file__), "sessions.json")

def _load_sessions():
    if not os.path.exists(SESSION_FILE):
        return {}
    try:
        with open(SESSION_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def _save_sessions(data):
    with open(SESSION_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def create_session(image_filename, predictions_obj, initial_assistant_msg, profile=None, severity_index=None, marked_image_url=None, suggested_follow_ups=None):
    sessions = _load_sessions()
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Auto-generate session title from top prediction
    top_predictions = predictions_obj.get("top_k", [])
    if top_predictions:
        top_label = top_predictions[0].get("label", "Unknown")
        # Capitalize and clean up the label
        title = top_label.replace("_", " ").title() + " Analysis"
    else:
        title = "Skin Analysis"

    session_data = {
        "session_id": session_id,
        "created_at": now,
        "updated_at": now,
        "title": title,
        "messages": [
            {
                "message_id": str(uuid.uuid4()),
                "role": "assistant",
                "content": initial_assistant_msg,
                "suggested_follow_ups": suggested_follow_ups,
                "timestamp": now
            }
        ],
        "images": [
            {
                "image_id": str(uuid.uuid4()),
                "image_path": image_filename,
                "uploaded_at": now,
                "width": 224,
                "height": 224
            }
        ],
        "prediction_history": [
            {
                "prediction_id": str(uuid.uuid4()),
                "image_id": str(uuid.uuid4()),
                "top_k": predictions_obj.get("top_k", []),
                "confidence": predictions_obj.get("confidence", "medium")
            }
        ],
        "profile": profile,
        "severity_index": severity_index,
        "marked_image_url": marked_image_url
    }
    
    sessions[session_id] = session_data
    _save_sessions(sessions)
    return session_data

def get_session(session_id):
    sessions = _load_sessions()
    return sessions.get(session_id)

def get_all_sessions():
    sessions = _load_sessions()
    session_list = list(sessions.values())
    session_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return session_list

def add_message(session_id, role, content, suggested_follow_ups=None):
    sessions = _load_sessions()
    if session_id not in sessions:
        return None
        
    now = datetime.now(timezone.utc).isoformat()
    sessions[session_id]["messages"].append({
        "message_id": str(uuid.uuid4()),
        "role": role,
        "content": content,
        "suggested_follow_ups": suggested_follow_ups,
        "timestamp": now
    })
    sessions[session_id]["updated_at"] = now
    _save_sessions(sessions)
    return sessions[session_id]

def delete_session(session_id):
    sessions = _load_sessions()
    if session_id in sessions:
        del sessions[session_id]
        _save_sessions(sessions)
        return True
    return False

