# CTs Studio Manager - Project Management Expansion Plan

## Executive Summary

Expand CTs Studio Manager from pure asset tracking to a comprehensive studio management platform that includes client project management and collaborative audio review tools.

**Current System:** Asset inventory + Session tracking + Check-in/out workflows

**Expanded System:** Asset inventory + Client/Project/Track hierarchy + Interactive stem player + Collaborative review tools

---

## New Information Architecture

### Hierarchical Structure

```
Studio
├── Clients (existing concept, expanded)
│   ├── Contact Information
│   ├── Billing Details
│   └── Projects
│       ├── Project Metadata
│       ├── Assets Used (linked to existing asset system)
│       ├── Recording Sessions (existing, now linked to projects)
│       └── Tracks
│           ├── Track Metadata
│           ├── Final Mix
│           ├── Stems (individual audio layers)
│           │   ├── Vocals
│           │   ├── Drums
│           │   ├── Bass
│           │   ├── Guitar
│           │   ├── Keys
│           │   └── [Custom stems]
│           ├── Revisions/Versions
│           └── Comments/Feedback
```

### How It Integrates with Existing System

**Recording Sessions** (existing) now have dual purpose:
1. **Asset Check-out Session** - Equipment tracking (current functionality)
2. **Project Session** - Linked to a Client Project, tracking which recording session produced which tracks

**Example Flow:**
1. Client "Red Hot Records" books Studio A
2. Create Recording Session → Links to Client's Project "Album: Fire"
3. Check out equipment (Neumann U87, SSL Compressor, etc.) via existing system
4. During/after session, upload tracks with stems
5. Check in equipment
6. Client can now access Project "Album: Fire" to review stems online

---

## New Data Models

### Client (Enhanced)
```typescript
{
  id: string
  name: string
  contact_email: string
  contact_phone?: string
  billing_address?: string
  company?: string
  notes?: string
  created_at: string
  total_projects: number
  active_projects: number
  total_revenue?: number
  avatar_url?: string
}
```

### Project
```typescript
{
  id: string
  client_id: string
  project_name: string
  project_type: 'album' | 'ep' | 'single' | 'demo' | 'podcast' | 'commercial' | 'other'
  status: 'planning' | 'in_progress' | 'mixing' | 'mastering' | 'completed' | 'archived'
  start_date: string
  deadline?: string
  completion_date?: string

  // Studio details
  engineer_id?: string
  producer?: string
  studio_location?: string

  // Financial
  budget?: number
  total_cost?: number
  payment_status?: 'pending' | 'partial' | 'paid'

  // Content
  description?: string
  genre?: string
  target_release_date?: string

  // Metadata
  artwork_url?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
}
```

### Track
```typescript
{
  id: string
  project_id: string
  track_number?: number
  track_name: string
  duration?: number  // in seconds
  bpm?: number
  key?: string  // Musical key (e.g., "C Major", "A Minor")
  time_signature?: string  // e.g., "4/4", "3/4"

  // Status
  status: 'tracking' | 'editing' | 'mixing' | 'mastered' | 'approved' | 'revision_needed'
  version: number  // Track version/revision number
  is_latest_version: boolean

  // Files
  final_mix_url?: string  // URL to the final stereo mix
  has_stems: boolean
  stem_count: number

  // Recording details
  recorded_date?: string
  recording_session_id?: string  // Link to existing session system

  // Collaboration
  allow_client_access: boolean
  allow_comments: boolean

  // Metadata
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
}
```

### Stem
```typescript
{
  id: string
  track_id: string
  stem_name: string  // e.g., "Lead Vocal", "Kick Drum", "Bass DI"
  stem_type: 'vocal' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other'
  color?: string  // Visual identifier in player (like DAW track colors)

  // Audio file
  file_url: string
  file_size: number  // bytes
  file_format: string  // 'wav', 'mp3', 'flac', etc.
  sample_rate: number  // e.g., 44100, 48000
  bit_depth?: number  // e.g., 16, 24

  // Playback
  default_volume: number  // 0-100, default 70
  default_pan: number     // -100 to 100, default 0 (center)
  is_muted_by_default: boolean

  // Organization
  stem_order: number  // Display order in player
  group?: string  // e.g., "Drums", "Vocals" for grouping

  // Processing info
  is_processed: boolean  // Has completed upload/conversion
  waveform_data?: string  // JSON array of waveform peaks for visualization

  created_at: string
  uploaded_by: string
}
```

### TrackComment
```typescript
{
  id: string
  track_id: string
  user_id: string
  parent_comment_id?: string  // For threaded replies

  // Comment content
  comment_text: string
  timestamp?: number  // Timestamp in track (seconds) for time-based comments

  // Metadata
  created_at: string
  updated_at: string
  is_resolved: boolean
  resolved_by?: string
  resolved_at?: string
}
```

### TrackVersion
```typescript
{
  id: string
  track_id: string
  version_number: number
  version_name?: string  // e.g., "First Mix", "Revision after feedback"

  // Files (snapshot of the track at this version)
  final_mix_url?: string
  stems: Stem[]

  // Metadata
  notes?: string
  created_at: string
  created_by: string
}
```

---

## Updated Recording Session Model

Enhance existing `sessions` table to link with projects:

```typescript
{
  // ... existing fields ...
  project_id?: string         // NEW: Link to project
  tracks_recorded?: string[]  // NEW: Array of track IDs recorded in this session
  session_type: 'tracking' | 'mixing' | 'mastering' | 'overdubs' | 'rehearsal'  // ENHANCED
}
```

---

## Stem Player Features (Splitter.fm Inspired)

### Core Player Features

#### 1. Multi-Track Waveform Display
- Visual waveform for each stem
- Synchronized playhead across all stems
- Zoom in/out on timeline
- Click to seek/jump to position
- Time ruler with measures/beats or timestamps

#### 2. Individual Stem Controls (Per Track Row)
```
[Color Bar] [Stem Name     ] [S] [M] [Vol ----O----] [Pan L--O--R]
```
- **S** = Solo button (play only this stem)
- **M** = Mute button (silence this stem)
- **Vol** = Volume slider (0-100%)
- **Pan** = Pan control (L-R)
- Visual level meter showing playback levels

#### 3. Transport Controls
```
[<< Prev] [Play/Pause ▶] [Next >>] [Loop 🔁] [00:00 / 03:45]
```
- Play/Pause (spacebar)
- Skip back/forward by measures
- Loop section (set A/B points)
- Current time / Total duration
- Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x)

#### 4. Master Controls
- Master volume
- Master mute (mute all)
- Solo all / Reset all
- Download stems (zip file)
- Share link

#### 5. Advanced Features
- **Stem Groups:** Collapsible groups (e.g., all drum stems in "Drums" folder)
- **Presets:** Save custom mute/solo/volume configurations
  - "Vocals Only"
  - "Drums & Bass"
  - "Instrumental"
- **Waveform Colors:** Match stem colors
- **Time-based Comments:** Click on timeline to add timestamped feedback
- **A/B Comparison:** Switch between track versions quickly

### UI Layout (Desktop)

```
┌─────────────────────────────────────────────────────────┐
│ Header: Track Name - Project Name - Client Name     ⚙️  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Transport Controls]  [00:32 / 03:45]  [Master Vol]    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │       WAVEFORM TIMELINE (synchronized)           │   │
│ │ ▁▃▅▇▇▅▃▁   ▂▄▆█▆▄▂   ▁▃▅▇▇▅▃▁   ▂▄▆█▆▄▂          │   │
│ │             [Playhead]                            │   │
│ │ 0:00    0:30    1:00    1:30    2:00    2:30     │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Stems:                                                  │
│                                                         │
│ 🟦 Lead Vocal      [S] [M] [Vol ──────O─] [Pan ──O──]  │
│ 🟩 Kick Drum       [S] [M] [Vol ────O───] [Pan ──O──]  │
│ 🟩 Snare           [S] [M] [Vol ────O───] [Pan ──O──]  │
│ 🟨 Bass DI         [S] [M] [Vol ──────O─] [Pan ──O──]  │
│ 🟧 Guitar L        [S] [M] [Vol ───O────] [Pan O────]  │
│ 🟧 Guitar R        [S] [M] [Vol ───O────] [Pan ────O]  │
│ 🟪 Keys            [S] [M] [Vol ─────O──] [Pan ──O──]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### UI Layout (Mobile)

Mobile-optimized view:
- Vertical list of stems (stacked)
- Swipe left/right to see more controls
- Simplified waveform (single master waveform)
- Tap stem to expand controls
- Bottom-fixed transport controls

---

## Page Structure & Routes

### New Pages

#### `/clients`
- List all clients
- Search/filter
- Add new client
- Click to view client detail

#### `/clients/[clientId]`
- Client profile
- Contact information
- List of projects
- Total revenue, sessions
- "Create New Project" button

#### `/clients/[clientId]/projects/[projectId]`
- Project overview
- Project details (status, dates, budget)
- List of tracks in project
- Linked recording sessions
- Assets used in this project
- "Add Track" button
- Comments/notes

#### `/clients/[clientId]/projects/[projectId]/tracks/[trackId]`
- **Primary feature: Stem Player Interface**
- Track metadata (name, status, version)
- Stem player (main feature)
- Track-level comments
- Version history
- Download options
- Share link

#### `/clients/[clientId]/projects/[projectId]/tracks/[trackId]/upload`
- Upload final mix
- Upload stems (multiple file upload)
- Auto-detect stem names from filenames
- Set stem colors, groups
- Process audio files

#### `/clients/[clientId]/projects/[projectId]/tracks/[trackId]/versions`
- View all versions of a track
- Compare versions side-by-side
- Restore previous version

### Modified Pages

#### `/sessions` (Enhanced)
- Now shows option to link session to a project
- Can create tracks directly from session
- Shows which tracks were created in each session

#### `/dashboard` (Enhanced)
- Add stats for:
  - Active projects
  - Tracks in mixing/mastering
  - Client activity
- Quick actions:
  - "Upload Track"
  - "Review Stems"

---

## Audio File Management

### Storage Strategy

**Use Supabase Storage with organized buckets:**

```
Storage Buckets:
├── project-audio/
│   ├── [projectId]/
│   │   ├── [trackId]/
│   │   │   ├── final-mix.wav
│   │   │   ├── stems/
│   │   │   │   ├── vocal-lead.wav
│   │   │   │   ├── drums-kick.wav
│   │   │   │   ├── drums-snare.wav
│   │   │   │   └── ...
│   │   │   └── versions/
│   │   │       ├── v1/
│   │   │       └── v2/
```

### File Processing Pipeline

**Upload Flow:**
1. User uploads WAV/AIFF stems (high quality)
2. Backend processes files:
   - **Generate MP3/AAC for web playback** (lower bandwidth)
   - **Extract waveform data** (peaks for visualization)
   - **Extract metadata** (duration, sample rate, bit depth)
3. Store both original (for download) and web-optimized (for player)
4. Update database with file URLs and metadata

**Technologies:**
- **FFmpeg** (server-side) for audio conversion
- **Web Audio API** (client-side) for playback
- **WaveSurfer.js** or **Peaks.js** for waveform visualization

### File Format Support

**Input Formats (Upload):**
- WAV (preferred)
- AIFF
- FLAC
- MP3 (discouraged for stems)

**Streaming Format (Playback):**
- MP3 (128-320kbps) for compatibility
- AAC/M4A for better quality at lower bitrate

### Bandwidth Considerations

**Optimization strategies:**
- Lazy load stems (load only visible stems initially)
- Progressive loading (load low-res waveform first, full audio on play)
- Caching (browser cache for repeated plays)
- Quality selector (let users choose quality: "Low", "Medium", "High")

---

## User Workflows

### Workflow 1: Creating a New Project

1. Navigate to Clients page
2. Select client or create new client
3. Click "New Project"
4. Fill in project details:
   - Project name
   - Type (Album, EP, Single, etc.)
   - Deadline, budget
   - Assign engineer
5. Submit
6. Project created, ready to add tracks

### Workflow 2: Recording Session → Track Upload

1. **Book Recording Session** (existing flow)
   - Create session linked to project
   - Check out equipment

2. **During/After Session:**
   - Navigate to project
   - Click "Add Track"
   - Upload final mix + stems
   - System processes files

3. **Track Processing:**
   - Shows progress bar
   - Generates waveforms
   - Creates web-optimized versions
   - Track becomes available in player

4. **Review:**
   - Engineer reviews track
   - Marks status as "mixing", "mastered", etc.

### Workflow 3: Client Reviewing Stems

1. **Studio sends share link to client**
   - Public link (no login required) OR
   - Client account with limited access

2. **Client opens link:**
   - Sees stem player interface
   - Can solo/mute stems
   - Listen to mix breakdown

3. **Client leaves feedback:**
   - Adds timestamped comments ("At 1:23, vocal too loud")
   - General comments
   - Approves or requests revision

4. **Engineer sees feedback:**
   - Notification of new comments
   - Reviews feedback
   - Makes revisions
   - Uploads new version

### Workflow 4: Track Versioning

1. Engineer uploads Track v1
2. Client provides feedback
3. Engineer creates v2:
   - Upload new stems
   - System auto-increments version
   - Previous version archived but accessible
4. Client can compare v1 vs v2 side-by-side
5. Approve v2, mark as final

---

## Technical Implementation Plan

### Phase 1: Data Model & Basic Project Management (Weeks 1-2)

**Tasks:**
- Create new database tables (clients, projects, tracks, stems)
- Build CRUD pages for clients
- Build CRUD pages for projects
- Link sessions to projects
- Simple file upload for tracks (no player yet)

**Deliverables:**
- Can create clients and projects
- Can link recording sessions to projects
- Can upload track files (basic)

### Phase 2: Audio Processing & Storage (Weeks 3-4)

**Tasks:**
- Set up Supabase Storage buckets
- Implement file upload with progress
- Server-side audio processing (FFmpeg)
- Waveform generation
- Database storage of file metadata

**Deliverables:**
- Upload stems and final mixes
- Files are processed and stored
- Metadata extracted

### Phase 3: Basic Stem Player (Weeks 5-7)

**Tasks:**
- Integrate Web Audio API
- Build multi-track player UI
- Implement play/pause/seek
- Add individual stem controls (solo/mute/volume)
- Waveform visualization (WaveSurfer.js or Peaks.js)

**Deliverables:**
- Functional stem player
- Can play multiple stems in sync
- Basic controls work

### Phase 4: Advanced Player Features (Weeks 8-9)

**Tasks:**
- Pan controls
- Master controls
- Playback speed
- Loop regions
- Stem grouping
- Presets (save mute/solo configs)
- Mobile-optimized player

**Deliverables:**
- Full-featured player matching splitter.fm
- Mobile responsive

### Phase 5: Collaboration Features (Weeks 10-11)

**Tasks:**
- Track comments system
- Timestamped comments
- Client access/sharing
- Email notifications for comments
- Track versioning
- Version comparison

**Deliverables:**
- Clients can review and comment
- Version history works
- Notifications sent

### Phase 6: Integration & Polish (Weeks 12-13)

**Tasks:**
- Dashboard updates with project stats
- Enhanced session linking
- Download stems as ZIP
- Share links (public/private)
- Performance optimization
- Testing and bug fixes

**Deliverables:**
- Fully integrated system
- Polished UI
- Performance optimized

---

## Technical Stack Additions

### New Dependencies

**Audio Processing (Backend):**
- `fluent-ffmpeg` - FFmpeg wrapper for Node.js
- `music-metadata` - Extract audio metadata
- `audiowaveform` - Generate waveform data

**Audio Playback (Frontend):**
- `wavesurfer.js` or `peaks.js` - Waveform visualization
- `tone.js` (optional) - Advanced audio manipulation
- Native Web Audio API - Multi-track playback

**File Upload:**
- `react-dropzone` - Drag & drop file uploads
- `uppy` (alternative) - Advanced upload UI with progress

**UI Enhancements:**
- `react-range` - Custom sliders for volume/pan
- `react-color` - Color picker for stem colors
- `recharts` or `victory` - Charts for analytics

---

## Database Schema Updates

### New Tables

```sql
-- Clients (enhanced from existing concept)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  billing_address TEXT,
  company VARCHAR(255),
  notes TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  project_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'planning',
  start_date DATE,
  deadline DATE,
  completion_date DATE,
  engineer_id UUID REFERENCES users(id),
  producer VARCHAR(255),
  studio_location VARCHAR(255),
  budget DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  payment_status VARCHAR(50),
  description TEXT,
  genre VARCHAR(100),
  target_release_date DATE,
  artwork_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Tracks
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  track_number INTEGER,
  track_name VARCHAR(255) NOT NULL,
  duration INTEGER,
  bpm INTEGER,
  key VARCHAR(20),
  time_signature VARCHAR(10),
  status VARCHAR(50) DEFAULT 'tracking',
  version INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT TRUE,
  final_mix_url TEXT,
  has_stems BOOLEAN DEFAULT FALSE,
  stem_count INTEGER DEFAULT 0,
  recorded_date DATE,
  recording_session_id UUID REFERENCES sessions(id),
  allow_client_access BOOLEAN DEFAULT TRUE,
  allow_comments BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Stems
CREATE TABLE stems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  stem_name VARCHAR(255) NOT NULL,
  stem_type VARCHAR(50),
  color VARCHAR(7),
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_format VARCHAR(10),
  sample_rate INTEGER,
  bit_depth INTEGER,
  default_volume INTEGER DEFAULT 70,
  default_pan INTEGER DEFAULT 0,
  is_muted_by_default BOOLEAN DEFAULT FALSE,
  stem_order INTEGER,
  stem_group VARCHAR(100),
  is_processed BOOLEAN DEFAULT FALSE,
  waveform_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id)
);

-- Track Comments
CREATE TABLE track_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  parent_comment_id UUID REFERENCES track_comments(id),
  comment_text TEXT NOT NULL,
  timestamp_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP
);

-- Track Versions
CREATE TABLE track_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name VARCHAR(255),
  final_mix_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Stem Versions (junction table)
CREATE TABLE stem_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_version_id UUID REFERENCES track_versions(id) ON DELETE CASCADE,
  stem_id UUID REFERENCES stems(id) ON DELETE CASCADE
);
```

### Modified Tables

```sql
-- Enhance existing sessions table
ALTER TABLE sessions
ADD COLUMN project_id UUID REFERENCES projects(id),
ADD COLUMN session_type VARCHAR(50) DEFAULT 'tracking';

-- Add tracks_recorded JSONB column for array of track IDs
ALTER TABLE sessions
ADD COLUMN tracks_recorded JSONB DEFAULT '[]'::jsonb;
```

---

## Security & Access Control

### Client Portal Access

**Two models:**

**Model A: Client Accounts**
- Clients get login credentials
- Role: 'client'
- Can only view their own projects
- Can comment and approve tracks
- Cannot edit or delete

**Model B: Share Links (Simpler)**
- No account needed
- Generate unique, secure share link per track
- Optional password protection
- Track analytics (who viewed, when)
- Expire links after X days

**Recommended:** Start with Model B (share links), add Model A later if needed

### RLS Policies

```sql
-- Clients table: Only admins can manage clients
CREATE POLICY "Admins can do anything with clients"
  ON clients FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Projects: Admins + assigned engineer can view/edit
CREATE POLICY "View projects"
  ON projects FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    engineer_id = auth.uid()
  );

-- Tracks: If allow_client_access = true, anyone with link can view
-- (Implement via share_token in application layer)
```

---

## Analytics & Reporting

### Dashboard Analytics (New Cards)

**Project Stats:**
- Active projects
- Projects completed this month
- Revenue this month vs. last month

**Track Stats:**
- Tracks in mixing
- Tracks awaiting client approval
- Tracks completed this week

**Client Activity:**
- Most active clients
- New clients this month
- Clients with pending invoices

### Project-Level Analytics

- Total tracks recorded
- Total studio time (from sessions)
- Equipment used (from asset check-outs)
- Revenue generated
- Timeline (Gantt chart of sessions and milestones)

---

## Mobile Considerations

### Stem Player Mobile Experience

**Challenges:**
- Multiple large audio files
- Complex UI with many controls
- Mobile bandwidth

**Solutions:**
- Progressive loading (load stems as needed)
- Simplified mobile UI:
  - Vertical stem list
  - Swipe to reveal controls
  - Simplified waveform
- Quality selector (Low/Medium/High)
- Download for offline (optional)

---

## Future Enhancements (Phase 2+)

### Advanced Features

1. **AI-Powered Stem Separation**
   - Upload a final mix, AI splits it into stems
   - Integration with Spleeter, Demucs, or similar

2. **Collaborative Mixing**
   - Multiple users can adjust stems in real-time
   - See others' cursors (like Figma for audio)

3. **Automatic Mixing Notes**
   - AI listens to stems and suggests mix notes
   - "Lead vocal might be too quiet"
   - "Drums and bass not well balanced"

4. **Visual Spectrum Analyzer**
   - See frequency spectrum per stem
   - Identify frequency conflicts

5. **Integration with DAWs**
   - Export stem player settings to Pro Tools session
   - Import session files directly

6. **Mobile App**
   - Native iOS/Android app
   - Offline playback
   - Push notifications for comments

7. **Automated Backups**
   - Automatic project backups to cloud storage
   - Version control like Git for audio

---

## Cost Estimates

### Storage Costs (Supabase)

**Example Project:**
- 10 tracks per project
- 10 stems per track
- 5 MB per stem (web-optimized MP3)
- Total: 10 × 10 × 5MB = 500MB per project

**Supabase Storage Pricing:**
- Free tier: 1GB
- Pro: $0.021 per GB/month

**For 100 active projects:**
- 100 × 500MB = 50GB
- Cost: ~$1.05/month (very affordable)

### Bandwidth Costs

**Example:**
- Client reviews 1 track (10 stems × 5MB = 50MB)
- 100 reviews/month = 5GB bandwidth
- Supabase: $0.09 per GB
- Cost: ~$0.45/month

**Total estimated cost for 100 projects with active review: ~$1.50/month**

---

## UI/UX Design Inspiration

### Reference Sites/Apps

1. **Splitter.fm** - Stem player interface
2. **Soundtrap** - Web-based DAW UI
3. **Soundcloud** - Waveform player, comments
4. **Ableton Live** - Track layout, colors
5. **Splice** - Sample player, waveforms
6. **Pro Tools Cloud Collaboration** - Review and comment features

### Design Principles

- **Simplicity:** Don't overwhelm with too many controls
- **Clarity:** Clear visual hierarchy (stems, groups, transport)
- **Responsiveness:** Works seamlessly on all devices
- **Performance:** Fast loading, smooth playback
- **Accessibility:** Keyboard shortcuts, screen reader support

---

## Next Steps

### Immediate Actions

1. **Validate the Plan**
   - Review this plan with stakeholders
   - Confirm feature priorities
   - Adjust timeline if needed

2. **Database Design**
   - Create new tables in Supabase
   - Set up RLS policies
   - Test relationships

3. **Prototype Stem Player**
   - Build simple proof-of-concept with Web Audio API
   - Test with 2-3 stems
   - Validate waveform visualization

4. **User Research**
   - Interview studio engineers and clients
   - What features are most valuable?
   - What's the typical workflow?

### Decision Points

**Questions to answer before proceeding:**

1. **File Formats:** Stick with MP3 or support higher quality AAC/Opus?
2. **Processing:** Client-side or server-side audio processing?
3. **Client Access:** Account-based or share links?
4. **Versioning:** Automatic versioning or manual?
5. **Mobile:** Mobile web app or native app eventually?

---

**End of Expansion Plan**

*Created: 2026-02-13*
*Version: 1.0*

## Sources:
- [Splitter.fm FAQ](https://splitter.fm/faq)
- [Splitter.fm Discussion - BassBuzz Forum](https://forum.bassbuzz.com/t/splitter-fm-stems-of-songs/31888)
