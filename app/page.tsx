/**
 * Home Page - Landing / Redirect
 *
 * Redirects authenticated users to dashboard, others to login
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Otherwise show landing page
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">CTs Studio Manager</h1>
          <p className="text-2xl text-slate-300 mb-2">
            Equipment & Session Tracking
          </p>
          <p className="text-lg text-slate-400">
            Track equipment with barcode-based check-in/check-out workflows
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              📦 Asset Tracking
            </h3>
            <p className="text-sm text-slate-400">
              Manage your studio equipment inventory with unique barcodes and real-time status updates
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              🎵 Session Management
            </h3>
            <p className="text-sm text-slate-400">
              Track which equipment is checked out for each recording session
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              📱 Mobile First
            </h3>
            <p className="text-sm text-slate-400">
              Scan barcodes with your phone camera for instant check-out and check-in
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
