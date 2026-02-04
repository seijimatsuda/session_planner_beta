# Soccer Session Planner - Complete Rebuild Plan

## PROJECT.md

### Project Overview
**Name:** Soccer Session Planner
**Version:** 2.0
**Description:** A web application for soccer coaches to organize training drills and build structured practice sessions. Coaches can upload drill videos/images, categorize them, and arrange them in a visual 4x3 grid to plan training sessions.

### Target Platforms
- **Desktop:** macOS, Windows (Chrome, Safari, Firefox, Edge)
- **Tablet:** iPad (Safari, Chrome)
- **Mobile:** iPhone, Android (Safari, Chrome)

### Core Value Proposition
Coaches can quickly build and save training session plans by dragging drills into a visual grid, accessible from any device including iPads on the field.

---

## Tech Stack (Recommended for iOS/macOS Compatibility)

### Frontend
- **Framework:** React 18+ with Vite
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **State Management:** React Context + TanStack Query
- **Routing:** React Router v6+
- **Form Handling:** React Hook Form + Zod
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **Hosting:** Vercel

### Backend
- **Framework:** Express.js 5 (or Hono for edge)
- **Language:** TypeScript
- **Hosting:** Render (Docker) or Railway

### Database & Storage
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **Media Proxy:** Express backend (required for iOS video streaming)

---

## ROADMAP.md

### Milestone 1: Foundation (MVP)

#### Phase 1: Project Setup & Infrastructure
**Goal:** Set up development environment with proper tooling and deployment pipeline.

**Tasks:**
1. Initialize Vite + React + TypeScript project
2. Configure Tailwind CSS
3. Set up ESLint + Prettier with strict rules
4. Create Supabase project (database + auth + storage)
5. Configure environment variables structure
6. Set up Vercel deployment (frontend)
7. Create Express backend with TypeScript
8. Set up Render deployment (backend)
9. Configure CORS for cross-origin requests
10. Create health check endpoints

**Deliverables:**
- [ ] Frontend deploys to Vercel on push
- [ ] Backend deploys to Render on push
- [ ] Environment variables configured
- [ ] Basic "Hello World" running on both

---

#### Phase 2: Authentication System
**Goal:** Users can sign up, log in, and maintain sessions across devices.

**Tasks:**
1. Set up Supabase Auth client
2. Create AuthContext and AuthProvider
3. Build Login page with email/password form
4. Build Signup page with email/password form
5. Create ProtectedRoute component
6. Implement logout functionality
7. Handle auth state persistence
8. Create useAuth hook
9. Add loading states during auth checks
10. Style auth pages for mobile/tablet

**Deliverables:**
- [ ] Users can sign up with email/password
- [ ] Users can log in
- [ ] Sessions persist across browser refreshes
- [ ] Protected routes redirect to login
- [ ] Works on iOS Safari

---

#### Phase 3: Database Schema & Services
**Goal:** Database tables and service layer ready for CRUD operations.

**Tasks:**
1. Create `drills` table in Supabase:
   ```sql
   id: uuid primary key
   created_at: timestamptz
   name: text not null
   video_url: text (optional reference URL)
   video_file_path: text (storage path)
   category: text check (activation|dribbling|passing|shooting)
   num_players: integer
   equipment: text[]
   tags: text[]
   user_id: uuid references auth.users
   creator_email: text
   ```
2. Create `sessions` table in Supabase:
   ```sql
   id: uuid primary key
   created_at: timestamptz
   name: text not null
   grid_data: jsonb not null
   user_id: uuid references auth.users
   creator_email: text
   ```
3. Enable Row Level Security (RLS) on both tables
4. Create RLS policies (users access own data only)
5. Create TypeScript types for all entities
6. Build drillService with CRUD functions
7. Build sessionService with CRUD functions
8. Set up React Query hooks for data fetching

**Deliverables:**
- [ ] Database tables created with RLS
- [ ] TypeScript types match schema
- [ ] Service functions tested
- [ ] React Query hooks ready

---

#### Phase 4: Supabase Storage & Media Upload
**Goal:** Users can upload drill videos/images that work on all platforms.

**Tasks:**
1. Create `drill-videos` storage bucket in Supabase
2. Configure bucket policies (authenticated uploads)
3. Build uploadMedia function with progress tracking
4. Implement file validation:
   - Max size: 100MB
   - Allowed video: MP4, MOV, M4V, WebM
   - Allowed image: JPG, PNG, GIF, WebP
5. Generate storage paths: `userId/timestamp.extension`
6. Build deleteMedia function
7. Create getMediaUrl function (signed URLs)
8. Add iOS-specific signed URL handling (longer expiry)

**Deliverables:**
- [ ] Storage bucket configured
- [ ] Upload works on desktop and iOS
- [ ] File validation prevents bad uploads
- [ ] Signed URLs work for retrieval

---

#### Phase 5: iOS Media Proxy (Critical)
**Goal:** Video streaming works reliably on iOS Safari.

**Why This Is Needed:**
iOS Safari has strict requirements for video streaming:
- Requires proper CORS headers
- Requires HTTP Range request support (byte-range streaming)
- Requires specific Content-Type headers
- Often fails with direct Supabase signed URLs

**Tasks:**
1. Create `/api/media/:path` proxy route in Express
2. Implement token-based authentication (query param)
3. Add proper CORS headers for iOS Safari:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, HEAD, OPTIONS
   Access-Control-Allow-Headers: Range, Authorization
   Access-Control-Expose-Headers: Content-Range, Content-Length
   ```
4. Implement HTTP Range request handling:
   - Parse Range header
   - Return 206 Partial Content for range requests
   - Return proper Content-Range header
5. Stream files from Supabase Storage to client
6. Add caching headers (Cache-Control: max-age=3600)
7. Implement HEAD request support
8. Add path validation (prevent directory traversal)
9. Create frontend getProxiedMediaUrl function
10. Add automatic fallback to signed URLs if proxy fails

**Deliverables:**
- [ ] Videos play on iOS Safari
- [ ] Range requests work (scrubbing works)
- [ ] CORS errors eliminated
- [ ] Fallback works if proxy is down

---

#### Phase 6: Core UI Components
**Goal:** Reusable UI components built with mobile-first responsive design.

**Tasks:**
1. Create AppLayout component (header, nav, content area)
2. Build responsive navigation (hamburger on mobile)
3. Create Button component (with touch targets >= 44px)
4. Create Input component (with proper mobile styling)
5. Create Select component
6. Create Modal component (mobile-friendly)
7. Create Card component
8. Create Badge component (for categories)
9. Create Loading spinner
10. Create ErrorBoundary component
11. Test all components on iOS Safari

**Deliverables:**
- [ ] Component library complete
- [ ] All touch targets >= 44px (iOS accessibility)
- [ ] Components work on mobile/tablet
- [ ] Consistent styling throughout

---

### Milestone 2: Core Features

#### Phase 7: Add Drill Feature
**Goal:** Users can add drills with media and metadata.

**Tasks:**
1. Create AddDrill page
2. Build AddDrillForm component with fields:
   - Drill name (required)
   - Category dropdown (required)
   - Media upload (drag-drop + click)
   - Number of players (optional)
   - Equipment list (tag input)
   - Tags (tag input)
   - Reference URL (optional)
3. Implement Zod validation schema
4. Show upload progress indicator
5. Preview uploaded media before submit
6. Handle form submission with React Query mutation
7. Show success/error feedback
8. Redirect to library after success
9. Test video upload on iOS

**Deliverables:**
- [ ] Can add drill with all fields
- [ ] Validation works
- [ ] Media uploads correctly
- [ ] Works on iOS/iPad

---

#### Phase 8: Drill Library
**Goal:** Users can view, search, and filter their drill library.

**Tasks:**
1. Create Library page
2. Build DrillCard component:
   - Thumbnail/video preview
   - Drill name
   - Category badge (color-coded)
   - Equipment icons
   - Tags
3. Implement responsive grid layout (1-4 columns)
4. Add search bar (search by name)
5. Add category filter dropdown
6. Add "Add Drill" button
7. Handle empty state (no drills yet)
8. Implement infinite scroll or pagination
9. Add click to view drill details

**Deliverables:**
- [ ] Grid displays all user drills
- [ ] Search works
- [ ] Filter by category works
- [ ] Responsive on all devices

---

#### Phase 9: Drill Detail & Edit
**Goal:** Users can view drill details and edit existing drills.

**Tasks:**
1. Create DrillDetailModal component:
   - Full media playback
   - All drill metadata
   - Edit button
   - Delete button (with confirmation)
2. Create EditDrill page
3. Build EditDrillForm (similar to AddDrillForm)
4. Pre-populate form with existing data
5. Allow media replacement
6. Handle form submission (update mutation)
7. Implement delete drill function
8. Show confirmation dialog before delete

**Deliverables:**
- [ ] Can view full drill details
- [ ] Can edit all drill fields
- [ ] Can replace media
- [ ] Can delete drills

---

#### Phase 10: Session Planner Grid
**Goal:** Users can plan sessions using a visual 4x3 grid with drag-and-drop.

**Tasks:**
1. Create SessionPlanner page
2. Build SessionGrid component:
   - 4 rows (Activation, Dribbling, Passing, Shooting)
   - 3 columns per row
   - Color-coded row headers
3. Implement @dnd-kit drag-and-drop:
   - DndContext provider
   - Droppable grid cells
   - Draggable drill items
4. Create drill sidebar/panel with available drills
5. Add session name input
6. Implement click-to-add (alternative to drag)
7. Allow removing drills from grid
8. Show drill preview on hover/tap
9. Implement touch-friendly drag on iPad
10. Save session button

**Grid Structure:**
```
| Row          | Col 1 | Col 2 | Col 3 |
|--------------|-------|-------|-------|
| Activation   |  [ ]  |  [ ]  |  [ ]  |
| Dribbling    |  [ ]  |  [ ]  |  [ ]  |
| Passing      |  [ ]  |  [ ]  |  [ ]  |
| Shooting     |  [ ]  |  [ ]  |  [ ]  |
```

**Deliverables:**
- [ ] Grid displays correctly
- [ ] Drag-and-drop works on desktop
- [ ] Drag-and-drop works on iPad
- [ ] Click-to-add works
- [ ] Can remove drills from grid

---

#### Phase 11: Save & Load Sessions
**Goal:** Users can save sessions and view them later.

**Tasks:**
1. Implement saveSession function
2. Store grid state as JSONB:
   ```json
   {
     "grid": [
       [{"drillId": "uuid", "position": 0}, null, null],
       [null, {"drillId": "uuid", "position": 1}, null],
       ...
     ]
   }
   ```
3. Create SavedSessions page
4. Display session cards in grid
5. Add view/edit/delete actions per session
6. Create SessionView page (read-only)
7. Load drills for session display
8. Handle sessions with deleted drills gracefully
9. Add duplicate session feature

**Deliverables:**
- [ ] Sessions save to database
- [ ] Saved sessions list displays
- [ ] Can view saved session (read-only)
- [ ] Can edit existing session
- [ ] Can delete session

---

#### Phase 12: Dashboard
**Goal:** Landing page with quick actions after login.

**Tasks:**
1. Create Dashboard page
2. Add welcome message with user email
3. Create quick action cards:
   - Add Drill
   - View Library
   - Plan Session
   - Saved Sessions
4. Show recent sessions (last 3-5)
5. Show drill count
6. Responsive grid layout
7. Add helpful empty states for new users

**Deliverables:**
- [ ] Dashboard displays after login
- [ ] Quick actions work
- [ ] Recent sessions shown
- [ ] Good experience for new users

---

### Milestone 3: Polish & Production

#### Phase 13: Error Handling & Loading States
**Goal:** Professional UX with proper feedback for all states.

**Tasks:**
1. Add loading skeletons for all data fetching
2. Implement toast notifications for success/error
3. Add retry logic for failed requests
4. Create user-friendly error messages
5. Handle offline state
6. Add form validation error display
7. Implement optimistic updates where appropriate

**Deliverables:**
- [ ] No jarring loading states
- [ ] Errors are user-friendly
- [ ] Retry logic works
- [ ] Forms show validation errors clearly

---

#### Phase 14: iOS/iPad Optimization
**Goal:** Perfect experience on Apple devices.

**Tasks:**
1. Test all features on iOS Safari
2. Test all features on iPad Safari
3. Fix any touch event issues
4. Ensure minimum 44px touch targets
5. Add `-webkit-touch-callout: none` where needed
6. Test video playback:
   - Play/pause
   - Scrubbing (seek)
   - Fullscreen
7. Add `playsInline` attribute to all videos
8. Add `webkit-playsinline` for legacy iOS
9. Test drag-and-drop with touch
10. Fix any viewport issues
11. Test with different iOS versions

**Deliverables:**
- [ ] All features work on iPhone
- [ ] All features work on iPad
- [ ] Videos play correctly
- [ ] Drag-and-drop works with touch

---

#### Phase 15: Performance Optimization
**Goal:** Fast load times and smooth interactions.

**Tasks:**
1. Implement lazy loading for images/videos
2. Add React.lazy for route-based code splitting
3. Optimize bundle size (analyze with vite-bundle-visualizer)
4. Add service worker for offline assets (optional)
5. Implement proper caching headers
6. Use React Query caching effectively
7. Optimize re-renders with React.memo
8. Test Lighthouse scores (aim for 90+)

**Deliverables:**
- [ ] Initial load < 3 seconds
- [ ] Lighthouse performance > 90
- [ ] Smooth scrolling and transitions

---

#### Phase 16: Final Testing & Launch
**Goal:** Production-ready application.

**Tasks:**
1. End-to-end testing on all platforms:
   - macOS Safari
   - macOS Chrome
   - iOS Safari (iPhone)
   - iOS Safari (iPad)
   - Windows Chrome
2. Test all user flows:
   - Sign up → Add drill → Plan session → Save → View
3. Security audit:
   - RLS policies correct
   - No exposed secrets
   - Input sanitization
4. Fix any remaining bugs
5. Update environment variables for production
6. Final deployment
7. Monitor error rates post-launch

**Deliverables:**
- [ ] All platforms tested
- [ ] All user flows work
- [ ] Security review complete
- [ ] Production deployed

---

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=https://your-backend.onrender.com
```

### Backend (.env)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DRILL_STORAGE_BUCKET=drill-videos
PORT=3001
```

---

## Key iOS Compatibility Checklist

These issues caused problems in the original build. Address them proactively:

### Video Playback
- [ ] Use `<video playsInline webkit-playsinline>` attributes
- [ ] Use backend proxy for video URLs (not direct Supabase)
- [ ] Support HTTP Range requests in proxy
- [ ] Set proper CORS headers
- [ ] Use MP4 or MOV format (avoid WebM on iOS)

### Touch Interactions
- [ ] All buttons/links minimum 44x44px
- [ ] Drag-and-drop works with touch events
- [ ] No hover-only interactions
- [ ] Test with actual iOS devices (not just simulators)

### Safari Quirks
- [ ] Test `position: fixed` elements
- [ ] Test `100vh` (use `dvh` or JS fallback)
- [ ] Test form inputs (auto-zoom prevention)
- [ ] Test file uploads from camera roll

---

## File Structure

```
soccer-session-planner/
├── src/
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   └── Navigation.tsx
│   │   ├── drills/
│   │   │   ├── DrillCard.tsx
│   │   │   ├── AddDrillForm.tsx
│   │   │   ├── EditDrillForm.tsx
│   │   │   └── DrillDetailModal.tsx
│   │   ├── sessions/
│   │   │   ├── SessionGrid.tsx
│   │   │   ├── GridCell.tsx
│   │   │   └── DraggableDrill.tsx
│   │   └── auth/
│   │       └── ProtectedRoute.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDrills.ts
│   │   └── useSessions.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Library.tsx
│   │   ├── AddDrill.tsx
│   │   ├── EditDrill.tsx
│   │   ├── SessionPlanner.tsx
│   │   ├── SessionView.tsx
│   │   ├── SavedSessions.tsx
│   │   ├── Login.tsx
│   │   └── Signup.tsx
│   ├── services/
│   │   ├── database.ts
│   │   └── storage.ts
│   ├── types/
│   │   └── index.ts
│   ├── schemas/
│   │   └── drillSchema.ts
│   ├── App.tsx
│   └── main.tsx
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   └── routes/
│   │       └── media.ts
│   ├── Dockerfile
│   └── package.json
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── vercel.json
└── .env.example
```

---

## Commands Reference

### Development
```bash
# Frontend
npm create vite@latest soccer-session-planner -- --template react-ts
cd soccer-session-planner
npm install
npm run dev

# Backend
mkdir backend && cd backend
npm init -y
npm install express cors typescript @types/express @types/cors
npx tsc --init
npm run dev
```

### Dependencies (Frontend)
```bash
npm install @supabase/supabase-js @tanstack/react-query react-router-dom react-hook-form @hookform/resolvers zod @dnd-kit/core @dnd-kit/sortable tailwindcss postcss autoprefixer
npm install -D @types/react @types/react-dom
```

### Dependencies (Backend)
```bash
npm install express cors @supabase/supabase-js
npm install -D typescript @types/express @types/cors @types/node tsx
```

---

## Success Criteria

1. **User can sign up and log in** on any device
2. **User can add drills** with video/image uploads
3. **User can view drill library** with search and filters
4. **User can plan sessions** using drag-and-drop grid
5. **User can save and load sessions**
6. **Videos play correctly on iOS Safari** (including scrubbing)
7. **Drag-and-drop works on iPad** with touch
8. **App loads in under 3 seconds**
9. **No console errors on any platform**
10. **All data persists correctly**

---

## Getting Started

1. Copy this plan to your new repository as `PROJECT.md` and `ROADMAP.md`
2. Create a new Supabase project
3. Initialize the Vite frontend
4. Initialize the Express backend
5. Set up deployments on Vercel (frontend) and Render (backend)
6. Begin Phase 1

Good luck with the rebuild!
