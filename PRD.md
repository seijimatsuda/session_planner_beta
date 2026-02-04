# Product Requirements Document (PRD)
# Soccer Session Planner

**Version:** 1.0
**Last Updated:** January 2025
**Status:** In Development

---

## 1. Executive Summary

Soccer Session Planner is a web application designed for soccer coaches to organize training drills and build structured practice sessions. The app enables coaches to upload drill videos/images, categorize them in a searchable library, and assemble training sessions using an intuitive drag-and-drop interface.

---

## 2. Problem Statement

Soccer coaches face challenges in:
- **Organizing drill content:** Coaches collect drills from various sources (YouTube, Instagram, personal recordings) but lack a centralized system to store and categorize them
- **Planning sessions efficiently:** Building training sessions requires manually remembering which drills to use and in what order
- **Accessing content on the field:** Coaches need mobile-friendly access to their drill library during practice

---

## 3. Target Users

### Primary User: Soccer Coach
- **Age Range:** 25-55
- **Technical Proficiency:** Basic to intermediate
- **Use Context:** Planning sessions at home (desktop/laptop), referencing during practice (tablet/phone)
- **Pain Points:** Scattered drill resources, time-consuming session planning, difficulty accessing content during practice

---

## 4. Product Goals

1. **Centralized Drill Library:** Single location to store, categorize, and search all training drills
2. **Visual Session Planning:** Intuitive grid-based interface to build training sessions
3. **Cross-Platform Access:** Works on desktop (macOS) and mobile devices (iOS/iPad)
4. **Quick Reference:** Easy access to drill videos during practice

---

## 5. Core Features

### 5.1 User Authentication
| Feature | Description | Priority |
|---------|-------------|----------|
| Email/Password Sign Up | New users can create accounts | P0 |
| Email/Password Login | Existing users can authenticate | P0 |
| Session Persistence | Users stay logged in across browser sessions | P0 |
| Logout | Users can securely sign out | P0 |

### 5.2 Drill Management

#### 5.2.1 Add Drill
| Feature | Description | Priority |
|---------|-------------|----------|
| Media Upload | Upload video (MP4, MOV) or image (JPG, PNG) of drill | P0 |
| Drill Name | Text field for naming the drill | P0 |
| Category Selection | Dropdown: Activation, Dribbling, Passing, Shooting | P0 |
| Number of Players | Optional field for player count | P1 |
| Equipment List | Add multiple equipment items (cones, balls, etc.) | P1 |
| Tags | Add searchable tags for organization | P1 |
| Reference URL | Optional link to source video (YouTube, Instagram) | P2 |

#### 5.2.2 Drill Library
| Feature | Description | Priority |
|---------|-------------|----------|
| Grid View | Visual card-based display of all drills | P0 |
| Category Filter | Filter drills by category | P0 |
| Search | Search by drill name or tags | P0 |
| Edit Drill | Modify drill details and replace media | P0 |
| Delete Drill | Remove drill from library | P0 |
| Media Preview | Thumbnail display with video playback | P0 |

### 5.3 Session Planning

#### 5.3.1 Session Builder
| Feature | Description | Priority |
|---------|-------------|----------|
| 4x3 Grid Layout | Fixed grid with 4 rows (one per category) and 3 columns | P0 |
| Drag-and-Drop | Drag drills from library into grid cells | P0 |
| Click-to-Add | Alternative method to add drills to grid | P1 |
| Session Name | Name the training session | P0 |
| Save Session | Persist session to database | P0 |
| Edit Session | Modify existing saved sessions | P0 |

#### 5.3.2 Saved Sessions
| Feature | Description | Priority |
|---------|-------------|----------|
| Session List | View all saved sessions | P0 |
| View Session | Read-only view of session grid | P0 |
| Edit Session | Navigate to session builder with loaded data | P0 |
| Delete Session | Remove session from database | P0 |
| Duplicate Session | Create copy of existing session | P2 |

### 5.4 Dashboard
| Feature | Description | Priority |
|---------|-------------|----------|
| Quick Actions | Buttons to Add Drill, View Library, Plan Session | P0 |
| Navigation | Access to all app sections | P0 |

---

## 6. Technical Architecture

### 6.1 Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend Framework | React 19 + Vite |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State Management | React Context + React Query |
| Routing | React Router v6 |
| Form Handling | React Hook Form + Zod |
| Drag & Drop | @dnd-kit/core |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Backend Proxy | Express.js on Render |
| Frontend Hosting | Vercel |

### 6.2 Data Model

#### Drills Table
```
id: UUID (primary key)
created_at: timestamp
name: text (required)
video_url: text (optional reference URL)
video_file_path: text (Supabase Storage path)
category: enum ('activation', 'dribbling', 'passing', 'shooting')
num_players: integer (optional)
equipment: text[] (array)
tags: text[] (array)
user_id: UUID (foreign key)
creator_email: text (for shared access attribution)
```

#### Sessions Table
```
id: UUID (primary key)
created_at: timestamp
name: text (required)
grid_data: JSONB (4x3 grid structure)
user_id: UUID (foreign key)
creator_email: text (for shared access attribution)
```

### 6.3 Grid Data Structure
```json
{
  "grid": [
    [{"drillId": "uuid", "position": 0}, null, null],
    [{"drillId": "uuid", "position": 0}, {"drillId": "uuid", "position": 1}, null],
    [null, null, null],
    [null, null, null]
  ]
}
```

---

## 7. User Flows

### 7.1 Add New Drill
```
1. User clicks "Add Drill" from Dashboard or Library
2. User uploads video/image file
3. User fills in drill details (name, category, etc.)
4. User clicks "Create Drill"
5. System uploads media to Supabase Storage
6. System creates drill record in database
7. User is redirected to Library
```

### 7.2 Plan Training Session
```
1. User clicks "Plan Session" from Dashboard
2. User sees empty 4x3 grid (top) and drill library (bottom)
3. User filters/searches for desired drills
4. User drags drill from library to grid cell (or clicks to add)
5. User repeats for each drill in session
6. User enters session name
7. User clicks "Save Session"
8. System persists grid configuration to database
9. User is redirected to Saved Sessions
```

### 7.3 Reference Drill During Practice
```
1. User opens app on iPad/tablet
2. User navigates to Library or Saved Session
3. User taps drill card to view media
4. Video plays inline for quick reference
5. User returns to session view
```

---

## 8. Platform Requirements

### 8.1 Supported Platforms
| Platform | Browser | Status |
|----------|---------|--------|
| macOS | Safari, Chrome | Supported |
| iOS/iPadOS | Safari | Supported (with restrictions) |
| Windows | Chrome, Edge | Supported |
| Android | Chrome | Supported |

### 8.2 iOS/iPad Specific Requirements
- **Video Format:** Only MP4 and MOV files supported (H.264 codec)
- **Media Proxy:** Backend proxy required for CORS compatibility
- **Touch Targets:** Minimum 44px for all interactive elements
- **Inline Playback:** Videos play inline (not fullscreen by default)

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Page load time: < 3 seconds on 4G connection
- Media upload: Support files up to 100MB
- Grid interaction: < 100ms response time for drag operations

### 9.2 Security
- Row-Level Security (RLS) on all database tables
- Users can only access their own drills and sessions
- Authenticated media access via signed URLs or backend proxy
- HTTPS required for all connections

### 9.3 Reliability
- 99.5% uptime target
- Graceful error handling with user-friendly messages
- Automatic retry logic for failed media loads

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Retention | 40% weekly active | Analytics |
| Drills Created | 10+ per active user | Database |
| Sessions Planned | 2+ per week per active user | Database |
| iOS Compatibility | 95% media load success | Error tracking |

---

## 11. Future Considerations (Out of Scope v1)

- Drill sharing between users
- Team management features
- Session templates
- Analytics/drill usage tracking
- Offline support (PWA)
- Video trimming/editing
- AI-powered drill suggestions
- Calendar integration
- Print-friendly session exports

---

## 12. Appendix

### A. File Structure
```
soccer-session-planner/
├── src/
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Supabase client config
│   ├── pages/           # Route page components
│   ├── schemas/         # Zod validation schemas
│   ├── services/        # API service functions
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── backend/
│   └── src/
│       ├── routes/      # Express API routes
│       └── server.ts    # Express server entry
└── public/              # Static assets
```

### B. Environment Variables

#### Frontend (Vercel)
```
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
VITE_BACKEND_URL=<render_backend_url>
```

#### Backend (Render)
```
SUPABASE_URL=<supabase_project_url>
SUPABASE_SERVICE_ROLE_KEY=<supabase_service_role_key>
DRILL_STORAGE_BUCKET=drill-videos
```

### C. Related Documentation
- `master_plan.md` - Development phases and implementation details
- `BACKEND_PROXY_SETUP.md` - iOS media proxy configuration
- `IPAD_MEDIA_TROUBLESHOOTING.md` - iOS debugging guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
