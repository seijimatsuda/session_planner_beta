Master Plan
===========
# Soccer Session Planner - Development Master Plan

## Project Overview
A web application for soccer coaches to manage drills and plan training sessions. The app allows importing drill videos from YouTube/Instagram, organizing them in a library, and building session plans using a drag-and-drop interface.

## Tech Stack
- **Frontend Framework:** React 18+ with Vite
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database & Backend:** Supabase (Authentication, PostgreSQL, Storage)
- **Video Download:** yt-dlp via serverless function (Vercel/Netlify)
- **Drag & Drop:** @dnd-kit/core (modern, accessible)
- **State Management:** React Context API + hooks
- **Routing:** React Router v6
- **Form Handling:** React Hook Form + Zod validation
- **Deployment:** Vercel

## Database Schema

### Table: drills
```sql
id: uuid (primary key)
created_at: timestamp
name: text (required)
video_url: text (original URL)
video_file_path: text (stored file path in Supabase Storage)
category: text (enum: 'activation', 'dribbling', 'passing', 'shooting')
num_players: integer
equipment: text[]
tags: text[]
user_id: uuid (foreign key to auth.users)
```

### Table: sessions
```sql
id: uuid (primary key)
created_at: timestamp
name: text (required)
grid_data: jsonb (stores 4x3 grid with drill IDs and positions)
user_id: uuid (foreign key to auth.users)
```

Example grid_data structure:
```json
{
  "grid": [
    [{"drillId": "uuid1", "position": 0}, {"drillId": "uuid2", "position": 1}, {"drillId": null, "position": 2}],
    [{"drillId": "uuid3", "position": 0}, null, null],
    [null, null, null],
    [null, null, null]
  ]
}
```

## Core Interfaces (Pages/Routes)

1. **Drill Input Interface** (`/drills/new`)
   - Modal or dedicated page for adding drills
   - URL input → video download → form fields

2. **Library Interface** (`/library`)
   - Grid view of all drills
   - Filter by category, search by name/tags
   - Edit/delete actions

3. **Session Planning Interface** (`/sessions/new` or `/sessions/:id/edit`)
   - 4x3 grid at top (fixed)
   - Library below (scrollable)
   - Drag-and-drop OR click "Add to Session"

4. **Saved Sessions Interface** (`/sessions`)
   - List of all saved sessions
   - Actions: View, Edit, Duplicate, Delete

5. **Home/Dashboard** (`/`)
   - Quick access buttons to all sections
   - Recent sessions/drills

---

## PHASE 1: Project Setup & Authentication
**Goal:** Get the basic app structure running with user authentication.

### Tasks:
1. Initialize Vite + React + TypeScript project
```bash
   npm create vite@latest soccer-session-planner -- --template react-ts
```

2. Install core dependencies:
```bash
   npm install @supabase/supabase-js react-router-dom @tanstack/react-query tailwindcss postcss autoprefixer
   npm install -D @types/node
   npx tailwindcss init -p
```

3. Set up Tailwind CSS configuration (include all paths)

4. Create Supabase project:
   - Sign up at supabase.com
   - Create new project
   - Note the project URL and anon key
   - Create `.env` file with:
```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
```

5. Set up Supabase client (`src/lib/supabase.ts`):
```typescript
   import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   
   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

6. Create authentication pages:
   - `/login` - Email/password login
   - `/signup` - Email/password registration
   - Use Supabase Auth (supabase.auth.signInWithPassword, signUp)

7. Create AuthContext (`src/contexts/AuthContext.tsx`):
   - Provide user state across app
   - Handle session management
   - Protect routes (redirect to login if not authenticated)

8. Set up React Router with protected routes:
```
   / (Dashboard - protected)
   /login (public)
   /signup (public)
   /library (protected)
   /drills/new (protected)
   /sessions (protected)
   /sessions/new (protected)
   /sessions/:id/edit (protected)
```

9. Create basic navigation/layout component with:
   - App header with navigation links
   - Logout button
   - Container for page content

### Testing Phase 1:
- [ ] Can sign up new user successfully
- [ ] Can log in with created user
- [ ] Cannot access protected routes when logged out
- [ ] Session persists on page refresh
- [ ] Can log out successfully
- [ ] All routes render without errors

**DO NOT PROCEED TO PHASE 2 UNTIL ALL TESTS PASS.**

---

## PHASE 2: Database Setup & Drill Storage

**Goal:** Create database tables and enable video storage in Supabase.

### Tasks:

1. In Supabase Dashboard → SQL Editor, run this schema:
```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create drills table
   CREATE TABLE drills (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     name TEXT NOT NULL,
     video_url TEXT NOT NULL,
     video_file_path TEXT,
     category TEXT NOT NULL CHECK (category IN ('activation', 'dribbling', 'passing', 'shooting')),
     num_players INTEGER,
     equipment TEXT[],
     tags TEXT[],
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
   );

   -- Create sessions table
   CREATE TABLE sessions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     name TEXT NOT NULL,
     grid_data JSONB NOT NULL DEFAULT '{"grid": [[null,null,null],[null,null,null],[null,null,null],[null,null,null]]}',
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
   );

   -- Enable Row Level Security
   ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
   ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

   -- Policies for drills (users can only access their own drills)
   CREATE POLICY "Users can view own drills" ON drills
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own drills" ON drills
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own drills" ON drills
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own drills" ON drills
     FOR DELETE USING (auth.uid() = user_id);

   -- Policies for sessions
   CREATE POLICY "Users can view own sessions" ON sessions
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert own sessions" ON sessions
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update own sessions" ON sessions
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete own sessions" ON sessions
     FOR DELETE USING (auth.uid() = user_id);

   -- Create indexes for better query performance
   CREATE INDEX idx_drills_user_id ON drills(user_id);
   CREATE INDEX idx_drills_category ON drills(category);
   CREATE INDEX idx_sessions_user_id ON sessions(user_id);
```

2. Set up Supabase Storage bucket for videos:
   - Go to Storage in Supabase Dashboard
   - Create bucket named `drill-videos`
   - Make it private (authenticated users only)
   - Set up storage policies:
```sql
     -- Allow authenticated users to upload
     CREATE POLICY "Authenticated users can upload videos"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'drill-videos');

     -- Allow users to read their own videos
     CREATE POLICY "Users can view own videos"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'drill-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

     -- Allow users to delete their own videos
     CREATE POLICY "Users can delete own videos"
     ON storage.objects FOR DELETE
     TO authenticated
     USING (bucket_id = 'drill-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

3. Create TypeScript types (`src/types/index.ts`):
```typescript
   export type Category = 'activation' | 'dribbling' | 'passing' | 'shooting'

   export interface Drill {
     id: string
     created_at: string
     name: string
     video_url: string
     video_file_path: string | null
     category: Category
     num_players: number | null
     equipment: string[]
     tags: string[]
     user_id: string
   }

   export interface Session {
     id: string
     created_at: string
     name: string
     grid_data: {
       grid: (GridCell | null)[][]
     }
     user_id: string
   }

   export interface GridCell {
     drillId: string
     position: number
   }

   export type NewDrill = Omit<Drill, 'id' | 'created_at' | 'user_id' | 'video_file_path'>
   export type NewSession = Omit<Session, 'id' | 'created_at' | 'user_id'>
```

4. Create database service layer (`src/services/database.ts`):
```typescript
   import { supabase } from '../lib/supabase'
   import type { Drill, Session, NewDrill, NewSession } from '../types'

   // Drill operations
   export const drillService = {
     async getAll(): Promise<Drill[]> {
       const { data, error } = await supabase
         .from('drills')
         .select('*')
         .order('created_at', { ascending: false })
       
       if (error) throw error
       return data || []
     },

     async getById(id: string): Promise<Drill | null> {
       const { data, error } = await supabase
         .from('drills')
         .select('*')
         .eq('id', id)
         .single()
       
       if (error) throw error
       return data
     },

     async getByCategory(category: string): Promise<Drill[]> {
       const { data, error } = await supabase
         .from('drills')
         .select('*')
         .eq('category', category)
         .order('created_at', { ascending: false })
       
       if (error) throw error
       return data || []
     },

     async create(drill: NewDrill & { user_id: string }): Promise<Drill> {
       const { data, error } = await supabase
         .from('drills')
         .insert(drill)
         .select()
         .single()
       
       if (error) throw error
       return data
     },

     async update(id: string, updates: Partial<NewDrill>): Promise<Drill> {
       const { data, error } = await supabase
         .from('drills')
         .update(updates)
         .eq('id', id)
         .select()
         .single()
       
       if (error) throw error
       return data
     },

     async delete(id: string): Promise<void> {
       const { error } = await supabase
         .from('drills')
         .delete()
         .eq('id', id)
       
       if (error) throw error
     }
   }

   // Session operations
   export const sessionService = {
     async getAll(): Promise<Session[]> {
       const { data, error } = await supabase
         .from('sessions')
         .select('*')
         .order('created_at', { ascending: false })
       
       if (error) throw error
       return data || []
     },

     async getById(id: string): Promise<Session | null> {
       const { data, error } = await supabase
         .from('sessions')
         .select('*')
         .eq('id', id)
         .single()
       
       if (error) throw error
       return data
     },

     async create(session: NewSession & { user_id: string }): Promise<Session> {
       const { data, error } = await supabase
         .from('sessions')
         .insert(session)
         .select()
         .single()
       
       if (error) throw error
       return data
     },

     async update(id: string, updates: Partial<NewSession>): Promise<Session> {
       const { data, error } = await supabase
         .from('sessions')
         .update(updates)
         .eq('id', id)
         .select()
         .single()
       
       if (error) throw error
       return data
     },

     async delete(id: string): Promise<void> {
       const { error } = await supabase
         .from('sessions')
         .delete()
         .eq('id', id)
       
       if (error) throw error
     }
   }
```

5. Create storage service (`src/services/storage.ts`):
```typescript
   import { supabase } from '../lib/supabase'

   export const storageService = {
     async uploadVideo(file: File, userId: string): Promise<string> {
       const fileExt = file.name.split('.').pop()
       const fileName = `${userId}/${Date.now()}.${fileExt}`
       
       const { error: uploadError } = await supabase.storage
         .from('drill-videos')
         .upload(fileName, file)

       if (uploadError) throw uploadError

       return fileName
     },

     getVideoUrl(path: string): string {
       const { data } = supabase.storage
         .from('drill-videos')
         .getPublicUrl(path)
       
       return data.publicUrl
     },

     async deleteVideo(path: string): Promise<void> {
       const { error } = await supabase.storage
         .from('drill-videos')
         .remove([path])

       if (error) throw error
     }
   }
```

### Testing Phase 2:
- [ ] Tables created successfully in Supabase
- [ ] Storage bucket created with correct policies
- [ ] Can manually insert a test drill via Supabase dashboard
- [ ] Can manually insert a test session via Supabase dashboard
- [ ] RLS policies work (test user can only see their own data)
- [ ] TypeScript types compile without errors

**DO NOT PROCEED TO PHASE 3 UNTIL ALL TESTS PASS.**

---

## PHASE 3: Drill Input Interface & Video Download

**Goal:** Allow users to add drills by pasting YouTube/Instagram URLs.

### Tasks:

1. Install form dependencies:
```bash
   npm install react-hook-form zod @hookform/resolvers
```

2. Create video download serverless function:
   - Create `api/download-video.ts` (for Vercel) or equivalent:
```typescript
   import type { VercelRequest, VercelResponse } from '@vercel/node'
   import { exec } from 'child_process'
   import { promisify } from 'util'
   import fs from 'fs/promises'
   import path from 'path'

   const execAsync = promisify(exec)

   export default async function handler(req: VercelRequest, res: VercelResponse) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' })
     }

     const { url } = req.body

     if (!url) {
       return res.status(400).json({ error: 'URL is required' })
     }

     const tempDir = '/tmp'
     const outputTemplate = path.join(tempDir, '%(id)s.%(ext)s')

     try {
       // Download video using yt-dlp
       const { stdout } = await execAsync(
         `yt-dlp -f "best[height<=720]" -o "${outputTemplate}" "${url}"`
       )

       // Find the downloaded file
       const files = await fs.readdir(tempDir)
       const videoFile = files.find(f => f.match(/\.(mp4|webm|mkv)$/))

       if (!videoFile) {
         throw new Error('Video file not found after download')
       }

       const videoPath = path.join(tempDir, videoFile)
       const videoBuffer = await fs.readFile(videoPath)

       // Clean up
       await fs.unlink(videoPath)

       // Return video as base64 (or you can upload directly to Supabase here)
       return res.status(200).json({
         success: true,
         video: videoBuffer.toString('base64'),
         filename: videoFile
       })

     } catch (error) {
       console.error('Download error:', error)
       return res.status(500).json({ 
         error: 'Failed to download video',
         details: error instanceof Error ? error.message : 'Unknown error'
       })
     }
   }
```

   **NOTE:** For simplicity, we'll implement a client-side approach initially that asks users to download the video manually and upload it. You can implement the serverless function later as an enhancement.

3. Create drill form schema (`src/schemas/drillSchema.ts`):
```typescript
   import { z } from 'zod'

   export const drillSchema = z.object({
     name: z.string().min(1, 'Name is required').max(100),
     video_url: z.string().url('Must be a valid URL'),
     category: z.enum(['activation', 'dribbling', 'passing', 'shooting']),
     num_players: z.number().int().positive().optional().nullable(),
     equipment: z.array(z.string()).default([]),
     tags: z.array(z.string()).default([])
   })

   export type DrillFormData = z.infer<typeof drillSchema>
```

4. Create AddDrillForm component (`src/components/AddDrillForm.tsx`):
```typescript
   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   import { drillSchema, type DrillFormData } from '../schemas/drillSchema'
   import { useState } from 'react'
   import { useAuth } from '../contexts/AuthContext'
   import { drillService } from '../services/database'
   import { storageService } from '../services/storage'

   export function AddDrillForm({ onSuccess }: { onSuccess: () => void }) {
     const { user } = useAuth()
     const [videoFile, setVideoFile] = useState<File | null>(null)
     const [isSubmitting, setIsSubmitting] = useState(false)
     const [equipmentInput, setEquipmentInput] = useState('')
     const [tagInput, setTagInput] = useState('')

     const {
       register,
       handleSubmit,
       watch,
       setValue,
       formState: { errors }
     } = useForm<DrillFormData>({
       resolver: zodResolver(drillSchema),
       defaultValues: {
         equipment: [],
         tags: []
       }
     })

     const equipment = watch('equipment')
     const tags = watch('tags')

     const addEquipment = () => {
       if (equipmentInput.trim()) {
         setValue('equipment', [...equipment, equipmentInput.trim()])
         setEquipmentInput('')
       }
     }

     const removeEquipment = (index: number) => {
       setValue('equipment', equipment.filter((_, i) => i !== index))
     }

     const addTag = () => {
       if (tagInput.trim()) {
         setValue('tags', [...tags, tagInput.trim()])
         setTagInput('')
       }
     }

     const removeTag = (index: number) => {
       setValue('tags', tags.filter((_, i) => i !== index))
     }

     const onSubmit = async (data: DrillFormData) => {
       if (!user || !videoFile) return

       setIsSubmitting(true)
       try {
         // Upload video to Supabase Storage
         const videoPath = await storageService.uploadVideo(videoFile, user.id)

         // Create drill in database
         await drillService.create({
           ...data,
           video_file_path: videoPath,
           user_id: user.id
         })

         onSuccess()
       } catch (error) {
         console.error('Error creating drill:', error)
         alert('Failed to create drill. Please try again.')
       } finally {
         setIsSubmitting(false)
       }
     }

     return (
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
         {/* Video URL */}
         <div>
           <label className="block text-sm font-medium mb-2">
             Video URL (YouTube or Instagram)
           </label>
           <input
             type="url"
             {...register('video_url')}
             className="w-full px-3 py-2 border rounded-lg"
             placeholder="https://youtube.com/watch?v=..."
           />
           {errors.video_url && (
             <p className="text-red-500 text-sm mt-1">{errors.video_url.message}</p>
           )}
         </div>

         {/* Manual Video Upload (temporary solution) */}
         <div>
           <label className="block text-sm font-medium mb-2">
             Upload Video File
           </label>
           <input
             type="file"
             accept="video/*"
             onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
             className="w-full"
           />
           <p className="text-sm text-gray-500 mt-1">
             Please download the video from the URL above and upload it here
           </p>
         </div>

         {/* Drill Name */}
         <div>
           <label className="block text-sm font-medium mb-2">Drill Name</label>
           <input
             type="text"
             {...register('name')}
             className="w-full px-3 py-2 border rounded-lg"
             placeholder="Ball Mastery Drill"
           />
           {errors.name && (
             <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
           )}
         </div>

         {/* Category */}
         <div>
           <label className="block text-sm font-medium mb-2">Category</label>
           <select
             {...register('category')}
             className="w-full px-3 py-2 border rounded-lg"
           >
             <option value="activation">Activation</option>
             <option value="dribbling">Dribbling</option>
             <option value="passing">Passing</option>
             <option value="shooting">Shooting</option>
           </select>
           {errors.category && (
             <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
           )}
         </div>

         {/* Number of Players */}
         <div>
           <label className="block text-sm font-medium mb-2">
             Number of Players (optional)
           </label>
           <input
             type="number"
             {...register('num_players', { valueAsNumber: true })}
             className="w-full px-3 py-2 border rounded-lg"
             placeholder="2"
           />
           {errors.num_players && (
             <p className="text-red-500 text-sm mt-1">{errors.num_players.message}</p>
           )}
         </div>

         {/* Equipment */}
         <div>
           <label className="block text-sm font-medium mb-2">Equipment</label>
           <div className="flex gap-2 mb-2">
             <input
               type="text"
               value={equipmentInput}
               onChange={(e) => setEquipmentInput(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
               className="flex-1 px-3 py-2 border rounded-lg"
               placeholder="Add equipment (e.g., cones, ball)"
             />
             <button
               type="button"
               onClick={addEquipment}
               className="px-4 py-2 bg-blue-500 text-white rounded-lg"
             >
               Add
             </button>
           </div>
           <div className="flex flex-wrap gap-2">
             {equipment.map((item, index) => (
               <span
                 key={index}
                 className="px-3 py-1 bg-gray-200 rounded-full text-sm flex items-center gap-2"
               >
                 {item}
                 <button
                   type="button"
                   onClick={() => removeEquipment(index)}
                   className="text-red-500 font-bold"
                 >
                   ×
                 </button>
               </span>
             ))}
           </div>
         </div>

         {/* Tags */}
         <div>
           <label className="block text-sm font-medium mb-2">Tags</label>
           <div className="flex gap-2 mb-2">
             <input
               type="text"
               value={tagInput}
               onChange={(e) => setTagInput(e.target.value)}
               onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
               className="flex-1 px-3 py-2 border rounded-lg"
               placeholder="Add tag (e.g., beginner, footwork)"
             />
             <button
               type="button"
               onClick={addTag}
               className="px-4 py-2 bg-blue-500 text-white rounded-lg"
             >
               Add
             </button>
           </div>
           <div className="flex flex-wrap gap-2">
             {tags.map((tag, index) => (
               <span
                 key={index}
                 className="px-3 py-1 bg-blue-100 rounded-full text-sm flex items-center gap-2"
               >
                 {tag}
                 <button
                   type="button"
                   onClick={() => removeTag(index)}
                   className="text-red-500 font-bold"
                 >
                   ×
                 </button>
               </span>
             ))}
           </div>
         </div>

         {/* Submit */}
         <button
           type="submit"
           disabled={isSubmitting || !videoFile}
           className="w-full py-3 bg-green-500 text-white rounded-lg font-medium disabled:bg-gray-300"
         >
           {isSubmitting ? 'Creating Drill...' : 'Create Drill'}
         </button>
       </form>
     )
   }
```

5. Create AddDrill page (`src/pages/AddDrill.tsx`):
```typescript
   import { useNavigate } from 'react-router-dom'
   import { AddDrillForm } from '../components/AddDrillForm'

   export function AddDrill() {
     const navigate = useNavigate()

     return (
       <div className="max-w-2xl mx-auto p-6">
         <h1 className="text-3xl font-bold mb-6">Add New Drill</h1>
         <div className="bg-white rounded-lg shadow-md p-6">
           <AddDrillForm onSuccess={() => navigate('/library')} />
         </div>
       </div>
     )
   }
```

6. Add route to router for `/drills/new`

### Testing Phase 3:
- [ ] Can navigate to /drills/new
- [ ] Form validation works (try submitting empty/invalid data)
- [ ] Can add/remove equipment items
- [ ] Can add/remove tags
- [ ] Can upload a video file
- [ ] Drill successfully saves to database
- [ ] Video successfully uploads to Supabase Storage
- [ ] Redirects to library after successful creation
- [ ] Error handling works (test with network disconnected)

**DO NOT PROCEED TO PHASE 4 UNTIL ALL TESTS PASS.**

---

## PHASE 4: Library Interface

**Goal:** Display all drills in a filterable grid, with edit/delete capabilities.

### Tasks:

1. Install React Query for data fetching:
```bash
   npm install @tanstack/react-query
```

2. Set up React Query provider in `src/main.tsx`:
```typescript
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

   const queryClient = new QueryClient()

   // Wrap your app with QueryClientProvider
```

3. Create DrillCard component (`src/components/DrillCard.tsx`):
```typescript
   import { useState } from 'react'
   import type { Drill } from '../types'
   import { storageService } from '../services/storage'

   interface DrillCardProps {
     drill: Drill
     onEdit: (drill: Drill) => void
     onDelete: (id: string) => void
   }

   export function DrillCard({ drill, onEdit, onDelete }: DrillCardProps) {
     const [showVideo, setShowVideo] = useState(false)
     const videoUrl = drill.video_file_path 
       ? storageService.getVideoUrl(drill.video_file_path)
       : null

     return (
       <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
         {/* Video Thumbnail/Preview */}
         <div 
           className="relative w-full h-48 bg-gray-200 cursor-pointer"
           onClick={() => setShowVideo(!showVideo)}
         >
           {videoUrl && showVideo ? (
             <video
               src={videoUrl}
               controls
               className="w-full h-full object-cover"
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center">
               <span className="text-gray-500">Click to play video</span>
             </div>
           )}
         </div>

         {/* Drill Info */}
         <div className="p-4">
           <div className="flex justify-between items-start mb-2">
             <h3 className="font-semibold text-lg">{drill.name}</h3>
             <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
               {drill.category}
             </span>
           </div>

           {drill.num_players && (
             <p className="text-sm text-gray-600 mb-2">
               Players: {drill.num_players}
             </p>
           )}

           {drill.equipment.length > 0 && (
             <div className="mb-2">
               <p className="text-xs text-gray-500 mb-1">Equipment:</p>
               <div className="flex flex-wrap gap-1">
                 {drill.equipment.map((item, i) => (
                   <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                     {item}
                   </span>
                 ))}
               </div>
             </div>
           )}

           {drill.tags.length > 0 && (
             <div className="mb-3">
               <p className="text-xs text-gray-500 mb-1">Tags:</p>
               <div className="flex flex-wrap gap-1">
                 {drill.tags.map((tag, i) => (
                   <span key={i} className="px-2 py-0.5 bg-blue-50 rounded text-xs text-blue-700">
                     {tag}
                   </span>
                 ))}
               </div>
             </div>
           )}

           {/* Actions */}
           <div className="flex gap-2 mt-3">
             <button
               onClick={() => onEdit(drill)}
               className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
             >
               Edit
             </button>
             <button
               onClick={() => {
                 if (confirm('Delete this drill?')) {
                   onDelete(drill.id)
                 }
               }}
               className="flex-1 py-2 bg-red-500 text-white rounded hover:bg-red-600"
             >
               Delete
             </button>
           </div>
         </div>
       </div>
     )
   }
```

4. Create Library page (`src/pages/Library.tsx`):
```typescript
   import { useState } from 'react'
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { drillService, storageService } from '../services/database'
   import { DrillCard } from '../components/DrillCard'
   import type { Drill, Category } from '../types'

   export function Library() {
     const queryClient = useQueryClient()
     const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')
     const [searchQuery, setSearchQuery] = useState('')

     // Fetch drills
     const { data: drills = [], isLoading } = useQuery({
       queryKey: ['drills'],
       queryFn: drillService.getAll
     })

     // Delete drill mutation
     const deleteMutation = useMutation({
       mutationFn: async (id: string) => {
         const drill = drills.find(d => d.id === id)
         if (drill?.video_file_path) {
           await storageService.deleteVideo(drill.video_file_path)
         }
         await drillService.delete(id)
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['drills'] })
       }
     })

     // Filter drills
     const filteredDrills = drills.filter(drill => {
       const matchesCategory = selectedCategory === 'all' || drill.category === selectedCategory
       const matchesSearch = drill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         drill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
       return matchesCategory && matchesSearch
     })

     const categories: (Category | 'all')[] = ['all', 'activation', 'dribbling', 'passing', 'shooting']

     if (isLoading) {
       return <div className="text-center py-12">Loading drills...</div>
     }

     return (
       <div className="max-w-7xl mx-auto p-6">
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-3xl font-bold">Drill Library</h1>
           
             href="/drills/new"
             className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
           >
             + Add Drill
           </a>
         </div>

         {/* Filters */}
         <div className="mb-6 space-y-4">
           {/* Category Filter */}
           <div className="flex gap-2 flex-wrap">
             {categories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-4 py-2 rounded-lg capitalize ${
                   selectedCategory === cat
                     ? 'bg-blue-500 text-white'
                     : 'bg-gray-200 hover:bg-gray-300'
                 }`}
               >
                 {cat}
               </button>
             ))}
           </div>

           {/* Search */}
           <input
             type="text"
             placeholder="Search by name or tags..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full px-4 py-2 border rounded-lg"
           />
         </div>

         {/* Drill Grid */}
         {filteredDrills.length === 0 ? (
           <div className="text-center py-12 text-gray-500">
             No drills found. Add your first drill to get started!
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredDrills.map(drill => (
               <DrillCard
                 key={drill.id}
                 drill={drill}
                 onEdit={(drill) => {
                   // TODO: Implement edit modal in Phase 5
                   console.log('Edit drill:', drill)
                 }}
                 onDelete={(id) => deleteMutation.mutate(id)}
               />
             ))}
           </div>
         )}
       </div>
     )
   }
```

5. Add route for `/library`

### Testing Phase 4:
- [ ] Library page loads without errors
- [ ] All drills display correctly
- [ ] Video plays when clicked
- [ ] Can filter by category (all, activation, dribbling, passing, shooting)
- [ ] Search works for drill names
- [ ] Search works for tags
- [ ] Can delete a drill (confirms + removes from UI)
- [ ] Video is deleted from storage when drill is deleted
- [ ] "Add Drill" button navigates to /drills/new
- [ ] Empty state shows when no drills match filters

**DO NOT PROCEED TO PHASE 5 UNTIL ALL TESTS PASS.**

---

## PHASE 5: Session Planning Interface - Part 1 (Grid & Basic Drag-Drop)

**Goal:** Create the 4x3 grid and enable basic drill placement.

### Tasks:

1. Install drag-and-drop library:
```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

2. Create SessionGrid component (`src/components/SessionGrid.tsx`):
```typescript
   import { useDroppable } from '@dnd-kit/core'
   import type { Drill } from '../types'
   import { storageService } from '../services/storage'

   interface GridCellProps {
     drill: Drill | null
     rowIndex: number
     colIndex: number
     category: string
     onRemove: (rowIndex: number, colIndex: number) => void
   }

   function GridCell({ drill, rowIndex, colIndex, category, onRemove }: GridCellProps) {
     const { setNodeRef, isOver } = useDroppable({
       id: `cell-${rowIndex}-${colIndex}`,
       data: { rowIndex, colIndex, category }
     })

     const categoryColors: Record<string, string> = {
       activation: 'border-yellow-400',
       dribbling: 'border-blue-400',
       passing: 'border-green-400',
       shooting: 'border-red-400'
     }

     return (
       <div
         ref={setNodeRef}
         className={`
           relative h-32 border-2 rounded-lg p-2 transition-colors
           ${isOver ? 'bg-blue-50' : 'bg-white'}
           ${categoryColors[category] || 'border-gray-300'}
         `}
       >
         {drill ? (
           <div className="h-full flex flex-col">
             <div className="flex-1 flex items-center justify-center text-sm font-medium text-center">
               {drill.name}
             </div>
             <button
               onClick={() => onRemove(rowIndex, colIndex)}
               className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
             >
               ×
             </button>
           </div>
         ) : (
           <div className="h-full flex items-center justify-center text-gray-400 text-sm">
             Drop drill here
           </div>
         )}
       </div>
     )
   }

   interface SessionGridProps {
     grid: (Drill | null)[][]
     onRemoveDrill: (rowIndex: number, colIndex: number) => void
   }

   export function SessionGrid({ grid, onRemoveDrill }: SessionGridProps) {
     const categories = ['activation', 'dribbling', 'passing', 'shooting']

     return (
       <div className="bg-gray-50 rounded-lg p-4">
         <h2 className="text-xl font-bold mb-4">Session Plan (4x3 Grid)</h2>
         <div className="grid grid-cols-3 gap-4">
           {grid.map((row, rowIndex) => (
             row.map((drill, colIndex) => (
               <GridCell
                 key={`${rowIndex}-${colIndex}`}
                 drill={drill}
                 rowIndex={rowIndex}
                 colIndex={colIndex}
                 category={categories[rowIndex]}
                 onRemove={onRemoveDrill}
               />
             ))
           ))}
         </div>
         <div className="mt-4 flex gap-4 text-sm">
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-yellow-400"></div>
             <span>Activation</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-blue-400"></div>
             <span>Dribbling</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-green-400"></div>
             <span>Passing</span>
           </div>
           <div className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-red-400"></div>
             <span>Shooting</span>
           </div>
         </div>
       </div>
     )
   }
```

3. Create DraggableDrill component (`src/components/DraggableDrill.tsx`):
```typescript
   import { useDraggable } from '@dnd-kit/core'
   import type { Drill } from '../types'

   interface DraggableDrillProps {
     drill: Drill
     onAddToSession: (drill: Drill) => void
   }

   export function DraggableDrill({ drill, onAddToSession }: DraggableDrillProps) {
     const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
       id: drill.id,
       data: { drill }
     })

     const style = transform ? {
       transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
       opacity: isDragging ? 0.5 : 1
     } : undefined

     return (
       <div
         ref={setNodeRef}
         style={style}
         className="bg-white rounded-lg shadow p-3 cursor-move hover:shadow-md transition-shadow"
       >
         <div className="flex justify-between items-start mb-2">
           <h4 className="font-medium text-sm" {...listeners} {...attributes}>
             {drill.name}
           </h4>
           <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
             {drill.category}
           </span>
         </div>
         <button
           onClick={() => onAddToSession(drill)}
           className="w-full py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
         >
           + Add to Session
         </button>
       </div>
     )
   }
```

4. Create SessionPlanner page (`src/pages/SessionPlanner.tsx`):
```typescript
   import { useState } from 'react'
   import { useQuery } from '@tanstack/react-query'
   import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core'
   import { drillService } from '../services/database'
   import { SessionGrid } from '../components/SessionGrid'
   import { DraggableDrill } from '../components/DraggableDrill'
   import type { Drill, Category } from '../types'

   export function SessionPlanner() {
     // Initialize 4x3 grid (4 rows for categories, 3 columns)
     const [grid, setGrid] = useState<(Drill | null)[][]>(
       Array(4).fill(null).map(() => Array(3).fill(null))
     )
     const [activeDrill, setActiveDrill] = useState<Drill | null>(null)
     const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all')

     const categories: Category[] = ['activation', 'dribbling', 'passing', 'shooting']

     // Fetch drills
     const { data: drills = [] } = useQuery({
       queryKey: ['drills'],
       queryFn: drillService.getAll
     })

     // Filter drills
     const filteredDrills = selectedCategory === 'all'
       ? drills
       : drills.filter(d => d.category === selectedCategory)

     const handleDragStart = (event: any) => {
       const drill = event.active.data.current?.drill
       setActiveDrill(drill)
     }

     const handleDragEnd = (event: DragEndEvent) => {
       setActiveDrill(null)

       const { active, over } = event
       if (!over) return

       const drill = active.data.current?.drill as Drill
       const { rowIndex, colIndex, category } = over.data.current || {}

       if (rowIndex === undefined || colIndex === undefined) return

       // Validate category match
       const expectedCategory = categories[rowIndex]
       if (drill.category !== expectedCategory) {
         alert(`This drill is for ${drill.category}, but you're trying to place it in ${expectedCategory}`)
         return
       }

       // Place drill in grid
       const newGrid = grid.map(row => [...row])
       newGrid[rowIndex][colIndex] = drill
       setGrid(newGrid)
     }

     const handleAddToSession = (drill: Drill) => {
       // Find first empty cell in correct category row
       const categoryIndex = categories.indexOf(drill.category)
       const row = grid[categoryIndex]
       const emptyColIndex = row.findIndex(cell => cell === null)

       if (emptyColIndex === -1) {
         alert('No empty slots in this category. Remove a drill first.')
         return
       }

       const newGrid = grid.map(row => [...row])
       newGrid[categoryIndex][emptyColIndex] = drill
       setGrid(newGrid)
     }

     const handleRemoveDrill = (rowIndex: number, colIndex: number) => {
       const newGrid = grid.map(row => [...row])
       newGrid[rowIndex][colIndex] = null
       setGrid(newGrid)
     }

     return (
       <div className="max-w-7xl mx-auto p-6">
         <h1 className="text-3xl font-bold mb-6">Plan Session</h1>

         <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
           {/* Session Grid */}
           <div className="mb-8">
             <SessionGrid grid={grid} onRemoveDrill={handleRemoveDrill} />
           </div>

           {/* Drill Library */}
           <div className="bg-white rounded-lg shadow p-6">
             <h2 className="text-xl font-bold mb-4">Drill Library</h2>
             
             {/* Category Filter */}
             <div className="flex gap-2 mb-4 flex-wrap">
               {['all', ...categories].map(cat => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat as Category | 'all')}
                   className={`px-4 py-2 rounded-lg capitalize ${
                     selectedCategory === cat
                       ? 'bg-blue-500 text-white'
                       : 'bg-gray-200 hover:bg-gray-300'
                   }`}
                 >
                   {cat}
                 </button>
               ))}
             </div>

             {/* Drills Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
               {filteredDrills.map(drill => (
                 <DraggableDrill
                   key={drill.id}
                   drill={drill}
                   onAddToSession={handleAddToSession}
                 />
               ))}
             </div>
           </div>

           <DragOverlay>
             {activeDrill ? (
               <div className="bg-white rounded-lg shadow-lg p-3 opacity-90">
                 <h4 className="font-medium">{activeDrill.name}</h4>
               </div>
             ) : null}
           </DragOverlay>
         </DndContext>
       </div>
     )
   }
```

5. Add route for `/sessions/new`

### Testing Phase 5:
- [ ] Session planner page loads with empty 4x3 grid
- [ ] Grid cells show correct category colors (yellow/blue/green/red)
- [ ] Can drag drills from library to grid
- [ ] Dragging shows visual feedback (overlay)
- [ ] Cannot place drill in wrong category (shows alert)
- [ ] "Add to Session" button places drill in first empty slot
- [ ] Can remove drills from grid (X button)
- [ ] Category filter works for drill library
- [ ] Multiple drills can be added to session
- [ ] Grid state updates correctly

**DO NOT PROCEED TO PHASE 6 UNTIL ALL TESTS PASS.**

---

## PHASE 6: Session Planning Interface - Part 2 (Save & Load)

**Goal:** Enable saving sessions and loading them for editing.

### Tasks:

1. Add save functionality to SessionPlanner (`src/pages/SessionPlanner.tsx`):
```typescript
   // Add these to the existing SessionPlanner component
   import { useNavigate, useParams } from 'react-router-dom'
   import { useMutation } from '@tanstack/react-query'
   import { sessionService } from '../services/database'
   import { useAuth } from '../contexts/AuthContext'

   export function SessionPlanner() {
     const { id } = useParams() // For editing existing sessions
     const navigate = useNavigate()
     const { user } = useAuth()
     const [sessionName, setSessionName] = useState('')
     const [isSaving, setIsSaving] = useState(false)

     // ... existing state and handlers ...

     // Load existing session if editing
     const { data: existingSession } = useQuery({
       queryKey: ['session', id],
       queryFn: () => id ? sessionService.getById(id) : null,
       enabled: !!id
     })

     // Populate grid when editing existing session
     useEffect(() => {
       if (existingSession) {
         setSessionName(existingSession.name)
         // Convert grid_data to grid with actual drill objects
         const loadedGrid = existingSession.grid_data.grid.map(row =>
           row.map(cell => {
             if (!cell) return null
             return drills.find(d => d.id === cell.drillId) || null
           })
         )
         setGrid(loadedGrid)
       }
     }, [existingSession, drills])

     // Save session mutation
     const saveMutation = useMutation({
       mutationFn: async () => {
         if (!user) throw new Error('Not authenticated')
         
         // Convert grid to serializable format
         const gridData = {
           grid: grid.map((row, rowIndex) =>
             row.map((drill, colIndex) => 
               drill ? { drillId: drill.id, position: colIndex } : null
             )
           )
         }

         if (id) {
           // Update existing session
           return sessionService.update(id, {
             name: sessionName,
             grid_data: gridData
           })
         } else {
           // Create new session
           return sessionService.create({
             name: sessionName,
             grid_data: gridData,
             user_id: user.id
           })
         }
       },
       onSuccess: () => {
         navigate('/sessions')
       }
     })

     const handleSave = () => {
       if (!sessionName.trim()) {
         alert('Please enter a session name')
         return
       }

       const hasAtLeastOneDrill = grid.some(row => row.some(cell => cell !== null))
       if (!hasAtLeastOneDrill) {
         alert('Please add at least one drill to the session')
         return
       }

       saveMutation.mutate()
     }

     // Add save section to JSX (after the drill library section)
     return (
       <div className="max-w-7xl mx-auto p-6">
         {/* ... existing grid and library sections ... */}

         {/* Save Session */}
         <div className="mt-8 bg-white rounded-lg shadow p-6">
           <h2 className="text-xl font-bold mb-4">Save Session</h2>
           <div className="flex gap-4">
             <input
               type="text"
               value={sessionName}
               onChange={(e) => setSessionName(e.target.value)}
               placeholder="Enter session name..."
               className="flex-1 px-4 py-2 border rounded-lg"
             />
             <button
               onClick={handleSave}
               disabled={saveMutation.isPending}
               className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300"
             >
               {saveMutation.isPending ? 'Saving...' : (id ? 'Update Session' : 'Save Session')}
             </button>
             <button
               onClick={() => navigate('/sessions')}
               className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
             >
               Cancel
             </button>
           </div>
         </div>
       </div>
     )
   }
```

2. Create SavedSessions page (`src/pages/SavedSessions.tsx`):
```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import { useNavigate } from 'react-router-dom'
   import { sessionService } from '../services/database'
   import type { Session } from '../types'

   export function SavedSessions() {
     const navigate = useNavigate()
     const queryClient = useQueryClient()

     const { data: sessions = [], isLoading } = useQuery({
       queryKey: ['sessions'],
       queryFn: sessionService.getAll
     })

     const deleteMutation = useMutation({
       mutationFn: sessionService.delete,
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['sessions'] })
       }
     })

     const duplicateMutation = useMutation({
       mutationFn: async (session: Session) => {
         return sessionService.create({
           name: `${session.name} (Copy)`,
           grid_data: session.grid_data,
           user_id: session.user_id
         })
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['sessions'] })
       }
     })

     if (isLoading) {
       return <div className="text-center py-12">Loading sessions...</div>
     }

     return (
       <div className="max-w-7xl mx-auto p-6">
         <div className="flex justify-between items-center mb-6">
           <h1 className="text-3xl font-bold">Saved Sessions</h1>
           <button
             onClick={() => navigate('/sessions/new')}
             className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
           >
             + New Session
           </button>
         </div>

         {sessions.length === 0 ? (
           <div className="text-center py-12 text-gray-500">
             No sessions yet. Create your first session!
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {sessions.map(session => {
               const drillCount = session.grid_data.grid.flat().filter(cell => cell !== null).length
               
               return (
                 <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
                   <h3 className="text-xl font-semibold mb-2">{session.name}</h3>
                   <p className="text-sm text-gray-600 mb-1">
                     {drillCount} drill{drillCount !== 1 ? 's' : ''}
                   </p>
                   <p className="text-xs text-gray-500 mb-4">
                     Created {new Date(session.created_at).toLocaleDateString()}
                   </p>

                   <div className="flex gap-2">
                     <button
                       onClick={() => navigate(`/sessions/${session.id}/edit`)}
                       className="flex-1 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                     >
                       Edit
                     </button>
                     <button
                       onClick={() => duplicateMutation.mutate(session)}
                       className="flex-1 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                     >
                       Duplicate
                     </button>
                     <button
                       onClick={() => {
                         if (confirm('Delete this session?')) {
                           deleteMutation.mutate(session.id)
                         }
                       }}
                       className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                     >
                       🗑️
                     </button>
                   </div>
                 </div>
               )
             })}
           </div>
         )}
       </div>
     )
   }
```

3. Add routes:
   - `/sessions` → SavedSessions
   - `/sessions/:id/edit` → SessionPlanner (for editing)

4. Create Dashboard/Home page (`src/pages/Dashboard.tsx`):
```typescript
   import { useNavigate } from 'react-router-dom'

   export function Dashboard() {
     const navigate = useNavigate()

     const quickActions = [
       { label: 'Add Drill', path: '/drills/new', color: 'bg-green-500' },
       { label: 'View Library', path: '/library', color: 'bg-blue-500' },
       { label: 'Plan Session', path: '/sessions/new', color: 'bg-purple-500' },
       { label: 'My Sessions', path: '/sessions', color: 'bg-orange-500' }
     ]

     return (
       <div className="max-w-4xl mx-auto p-6">
         <h1 className="text-4xl font-bold mb-2">Soccer Session Planner</h1>
         <p className="text-gray-600 mb-8">Manage drills and plan training sessions</p>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {quickActions.map(action => (
             <button
               key={action.path}
               onClick={() => navigate(action.path)}
               className={`${action.color} text-white p-8 rounded-lg text-xl font-semibold hover:opacity-90 transition-opacity`}
             >
               {action.label}
             </button>
           ))}
         </div>
       </div>
     )
   }
```

5. Update navigation to include all pages

### Testing Phase 6:
- [ ] Can enter session name
- [ ] Can save new session (redirects to /sessions)
- [ ] Saved session appears in SavedSessions list
- [ ] Can click "Edit" to load session for editing
- [ ] Grid populates correctly when editing
- [ ] Can update existing session
- [ ] Can duplicate session (creates copy with " (Copy)" suffix)
- [ ] Can delete session (with confirmation)
- [ ] Dashboard shows all 4 quick action buttons
- [ ] All navigation works correctly
- [ ] Empty state shows when no sessions exist

**DO NOT PROCEED TO PHASE 7 UNTIL ALL TESTS PASS.**

---

## PHASE 8: Shared Access & Session Viewing

**Goal:** Enable shared library/sessions for coaching staff collaboration and add read-only session view.

### Tasks:

1. **Update RLS Policies for Shared Access:**
   - All authenticated users can view/edit/delete all drills
   - All authenticated users can view/edit/delete all sessions
   - See SQL migration in `SHARED_ACCESS_MIGRATION.sql`

2. **Update Storage Policies for Shared Access:**
   - All authenticated users can view all videos/images
   - All authenticated users can upload/delete any files
   - See SQL migration in `SHARED_STORAGE_MIGRATION.sql`

3. **Add Creator Attribution:**
   - Update database queries to include user email for drills/sessions
   - Display creator info on drill cards and session cards
   - Show "Created by [email]" in UI

4. **Create Session View Page:**
   - New route: `/sessions/:id` (read-only view)
   - Existing route: `/sessions/:id/edit` (edit mode)
   - Display dynamic grid (only show filled cells, not 4x3 if not full)
   - Click drill in grid to see full details (modal or expand)
   - Include Edit, Duplicate, Delete buttons

5. **Update Navigation:**
   - Click session card → goes to `/sessions/:id` (view)
   - Edit button → goes to `/sessions/:id/edit` (edit)

### Testing Phase 8:
- [ ] All users can see all drills in library
- [ ] All users can edit/delete any drill
- [ ] Creator attribution shows on drills
- [ ] All users can see all sessions
- [ ] All users can edit/delete any session
- [ ] Creator attribution shows on sessions
- [ ] Can view videos/images from all users
- [ ] Session view page shows grid correctly
- [ ] Dynamic grid sizing works (not always 4x3)
- [ ] Can click drill in view to see details
- [ ] Edit/Duplicate/Delete buttons work in view mode
- [ ] Click session card goes to view, not edit

**DO NOT PROCEED TO PHASE 7 UNTIL ALL TESTS PASS.**

---

## PHASE 9: Feature Enhancements & iOS Compatibility

**Goal:** Add drill editing functionality, fix iOS/iPad media display issues, enable drill detail viewing from sessions, and improve mobile layout compatibility.

### Tasks:

1. **Implement Edit Drill Functionality:**
   - Create EditDrillForm component (or modify AddDrillForm to support edit mode)
   - Allow editing all drill fields: name, category, num_players, equipment, tags, video_url
   - Support replacing video/image file (upload new file)
   - Keep existing media if no new file is uploaded during edit
   - Allow editing all drills (no ownership restriction, following shared access model)
   - Create edit drill page/route: `/drills/:id/edit`
   - Update Library page to navigate to edit page when Edit button clicked
   - Use existing `drillService.update()` method

2. **Fix iPad/iOS Media Display Issues:**
   - **Problem:** Videos and images show blank grey screen in Library view and when viewing media
   - **Solution:**
     - Automatically load and display thumbnail/preview for images (don't wait for click)
     - Use native iOS video controls (ensure proper video element attributes)
     - Fix signed URL expiration issues (increase expiration time or refresh as needed)
     - Ensure proper MIME types and video codec compatibility (H.264 for iOS)
     - Add proper error handling for media loading failures
     - Pre-load media URLs when drill cards are rendered (use React Query or similar)
     - Use proper image/video element attributes for iOS compatibility:
       - Video: Add `playsInline` attribute for iOS
       - Image: Ensure proper `loading` attributes
     - Check and fix Supabase storage signed URL configuration

3. **Add Drill Detail Modal to Session Planner:**
   - When a drill is placed in the grid, make it clickable
   - Clicking a drill in SessionPlanner grid opens a modal showing all drill details:
     - Name
     - Category
     - Number of players
     - Media (video/image) with automatic thumbnail display
     - Equipment list
     - Tags
     - Creator email (if shared)
     - Video URL (if provided)
   - Use same modal pattern as SessionView (reusable DrillDetailModal component)
   - Modal should work on both desktop and mobile/iPad

4. **iPhone Layout Adjustments:**
   - Ensure responsive design works well on iPhone screens
   - Adjust grid layouts for smaller screens
   - Ensure touch targets are appropriately sized (minimum 44x44px)
   - Test and fix any layout issues specific to iPhone viewport
   - Ensure modals are properly sized and scrollable on iPhone
   - Test navigation and button layouts on iPhone

5. **iPad Layout Compatibility:**
   - Maintain existing layout for iPad (generally similar to desktop)
   - Focus on fixing media display issues (priority)
   - Ensure touch interactions work smoothly
   - Test drag-and-drop functionality on iPad

### Implementation Details:

**Edit Drill Form:**
- Create `EditDrill.tsx` page component
- Modify or create `EditDrillForm.tsx` component that:
  - Pre-fills form with existing drill data
  - Shows current media (video/image thumbnail)
  - Allows uploading new media file (optional)
  - Updates drill using `drillService.update()`
  - If new media uploaded: upload new file, update `video_file_path`, optionally delete old file
  - If no new media: keep existing `video_file_path`

**Media Display Fixes:**
- Update `DrillCard.tsx` to:
  - Automatically load and display thumbnail on mount (use `useEffect`)
  - Show thumbnail immediately (don't wait for click)
  - Handle both image and video files appropriately
  - Add proper iOS video attributes: `playsInline`, `controls`, etc.
- Update storage service to use longer expiration times for signed URLs
- Add error boundaries for media loading failures
- Consider using Supabase public URLs or CDN if signed URLs cause issues

**Drill Detail Modal:**
- Extract `DrillDetailModal` from `SessionView.tsx` into separate component (`src/components/DrillDetailModal.tsx`)
- Import and use in `SessionPlanner.tsx`
- Update `SessionGrid.tsx` to make drill cards clickable
- Pass click handler from SessionPlanner to SessionGrid to GridCell

**Mobile Layout:**
- Review and update Tailwind responsive classes
- Test on iPhone SE, iPhone 12/13/14, iPhone Pro Max sizes
- Ensure proper viewport meta tag
- Add mobile-specific CSS adjustments if needed

### Testing Phase 9:
- [ ] Can navigate to edit drill page from Library
- [ ] Edit form pre-fills with existing drill data
- [ ] Can update all drill fields
- [ ] Can upload new media file to replace existing
- [ ] Existing media is preserved if no new file uploaded
- [ ] Drill updates successfully save to database
- [ ] Media displays correctly on iPad (no blank grey screen)
- [ ] Media displays correctly on iPhone
- [ ] Images show thumbnail automatically in Library view
- [ ] Videos show thumbnail/play button automatically in Library view
- [ ] Videos play with native iOS controls on iPad/iPhone
- [ ] Can click drill in SessionPlanner grid to view details
- [ ] Drill detail modal shows all drill information
- [ ] Drill detail modal works on iPad
- [ ] Drill detail modal works on iPhone
- [ ] Layout is usable and responsive on iPhone
- [ ] Layout works well on iPad
- [ ] All touch interactions work on mobile devices

**DO NOT PROCEED UNTIL ALL TESTS PASS.**

---

## PHASE 7: Polish & Deployment

**Goal:** Add final touches, handle edge cases, and deploy the app.

### Tasks:

1. Add loading states and error handling throughout:
   - Loading spinners for data fetching
   - Error messages for failed operations
   - Proper form validation feedback

2. Add responsive design improvements:
   - Test on mobile/tablet
   - Adjust grid layout for smaller screens
   - Ensure touch-friendly drag-and-drop

3. Add visual improvements:
   - Better empty states with images/illustrations
   - Smooth transitions and animations
   - Consistent spacing and typography
   - Video thumbnail generation (optional)

4. Create a simple README.md with:
   - Project description
   - Setup instructions
   - Environment variables needed
   - How to run locally

5. Set up deployment on Vercel:
```bash
   npm install -g vercel
   vercel login
   vercel
```

6. Configure environment variables in Vercel dashboard:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY

7. Test deployed application thoroughly:
   - Sign up/login works
   - All CRUD operations work
   - Video upload works
   - Drag-and-drop works
   - Mobile responsiveness

8. Optional enhancements (if time permits):
   - Add keyboard shortcuts (Esc to close modals, etc.)
   - Add drill preview on hover in session planner
   - Add session duration estimator
   - Add export session to PDF
   - Add drill reordering within grid (swap positions)

### Testing Phase 7:
- [ ] App deployed successfully to Vercel
- [ ] All features work in production
- [ ] Mobile/tablet experience is good
- [ ] Loading states show appropriately
- [ ] Errors are handled gracefully
- [ ] No console errors in production
- [ ] Videos load and play correctly
- [ ] Authentication persists across sessions

---

## Final Checklist

Before considering the project complete, verify:

- [ ] Users can sign up and log in
- [ ] Users can add drills with video upload
- [ ] Users can view all drills in library
- [ ] Users can filter drills by category
- [ ] Users can search drills by name/tags
- [ ] Users can create new sessions with drag-and-drop
- [ ] Users can save sessions with names
- [ ] Users can view all saved sessions
- [ ] Users can edit existing sessions
- [ ] Users can duplicate sessions
- [ ] Users can delete drills and sessions
- [ ] Videos are stored securely and load properly
- [ ] RLS policies prevent users from seeing others' data
- [ ] App is responsive on mobile/tablet
- [ ] App is deployed and accessible online

---

## Development Guidelines

### Code Quality:
- Use TypeScript strictly (no `any` types unless absolutely necessary)
- Follow React best practices (proper hooks usage, avoid unnecessary re-renders)
- Keep components small and focused (single responsibility)
- Use meaningful variable and function names
- Add comments for complex logic

### Error Handling:
- Always wrap async operations in try-catch
- Show user-friendly error messages
- Log errors to console for debugging
- Never expose sensitive errors to users

### Performance:
- Use React Query for efficient data caching
- Lazy load components where appropriate
- Optimize images and videos
- Minimize bundle size

### Security:
- Never commit .env files
- Always use Supabase RLS policies
- Validate user input on both client and server
- Use HTTPS in production

### Git Workflow:
- Commit after completing each phase
- Write clear commit messages
- Don't commit broken code
- Use meaningful branch names if branching

---

## Troubleshooting Common Issues

### Video upload fails:
- Check Supabase storage bucket permissions
- Verify file size limits
- Check network connection
- Ensure correct MIME types

### Drag-and-drop not working:
- Verify @dnd-kit dependencies installed
- Check DndContext wrapper exists
- Ensure droppable IDs are unique
- Test with console logs to debug

### Database queries fail:
- Check RLS policies in Supabase
- Verify user is authenticated
- Check table/column names match schema
- Look for Supabase error messages in console

### Deployment issues:
- Verify environment variables set in Vercel
- Check build logs for errors
- Ensure all dependencies in package.json
- Test with `npm run build` locally first

---

## Post-MVP Enhancement Ideas

After the core app is working, consider these additions:

1. **Automatic video download** from URLs (implement serverless function)
2. **Drill notes and variations** (add description field)
3. **Session templates** (save commonly used session structures)
4. **Player tracking** (assign sessions to specific players)
5. **Progress tracking** (mark drills as completed, track improvements)
6. **Session sharing** (export/share sessions with other coaches)
7. **Mobile app** (React Native version)
8. **Offline mode** (PWA with service workers)
9. **Advanced filtering** (by difficulty, duration, equipment)
10. **AI-powered session suggestions** (based on player level/goals)

---

## Success Criteria

The beta is successful when:
✅ A coach can add 10+ drills with videos
✅ A coach can create and save 3+ complete sessions
✅ A coach can load and edit saved sessions
✅ The app works smoothly on desktop and mobile
✅ No critical bugs exist
✅ The app is deployed and accessible online

Good luck building! Remember to test thoroughly after each phase before moving forward.
<!-- Add your project plan details here. -->

