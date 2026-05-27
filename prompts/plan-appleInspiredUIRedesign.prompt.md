## Plan: Apple-Inspired UI Redesign & Session Naming

Redesign the UI using Apple's human interface guidelines (squircle corners, glassmorphism, clean layouts) to create a professional, medical-grade web app. Introduce mobile responsiveness with a collapsible sidebar and automatic naming for chat sessions stored in the backend.

**Steps**
1. **Backend Schema Update**
   - Add a `title` field to `SessionObject` in `backend/schemas.py`.
   - Update `backend/session_store.py` to auto-generate a title based on the top CLIP prediction or first user input.
2. **Frontend Theme Provider Setup**
   - Install `next-themes` and configure `ThemeProvider` in `frontend/src/app/layout.tsx`.
   - Set the default theme to `dark`, but fully support switching to light.
3. **Sidebar Component (Collapsible)**
   - Extract the sidebar into a separate component.
   - Use `shadcn`'s `Sheet` component for a mobile slide-out menu.
   - Add an expand/collapse toggle for desktop users.
   - Update `frontend/src/lib/api.ts` to expect `title` in session list.
4. **Main UI Redesign (Apple Aesthetics)**
   - Update `frontend/src/app/page.tsx` main layout to use generous padding, larger border radiuses (e.g., `rounded-3xl`), and blurred translucent headers/footers (`backdrop-blur-xl`).
   - Redesign the chat input to be a floating "pill" style, similar to Apple Messages.
   - Use subtle shadows instead of harsh borders to separate zones.

**Relevant files**
- `backend/schemas.py` — Add `title: str` to `SessionObject`
- `backend/session_store.py` — Auto-generate title in `create_session`
- `frontend/src/lib/api.ts` — Update `SessionListResponse` schema to include `title`
- `frontend/src/app/layout.tsx` — Add `ThemeProvider` for unified dark/light handling
- `frontend/src/app/page.tsx` — Implement the full visual overhaul, mobile drawer for the sidebar, and new floating input styles.
- `frontend/src/components/ui/*` — Utilize Shadcn UI components for Sheet, Buttons, Cards

**Verification**
1. Open the app on mobile viewport and verify the sidebar is collapsed into a hamburger menu (Sheet).
2. Check that the sidebar toggle acts smoothly on desktop.
3. Perform a new image upload and verify the newly created session has a readable, auto-generated title instead of just the ID.
4. Toggle between dark and light modes, verifying the glass properties (blur and transparency) adjust gracefully.

**Decisions**
- Backend handles session naming natively to persist context properly across devices.
- Added `next-themes` for robust and clean handling of Dark Mode as default, whilst building out both palettes appropriately.