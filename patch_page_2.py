import re

with open("frontend/src/app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update wikiData state
content = content.replace(
    "const [wikiData, setWikiData] = useState<{title: string, extract: string} | null>(null);",
    "const [wikiData, setWikiData] = useState<{title: string, extract: string, thumbnail?: string} | null>(null);"
)

# 2. Update fetchWiki
old_fetch_wiki = """
        const data = await res.json();
        setWikiData({ title: data.title, extract: data.extract });
"""
new_fetch_wiki = """
        const data = await res.json();
        setWikiData({ 
          title: data.title, 
          extract: data.extract,
          thumbnail: data.originalimage?.source || data.thumbnail?.source
        });
"""
content = content.replace(old_fetch_wiki, new_fetch_wiki)

# 3. Update Wiki button to SVG
old_wiki_btn = """<button onClick={() => setRightSidebarOpen(true)} className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors flex items-center justify-center" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>Wiki</button>"""
# if flex items-center justify-center wasn't there in my previous replace, check exactly what it was:
# oh wait, my previous code didn't have "flex items-center justify-center".
# It was: <button onClick={() => setRightSidebarOpen(true)} className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors" style={{ background: 'var(--surface-secondary)', color: 'var(--text-primary)' }}>Wiki</button>

# Also we need to ensure the button is visible on mobile too. Let's find where the button is.
# Currently it's inside `{!isMobile && ( ... )}` which means it's hidden on mobile.
# We need to move the wiki button outside of `!isMobile` or duplicate it for mobile.

header_block_regex = re.compile(r'\{\/\* Desktop theme toggle \(compact\) \*\/\}(.*?)\<\/header\>', re.DOTALL)
header_match = header_block_regex.search(content)

if header_match:
    old_header_block = header_match.group(1)
    new_header_block = """
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">
                      <path d="M294.5 256.4l-64.8-175h49.6l38.2 119.8 40.5-119.8h46l-67 175h-42.5zM128 81.4h-42L194.5 352h46L348.6 81.4h-45.7l-38.3 124L225 81.4h-48.5L138.8 201 100 81.4H47.4l66 182-15 42h44.3L209 81.4H165l-37 114.7z" fill="currentColor"/>
                    </svg>
                  </button>
                )}
                {!isMobile && (
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-secondary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </button>
                )}
              </div>
            )}
          </div>
"""
    content = content.replace(old_header_block, new_header_block)

# 4. Extract WikiContent component and add mobile sheet
wiki_content_def = """
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
"""

# Insert before RENDER
content = content.replace("  /* ────────────────────────────────────────────────────────────────── */\n  /* RENDER", wiki_content_def + "\n  /* ────────────────────────────────────────────────────────────────── */\n  /* RENDER")


# Replace desktop right sidebar
old_desktop_sidebar_regex = re.compile(r'\{\/\* ─── Desktop Right Sidebar \(Wiki\) ─── \*\/\}.*?\<\/aside\>\n\s*\}\)', re.DOTALL)
desktop_sidebar_match = old_desktop_sidebar_regex.search(content)

if desktop_sidebar_match:
    new_sidebars = """{/* ─── Mobile Right Sidebar (Wiki) ─── */}
      {isMobile && wikiData && (
        <Sheet side="right" open={rightSidebarOpen} onOpenChange={setRightSidebarOpen}>
          <WikiSidebarContent />
        </Sheet>
      )}

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
      )}"""
    content = content.replace(desktop_sidebar_match.group(0), new_sidebars)


with open("frontend/src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

