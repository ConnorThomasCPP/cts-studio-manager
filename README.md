# CTs Studio Manager

A mobile-first inventory tracking system for recording studios, featuring barcode-based asset management, session tracking, and AI-powered equipment cost estimation.

## 🎯 Overview

CTs Studio Manager helps recording studios track equipment through barcode scanning during recording sessions. Each session acts as a temporary hire contract with check-out/check-in workflows, ensuring gear accountability and preventing losses.

**Live Demo:** [Your Vercel URL]
**Repository:** https://github.com/ConnorThomasCPP/cts-studio-manager

## ✨ Features

### Asset Management
- ✅ Complete CRUD operations for studio equipment
- ✅ Code 128 barcode generation for each asset
- ✅ Photo uploads with Supabase Storage
- ✅ Category and location organization
- ✅ Purchase value and replacement cost tracking
- ✅ AI-powered replacement cost estimation (using Anthropic Claude)

### Session Tracking
- ✅ Recording session management (planned → active → completed)
- ✅ Client and engineer assignment
- ✅ Asset check-out/check-in workflows
- ✅ Session validation (prevents closing with unreturned assets)
- ✅ Real-time session updates

### Mobile Barcode Scanning
- ✅ Camera-based barcode scanning (html5-qrcode)
- ✅ Manual asset code entry fallback
- ✅ Quick check-out to active sessions
- ✅ Asset condition tracking
- ✅ Touch-optimized interface

### User Management
- ✅ Role-based access control (Admin, Engineer, Viewer)
- ✅ Profile management with Gravatar support
- ✅ Custom photo uploads
- ✅ Authentication with Supabase Auth

### Admin Features
- ✅ Location and category management
- ✅ System settings configuration
- ✅ API key management (admin-only)
- ✅ Transaction history and audit logging

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 14.2 (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS, shadcn/ui components
- **State:** React hooks, Zustand (for scan state)
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
inventory-tracker/
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── admin/           # Admin settings
│   │   ├── assets/          # Asset management
│   │   ├── profile/         # User profile
│   │   ├── scan/            # Mobile barcode scanner
│   │   ├── sessions/        # Session management
│   │   └── transactions/    # Transaction history
│   └── api/                 # API routes
│       └── assets/
│           └── find-replacement-cost/  # AI cost estimation
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   └── supabase/
│       ├── client.ts        # Browser-side Supabase client
│       ├── server.ts        # Server-side Supabase client
│       └── database.types.ts # Generated TypeScript types
├── supabase/
│   └── migrations/          # Database schema migrations
├── middleware.ts            # Auth middleware
└── types/                   # TypeScript type definitions
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

# Login to Supabase
supabase login

# Generate types (replace PROJECT_ID with your Supabase project ID)
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

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

- **users** - User profiles with roles (admin/engineer/viewer)
- **assets** - Equipment inventory with barcodes and metadata
- **sessions** - Recording sessions with client/engineer info
- **transactions** - Immutable audit log of all asset movements
- **session_assets** - Junction table for session-asset assignments
- **categories** - Asset categories with color coding
- **locations** - Physical storage locations
- **settings** - System configuration (admin-only)

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
supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

## 📝 Common Tasks

### Add a New Asset

1. Go to `/assets/new`
2. Fill in asset details
3. Upload photo (optional)
4. Click "Generate" for auto-generated asset code
5. Use "Find Cost" for AI-powered price estimation
6. Submit

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
