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
from PIL import ImageDraw

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
        model="gemini-2.5-flash",
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

def generate_lesion_markup(image_path: str, session_id: str) -> str:
    image = Image.open(image_path)
    
    # 1. Attempt to use Gemini Image Model (Nano Banana) to mark the image directly
    try:
        image_prompt = (
            "Identify the primary skin lesion or affected area in this image. "
            "Draw a clean, solid red circle directly around the lesion's perimeter to highlight it. "
            "Ensure the red circle is thin and precise, wrapping around the lesion without covering or obscuring the lesion itself, "
            "and keep all other parts of the image unchanged."
        )
        print("Attempting direct image marking with gemini-2.5-flash-image (Nano Banana)...")
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[image_prompt, image],
            config={
                "response_modalities": ["IMAGE"]
            }
        )
        
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                pil_image = part.as_image()
                if pil_image:
                    marked_path = f"marked_{session_id}.jpg"
                    if pil_image.mode in ("RGBA", "P"):
                        pil_image = pil_image.convert("RGB")
                    pil_image.save(marked_path)
                    print("Successfully generated direct markup using gemini-2.5-flash-image!")
                    return marked_path
    except Exception as e:
        print("Direct image marking failed (likely due to API billing/quota restrictions). Error:", e)
        print("Falling back to Pillow-based bounding box drawing...")
        pass

    # 2. Fallback to coordinate-based Pillow drawing
    try:
        box_prompt = "Return a bounding box [ymin, xmin, ymax, xmax] around the primary skin lesion or affected area in this image."
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[box_prompt, image]
        )
        match = re.search(r'\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]', response.text)
        if match:
            ymin, xmin, ymax, xmax = map(int, match.groups())
            width, height = image.size
            # Convert 0-1000 scale to pixel coordinates
            left = (xmin / 1000) * width
            top = (ymin / 1000) * height
            right = (xmax / 1000) * width
            bottom = (ymax / 1000) * height
            
            draw = ImageDraw.Draw(image)
            draw.ellipse([left, top, right, bottom], outline="red", width=5)
            
            marked_path = f"marked_{session_id}.jpg"
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            image.save(marked_path)
            return marked_path
    except Exception as e:
        print("Error generating markup via coordinate fallback:", e)
        pass
    
    return None
    
    return None

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
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": GeminiStructuredChat
        }
    )
    
    return response.text
