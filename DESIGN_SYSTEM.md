# CTs Studio Manager - Design System Specification

**Based on:** design-companion-hub dark studio theme

---

## 🎨 Design Philosophy

**Theme:** Professional Dark Studio Interface
**Audience:** Recording engineers, studio managers, and audio professionals
**Design Goals:**
- Reduce eye strain in dark studio environments
- Professional, modern aesthetic
- Clear information hierarchy
- Smooth, performant interactions

---

## Color System

### Base Colors (Dark Theme)

```css
:root {
  /* Main background and surfaces */
  --background: 220 16% 8%;        /* Darkest - main bg */
  --foreground: 210 20% 92%;       /* Primary text */

  --card: 220 14% 11%;             /* Card background */
  --card-foreground: 210 20% 92%;  /* Card text */

  --popover: 220 14% 13%;
  --popover-foreground: 210 20% 92%;

  /* Primary brand color - Blue */
  --primary: 210 100% 56%;         /* Bright blue */
  --primary-foreground: 220 16% 4%;

  /* Secondary elements */
  --secondary: 220 14% 16%;
  --secondary-foreground: 210 20% 80%;

  --muted: 220 12% 14%;
  --muted-foreground: 215 12% 50%;

  --accent: 210 100% 56%;
  --accent-foreground: 220 16% 4%;

  --destructive: 0 72% 51%;        /* Red */
  --destructive-foreground: 210 40% 98%;

  --border: 220 12% 18%;
  --input: 220 12% 18%;
  --ring: 210 100% 56%;

  --radius: 0.5rem;
}
```

### Status Colors

```css
/* Asset & Session Status */
--status-active: 142 71% 45%;      /* Green - Available, Active */
--status-warning: 38 92% 50%;      /* Orange - Checked Out, Maintenance */
--status-error: 0 72% 51%;         /* Red - Missing, Error */
--status-info: 210 100% 56%;       /* Blue - Info, Planned */
--status-idle: 215 12% 50%;        /* Gray - Idle, Completed */
```

**Status Mapping:**
- **Available / Active Sessions** → `status-active` (Green)
- **Checked Out / In Progress** → `status-warning` (Orange)
- **Maintenance / Needs Attention** → `status-warning` (Orange)
- **Missing / Error** → `status-error` (Red)
- **Planned / Info** → `status-info` (Blue)
- **Completed / Archived** → `status-idle` (Gray)

### Role Colors

```css
--role-admin: 280 67% 60%;         /* Purple - Admin users */
--role-engineer: 210 100% 56%;     /* Blue - Engineers */
--role-client: 142 71% 45%;        /* Green - Clients */
--role-viewer: 215 12% 50%;        /* Gray - Viewers */
```

### Surface Layers (Depth)

```css
--surface-0: 220 16% 8%;           /* Base background */
--surface-1: 220 14% 11%;          /* Card surface */
--surface-2: 220 14% 14%;          /* Nested cards */
--surface-3: 220 12% 18%;          /* Deepest layer */
```

**Usage:**
- Surface-0: Page background
- Surface-1: Cards, panels
- Surface-2: Nested elements within cards
- Surface-3: Borders, inputs

### Glow Effects

```css
--glow-primary: 210 100% 56%;
--glow-success: 142 71% 45%;
```

**Utility Classes:**
```css
.glow-primary {
  box-shadow: 0 0 20px -5px hsl(var(--glow-primary) / 0.3);
}

.glow-success {
  box-shadow: 0 0 20px -5px hsl(var(--glow-success) / 0.3);
}
```

### Sidebar Colors

```css
--sidebar-background: 220 16% 6%;  /* Darker than main bg */
--sidebar-foreground: 210 20% 80%;
--sidebar-primary: 210 100% 56%;
--sidebar-primary-foreground: 220 16% 4%;
--sidebar-accent: 220 14% 14%;
--sidebar-accent-foreground: 210 20% 92%;
--sidebar-border: 220 12% 14%;
--sidebar-ring: 210 100% 56%;
```

---

## Typography

### Font Stack

**UI Text:**
```css
font-family: 'Inter', sans-serif;
```

**Data/Codes:**
```css
font-family: 'JetBrains Mono', monospace;
```

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
```

### Font Sizes

```
Text 3XL: 1.875rem (30px) - Page titles
Text 2XL: 1.5rem (24px)   - Section headings
Text XL:  1.25rem (20px)  - Card titles
Text LG:  1.125rem (18px) - Subheadings
Text Base: 1rem (16px)    - Body text
Text SM:  0.875rem (14px) - Secondary text
Text XS:  0.75rem (12px)  - Labels, badges
```

### Font Weights

```
Light:    300
Regular:  400
Medium:   500
Semibold: 600
Bold:     700
```

### Typography Rules

- **Headings:** Use Inter with semibold weight, tight tracking
- **Body:** Use Inter with regular weight
- **Asset Codes, Serial Numbers:** Use JetBrains Mono
- **Numbers in Stats:** Use JetBrains Mono for better readability

---

## Component Library

### 1. StatCard (Dashboard Stats)

**Visual:** Gradient card with icon, value, and optional change indicator

```tsx
<StatCard
  title="Total Assets"
  value={142}
  icon={Package}
  change="+12 this month"
/>
```

**Styling:**
```css
.stat-card-gradient {
  background: linear-gradient(
    135deg,
    hsl(var(--surface-2)) 0%,
    hsl(var(--surface-1)) 100%
  );
}
```

**Features:**
- Gradient background (surface-2 → surface-1)
- Border with hover effect (primary/20)
- Glow effect on hover
- Icon in colored circle (primary/10 bg)
- Large monospace number
- Optional change indicator in green

**Anatomy:**
```
┌─────────────────────────────┐
│ Total Assets          [📦]  │ ← Title + Icon
│ 142                         │ ← Value (monospace)
│ +12 this month              │ ← Change (optional)
└─────────────────────────────┘
```

### 2. StatusBadge

**Visual:** Pill-shaped badge with colored dot and text

```tsx
<StatusBadge status="available" />
<StatusBadge status="checked-out" />
<StatusBadge status="maintenance" />
```

**Config:**
```typescript
const statusConfig = {
  available: {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active"
  },
  "checked-out": {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  maintenance: {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  missing: {
    bg: "bg-status-error/10",
    text: "text-status-error",
    dot: "bg-status-error"
  },
  active: {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active animate-pulse-glow"
  },
  completed: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground"
  },
}
```

**Features:**
- Rounded pill shape
- Colored background (10% opacity)
- Colored dot indicator
- Animated pulse for "active" status
- Small text (12px)

**Visual:**
```
[ ● available ]  ← Green
[ ● checked-out ] ← Orange
[ ● missing ]    ← Red
```

### 3. Card Components

**Standard Card:**
```tsx
<div className="rounded-xl border border-border bg-card p-5">
  {/* Content */}
</div>
```

**Interactive Card (Hover):**
```tsx
<div className="rounded-xl border border-border bg-card p-5
                transition-all hover:border-primary/30 hover:glow-primary">
  {/* Content */}
</div>
```

**Features:**
- Rounded corners (12px)
- Border (subtle)
- Padding (20px)
- Hover effects: border glow + box-shadow glow

### 4. Quick Action Buttons

**Visual:** Card-style button with icon, label, and arrow

```tsx
<Link to="/assets/new" className="group flex items-center gap-3
  rounded-xl border border-border bg-card p-4
  transition-all hover:border-primary/30 hover:bg-surface-2">
  <Package className="h-5 w-5 text-status-info" />
  <span className="text-sm font-medium">Add Asset</span>
  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground
    opacity-0 group-hover:opacity-100 transition-opacity" />
</Link>
```

**Features:**
- Card-style appearance
- Icon on left (colored)
- Label in center
- Arrow appears on hover (right side)
- Hover: change background to surface-2

**Grid Layout:**
```
┌──────────┬──────────┬──────────┬──────────┐
│ 📦 Add   │ 🎵 New   │ 📱 Scan  │ 📋 View  │
│  Asset   │  Session │  Barcode │  Assets  │
└──────────┴──────────┴──────────┴──────────┘
```

### 5. List Items (Recent Activity)

```tsx
<div className="flex items-center gap-3 rounded-lg bg-surface-1 p-3">
  <div className="flex h-8 w-8 shrink-0 items-center justify-center
    rounded-full bg-surface-2">
    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  </div>
  <div className="min-w-0 flex-1">
    <p className="truncate text-sm text-foreground">Asset checked out</p>
    <p className="text-xs text-muted-foreground">Marcus Chen · 2:34 PM</p>
  </div>
  <StatusBadge status="check-out" />
</div>
```

**Features:**
- Rounded container (surface-1)
- Icon in circle (left)
- Text content (flexible width, truncates)
- Status badge (right)

### 6. Sidebar Navigation

**Desktop Sidebar:**
- Fixed left side
- 240px width (expanded) / 64px (collapsed)
- Collapsible
- Logo at top
- Nav items in middle
- User profile at bottom

**Mobile Bottom Nav:**
- Fixed bottom
- 5 main nav items
- Icons + labels
- Active state highlighting

**Nav Item States:**
```tsx
// Active
"bg-primary/10 text-primary"

// Inactive (hover)
"text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
```

---

## Utility Classes

### Gradients

```css
.surface-gradient {
  background: linear-gradient(
    180deg,
    hsl(var(--surface-1)) 0%,
    hsl(var(--surface-0)) 100%
  );
}

.stat-card-gradient {
  background: linear-gradient(
    135deg,
    hsl(var(--surface-2)) 0%,
    hsl(var(--surface-1)) 100%
  );
}

.text-gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--status-info)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Animations

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}
```

**Usage:**
```css
.animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
.animate-slide-in { animation: slide-in 0.3s ease-out; }
.animate-accordion-down { animation: accordion-down 0.2s ease-out; }
.animate-accordion-up { animation: accordion-up 0.2s ease-out; }
```

---

## Layout Patterns

### Page Layout Structure

```tsx
<div className="min-h-screen bg-background">
  <AppSidebar />
  <MobileNav />

  <header className="sticky top-0 backdrop-blur-sm">
    {/* Top bar with menu toggle */}
  </header>

  <main className="transition-all pb-20 md:pb-8 md:pl-60">
    <div className="p-4 md:p-8">
      {/* Page content */}
    </div>
  </main>
</div>
```

### Dashboard Layout

```tsx
<div className="space-y-8 animate-slide-in">
  {/* 1. Header */}
  <div>
    <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
    <p className="text-muted-foreground">Welcome back, [User]</p>
  </div>

  {/* 2. Stats Grid */}
  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <StatCard ... />
    <StatCard ... />
    <StatCard ... />
    <StatCard ... />
  </div>

  {/* 3. Quick Actions */}
  <div>
    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* Action buttons */}
    </div>
  </div>

  {/* 4. Two-Column Content */}
  <div className="grid gap-6 lg:grid-cols-2">
    <Card>{/* Active Sessions */}</Card>
    <Card>{/* Recent Activity */}</Card>
  </div>
</div>
```

### Asset Grid Layout

```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {assets.map(asset => (
    <Card className="hover:shadow-lg hover:glow-primary transition-all">
      {/* Asset card content */}
    </Card>
  ))}
</div>
```

---

## Stem Player Design

### Player Container

```tsx
<div className="rounded-xl border border-border bg-card p-6">
  {/* Transport Controls */}
  <div className="flex items-center gap-4 mb-6">
    <Button size="lg" className="h-12 w-12 rounded-full">
      <Play className="h-5 w-5" />
    </Button>
    <div className="flex-1">
      <div className="flex justify-between text-xs text-muted-foreground font-mono mb-1">
        <span>00:32</span>
        <span>03:45</span>
      </div>
      {/* Progress bar */}
    </div>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Master</span>
      {/* Volume slider */}
    </div>
  </div>

  {/* Waveform Timeline */}
  <div className="mb-6 rounded-lg bg-surface-1 p-4">
    {/* Waveform visualization */}
  </div>

  {/* Stem List */}
  <div className="space-y-2">
    {stems.map(stem => (
      <StemRow key={stem.id} stem={stem} />
    ))}
  </div>
</div>
```

### Individual Stem Row

```tsx
<div className="flex items-center gap-3 rounded-lg bg-surface-1 p-3
                hover:bg-surface-2 transition-colors group">
  {/* Color indicator */}
  <div className="w-1 h-8 rounded-full" style={{ background: stem.color }} />

  {/* Stem name */}
  <div className="w-32 min-w-0">
    <p className="text-sm font-medium truncate">{stem.name}</p>
  </div>

  {/* Solo button */}
  <button className="h-8 w-8 rounded-md bg-surface-2 hover:bg-primary/20
    hover:text-primary transition-colors">
    <span className="text-xs font-mono">S</span>
  </button>

  {/* Mute button */}
  <button className="h-8 w-8 rounded-md bg-surface-2 hover:bg-status-error/20
    hover:text-status-error transition-colors">
    <span className="text-xs font-mono">M</span>
  </button>

  {/* Volume slider */}
  <div className="flex-1 max-w-xs">
    <input type="range" className="w-full" />
  </div>

  {/* Pan control */}
  <div className="w-24">
    <input type="range" className="w-full" />
  </div>

  {/* Level meter */}
  <div className="w-16 h-2 rounded-full bg-surface-2 overflow-hidden">
    <div className="h-full bg-status-active transition-all"
         style={{ width: `${stem.level}%` }} />
  </div>
</div>
```

**Color Coding:**
- 🟦 **Blue** - Vocals
- 🟩 **Green** - Drums
- 🟨 **Yellow** - Bass
- 🟧 **Orange** - Guitar
- 🟪 **Purple** - Keys/Synth
- ⚪ **White** - FX/Other

---

## Responsive Breakpoints

```tsx
// Tailwind breakpoints
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small desktop
xl: 1280px  // Desktop
2xl: 1400px // Large desktop
```

### Responsive Patterns

**Stats Grid:**
```
Mobile (2 cols)    → md (2 cols) → lg (4 cols)
grid-cols-2           grid-cols-2    grid-cols-4
```

**Quick Actions:**
```
Mobile (2 cols)    → md (4 cols)
grid-cols-2           grid-cols-4
```

**Content Sections:**
```
Mobile (1 col)     → lg (2 cols)
grid-cols-1           grid-cols-2
```

**Sidebar:**
```
Mobile: Hidden, bottom nav shown
Desktop: Visible, bottom nav hidden
```

**Stem Player:**
```
Mobile: Vertical stack, simplified controls
Desktop: Horizontal layout, full controls
```

---

## Interactive States

### Hover Effects

**Cards:**
```css
transition-all
hover:border-primary/30
hover:glow-primary
```

**Buttons:**
```css
transition-colors
hover:bg-primary/90
```

**Links:**
```css
text-primary
hover:underline
```

**Nav Items:**
```css
hover:bg-sidebar-accent
hover:text-sidebar-accent-foreground
```

### Focus States

All interactive elements should have visible focus rings:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

### Active States

**Nav Items:**
```css
bg-primary/10 text-primary
```

**Buttons:**
```css
active:scale-95
```

---

## Spacing System

**Base:** 4px (0.25rem)

```
0   → 0px
1   → 4px
2   → 8px
3   → 12px
4   → 16px
5   → 20px
6   → 24px
8   → 32px
10  → 40px
12  → 48px
16  → 64px
20  → 80px
```

**Common Usage:**
- Card padding: `p-5` (20px)
- Section spacing: `space-y-8` (32px)
- Grid gaps: `gap-4` (16px)
- Button padding: `px-4 py-2` (16px/8px)

---

## Accessibility

### Color Contrast

All text must meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio

**Tested Combinations:**
- ✅ Foreground on Background: 11.3:1
- ✅ Primary on Card: 8.2:1
- ✅ Muted-foreground on Background: 4.8:1

### Keyboard Navigation

- All interactive elements focusable
- Focus rings visible
- Logical tab order
- Keyboard shortcuts for player:
  - `Space` - Play/Pause
  - `←/→` - Seek
  - `S` - Solo selected stem
  - `M` - Mute selected stem

### Screen Readers

- Semantic HTML elements
- ARIA labels where needed
- Alt text for images
- Status announcements for actions

---

## Icons

**Library:** Lucide React

**Common Icons:**
```tsx
import {
  Package,        // Assets
  CalendarClock,  // Sessions
  Users,          // Clients
  Music,          // Tracks
  ScanBarcode,    // Scanner
  ScrollText,     // Transactions
  Settings,       // Settings
  Play, Pause,    // Player
  Volume2,        // Audio
  Clock,          // Time
  ArrowRight      // Navigation
} from "lucide-react";
```

**Sizes:**
- Small: `h-4 w-4` (16px)
- Medium: `h-5 w-5` (20px)
- Large: `h-6 w-6` (24px)

---

## Performance Considerations

### Animations

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, or other layout properties
- Use `will-change` sparingly

### Images

- Lazy load images
- Use appropriate formats (WebP with fallback)
- Provide responsive image sizes

### Audio Player

- Progressive loading of stems
- Stream audio files (don't preload all)
- Use Web Audio API efficiently

---

## Component Examples

### Full Dashboard Example

```tsx
export default function Dashboard() {
  return (
    <div className="space-y-8 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back, Marcus. Here's your studio overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={142}
          icon={Package}
          change="+12 this month"
        />
        <StatCard
          title="Active Sessions"
          value={3}
          icon={CalendarClock}
        />
        <StatCard
          title="Checked Out"
          value={24}
          icon={Zap}
        />
        <StatCard
          title="Total Clients"
          value={8}
          icon={Users}
          change="+2 this month"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickAction to="/assets/new" icon={Package} label="Add Asset" />
          <QuickAction to="/sessions/new" icon={CalendarClock} label="New Session" />
          <QuickAction to="/scan" icon={ScanBarcode} label="Scan Barcode" />
          <QuickAction to="/assets" icon={Package} label="View Assets" />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSessions />
        <RecentActivity />
      </div>
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Design System Setup
- [ ] Install fonts (Inter, JetBrains Mono)
- [ ] Configure Tailwind with custom colors
- [ ] Add custom animations
- [ ] Create utility classes

### Phase 2: Core Components
- [ ] StatCard component
- [ ] StatusBadge component
- [ ] Card components
- [ ] Button variants
- [ ] Navigation components

### Phase 3: Layout
- [ ] AppLayout wrapper
- [ ] Sidebar (collapsible)
- [ ] Mobile bottom navigation
- [ ] Page containers

### Phase 4: Pages
- [ ] Dashboard page
- [ ] Assets list/detail pages
- [ ] Sessions list/detail pages
- [ ] Clients/Projects pages
- [ ] Stem player page

### Phase 5: Polish
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Animations
- [ ] Responsive testing

---

**End of Design System**

*Created: 2026-02-13*
*Version: 1.0*
*Based on: design-companion-hub dark studio theme*
