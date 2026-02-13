/**
 * Auth Layout
 *
 * Simple centered layout for authentication pages
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - CTs Studio Manager',
  description: 'CTs Studio Manager - Login',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">CTs Studio Manager</h1>
          <p className="text-slate-400">Equipment & Session Tracking</p>
        </div>
        {children}
      </div>
    </div>
  )
}
