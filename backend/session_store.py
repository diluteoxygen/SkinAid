import os
from datetime import datetime, timezone
import uuid
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL", "")
# Use the service role key to bypass RLS since the backend is a trusted environment
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_KEY", ""))

# Initialize Supabase client if URL and key are provided
# If not, fail gracefully or handle appropriately.
try:
    supabase: Client = create_client(url, key)
except Exception:
    supabase = None

def _get_supabase():
    if not supabase:
        raise Exception("Supabase client not initialized. Please check SUPABASE_URL and SUPABASE_KEY.")
    return supabase

def create_session(image_filename, predictions_obj, initial_assistant_msg, profile=None, severity_index=None, marked_image_url=None, suggested_follow_ups=None):
    client = _get_supabase()
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    top_predictions = predictions_obj.get("top_k", [])
    if top_predictions:
        top_label = top_predictions[0].get("label", "Unknown")
        title = top_label.replace("_", " ").title() + " Analysis"
    else:
        title = "Skin Analysis"

    session_data = {
        "session_id": session_id,
        "created_at": now,
        "updated_at": now,
        "title": title,
        "profile": profile,
        "severity_index": severity_index,
        "marked_image_url": marked_image_url
    }
    
    # Insert session
    client.table("sessions").insert(session_data).execute()
    
    # Insert initial messages
    messages = [
        {
            "message_id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": "user",
            "content": "Uploaded an image for analysis.",
            "timestamp": now
        },
        {
            "message_id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": "assistant",
            "content": initial_assistant_msg,
            "suggested_follow_ups": suggested_follow_ups,
            "timestamp": now
        }
    ]
    client.table("messages").insert(messages).execute()
    
    # Insert image record
    image_record = {
        "image_id": str(uuid.uuid4()),
        "session_id": session_id,
        "image_path": image_filename,
        "uploaded_at": now,
        "width": 224,
        "height": 224
    }
    client.table("images").insert(image_record).execute()
    
    # Insert prediction history
    pred_record = {
        "prediction_id": str(uuid.uuid4()),
        "session_id": session_id,
        "image_id": image_record["image_id"],
        "top_k": predictions_obj.get("top_k", []),
        "confidence": predictions_obj.get("confidence", "medium")
    }
    client.table("prediction_history").insert(pred_record).execute()
    
    return get_session(session_id)

def get_session(session_id):
    client = _get_supabase()
    
    session_res = client.table("sessions").select("*").eq("session_id", session_id).execute()
    if not session_res.data:
        return None
        
    session = session_res.data[0]
    
    messages_res = client.table("messages").select("*").eq("session_id", session_id).order("timestamp").execute()
    session["messages"] = messages_res.data
    
    images_res = client.table("images").select("*").eq("session_id", session_id).execute()
    session["images"] = images_res.data
    
    preds_res = client.table("prediction_history").select("*").eq("session_id", session_id).execute()
    session["prediction_history"] = preds_res.data
    
    return session

def get_all_sessions():
    client = _get_supabase()
    res = client.table("sessions").select("session_id, created_at, title").order("created_at", desc=True).execute()
    return res.data

def add_message(session_id, role, content, suggested_follow_ups=None):
    client = _get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    
    msg = {
        "message_id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": role,
        "content": content,
        "suggested_follow_ups": suggested_follow_ups,
        "timestamp": now
    }
    client.table("messages").insert(msg).execute()
    
    # Update session updated_at
    client.table("sessions").update({"updated_at": now}).eq("session_id", session_id).execute()
    
    return get_session(session_id)

def delete_session(session_id):
    client = _get_supabase()
    res = client.table("sessions").delete().eq("session_id", session_id).execute()
    return len(res.data) > 0
