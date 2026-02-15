'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ACCOUNT_THEME_OPTIONS, type AccountTheme } from '@/lib/account-themes'

export default function AccountSetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [accountName, setAccountName] = useState('')
  const [theme, setTheme] = useState<AccountTheme>('studio-default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    const checkAccount = async () => {
      const response = await fetch('/api/accounts')
      if (mounted && response.ok) {
        router.replace('/dashboard')
      }
    }
    checkAccount()
    return () => {
      mounted = false
    }
  }, [router])

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = accountName.trim()
    if (!trimmedName) {
      toast.error('Account name is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          theme,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      toast.success('Account created')
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your first account</CardTitle>
          <CardDescription>
            Your profile is active, but you are not part of any account yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="My Studio"
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select
                id="theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value as AccountTheme)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                disabled={loading}
              >
                {ACCOUNT_THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleSignOut}
            disabled={loading}
          >
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
