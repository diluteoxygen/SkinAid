const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface PredictionDetail {
  label: string;
  score: number;
}

export interface Prediction {
  top_k: PredictionDetail[];
  confidence: string;
}

export interface Metrics {
  latency_ms: number;
  memory_mb: number;
}

export interface ProfileMetadata {
  age?: string;
  gender?: string;
  lesion_area?: string;
  timeline?: string;
  notes?: string;
}

export interface AnalyzeResponse {
  session_id: string;
  prediction: Prediction;
  gemini_response: string;
  metrics?: Metrics;
  severity_index?: number;
  marked_image_url?: string;
}

export interface ChatResponse {
  assistant_response: string;
  suggested_follow_ups?: string[];
}

export interface SessionListResponse {
  session_id: string;
  created_at: string;
  title: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggested_follow_ups?: string[];
}

export interface SessionDetailResponse {
  session_id: string;
  messages: ChatMessage[];
  images: string[];
  prediction_history?: Prediction[];
  severity_index?: number;
  marked_image_url?: string;
}

export const api = {
  analyze: async (imageFile: File, profile?: ProfileMetadata): Promise<AnalyzeResponse> => {
    const formData = new FormData();
    formData.append("image", imageFile);
    
    if (profile) {
      if (profile.age) formData.append("age", profile.age);
      if (profile.gender) formData.append("gender", profile.gender);
      if (profile.lesion_area) formData.append("lesion_area", profile.lesion_area);
      if (profile.timeline) formData.append("timeline", profile.timeline);
      if (profile.notes) formData.append("notes", profile.notes);
    }

    const res = await fetch(`${BASE_URL}/analyze`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || "Error analyzing image");
    }

    return res.json();
  },

  chat: async (session_id: string, message: string): Promise<ChatResponse> => {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, message }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || "Error sending chat message");
    }

    return res.json();
  },

  getSessions: async (): Promise<SessionListResponse[]> => {
    const res = await fetch(`${BASE_URL}/sessions`);
    if (!res.ok) {
      throw new Error("Failed to fetch sessions");
    }
    return res.json();
  },

  getSession: async (id: string): Promise<SessionDetailResponse> => {
    const res = await fetch(`${BASE_URL}/sessions/${id}`);
    if (!res.ok) {
      throw new Error("Failed to fetch session details");
    }
    return res.json();
  },

  deleteSession: async (id: string): Promise<{status: string}> => {
    const res = await fetch(`${BASE_URL}/sessions/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      throw new Error("Failed to delete session");
    }
    return res.json();
  }
};
