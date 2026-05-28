import json
import os
import time
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

import sys

url = os.environ.get("SUPABASE_URL", "")
# We MUST use the service role key to bypass RLS for migration
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or not key:
    print("=====================================================")
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY is missing!")
    print("To migrate data into Supabase, you must bypass Row Level Security (RLS).")
    print("Please go to your Supabase Dashboard -> Project Settings -> API")
    print("Copy the 'service_role' secret key and add it to your backend/.env file as:")
    print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here")
    print("=====================================================")
    sys.exit(1)

supabase: Client = create_client(url, key)

def migrate():
    json_path = "sessions.json"
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        data = json.load(f)

    # Convert dictionary to list
    sessions = list(data.values())
    print(f"Found {len(sessions)} sessions to migrate.")

    for i, s in enumerate(sessions):
        print(f"Migrating session {i+1}/{len(sessions)}: {s['session_id']}")
        
        # Check if session exists
        try:
            existing = supabase.table("sessions").select("session_id").eq("session_id", s["session_id"]).execute()
            if existing.data:
                print(f"  Session {s['session_id']} already exists. Deleting existing records for a clean re-migration...")
                supabase.table("sessions").delete().eq("session_id", s["session_id"]).execute()
        except Exception as e:
            print(f"  Error checking/clearing session {s['session_id']}: {e}")
            continue
            
        title = s.get("title", "Skin Analysis")
        profile = s.get("profile", None)
        severity_index = s.get("severity_index", None)
        marked_image_url = s.get("marked_image_url", None)

        session_data = {
            "session_id": s["session_id"],
            "created_at": s["created_at"],
            "updated_at": s["updated_at"],
            "title": title,
            "profile": profile,
            "severity_index": severity_index,
            "marked_image_url": marked_image_url
        }

        # Insert session
        try:
            supabase.table("sessions").insert(session_data).execute()
        except Exception as e:
            print(f"  Failed to insert session: {e}")
            continue

        # Insert messages
        messages = s.get("messages", [])
        if messages:
            msg_records = []
            for m in messages:
                msg_records.append({
                    "message_id": m["message_id"],
                    "session_id": s["session_id"],
                    "role": m["role"],
                    "content": m["content"],
                    "suggested_follow_ups": m.get("suggested_follow_ups", None),
                    "timestamp": m["timestamp"]
                })
            try:
                supabase.table("messages").insert(msg_records).execute()
            except Exception as e:
                print(f"  Failed to insert messages: {e}")

        # Insert images
        images = s.get("images", [])
        if images:
            img_records = []
            for img in images:
                img_records.append({
                    "image_id": img["image_id"],
                    "session_id": s["session_id"],
                    "image_path": img["image_path"],
                    "uploaded_at": img["uploaded_at"],
                    "width": img.get("width", 224),
                    "height": img.get("height", 224)
                })
            try:
                supabase.table("images").insert(img_records).execute()
            except Exception as e:
                print(f"  Failed to insert images: {e}")

        # Insert prediction history
        preds = s.get("prediction_history", [])
        if preds:
            valid_image_ids = [img["image_id"] for img in images]
            pred_records = []
            for p in preds:
                image_id = p["image_id"]
                if image_id not in valid_image_ids:
                    if valid_image_ids:
                        old_image_id = image_id
                        image_id = valid_image_ids[0]
                        print(f"  [Fix] Mismatched image_id '{old_image_id}' resolved to session's image_id '{image_id}'")
                    else:
                        print(f"  [Warning] Skipping prediction history {p['prediction_id']} because session has no images.")
                        continue
                pred_records.append({
                    "prediction_id": p["prediction_id"],
                    "session_id": s["session_id"],
                    "image_id": image_id,
                    "top_k": p["top_k"],
                    "confidence": p["confidence"]
                })
            if pred_records:
                try:
                    supabase.table("prediction_history").insert(pred_records).execute()
                except Exception as e:
                    print(f"  Failed to insert prediction history: {e}")

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
