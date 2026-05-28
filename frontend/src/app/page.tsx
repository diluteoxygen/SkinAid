"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Copy, Plus, Send, ImageIcon, Loader2, Activity, PanelLeft, Moon, Sun, X, Trash2, ChevronLeft, ChevronRight, Upload, Camera, RefreshCw, Shield, Info, AlertTriangle, ClipboardList, Download, Share2, RotateCcw, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

import { api, BACKEND_URL, Prediction, ChatMessage, SessionDetailResponse, SessionListResponse, Metrics } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet } from "@/components/ui/sheet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWikipediaW } from "@fortawesome/free-brands-svg-icons";

const byPrefixAndName = {
  fab: {
    "wikipedia-w": faWikipediaW
  }
};

/* ────────────────────────────────────────────────────────────────────── */

function StructuredResultCard({ data, prediction, severityIndex, onAskFollowUp, imagePreview, profile }: { data: any, prediction: Prediction, severityIndex: number | null, onAskFollowUp: () => void, imagePreview?: string | null, profile?: any }) {
  const [openSection, setOpenSection] = useState<string | null>("why_this_result");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleDownload = () => {
    const reportContent = `SkinAid Clinical Report\n=======================\nPrimary Match: ${data.primary_match}\nSummary: ${data.summary}\nSeverity Index: ${severityIndex ?? data.severity_index} / 5\n\nWhy this result:\n${data.why_this_result.map((r: string) => `- ${r}`).join('\n')}\n\nOther possibilities:\n${data.other_possibilities.map((r: string) => `- ${r}`).join('\n')}\n\nRecommended actions:\n${data.recommended_actions.map((r: string) => `- ${r}`).join('\n')}\n\nSafety Note:\n${data.safety_note}`;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skinaid_report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const reportContent = `SkinAid Clinical Report\nPrimary Match: ${data.primary_match}\nSeverity Index: ${severityIndex ?? data.severity_index} / 5\n\nNote: This is not a medical diagnosis.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SkinAid Report', text: reportContent });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(reportContent);
      alert('Report copied to clipboard!');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="squircle overflow-hidden mb-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--glass-shadow)',
      }}
    >
      {/* Header: Primary Match & Summary */}
      <div className="px-6 py-6 border-b flex flex-col sm:flex-row gap-5 sm:items-start" style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface-secondary)' }}>
        {imagePreview && (
          <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--glass-shadow)' }}>
            <img src={imagePreview} alt="Reference" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Primary Match
            </span>
          </div>
          <h2 className="text-[22px] font-bold tracking-tight mb-2" style={{ color: 'var(--accent)' }}>
            {data.primary_match}
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {data.summary}
          </p>
        </div>
      </div>

      {/* Patient Context Snapshot */}
      {profile && (profile.age || profile.gender || profile.lesion_area || profile.timeline) && (
        <div className="px-6 py-4 border-b flex flex-wrap gap-x-6 gap-y-2 text-[12px]" style={{ borderColor: 'var(--border-secondary)', background: 'var(--surface)' }}>
          {profile.age && <div><span style={{ color: 'var(--text-tertiary)' }}>Age:</span> <span className="font-medium ml-1" style={{ color: 'var(--text-primary)' }}>{profile.age}</span></div>}
          {profile.gender && <div><span style={{ color: 'var(--text-tertiary)' }}>Gender:</span> <span className="font-medium ml-1 capitalize" style={{ color: 'var(--text-primary)' }}>{profile.gender}</span></div>}
          {profile.lesion_area && <div><span style={{ color: 'var(--text-tertiary)' }}>Area:</span> <span className="font-medium ml-1 capitalize" style={{ color: 'var(--text-primary)' }}>{profile.lesion_area}</span></div>}
          {profile.timeline && <div><span style={{ color: 'var(--text-tertiary)' }}>Timeline:</span> <span className="font-medium ml-1" style={{ color: 'var(--text-primary)' }}>{profile.timeline}</span></div>}
        </div>
      )}

      {/* Confidence Distribution Heatmap */}
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
        <h3 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Activity className="h-4 w-4" style={{ color: 'var(--accent)' }}/>
          Confidence Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {prediction.top_k.map((p, i) => (
            <div key={i} className="p-3 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ borderColor: 'var(--border-secondary)' }}>
               <div className="absolute inset-0" style={{ background: 'var(--accent)', opacity: Math.max(0.04, p.score * 0.8) }} />
               <span className="relative z-10 text-[16px] font-bold" style={{ color: 'var(--text-primary)' }}>{(p.score * 100).toFixed(1)}%</span>
               <span className="relative z-10 text-[11px] font-medium mt-1 uppercase tracking-wider line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{p.label.replace(/_/g, ' ')}</span>
            </div>
          ))}

          {/* Severity Index */}
          {(severityIndex !== null || data.severity_index) && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
              <div className="flex justify-between items-center text-[12px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold uppercase tracking-widest">Severity Index</span>
                <span>{severityIndex ?? data.severity_index} / 5</span>
              </div>
              <div className="flex gap-1 h-2.5">
                {[1, 2, 3, 4, 5].map(level => {
                  let bg = 'var(--surface-secondary)';
                  const sv = severityIndex ?? data.severity_index;
                  if (level <= sv) {
                    if (level <= 2) bg = '#34c759'; // Green
                    else if (level <= 3) bg = '#ffcc00'; // Yellow
                    else bg = '#ff3b30'; // Red
                  }
                  return (
                    <div key={level} className="flex-1 rounded-full transition-colors" style={{ background: bg }} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Sections */}
      <div className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
        {/* Why this result */}
        <div>
          <button onClick={() => toggleSection('why_this_result')} className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-[var(--surface-secondary)]">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              <span className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>Why this result</span>
            </div>
            {openSection === 'why_this_result' ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />}
          </button>
          <AnimatePresence>
            {openSection === 'why_this_result' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-6 pb-5 pt-1">
                  <ul className="list-disc pl-5 space-y-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {data.why_this_result.map((item: string, i: number) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Other possibilities */}
        <div>
          <button onClick={() => toggleSection('other_possibilities')} className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-[var(--surface-secondary)]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              <span className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>Other possibilities</span>
            </div>
            {openSection === 'other_possibilities' ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />}
          </button>
          <AnimatePresence>
            {openSection === 'other_possibilities' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-6 pb-5 pt-1">
                  <ul className="list-disc pl-5 space-y-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {data.other_possibilities.map((item: string, i: number) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recommended actions */}
        <div>
          <button onClick={() => toggleSection('recommended_actions')} className="w-full px-6 py-4 flex items-center justify-between text-left transition-colors hover:bg-[var(--surface-secondary)]">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
              <span className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>Recommended actions</span>
            </div>
            {openSection === 'recommended_actions' ? <ChevronUp className="h-4 w-4 text-[var(--text-tertiary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-tertiary)]" />}
          </button>
          <AnimatePresence>
            {openSection === 'recommended_actions' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-6 pb-5 pt-1">
                  <ul className="list-disc pl-5 space-y-2 text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {data.recommended_actions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Safety note */}
        <div style={{ background: 'color-mix(in srgb, var(--accent) 5%, transparent)' }}>
          <div className="px-6 py-4 flex items-start gap-3">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <div>
              <span className="font-semibold text-[12px] block mb-1" style={{ color: 'var(--text-primary)' }}>Safety Note</span>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{data.safety_note}</p>
            </div>
          </div>
        </div>
      </div>



      {/* Sticky Actions Row */}
      <div className="sticky bottom-0 border-t flex items-center justify-between px-4 py-3" style={{ background: 'var(--surface)', borderColor: 'var(--border-secondary)' }}>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--surface-secondary)] text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--surface-secondary)] text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--surface-secondary)] text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Run again</span>
          </button>
          <button onClick={onAskFollowUp} className="flex items-center gap-2 px-4 py-1.5 rounded-md transition-colors text-[12px] font-semibold" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            Ask Follow-up
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [sessions, setSessions] = useState<SessionListResponse[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [severityIndex, setSeverityIndex] = useState<number | null>(null);
  const [markedImageUrl, setMarkedImageUrl] = useState<string | null>(null);
  const [wikiData, setWikiData] = useState<{title: string, extract: string, thumbnail?: string} | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const [profile, setProfile] = useState({
    age: "",
    gender: "male",
    lesion_area: "",
    timeline: "",
    notes: ""
  });

  /* Camera states */
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* Sidebar states */
  const [sidebarOpen, setSidebarOpen] = useState(false);       // mobile sheet
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const [isMobile, setIsMobile] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  /* ─── Hydration guard for theme ─── */
  useEffect(() => setMounted(true), []);

  /* ─── Responsive detection ─── */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        loadSessions();
      }
    };
    checkAuthAndLoad();
  }, [router, supabase.auth]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, prediction]);

  /* ─── Data loaders ─── */
  
  const fetchWiki = async (label: string, autoOpen = false) => {
    if (!label) return;
    setWikiLoading(true);
    if (autoOpen && !isMobile) {
      setRightSidebarOpen(true);
    }
    try {
      const query = label.replace(/_/g, " ");
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setWikiData({ 
          title: data.title, 
          extract: data.extract,
          thumbnail: data.originalimage?.source || data.thumbnail?.source
        });
      } else {
        setWikiData(null);
      }
    } catch (e) {
      setWikiData(null);
    } finally {
      setWikiLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSessionDetails = async (id: string) => {
    try {
      const data = await api.getSession(id);
      setCurrentSessionId(id);
      setMessages(data.messages || []);

      if (data.prediction_history && data.prediction_history.length > 0) {
        setPrediction(data.prediction_history[data.prediction_history.length - 1]);
        fetchWiki(data.prediction_history[data.prediction_history.length - 1].top_k[0]?.label);
      } else {
        setPrediction(null);
        setWikiData(null);
      }
      setSeverityIndex(data.severity_index || null);

      setMetrics(null);
      setSelectedImage(null);
      if (data.images && data.images.length > 0) {
        const imgObj = data.images[0] as any;
        if (imgObj.image_path) {
          const url = imgObj.image_path.startsWith('http') ? imgObj.image_path : `${BACKEND_URL}${imgObj.image_path}`;
          setImagePreview(url);
        } else {
          setImagePreview(null);
        }
      } else {
        setImagePreview(null);
      }
      stopCamera();

      // Close mobile sidebar after selection
      if (isMobile) setSidebarOpen(false);
      setRightSidebarOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setPrediction(null);
    setMetrics(null);
    setSelectedImage(null);
    setImagePreview(null);
    setSeverityIndex(null);
    setMarkedImageUrl(null);
    setWikiData(null);
    stopCamera();
    if (isMobile) setSidebarOpen(false);
    setRightSidebarOpen(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteSession(id);
      if (currentSessionId === id) handleNewSession();
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const startCamera = async (deviceId?: string) => {
    setCameraError(null);
    setIsCameraActive(true);
    
    // Stop any existing stream first
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: { ideal: "environment" } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate devices to get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === "videoinput");
      setCameraDevices(videoDevices);

      if (!deviceId && videoDevices.length > 0) {
        const activeTrack = stream.getVideoTracks()[0];
        const activeSettings = activeTrack ? activeTrack.getSettings() : null;
        const activeDeviceId = activeSettings?.deviceId || videoDevices[0].deviceId;
        setSelectedCameraId(activeDeviceId);
      } else if (deviceId) {
        setSelectedCameraId(deviceId);
      }

    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Could not access camera. Please check permissions or select another camera.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const switchCamera = async () => {
    if (cameraDevices.length <= 1) return;
    const currentIndex = cameraDevices.findIndex(d => d.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextDevice = cameraDevices[nextIndex];
    if (nextDevice) {
      await startCamera(nextDevice.deviceId);
    }
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
            setImageExpanded(false);
            stopCamera();
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setImageExpanded(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    setMessages([]);
    setPrediction(null);
    try {
      const res = await api.analyze(selectedImage, profile);
      setCurrentSessionId(res.session_id);
      setPrediction(res.prediction);
      setSeverityIndex(res.severity_index || null);
      setMarkedImageUrl(res.marked_image_url || null);
      if (res.prediction.top_k[0]?.label) fetchWiki(res.prediction.top_k[0].label, true);
      if (res.metrics) {
        setMetrics(res.metrics);
      }

      let suggestedFollowUps: string[] | undefined = undefined;
      try {
        const parsed = JSON.parse(res.gemini_response);
        if (parsed && parsed.suggested_follow_ups) {
          suggestedFollowUps = parsed.suggested_follow_ups;
        }
      } catch (e) {
        // ignore
      }

      setMessages([
        { role: "user", content: "Uploaded an image for analysis." },
        { role: "assistant", content: res.gemini_response, suggested_follow_ups: suggestedFollowUps }
      ]);

      loadSessions();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error analyzing image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChat = async (overrideMessage?: string) => {
    const userMsg = (overrideMessage || chatInput).trim();
    if (!currentSessionId || !userMsg) return;

    if (!overrideMessage) setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatting(true);

    try {
      const res = await api.chat(currentSessionId, userMsg);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: res.assistant_response,
        suggested_follow_ups: res.suggested_follow_ups
      }]);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error sending message");
    } finally {
      setIsChatting(false);
    }
  };

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  /* ─── Sidebar content (shared between desktop & mobile) ─── */
  const SidebarContent = () => (
    <>
      {/* Logo area */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
            <Activity className="h-4 w-4" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text-primary)' }}>
            SkinAid
          </span>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Analysis button */}
      <div className="px-3 pb-2">
        <button
          onClick={handleNewSession}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-all duration-200"
          style={{
            background: 'var(--accent)',
            color: 'var(--accent-text)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <Plus className="h-4 w-4" />
          New Analysis
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div className="space-y-0.5">
          {sessions.map(s => (
            <div
              key={s.session_id}
              onClick={() => loadSessionDetails(s.session_id)}
              className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-150 text-left cursor-pointer"
              style={{
                background: currentSessionId === s.session_id ? 'var(--sidebar-active)' : 'transparent',
                color: currentSessionId === s.session_id ? 'var(--sidebar-active-text)' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                setHoveredSessionId(s.session_id);
                if (currentSessionId !== s.session_id) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)';
                }
              }}
              onMouseLeave={e => {
                setHoveredSessionId(null);
                if (currentSessionId !== s.session_id) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <div className="flex-1 truncate">
                <div className="truncate font-medium" style={{
                  color: currentSessionId === s.session_id ? 'var(--sidebar-active-text)' : 'var(--text-primary)'
                }}>
                  {s.title || `Session ${s.session_id.slice(0, 6)}`}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteSession(e, s.session_id)}
                className={`p-1 rounded-md transition-all duration-150 ${
                  hoveredSessionId === s.session_id ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Theme toggle footer */}
      {mounted && (
        <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all duration-200"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      )}
    </>
  );


  /* ─── Wiki Content ─── */
  const WikiSidebarContent = () => (
    <div className="w-full h-full flex flex-col">
      <div className="px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <h3 className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>{wikiData?.title}</h3>
        <button onClick={() => setRightSidebarOpen(false)} className="p-1 rounded-md" style={{ color: 'var(--text-secondary)' }}><X className="h-4 w-4" /></button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {wikiData?.thumbnail && (
          <img src={wikiData.thumbnail} alt={wikiData?.title} className="w-full h-40 object-cover rounded-[10px] mb-4 border" style={{borderColor: 'var(--border-secondary)'}} />
        )}
        <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {wikiData?.extract}
        </p>
        <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent((wikiData?.title || "").replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 mt-5 px-4 py-2.5 w-full rounded-[10px] text-[13px] font-semibold transition-all" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
          Read more on Wikipedia &rarr;
        </a>
      </div>
    </div>
  );

  /* ────────────────────────────────────────────────────────────────── */
  /* RENDER                                                            */
  /* ────────────────────────────────────────────────────────────────── */

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--background)', color: 'var(--text-primary)' }}>

      {/* ─── Mobile Sheet Sidebar ─── */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          {SidebarContent()}
        </Sheet>
      )}

      {/* ─── Desktop Sidebar ─── */}
      {!isMobile && (
        <aside
          className="relative flex flex-col shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group"
          style={{
            width: sidebarCollapsed ? 0 : 260,
            background: 'var(--sidebar-bg)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderRight: sidebarCollapsed ? 'none' : '1px solid var(--sidebar-border)',
            overflow: 'hidden'
          }}
        >
          <div className="w-[260px] h-full flex flex-col">
            {SidebarContent()}
          </div>
        </aside>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">

        {/* ─── Glass Header ─── */}
        <header
          className="glass h-[52px] flex items-center justify-between px-4 md:px-6 shrink-0 z-10 sticky top-0"
          style={{ borderBottom: '1px solid var(--border-secondary)' }}
        >
          <div className="flex items-center gap-3">
            {isMobile ? (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 -ml-1 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 -ml-1 rounded-lg transition-colors hover:bg-[var(--surface-secondary)]"
                style={{ color: 'var(--text-secondary)' }}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="font-semibold text-[15px] tracking-tight flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}>
              {currentSessionId ? (
                sessions.find(s => s.session_id === currentSessionId)?.title || 'Analysis'
              ) : (
                <>SkinAid</>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {metrics && (
              <div
                className="flex items-center gap-2.5 text-[11px] px-3 py-1.5 rounded-full"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-secondary)',
                }}
              >
                <Activity className="h-3 w-3" style={{ color: 'var(--accent)' }} />
                <span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {metrics.latency_ms.toFixed(0)}
                  </span> ms
                </span>
                {metrics.memory_mb > 0 && (
                  <span>
                    · <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {metrics.memory_mb.toFixed(1)}
                    </span> MB
                  </span>
                )}
              </div>
            )}

            {/* Desktop theme toggle (compact) */}
            {/* Nav Actions */}
            {mounted && (
              <div className="flex items-center gap-2">
                {wikiData && !rightSidebarOpen && (
                  <button 
                    onClick={() => setRightSidebarOpen(true)} 
                    className="p-2 rounded-full transition-colors flex items-center justify-center" 
                    style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}
                    title="View Wikipedia Info"
                  >
                    <FontAwesomeIcon icon={byPrefixAndName.fab['wikipedia-w']} className="h-4 w-4" />
                  </button>
                )}
                {!isMobile && (
                  <>
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="p-2 rounded-full transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-secondary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-full transition-colors flex items-center justify-center"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-secondary)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                      title="Log Out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
</header>

        {/* ─── Upload / Empty State ─── */}
        {!currentSessionId && !isUploading && messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-xl mx-auto w-full text-center">

            {!imagePreview && !isCameraActive && (
              <>
                {/* Icon with pulse ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className="pulse-ring mb-8"
                >
                  <div
                    className="w-20 h-20 rounded-[22px] flex items-center justify-center"
                    style={{
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--border-secondary)',
                    }}
                  >
                    <ImageIcon className="h-9 w-9" style={{ color: 'var(--accent)' }} />
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-[28px] font-bold tracking-tight mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Upload a skin image
                </motion.h2>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-[15px] mb-10 max-w-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Our AI will analyze the image using advanced vision models and provide clinical insights.
                </motion.p>
              </>
            )}

            {isCameraActive ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm squircle overflow-hidden relative flex flex-col items-center"
                style={{
                  background: 'var(--surface)',
                  boxShadow: 'var(--glass-shadow)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden" style={{ background: '#000' }}>
                  {cameraError ? (
                    <div className="p-6 text-center space-y-3">
                      <p className="text-[13px] font-medium" style={{ color: 'var(--danger)' }}>{cameraError}</p>
                      <button
                        onClick={() => {
                          cameraInputRef.current?.click();
                          stopCamera();
                        }}
                        className="px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200"
                        style={{
                          background: 'var(--accent)',
                          color: 'var(--accent-text)',
                        }}
                      >
                        Use System Camera Instead
                      </button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {/* High-tech overlay scanner line */}
                      <div className="absolute inset-0 pointer-events-none border border-white/20 m-4 rounded-xl flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/70 rounded-tl" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/70 rounded-tr" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/70 rounded-bl" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/70 rounded-br" />
                        
                        {/* Horizontal scanning light */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-[90%] h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] scanner-beam" />
                      </div>
                    </>
                  )}
                </div>

                {/* Shutter and controls panel */}
                <div className="w-full p-4 flex items-center justify-between" style={{ background: 'var(--surface-secondary)' }}>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={captureFrame}
                    disabled={!!cameraError || !cameraStream}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center bg-transparent border-4 border-white transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-white transition-all hover:bg-neutral-100" />
                  </button>

                  <button
                    onClick={switchCamera}
                    disabled={cameraDevices.length <= 1}
                    className="p-3 rounded-full transition-colors flex items-center justify-center disabled:opacity-30"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { if (cameraDevices.length > 1) (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    title="Switch Camera"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ) : !imagePreview ? (
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm"
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center p-6 squircle-lg transition-all duration-200 group w-full"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--glass-shadow)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
                >
                  <ImageIcon className="h-6 w-6 mb-2 transition-colors duration-200 group-hover:text-[var(--accent)]" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="font-medium text-[13px]" style={{ color: 'var(--text-primary)' }}>Import Image</span>
                </button>

                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
                      startCamera();
                    } else {
                      cameraInputRef.current?.click();
                    }
                  }}
                  className="flex-1 flex flex-col items-center justify-center p-6 squircle-lg transition-all duration-200 group w-full"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--glass-shadow)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-primary)'; }}
                >
                  <Camera className="h-6 w-6 mb-2 transition-colors duration-200 group-hover:text-[var(--accent)]" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="font-medium text-[13px]" style={{ color: 'var(--text-primary)' }}>Camera</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm squircle overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  boxShadow: 'var(--glass-shadow)',
                  border: '1px solid var(--border-primary)',
                }}
              >
                <div
                  className="p-2 flex justify-center cursor-pointer"
                  style={{ background: 'var(--surface-secondary)' }}
                  onClick={() => setImageExpanded(!imageExpanded)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={`object-contain rounded-[14px] transition-all duration-300 ${imageExpanded ? 'max-h-[60vh]' : 'max-h-56'}`}
                  />
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-left mb-3">
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Age" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} />
                    <div 
                      className="relative flex p-0.5 rounded-md h-9 text-[13px] font-medium select-none w-full" 
                      style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-primary)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, gender: 'male' })}
                        className="flex-1 text-center relative flex items-center justify-center transition-colors duration-200 cursor-pointer"
                        style={{
                          color: profile.gender?.toLowerCase() === 'male' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {profile.gender?.toLowerCase() === 'male' && (
                          <motion.div
                            layoutId="genderActiveBackground"
                            className="absolute inset-0 rounded-[5px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                            style={{ background: 'var(--surface)', zIndex: 0 }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">Male</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfile({ ...profile, gender: 'female' })}
                        className="flex-1 text-center relative flex items-center justify-center transition-colors duration-200 cursor-pointer"
                        style={{
                          color: profile.gender?.toLowerCase() === 'female' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {profile.gender?.toLowerCase() === 'female' && (
                          <motion.div
                            layoutId="genderActiveBackground"
                            className="absolute inset-0 rounded-[5px] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                            style={{ background: 'var(--surface)', zIndex: 0 }}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">Female</span>
                      </button>
                    </div>
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Lesion Area" value={profile.lesion_area} onChange={e => setProfile({...profile, lesion_area: e.target.value})} />
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Timeline (e.g., 2 weeks)" value={profile.timeline} onChange={e => setProfile({...profile, timeline: e.target.value})} />
                    <textarea className="text-sm p-2 rounded-md outline-none col-span-2 resize-none h-14" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Anything else you'd like to mention? (optional)" value={profile.notes} onChange={e => setProfile({...profile, notes: e.target.value})} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                      className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-secondary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAnalyze}
                      className="px-6 py-2 rounded-full text-[13px] font-semibold transition-all duration-200"
                      style={{
                        background: 'var(--accent)',
                        color: 'var(--accent-text)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent)'; }}
                    >
                      Analyze Image
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageSelect}
            />
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={handleImageSelect}
            />
          </div>
        ) : (
          /* ─── Chat / Results Area ─── */
          <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-6">


              {/* Uploaded Reference Image removed to be included in StructuredResultCard */}
              {/* Structured Result Card handles Prediction data now, rendered as the first message */}

              {/* Chat Messages */}
              <div className="space-y-5 pb-28">
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    let parsedData = null;
                    const firstAssistantIdx = messages.findIndex(m => m.role === 'assistant');
                    if (idx === firstAssistantIdx && msg.role === 'assistant') {
                      try {
                        const testParse = JSON.parse(msg.content);
                        if (testParse && testParse.primary_match) {
                          parsedData = testParse;
                        }
                      } catch (e) {
                        // ignore, it's just plain markdown
                      }
                    }

                    if (parsedData && prediction) {
                      return (
                        <StructuredResultCard
                          key={idx}
                          data={parsedData}
                          prediction={prediction}
                          severityIndex={severityIndex}
                          onAskFollowUp={() => chatInputRef.current?.focus()}
                          imagePreview={imagePreview}
                          profile={profile}
                        />
                      );
                    }

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className="group relative max-w-[85%] px-4 py-3 leading-relaxed text-[14px]"
                          style={msg.role === 'user' ? {
                            background: 'var(--bubble-user)',
                            color: 'var(--bubble-user-text)',
                            borderRadius: '20px 20px 4px 20px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                          } : {
                            background: 'var(--bubble-assistant)',
                            color: 'var(--bubble-assistant-text)',
                            border: '1px solid var(--bubble-assistant-border)',
                            borderRadius: '20px 20px 20px 4px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                          }}
                        >
                          {msg.role === 'user' ? (
                            msg.content
                          ) : (
                            <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-p:my-1.5 prose-headings:mt-3 prose-headings:mb-1.5 max-w-none">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          )}

                          {/* Copy button */}
                          {msg.role === 'assistant' && (
                            <button
                              onClick={() => handleCopyMessage(msg.content)}
                              className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-full transition-all duration-200"
                              style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border-primary)',
                                color: 'var(--text-tertiary)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Loading: Analyzing */}
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex justify-start w-full"
                    >
                      <div
                        className="max-w-[85%] w-full md:w-2/3 p-5"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '20px 20px 20px 4px',
                          boxShadow: 'var(--glass-shadow)',
                        }}
                      >
                        <h3 className="text-[13px] font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--accent)' }} />
                          AI Analysis Pipeline
                        </h3>
                        <div className="space-y-5 relative ml-1">
                          <div className="pipeline-connector"></div>

                          {[
                            { label: "OpenCLIP Vision Model", desc: "Extracting visual features & computing embeddings", delay: 0.1, color: 'var(--accent)' },
                            { label: "Diagnostic Engine", desc: "Classifying dermatological signatures", delay: 0.8, color: '#5856d6' },
                            { label: "Gemini LLM", desc: "Synthesizing clinical insights", delay: 1.5, color: '#af52de' },
                          ].map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: step.delay }}
                              className="flex gap-4 relative"
                            >
                              <div
                                className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 relative z-10"
                                style={{ background: `color-mix(in srgb, ${step.color} 15%, transparent)` }}
                              >
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: step.color }} />
                              </div>
                              <div className="mt-0.5">
                                <p className="text-[13px] font-medium leading-none" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
                                <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Loading: Chat */}
                  {isChatting && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex justify-start"
                    >
                      <div
                        className="max-w-[85%] w-full md:w-2/3 px-5 py-4"
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '20px 20px 20px 4px',
                        }}
                      >
                        <div className="space-y-2.5">
                          <div className="h-3.5 rounded-md w-3/4 shimmer" />
                          <div className="h-3.5 rounded-md w-full shimmer" />
                          <div className="h-3.5 rounded-md w-5/6 shimmer" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={scrollRef} />
              </div>
            </div>
          </div>
        )}

        {/* ─── Floating Pill Input ─── */}
        {(currentSessionId || isUploading) && (
          <div
            className="absolute bottom-0 inset-x-0 p-3 md:p-4 pt-14 pointer-events-none z-10"
            style={{
              background: `linear-gradient(to top, var(--background) 60%, transparent)`,
            }}
          >
            <div className="max-w-3xl mx-auto pointer-events-auto flex flex-col">
              {(() => {
                const lastMsg = messages[messages.length - 1];
                let chips: string[] = [];
                if (lastMsg?.role === 'assistant') {
                  if (lastMsg.suggested_follow_ups && lastMsg.suggested_follow_ups.length > 0) {
                    chips = lastMsg.suggested_follow_ups;
                  } else {
                    const firstAssistantIdx = messages.findIndex(m => m.role === 'assistant');
                    if (firstAssistantIdx !== -1 && firstAssistantIdx === messages.length - 1) {
                      try {
                        const parsed = JSON.parse(lastMsg.content);
                        chips = parsed.suggested_follow_ups || [];
                      } catch (e) {}
                    }
                  }
                }
                return chips.length > 0 && !isChatting && !isUploading ? (
                  <div className="flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar pb-1 pl-1">
                    {chips.map((chip, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          handleChat(chip);
                        }}
                        className="px-3 py-1.5 rounded-full whitespace-nowrap text-[12px] font-medium transition-colors hover:bg-[var(--surface-secondary)]"
                        style={{ background: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}
              <div
                className="pill-input flex items-center gap-2 pl-5 pr-1.5 py-1.5"
              >
                <input
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={isUploading ? "Analyzing image..." : "Ask a follow-up question..."}
                  disabled={isUploading || isChatting}
                  onKeyDown={e => { if (e.key === 'Enter') handleChat(); }}
                  className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--text-tertiary)] disabled:opacity-50"
                  style={{ color: 'var(--text-primary)' }}
                />
                <button
                  onClick={() => handleChat()}
                  disabled={!chatInput.trim() || isUploading || isChatting}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-30"
                  style={{
                    background: chatInput.trim() ? 'var(--accent)' : 'var(--surface-secondary)',
                    color: chatInput.trim() ? 'var(--accent-text)' : 'var(--text-tertiary)',
                  }}
                >
                  {isChatting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── Desktop Right Sidebar (Wiki) ─── */}
      {!isMobile && (
        <aside
          className="relative flex flex-col shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            width: rightSidebarOpen && wikiData ? 280 : 0,
            background: 'var(--sidebar-bg)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderLeft: rightSidebarOpen && wikiData ? '1px solid var(--sidebar-border)' : 'none',
            overflow: 'hidden'
          }}
        >
          {wikiData && <WikiSidebarContent />}
        </aside>
      )}

      {/* ─── Mobile Right Sheet Sidebar (Wiki) ─── */}
      {isMobile && (
        <Sheet open={rightSidebarOpen} onOpenChange={setRightSidebarOpen} side="right">
          {wikiData && <WikiSidebarContent />}
        </Sheet>
      )}
    </div>
  );
}
