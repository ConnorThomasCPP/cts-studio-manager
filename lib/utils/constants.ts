/**
 * Application Constants
 */

// Asset Status Colors (Tailwind classes)
export const STATUS_COLORS = {
  available: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-100',
    border: 'border-green-300 dark:border-green-700',
  },
  checked_out: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-100',
    border: 'border-yellow-300 dark:border-yellow-700',
  },
  maintenance: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-800 dark:text-orange-100',
    border: 'border-orange-300 dark:border-orange-700',
  },
  missing: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-100',
    border: 'border-red-300 dark:border-red-700',
  },
} as const

// Session Status Colors
export const SESSION_STATUS_COLORS = {
  planned: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-100',
    border: 'border-blue-300 dark:border-blue-700',
  },
  active: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-100',
    border: 'border-green-300 dark:border-green-700',
  },
  completed: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-800 dark:text-gray-100',
    border: 'border-gray-300 dark:border-gray-700',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-100',
    border: 'border-red-300 dark:border-red-700',
  },
} as const

// Condition Options
export const CONDITION_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'needs_maintenance', label: 'Needs Maintenance' },
] as const

// Asset Status Options
export const ASSET_STATUS_OPTIONS = [
  { value: 'available', label: 'Available', description: 'Ready to use' },
  { value: 'checked_out', label: 'Checked Out', description: 'Currently in use' },
  { value: 'maintenance', label: 'Maintenance', description: 'Being repaired' },
  { value: 'missing', label: 'Missing', description: 'Lost or stolen' },
] as const

// Session Status Options
export const SESSION_STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned', description: 'Scheduled but not started' },
  { value: 'active', label: 'Active', description: 'Currently in progress' },
  { value: 'completed', label: 'Completed', description: 'Finished' },
  { value: 'cancelled', label: 'Cancelled', description: 'Not happening' },
] as const

// User Roles
export const USER_ROLES = [
  { value: 'admin', label: 'Admin', description: 'Full access' },
  { value: 'engineer', label: 'Engineer', description: 'Can manage assets and sessions' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
] as const

// Navigation Links
export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/assets', label: 'Assets', icon: 'Package' },
  { href: '/sessions', label: 'Sessions', icon: 'Calendar' },
  { href: '/scan', label: 'Scan', icon: 'ScanLine' },
  { href: '/transactions', label: 'History', icon: 'History' },
] as const

// Admin Navigation Links
export const ADMIN_NAV_LINKS = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/locations', label: 'Locations' },
] as const

// Mobile Breakpoint (matches Tailwind 'md' breakpoint)
export const MOBILE_BREAKPOINT = 768

// Barcode Settings
export const BARCODE_CONFIG = {
  format: 'code128',
  width: 2,
  height: 100,
  displayValue: true,
  fontSize: 14,
  margin: 10,
} as const

// File Upload Settings
export const PHOTO_UPLOAD_CONFIG = {
  maxSizeMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  bucketName: 'asset-photos',
} as const

// Query Keys for React Query
export const QUERY_KEYS = {
  assets: ['assets'],
  asset: (id: string) => ['assets', id],
  sessions: ['sessions'],
  session: (id: string) => ['sessions', id],
  activeSessions: ['sessions', 'active'],
  transactions: ['transactions'],
  assetTransactions: (id: string) => ['transactions', 'asset', id],
  sessionTransactions: (id: string) => ['transactions', 'session', id],
  categories: ['categories'],
  locations: ['locations'],
  users: ['users'],
  userProfile: ['user', 'profile'],
} as const
