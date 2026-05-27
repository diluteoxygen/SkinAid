import re

with open("frontend/src/app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
state_addition = """
  const [severityIndex, setSeverityIndex] = useState<number | null>(null);
  const [markedImageUrl, setMarkedImageUrl] = useState<string | null>(null);
  const [wikiData, setWikiData] = useState<{title: string, extract: string} | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    lesion_area: "",
    timeline: "",
    allergies: ""
  });
"""
content = content.replace("const [chatInput, setChatInput] = useState(\"\");", "const [chatInput, setChatInput] = useState(\"\");" + state_addition)

# 2. Add fetchWiki function
fetch_wiki = """
  const fetchWiki = async (label: string) => {
    if (!label) return;
    setWikiLoading(true);
    setRightSidebarOpen(true);
    try {
      const query = label.replace(/_/g, " ");
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setWikiData({ title: data.title, extract: data.extract });
      } else {
        setWikiData(null);
      }
    } catch (e) {
      setWikiData(null);
    } finally {
      setWikiLoading(false);
    }
  };
"""
content = content.replace("const loadSessions = async () => {", fetch_wiki + "\n  const loadSessions = async () => {")

# 3. Update loadSessionDetails
load_sess_replace = """      if (data.prediction_history && data.prediction_history.length > 0) {
        setPrediction(data.prediction_history[data.prediction_history.length - 1]);
        fetchWiki(data.prediction_history[data.prediction_history.length - 1].top_k[0]?.label);
      } else {
        setPrediction(null);
        setWikiData(null);
      }
      setSeverityIndex(data.severity_index || null);
      setMarkedImageUrl(data.marked_image_url || null);"""
content = content.replace("""      if (data.prediction_history && data.prediction_history.length > 0) {
        setPrediction(data.prediction_history[data.prediction_history.length - 1]);
      } else {
        setPrediction(null);
      }""", load_sess_replace)

# 4. Update handleNewSession
handle_new_replace = """    setPrediction(null);
    setMetrics(null);
    setSelectedImage(null);
    setImagePreview(null);
    setSeverityIndex(null);
    setMarkedImageUrl(null);
    setWikiData(null);"""
content = content.replace("""    setPrediction(null);
    setMetrics(null);
    setSelectedImage(null);
    setImagePreview(null);""", handle_new_replace)

# 5. Update handleAnalyze
handle_analyze_replace = """      const res = await api.analyze(selectedImage, profile);
      setCurrentSessionId(res.session_id);
      setPrediction(res.prediction);
      setSeverityIndex(res.severity_index || null);
      setMarkedImageUrl(res.marked_image_url || null);
      if (res.prediction.top_k[0]?.label) fetchWiki(res.prediction.top_k[0].label);"""
content = content.replace("""      const res = await api.analyze(selectedImage);
      setCurrentSessionId(res.session_id);
      setPrediction(res.prediction);""", handle_analyze_replace)

# 6. Update Profile UI in Upload card
profile_ui_replace = """                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-left mb-3">
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Age" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} />
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Gender" value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} />
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Lesion Area" value={profile.lesion_area} onChange={e => setProfile({...profile, lesion_area: e.target.value})} />
                    <input className="text-sm p-2 rounded-md outline-none" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Timeline (e.g., 2 weeks)" value={profile.timeline} onChange={e => setProfile({...profile, timeline: e.target.value})} />
                    <input className="text-sm p-2 rounded-md outline-none col-span-2" style={{background: 'var(--surface)', border: '1px solid var(--border-primary)', color: 'var(--text-primary)'}} placeholder="Allergies (optional)" value={profile.allergies} onChange={e => setProfile({...profile, allergies: e.target.value})} />
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
                </div>"""

content = content.replace("""                <div className="p-3 flex justify-end gap-2">
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
                </div>""", profile_ui_replace)


# 7. Severity Index
severity_ui_replace = """                    </div>
                    <div className="px-5 py-4 space-y-3.5">
                      {prediction.top_k.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[13px]">
                          <span className="capitalize font-medium" style={{ color: 'var(--text-primary)' }}>
                            {p.label.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--bar-bg)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'var(--bar-fill)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${p.score * 100}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <span className="w-10 text-right tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {(p.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                      
                      {/* Severity Index */}
                      {severityIndex !== null && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
                          <div className="flex justify-between items-center text-[12px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                            <span className="font-semibold uppercase tracking-widest">Severity Index</span>
                            <span>{severityIndex} / 5</span>
                          </div>
                          <div className="flex gap-1 h-2.5">
                            {[1, 2, 3, 4, 5].map(level => {
                              let bg = 'var(--surface-secondary)';
                              if (level <= severityIndex) {
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
                    </div>"""
content = content.replace("""                    </div>
                    <div className="px-5 py-4 space-y-3.5">
                      {prediction.top_k.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[13px]">
                          <span className="capitalize font-medium" style={{ color: 'var(--text-primary)' }}>
                            {p.label.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-28 h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--bar-bg)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{ background: 'var(--bar-fill)' }}
                                initial={{ width: 0 }}
                                animate={{ width: `${p.score * 100}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                            <span className="w-10 text-right tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {(p.score * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>""", severity_ui_replace)

# 8. Render marked image
marked_image_ui = """
              {/* Marked Image */}
              {markedImageUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mb-6"
                >
                  <img src={`http://localhost:8000${markedImageUrl}`} alt="Marked Lesion" className="max-w-sm rounded-[18px] border" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--glass-shadow)' }} />
                </motion.div>
              )}
"""
content = content.replace("""              {/* Prediction Card */}
              {prediction && (""", marked_image_ui + """              {/* Prediction Card */}
              {prediction && (""")

# 9. Right sidebar for Wikipedia
right_sidebar_ui = """
      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">"""
      
right_sidebar_replacement = """
      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">"""

# Append sidebar at the end of the main wrapper instead
main_end_replace = """        )}
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
          {wikiData && (
            <div className="w-[280px] h-full flex flex-col">
              <div className="px-4 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
                <h3 className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>About {wikiData.title}</h3>
                <button onClick={() => setRightSidebarOpen(false)} className="p-1 rounded-md" style={{ color: 'var(--text-secondary)' }}><X className="h-4 w-4" /></button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {wikiData.extract}
                </p>
                <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(wikiData.title.replace(/ /g, "_"))}`} target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium mt-4 inline-block hover:underline" style={{ color: 'var(--accent)' }}>Read more on Wikipedia &rarr;</a>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}"""

content = content.replace("""        )}
      </main>
    </div>
  );
}""", main_end_replace)

# Header button to open wiki if it's closed but available
header_replace = """
            {/* Desktop theme toggle (compact) */}
            {mounted && !isMobile && (
              <div className="flex items-center gap-2">
                {wikiData && !rightSidebarOpen && (
                  <button onClick={() => setRightSidebarOpen(true)} className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>Wiki</button>
                )}
                <button
"""

content = content.replace("""
            {/* Desktop theme toggle (compact) */}
            {mounted && !isMobile && (
              <button
""", header_replace)

with open("frontend/src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

