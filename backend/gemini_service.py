import os

from google import genai
from dotenv import load_dotenv
from PIL import Image

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

sys_prompt_path = os.path.join(os.path.dirname(__file__), "system_prompt.md")
with open(sys_prompt_path, "r", encoding="utf-8") as f:
    SYSTEM_PROMPT = f.read()

import re
from schemas import ProfileMetadata, GeminiStructuredAnalysis, GeminiStructuredChat
def generate_response(predictions, image_path: str, profile: ProfileMetadata = None):
    profile_text = ""
    if profile:
        profile_text = f"""
Patient Profile:
- Age: {profile.age or 'Unknown'}
- Gender: {profile.gender or 'Unknown'}
- Lesion Area: {profile.lesion_area or 'Unknown'}
- Timeline: {profile.timeline or 'Unknown'}
- Additional Notes/History: {profile.notes or 'None'}
"""

    prompt = f"""{SYSTEM_PROMPT}

---
{profile_text}
Predictions from our local CLIP model:
{predictions}

Analyze the provided image alongside the CLIP model predictions and generate the response according to the precise format defined in your instructions.
    """

    image = Image.open(image_path)

    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=[prompt, image],
        config={
            "response_mime_type": "application/json",
            "response_schema": GeminiStructuredAnalysis
        }
    )

    text = response.text
    # text is now a JSON string containing the structured data
    # severity is part of the JSON, we don't need to parse it with regex anymore.
    # However, we need to return text as string.
    # Wait, the frontend will parse the text. But the backend schemas might need it.
    import json
    try:
        data = json.loads(text)
        severity = data.get("severity_index")
    except json.JSONDecodeError:
        severity = None

    return text, severity



def generate_chat_response(history_text: str, new_message: str):
    prompt = f"""{SYSTEM_PROMPT}

---
    
Here is the conversation history so far:
{history_text}

User's new message:
{new_message}

Maintain the persona defined in your instructions. Respond naturally to the user, answering their follow-up questions while adhering closely to all the safety constraints, core principles, and communication style boundaries defined above.
    """
    
    response = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": GeminiStructuredChat
        }
    )
    
    return response.text
