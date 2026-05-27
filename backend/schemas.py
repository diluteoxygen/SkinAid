from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid

def utc_now():
    return datetime.now(timezone.utc)

class TopKItem(BaseModel):
    label: str
    score: float

class PredictionObject(BaseModel):
    top_k: List[TopKItem]
    confidence: str

class ProfileMetadata(BaseModel):
    age: Optional[str] = None
    gender: Optional[str] = None
    lesion_area: Optional[str] = None
    timeline: Optional[str] = None
    notes: Optional[str] = None

class AnalyzeResponse(BaseModel):
    session_id: str
    prediction: PredictionObject
    gemini_response: str
    severity_index: Optional[int] = None
    marked_image_url: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    assistant_response: str

class MessageObject(BaseModel):
    message_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str
    content: str
    suggested_follow_ups: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=utc_now)

class ImageObject(BaseModel):
    image_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_path: str
    uploaded_at: datetime = Field(default_factory=utc_now)
    width: int = 224
    height: int = 224

class PredictionHistoryItem(BaseModel):
    prediction_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_id: str
    top_k: List[TopKItem]
    confidence: str
    generated_at: datetime = Field(default_factory=utc_now)

class SessionObject(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    title: str = "Untitled Analysis"
    messages: List[MessageObject] = []
    images: List[ImageObject] = []
    prediction_history: List[PredictionHistoryItem] = []
    profile: Optional[ProfileMetadata] = None
    severity_index: Optional[int] = None
    marked_image_url: Optional[str] = None

class GeminiStructuredAnalysis(BaseModel):
    primary_match: str
    summary: str
    why_this_result: List[str]
    other_possibilities: List[str]
    recommended_actions: List[str]
    safety_note: str
    suggested_follow_ups: List[str]
    severity_index: int

class GeminiStructuredChat(BaseModel):
    assistant_response: str
    suggested_follow_ups: List[str]
