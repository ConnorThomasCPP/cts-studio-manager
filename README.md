# CTs Studio Manager

A comprehensive studio management platform for recording studios, featuring barcode-based asset management, session tracking, professional stem player with collaborative comments, and AI-powered equipment cost estimation.

## 🎯 Overview

CTs Studio Manager helps recording studios track equipment through barcode scanning during recording sessions. Each session acts as a temporary hire contract with check-out/check-in workflows, ensuring gear accountability and preventing losses.

**Live Demo:** [Your Vercel URL]
**Repository:** https://github.com/ConnorThomasCPP/cts-studio-manager

## ✨ Features

### 🎵 Professional Stem Player
- ✅ DAW-style multi-track audio playback (inspired by splitter.fm)
- ✅ Color-coded waveforms for each stem (vocals, drums, bass, etc.)
- ✅ Individual stem controls: mute, solo, volume adjustment
- ✅ Playback speed control (0.5x to 2x)
- ✅ **Time-stamped collaborative comments** with emoji reactions (❤️, 🔥, 👍, ⚠️)
- ✅ Comment mode for adding feedback at specific timestamps
- ✅ Toggleable comment sidebar showing all comments across stems
- ✅ Individual stem downloads
- ✅ Synchronized multi-track playback with drift correction
- ✅ Client/Project/Track hierarchy for organization

### 📦 Asset Management
- ✅ Sortable table view with columns: Asset Tag, Brand, Model, Price, Location, Status
- ✅ Click column headers to sort (ascending → descending → default)
- ✅ Complete CRUD operations for studio equipment
- ✅ Code 128 barcode generation for each asset
- ✅ Photo uploads with Supabase Storage
- ✅ Category and location organization
- ✅ GBP (£) currency support for pricing
- ✅ Replacement cost tracking and display
- ✅ AI-powered replacement cost estimation (using Anthropic Claude)

### 📅 Session Tracking
- ✅ Recording session management (planned → active → completed)
- ✅ Client and engineer assignment
- ✅ Asset check-out/check-in workflows
- ✅ Session validation (prevents closing with unreturned assets)
- ✅ Real-time session updates

### 📱 Mobile Barcode Scanning
- ✅ Camera-based barcode scanning (html5-qrcode)
- ✅ Manual asset code entry fallback
- ✅ Quick check-out to active sessions
- ✅ Asset condition tracking
- ✅ Touch-optimized interface

### 👥 User Management
- ✅ Role-based access control (Admin, Engineer, Viewer)
- ✅ Profile management with Gravatar support
- ✅ Custom photo uploads
- ✅ Authentication with Supabase Auth

### ⚙️ Admin Features
- ✅ Location and category management
- ✅ System settings configuration
- ✅ API key management (admin-only)
- ✅ Transaction history and audit logging

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS with OKLCH colors, shadcn/ui components
- **State:** React hooks, Zustand (player state, scan state)
- **Audio:** Howler.js (multi-track playback), Web Audio API (waveform generation)
- **Barcode:** html5-qrcode (scanning), bwip-js (generation)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for photos)
- **AI:** Anthropic Claude API (replacement cost search)
- **Real-time:** Supabase Realtime subscriptions

### Deployment
- **Hosting:** Vercel
- **Database:** Supabase Cloud
- **CDN:** Vercel Edge Network

## 📁 Project Structure

```
cts-studio-manager/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── admin/           # Admin settings
│   │   ├── assets/          # Asset management with sortable table
│   │   ├── clients/         # Client management
│   │   ├── projects/        # Project management (per client)
│   │   ├── tracks/          # Track management with stem player
│   │   │   └── [id]/
│   │   │       └── components/  # Stem player components
│   │   │           ├── StemPlayer.tsx
│   │   │           ├── TransportControls.tsx
│   │   │           ├── WaveformCanvas.tsx
│   │   │           ├── CommentModal.tsx
│   │   │           ├── CommentMarker.tsx
│   │   │           └── CommentSidebar.tsx
│   │   ├── profile/         # User profile
│   │   ├── scan/            # Mobile barcode scanner
│   │   ├── sessions/        # Session management
│   │   └── transactions/    # Transaction history
│   └── api/                 # API routes
│       └── assets/
│           └── find-replacement-cost/  # AI cost estimation
├── components/
│   ├── assets/              # Asset components
│   │   └── assets-table.tsx # Sortable table with column sorting
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── services/            # Service layer
│   │   ├── asset-service.ts
│   │   ├── client-service.ts
│   │   ├── project-service.ts
│   │   ├── track-service.ts
│   │   └── stem-service.ts
│   ├── stores/              # Zustand state management
│   │   └── player-store.ts  # Audio player state
│   └── supabase/
│       ├── client.ts        # Browser-side Supabase client
│       ├── server.ts        # Server-side Supabase client
│       └── database.types.ts # Auto-generated TypeScript types
├── supabase/
│   └── migrations/          # Database schema migrations
├── middleware.ts            # Auth middleware (proxy.ts)
└── types/
    └── enhanced.ts          # Enhanced TypeScript types with stricter unions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- An Anthropic API key (optional, for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/ConnorThomasCPP/cts-studio-manager.git
cd cts-studio-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migrations in the `supabase/migrations/` directory:
   - Go to your Supabase project → SQL Editor
   - Run each migration file in order (001, 002, 003, etc.)
3. Set up Storage:
   - Create a bucket called `asset-photos`
   - Make it public or configure RLS policies

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Anthropic API (optional - for AI features)
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 5. Generate TypeScript Types

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase (you'll need a personal access token)
supabase login

# Generate types using the npm script
npm run gen:types
```

**Important:** Set the `SUPABASE_ACCESS_TOKEN` environment variable to avoid login prompts:
- Get your access token from: [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens)
- Add to your shell profile or `.env.local`

#### Database Type Management

This project uses a two-tier type system for better type safety:

1. **Auto-generated base types** (`lib/supabase/database.types.ts`)
   - Generated directly from Supabase schema
   - Source of truth for database structure
   - Regenerated when schema changes

2. **Enhanced types** (`types/enhanced.ts`)
   - Built on top of auto-generated types
   - Adds stricter union types (e.g., `StemType`, `ProjectStatus`)
   - Provides better type checking than loose `string | null` types

**When to regenerate types:**
- After running database migrations
- After schema changes in Supabase
- Run: `npm run gen:types`
- Then update `types/enhanced.ts` if new fields need stricter typing

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 7. Create Your First User

1. Go to `/signup` and create an account
2. In Supabase Dashboard → Authentication → Users, find your user
3. Go to Table Editor → `users` table
4. Update your user's `role` to `'admin'`

## 📊 Database Schema

### Core Tables

#### Asset Management
- **users** - User profiles with roles (admin/engineer/viewer)
- **assets** - Equipment inventory with barcodes and metadata
- **categories** - Asset categories with color coding
- **locations** - Physical storage locations
- **settings** - System configuration (admin-only)

#### Session Management
- **sessions** - Recording sessions with client/engineer info
- **transactions** - Immutable audit log of all asset movements
- **session_assets** - Junction table for session-asset assignments

#### Music Production
- **clients** - Studio clients who own projects
- **projects** - Client projects containing tracks
- **tracks** - Individual songs/compositions with metadata (BPM, key, etc.)
- **stems** - Individual audio files (vocals, drums, bass, etc.) with color coding
- **stem_comments** - Time-stamped comments on stems for collaborative feedback

### Key Relationships

```
assets
  ├─→ categories (category_id)
  ├─→ locations (home_location_id, current_location_id)
  └─→ users (created_by)

sessions
  └─→ users (created_by)

transactions
  ├─→ assets (asset_id)
  ├─→ users (user_id)
  └─→ sessions (session_id)

clients
  └─→ projects (client_id)
      └─→ tracks (project_id)
          └─→ stems (track_id)
              └─→ stem_comments (stem_id)
                  └─→ users (user_id)
```

### Database Functions

- `generate_asset_code(category_name)` - Auto-generates unique asset codes
- `check_out_asset(asset_id, session_id, user_id)` - Atomic check-out with transaction logging
- `check_in_asset(asset_id, condition, user_id)` - Atomic check-in with status updates

## 🔐 Authentication & Permissions

### Roles

- **Admin** - Full access to all features including settings and user management
- **Engineer** - Can manage assets, sessions, and scan equipment
- **Viewer** - Read-only access to assets and sessions

### Row Level Security (RLS)

All tables have RLS policies enforcing role-based access:
- Admins: Full CRUD access
- Engineers: Can read all, modify assets/sessions
- Viewers: Read-only access

## 🎨 Key Features Implementation

### Professional Stem Player

DAW-style multi-track audio player with collaborative features:

```typescript
// Located in: app/(dashboard)/tracks/[id]/components/StemPlayer.tsx
// Multi-track synchronization with Howler.js
const howlers = useRef<Map<string, Howl>>(new Map())

stems.forEach((stem) => {
  const howl = new Howl({
    src: [stem.file_url],
    html5: true,
    volume: stemVolumes[stem.id] ?? 1,
    rate: playbackSpeed,
    onload: () => setDuration(Math.max(duration, howl.duration()))
  })
  howlers.current.set(stem.id, howl)
})

// Drift correction - sync check every 100ms
const syncInterval = setInterval(() => {
  const positions = Array.from(howlers.current.values()).map(h => h.seek())
  const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length

  howlers.current.forEach((howl, index) => {
    if (Math.abs(positions[index] - avgPosition) > 0.05) {
      howl.seek(avgPosition) // Re-sync if drift > 50ms
    }
  })
}, 100)
```

**Comment System:**
```typescript
// Time-stamped comments with emoji reactions
interface StemComment {
  id: string
  stem_id: string
  user_id: string
  timestamp: number  // Playback position in seconds
  content: string    // Text or emoji (❤️, 🔥, 👍, ⚠️)
  created_at: string
}

// Comments appear as dots/emojis on waveform timeline
// Click to add comment, hover to preview, sidebar for full list
```

### Sortable Assets Table

Click column headers to sort assets by any field:

```typescript
// Located in: components/assets/assets-table.tsx
const [sortField, setSortField] = useState<SortField | null>(null)
const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

const handleSort = (field: SortField) => {
  if (sortField === field) {
    // Cycle: asc → desc → null
    setSortDirection(sortDirection === 'asc' ? 'desc' :
                     sortDirection === 'desc' ? null : 'asc')
  } else {
    setSortField(field)
    setSortDirection('asc')
  }
}

// Columns: Asset Name, Asset Tag, Brand, Model, Price (£), Location, Status
```

### Barcode Scanning

Mobile barcode scanning uses the device camera with html5-qrcode:

```typescript
// Located in: app/(dashboard)/scan/page.tsx
const scanner = new Html5Qrcode('reader')
await scanner.start(
  { facingMode: 'environment' },
  { fps: 10, qrbox: 250 },
  onScanSuccess
)
```

### AI Replacement Cost

Uses Anthropic Claude to search for current market prices:

```typescript
// Located in: app/api/assets/find-replacement-cost/route.ts
const message = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{
    role: 'user',
    content: `Search online for the current market price of: "${searchQuery}"`
  }]
})
```

### Real-Time Updates

Supabase Realtime provides live updates across devices:

```typescript
const subscription = supabase
  .channel('assets-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' },
    () => queryClient.invalidateQueries(['assets'])
  )
  .subscribe()
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Post-Deployment

1. Update Supabase Authentication URLs:
   - Go to Supabase → Authentication → URL Configuration
   - Add your production URL to allowed redirect URLs

2. Configure Anthropic API Key:
   - Log in as admin
   - Go to Admin Settings
   - Add your API key

## 🧪 Development

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Regenerate Database Types

After making database schema changes:

```bash
# Easy way (uses npm script)
npm run gen:types

# Manual way (if you need to specify options)
npx supabase gen types typescript --project-id nmfqupzjhrlamyekfbqx > lib/supabase/database.types.ts
```

**Note:** After regenerating types, check `types/enhanced.ts` to ensure stricter types (like `StemType`, `ProjectStatus`) still match your schema.

## 📝 Common Tasks

### Upload and Review Tracks

1. **Create a Client:**
   - Go to `/clients/new`
   - Enter client name and contact details

2. **Create a Project:**
   - Go to `/projects/new`
   - Select client and enter project name

3. **Upload a Track with Stems:**
   - Go to `/tracks/new`
   - Select project, enter track details (name, BPM, key)
   - Upload stems (vocals, drums, bass, etc.)
   - Each stem gets a color for visual distinction

4. **Play and Comment:**
   - Open track player at `/tracks/[id]`
   - Use transport controls to play/pause
   - Click **comment mode** button (💬)
   - Click on waveform to add comments or emoji reactions
   - Use sidebar to view all comments
   - Solo or mute individual stems
   - Adjust playback speed (0.5x to 2x)
   - Download individual stems

### Add a New Asset

1. Go to `/assets/new`
2. Fill in asset details
3. Upload photo (optional)
4. Click "Generate" for auto-generated asset code
5. Enter replacement cost in £ (or use "Find Cost" for AI estimation)
6. Submit

### Browse and Sort Assets

1. Go to `/assets`
2. View all assets in sortable table
3. Click column headers to sort:
   - Asset Tag, Brand, Model, Price, Location, Status
4. Use filters to show only Available/Checked Out/Maintenance

### Start a Recording Session

1. Go to `/sessions/new`
2. Enter client name, engineer, and session details
3. Mark as "Active" to enable check-outs
4. Use `/scan` on mobile to check out equipment

### Scan Equipment

1. Open `/scan` on mobile device
2. Tap "Start Scanning"
3. Point camera at barcode
4. Select active session
5. Confirm check-out

## 🐛 Troubleshooting

### Camera Not Working

- **Issue:** HTTPS required for camera access
- **Solution:** Use localhost for development, or deploy to Vercel

### Database Connection Errors

- **Issue:** Wrong Supabase credentials
- **Solution:** Double-check `.env.local` matches your Supabase project

### TypeScript Errors After Schema Changes

- **Issue:** Types out of sync with database
- **Solution:** Regenerate types with `supabase gen types`

### Build Fails on Vercel

- **Issue:** Missing environment variables
- **Solution:** Add all required env vars in Vercel dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- AI powered by [Anthropic Claude](https://www.anthropic.com/)
- Barcode scanning with [html5-qrcode](https://github.com/mebjas/html5-qrcode)

---

**Need help?** Open an issue on GitHub or contact the maintainer.
