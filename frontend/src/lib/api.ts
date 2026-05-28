import { createClient } from "./supabase";

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : "https://doxes-skinaid.hf.space";
const BASE_URL = `${BACKEND_URL}/api`;

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
};
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
      headers: await getAuthHeaders(),
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
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify({ session_id, message }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || "Error sending chat message");
    }

    return res.json();
  },

  getSessions: async (): Promise<SessionListResponse[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("session_id, created_at, title")
      .order("created_at", { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as SessionListResponse[];
  },

  getSession: async (id: string): Promise<SessionDetailResponse> => {
    const supabase = createClient();
    const [sessionRes, messagesRes, imagesRes, predsRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("session_id", id).single(),
      supabase.from("messages").select("*").eq("session_id", id).order("timestamp", { ascending: true }),
      supabase.from("images").select("*").eq("session_id", id),
      supabase.from("prediction_history").select("*").eq("session_id", id)
    ]);

    if (sessionRes.error) throw new Error(sessionRes.error.message);
    
    return {
      ...sessionRes.data,
      messages: messagesRes.data || [],
      images: imagesRes.data || [],
      prediction_history: predsRes.data || []
    } as SessionDetailResponse;
  },

  deleteSession: async (id: string): Promise<{status: string}> => {
    const supabase = createClient();
    const { error } = await supabase.from("sessions").delete().eq("session_id", id);
    if (error) throw new Error(error.message);
    return { status: "success" };
  }
};
