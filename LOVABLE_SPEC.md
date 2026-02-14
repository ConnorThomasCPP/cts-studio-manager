# CTs Studio Manager - Frontend Design Specification

## Project Overview

**Application Name:** CTs Studio Manager
**Purpose:** Mobile-first inventory tracking system for recording studios
**Core Function:** Barcode-based asset management with session tracking and check-in/out workflows
**Target Users:** Recording studio staff (Admins, Engineers, Viewers)

### Key Value Propositions
- Prevent equipment loss through systematic check-out/check-in workflows
- Track assets during recording sessions (temporary hire contracts)
- Mobile-optimized barcode scanning for quick asset operations
- Real-time session and asset status monitoring
- AI-powered equipment cost estimation

---

## User Roles & Permissions

### Admin
- **Access:** Full system access
- **Capabilities:**
  - All asset CRUD operations
  - Session management
  - User management
  - System settings configuration
  - Category and location management
  - API key configuration
  - View all transactions and audit logs

### Engineer
- **Access:** Operational access
- **Capabilities:**
  - View all assets
  - Create and manage assets
  - Create and manage sessions
  - Check assets in/out via barcode scanner
  - View transactions
  - Update own profile

### Viewer
- **Access:** Read-only
- **Capabilities:**
  - View assets (browse only)
  - View sessions (browse only)
  - View transactions (browse only)
  - Update own profile

---

## Core Features Breakdown

### 1. Asset Management

#### Asset List View
- **Layout:** Grid of cards (3 columns on desktop, 2 on tablet, 1 on mobile)
- **Card Components:**
  - Asset name (prominent)
  - Asset code (below name, monospace font)
  - Status badge (color-coded: Available=green, Checked Out=yellow, Maintenance=orange, Missing=red)
  - Brand and model (if available)
  - Category badge (with category color)
  - Location name
- **Filters:**
  - Status filter buttons (All, Available, Checked Out, Maintenance, Missing)
  - Category dropdown filter
  - Search bar (searches: name, asset code, brand)
- **Actions:**
  - "Add Asset" button (top right)
  - Click card to view details

#### Asset Detail View
- **Sections:**
  1. **Header:**
     - Asset name (large, bold)
     - Asset code (with barcode image displayed)
     - Status badge
     - Edit/Delete buttons (if user has permission)

  2. **Photo Section:**
     - Large asset photo (if available)
     - Photo upload/change button

  3. **Details Grid:**
     - Brand, Model, Serial Number
     - Category (with color badge)
     - Home Location, Current Location
     - Purchase Value, Replacement Cost
     - Purchase Date
     - Condition notes

  4. **Session History:**
     - List of recent sessions this asset was used in
     - Check-out/check-in timestamps
     - User who performed action

  5. **Transaction History:**
     - Chronological log of all asset movements
     - Type (check out, check in, status change)
     - User, timestamp, notes

#### Asset Creation/Edit Form
- **Fields:**
  - Asset name* (required)
  - Asset code (with "Generate" button for auto-generation)
  - Category dropdown* (required)
  - Brand, Model, Serial Number
  - Home location dropdown* (required)
  - Purchase value (currency input)
  - Replacement cost (currency input with "Find Cost" AI button)
  - Purchase date (date picker)
  - Condition (dropdown: Excellent, Good, Fair, Poor)
  - Notes (textarea)
  - Photo upload (drag & drop or file picker)
- **Barcode Generation:**
  - Automatic Code 128 barcode generation
  - Display barcode preview
  - Download barcode as PNG
- **AI Cost Finder:**
  - Button to trigger AI search
  - Shows loading state
  - Populates replacement cost field with AI result
  - Shows source/reasoning in tooltip

### 2. Session Management

#### Session List View
- **Tabs:**
  - Active (green badge)
  - Planned (blue badge)
  - Completed (gray badge)
- **Session Cards:**
  - Session name
  - Client name
  - Engineer name
  - Start time, End time
  - Status badge
  - Number of assets checked out
  - Click to view details

#### Session Detail View
- **Header:**
  - Session name
  - Status badge with status change buttons
  - Edit/Close Session buttons
- **Info Section:**
  - Client name, Engineer name
  - Start time, End time
  - Session type, Room/location
  - Notes
- **Checked Out Assets:**
  - Grid of asset cards currently assigned to this session
  - Each shows: photo, name, code, condition on checkout
  - Quick "Check In" button on each card
- **Session Timeline:**
  - Visual timeline of asset check-outs/check-ins
  - Shows who performed each action and when
- **Validation:**
  - Cannot close session if assets are still checked out
  - Warning message if attempting to close with unreturned items

#### Session Creation Form
- **Fields:**
  - Session name* (required)
  - Client name* (required)
  - Engineer (dropdown from users)* (required)
  - Start time (datetime picker)
  - End time (datetime picker)
  - Status (Planned, Active, Completed)
  - Session type (Recording, Mixing, Mastering, Rehearsal, etc.)
  - Room/location
  - Notes (textarea)

### 3. Mobile Barcode Scanner

**Critical:** This is a mobile-first feature requiring camera access

#### Scanner Interface
- **Initial State:**
  - Large "Start Scanner" button with camera icon
  - Instructions: "Point your camera at a barcode"
  - Camera permission request

- **Scanning State:**
  - Full-width camera viewfinder
  - Overlay with scan box (250x150px centered)
  - "Stop Scanner" button
  - Visual feedback when barcode detected

- **Asset Found State:**
  - Camera stops automatically
  - Card displays asset details:
    - Photo (if available)
    - Name, Code, Status
    - Brand, Model, Serial
    - Category, Location
  - **Action Buttons (large, touch-friendly):**
    - "Check Out" (if status = available)
    - "Check In" (if status = checked_out)
    - "Scan Another" button
  - Real-time status updates after action

- **Error States:**
  - Asset not found message
  - Camera permission denied message
  - Network error message

#### Scanner Features
- Uses device back camera (environment-facing)
- 10 FPS scan rate
- Debouncing to prevent duplicate scans
- Instant asset lookup via asset_code
- Creates transaction log on check-in/out
- Toast notifications for success/error

### 4. Dashboard (Home)

#### Layout (4 sections)

**1. Asset Status Overview (4 stat cards)**
- Card per status type:
  - Available (green) - "Ready to use"
  - Checked Out (yellow) - "Currently in use"
  - Maintenance (orange) - "Needs repair"
  - Missing (red) - "Lost or stolen"
- Each shows: large count number, status name, description

**2. Quick Actions (4 buttons)**
- Add Asset (primary button)
- New Session (outline button)
- Scan Barcode (outline button)
- View All Assets (outline button)
- Each with icon and label

**3. Active Sessions Panel**
- Shows all active sessions
- Each session card:
  - Session name
  - Client • Engineer
  - "Active" badge
  - Click to view details
- Empty state: "No active sessions" with "Create a session" link

**4. Recent Activity Panel**
- Last 5 transactions
- Timeline view with:
  - Asset name
  - Action type (check out/in)
  - User name
  - Timestamp (relative time)
- Empty state: "No recent activity"

### 5. User Profile

#### Profile View
- **Avatar Section:**
  - Large circular avatar
  - Gravatar support (fetches from email)
  - Custom photo upload option
  - Change photo button

- **User Details:**
  - Full name
  - Email
  - Role badge (color-coded by role)
  - Join date

- **Edit Profile Form:**
  - Name field
  - Email field (if allowed)
  - Password change (current, new, confirm)
  - Photo upload
  - Save/Cancel buttons

### 6. Admin Settings (Admin Only)

#### Tabs/Sections:

**Categories Tab**
- Table view with:
  - Category name
  - Color swatch
  - Asset count
  - Edit/Delete actions
- Add Category button
- Category form:
  - Name field
  - Color picker
  - Save/Cancel

**Locations Tab**
- Table view with:
  - Location name
  - Asset count
  - Edit/Delete actions
- Add Location button
- Location form:
  - Name field
  - Description
  - Save/Cancel

**API Configuration Tab**
- Anthropic API Key
  - Masked input field
  - "Show/Hide" toggle
  - Test connection button
  - Save button
- API usage stats (if available)

**System Settings Tab**
- General settings:
  - Studio name
  - Timezone
  - Currency
  - Save button

### 7. Transaction History

#### List View
- **Filters:**
  - Date range picker
  - Asset filter
  - User filter
  - Transaction type filter
- **Table/List:**
  - Timestamp
  - Asset name + code
  - Transaction type (badge)
  - User name
  - Session name (if applicable)
  - Notes
  - Condition (for check-ins)
- **Pagination:**
  - 50 items per page
  - Page controls

---

## Data Models (Frontend Perspective)

### Asset
```typescript
{
  id: string
  asset_code: string          // e.g., "MIC-00001"
  name: string                // e.g., "Shure SM7B"
  status: 'available' | 'checked_out' | 'maintenance' | 'missing'
  category_id: string
  category: { name: string, color: string }
  brand?: string
  model?: string
  serial_number?: string
  home_location_id: string
  home_location: { name: string }
  current_location_id?: string
  current_location?: { name: string }
  purchase_value?: number
  replacement_cost?: number
  purchase_date?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  photo_url?: string
  notes?: string
  created_at: string
  created_by: string
}
```

### Session
```typescript
{
  id: string
  session_name: string
  client_name: string
  engineer: string
  start_time: string
  end_time?: string
  status: 'planned' | 'active' | 'completed'
  session_type?: string
  room?: string
  notes?: string
  created_at: string
  created_by: string
  checked_out_assets?: Asset[]  // Joined data
}
```

### Transaction
```typescript
{
  id: string
  asset_id: string
  asset: { name: string, asset_code: string }
  user_id: string
  user: { name: string }
  session_id?: string
  session?: { session_name: string }
  type: 'check_out' | 'check_in' | 'status_change' | 'created' | 'updated'
  timestamp: string
  note?: string
  condition?: string  // Asset condition at time of action
}
```

### User
```typescript
{
  id: string
  email: string
  name: string
  role: 'admin' | 'engineer' | 'viewer'
  photo_url?: string
  created_at: string
}
```

### Category
```typescript
{
  id: string
  name: string
  color: string  // Hex color code
}
```

### Location
```typescript
{
  id: string
  name: string
  description?: string
}
```

---

## User Workflows

### Workflow 1: Adding a New Asset
1. Click "Add Asset" from dashboard or assets page
2. Fill in required fields (name, category, home location)
3. Click "Generate" to auto-create asset code
4. Optionally upload photo
5. Optionally use "Find Cost" AI feature for replacement cost
6. Submit form
7. Redirect to asset detail view
8. Show barcode for printing

### Workflow 2: Starting a Recording Session
1. Click "New Session" from dashboard
2. Fill in session details (name, client, engineer, times)
3. Set status to "Active" to enable check-outs
4. Submit form
5. Redirect to session detail view
6. Ready for asset check-outs via scanner

### Workflow 3: Checking Out Equipment (Mobile)
1. Open mobile scanner page (`/scan`)
2. Tap "Start Scanner"
3. Grant camera permission
4. Point camera at asset barcode
5. Camera auto-detects and looks up asset
6. View asset details on screen
7. Tap "Check Out" button
8. Transaction created, status updated
9. Success message displayed
10. Option to "Scan Another"

### Workflow 4: Checking In Equipment (Mobile)
1. Open mobile scanner page
2. Scan asset barcode (same as check-out)
3. View asset details
4. Tap "Check In" button
5. Transaction created, status updated to "available"
6. Success message displayed
7. Option to "Scan Another"

### Workflow 5: Closing a Session
1. Navigate to session detail view
2. Check that all assets are checked in
3. Click "Close Session" button
4. If assets still out: show warning, prevent close
5. If all assets returned: confirm close
6. Update session status to "completed"
7. Record end time
8. Show session summary

---

## Design Requirements

### Design System

#### Color Palette
**Status Colors:**
- Available: Green (#10B981 bg, #065F46 text, #D1FAE5 light)
- Checked Out: Yellow (#F59E0B bg, #92400E text, #FEF3C7 light)
- Maintenance: Orange (#F97316 bg, #9A3412 text, #FFEDD5 light)
- Missing: Red (#EF4444 bg, #991B1B text, #FEE2E2 light)

**Role Colors:**
- Admin: Purple
- Engineer: Blue
- Viewer: Gray

**Brand Colors:**
- Primary: Modern blue or studio-themed color
- Secondary: Complementary accent
- Success: Green
- Warning: Yellow
- Error: Red
- Info: Blue

#### Typography
- Headings: Bold, modern sans-serif
- Body: Clean, readable sans-serif (14-16px base)
- Monospace: Asset codes, serial numbers (JetBrains Mono or similar)
- Large touch targets on mobile (min 44x44px)

#### Spacing
- Base: 8px
- Consistent spacing scale (8, 16, 24, 32, 48, 64px)
- Generous padding on mobile for touch targets

### Component Design Guidelines

#### Cards
- Rounded corners (8-12px radius)
- Subtle shadow
- Hover effect (shadow increase)
- White background (dark mode: dark gray)
- Clear visual hierarchy

#### Buttons
**Primary:** Filled, brand color, white text
**Secondary/Outline:** Border, transparent bg
**Destructive:** Red
**Ghost:** No background, minimal styling

**Sizes:**
- Small: 32px height
- Medium: 40px height
- Large: 48px height (mobile touch targets)

#### Badges
- Rounded pill shape
- Small text (12px)
- Color-coded by status/type
- Border variant for subtle categories

#### Forms
- Clear labels above fields
- Helpful placeholder text
- Validation messages inline
- Required field indicators (*)
- Large touch-friendly inputs on mobile (min 44px height)

#### Navigation
**Desktop:**
- Sidebar navigation (left side)
- Logo at top
- Menu items: Dashboard, Assets, Sessions, Scan, Transactions, Admin (if admin), Profile
- User info at bottom with avatar

**Mobile:**
- Bottom tab bar for main navigation
- Hamburger menu for secondary items
- Sticky header with title

### Layout Patterns

#### Desktop (≥1024px)
- Sidebar + main content area
- Multi-column grids (3-4 columns)
- Side-by-side detail views

#### Tablet (768-1023px)
- Collapsible sidebar or top nav
- 2-column grids
- Stacked detail views

#### Mobile (≤767px)
- Bottom navigation
- Single column layouts
- Full-width cards
- Large touch targets
- Slide-out drawers for filters

### Mobile-First Considerations

**Critical Mobile Features:**
1. **Barcode Scanner:**
   - Full-screen camera view
   - Large, clear scan target area
   - Immediate feedback on successful scan
   - Large action buttons post-scan

2. **Quick Actions:**
   - Prominent "Scan" button on dashboard
   - One-tap access to common tasks
   - Swipe gestures for cards (optional)

3. **Responsive Tables:**
   - Convert to cards on mobile
   - Show essential info, hide details
   - Tap to expand for full details

4. **Touch-Optimized:**
   - All buttons ≥44x44px
   - Adequate spacing between interactive elements
   - No hover-only interactions

5. **Offline Capability (Optional Enhancement):**
   - Cache asset list for offline scanning
   - Queue transactions when offline
   - Sync when connection restored

### Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast (4.5:1 for text)
- Focus indicators on interactive elements
- Alt text for images
- Proper heading hierarchy
- ARIA labels where needed

---

## Technical Stack (Current Implementation)

### Frontend Framework
- Next.js 14.2 (App Router)
- React 18
- TypeScript

### Styling
- Tailwind CSS
- shadcn/ui components
- Custom CSS for animations

### State Management
- React hooks (useState, useEffect)
- Zustand (for scan state)
- React Query (for data fetching) - recommended

### Key Libraries
- **Barcode Scanning:** html5-qrcode
- **Barcode Generation:** bwip-js
- **Notifications:** sonner (toast messages)
- **Forms:** React Hook Form + Zod validation (recommended)
- **Icons:** Lucide React
- **Date Handling:** date-fns or Day.js

### Backend Integration
- Supabase (PostgreSQL database)
- Supabase Auth (authentication)
- Supabase Storage (photo uploads)
- Supabase Realtime (live updates)
- Anthropic Claude API (AI cost estimation)

---

## Pages & Routes

### Public Routes
- `/` - Landing page (redirects to /login or /dashboard)
- `/login` - Login page
- `/signup` - Registration page

### Protected Routes (Authenticated)
- `/dashboard` - Main dashboard
- `/assets` - Asset list
- `/assets/new` - Create asset form
- `/assets/[id]` - Asset detail view
- `/assets/[id]/edit` - Edit asset form
- `/sessions` - Session list
- `/sessions/new` - Create session form
- `/sessions/[id]` - Session detail view
- `/sessions/[id]/edit` - Edit session form
- `/scan` - Mobile barcode scanner
- `/transactions` - Transaction history
- `/profile` - User profile
- `/admin` - Admin settings (admin only)

---

## Real-Time Features

### Live Updates (via Supabase Realtime)
- **Asset list:** Auto-refresh when any asset is updated
- **Session detail:** Live updates when assets are checked in/out
- **Dashboard stats:** Real-time count updates
- **Transaction history:** New transactions appear immediately

### Optimistic UI Updates
- Update UI immediately on user action
- Rollback if server request fails
- Show loading states during async operations

---

## Error Handling & Loading States

### Loading States
- Skeleton screens for initial page loads
- Spinners for button actions
- Progress bars for file uploads
- Shimmer effects for content loading

### Error States
- Toast notifications for action failures
- Inline form validation errors
- Full-page error for critical failures
- Empty states with helpful CTAs
- Network error messages with retry option

### Success Feedback
- Toast notifications for successful actions
- Visual confirmation (checkmarks, color changes)
- Redirect to detail view after creation

---

## Performance Considerations

- Lazy load images
- Virtual scrolling for long lists
- Debounce search inputs
- Optimize barcode scanning FPS
- Code splitting per route
- Minimize bundle size
- CDN for static assets

---

## Future Enhancements (Optional)

1. **Advanced Reporting:**
   - Asset utilization charts
   - Session analytics
   - Financial reporting

2. **Notifications:**
   - Email notifications for session reminders
   - Alerts for missing assets
   - Low stock warnings

3. **Multi-Studio Support:**
   - Organization/studio switching
   - Cross-studio asset transfers

4. **Advanced Scanner Features:**
   - Bulk check-out mode
   - NFC tag support
   - QR code generation as alternative to Code 128

5. **Mobile App:**
   - Native iOS/Android apps
   - Push notifications
   - Offline-first architecture

---

## Design Deliverables Requested from Lovable

Please provide frontend design options for:

1. **Dashboard Layout** - 2-3 visual options for the main dashboard
2. **Asset Card Design** - Different card styles for the asset grid
3. **Mobile Scanner Interface** - Camera UI and scan result screens
4. **Navigation Pattern** - Desktop sidebar + mobile bottom nav concepts
5. **Color Scheme Options** - 2-3 complete color palette proposals
6. **Session Management View** - Visual concepts for session detail page

**Preferred Style:**
- Modern, clean, professional
- Studio/music industry aesthetic (subtle)
- Mobile-first responsive design
- Accessible and usable
- Balance between form and function

---

## Questions for Design Team

1. Should we use a dark theme by default (common in studio environments)?
2. Any specific brand colors or logo to incorporate?
3. Preference for card-based vs. table-based asset listings?
4. Should the scanner support landscape mode on mobile?
5. Any specific accessibility requirements beyond WCAG AA?

---

**End of Specification**

*Last Updated: 2026-02-13*
*Version: 1.0*
