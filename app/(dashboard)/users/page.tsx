'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  MoreHorizontal,
  Shield,
  UserCog,
  Eye,
  Mail,
  Trash2,
  Users,
  UserPlus,
  Clock,
  Loader2,
  ShieldAlert,
} from 'lucide-react'

interface TeamUser {
  id: string
  name: string
  email: string
  role: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  created_at: string | null
  updated_at: string | null
  last_sign_in_at: string | null
  status: 'active'
}

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    icon: Shield,
    description: 'Full access to all features including user management and account settings',
  },
  engineer: {
    label: 'Engineer',
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    icon: UserCog,
    description: 'Can manage assets, sessions, clients, projects, and tracks',
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-gray-500/10 text-gray-600 border-gray-200',
    icon: Eye,
    description: 'Read-only access to view all data',
  },
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ')
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }
  return email[0]?.toUpperCase() || '?'
}

function formatLastActive(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function UsersPage() {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [canManageUsers, setCanManageUsers] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [changeRoleDialogOpen, setChangeRoleDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TeamUser | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('engineer')
  const [newRole, setNewRole] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      const accountResponse = await fetch('/api/accounts')
      if (!accountResponse.ok) {
        throw new Error('Failed to load account context')
      }
      const accountData = await accountResponse.json()
      const isAdmin = accountData.currentRole === 'admin'
      setCanManageUsers(isAdmin)
      if (!isAdmin) {
        setAccessDenied(true)
        return
      }

      const response = await fetch('/api/users')
      if (response.status === 403) {
        setAccessDenied(true)
        return
      }
      if (!response.ok) throw new Error('Failed to load users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    engineers: users.filter(u => u.role === 'engineer').length,
    admins: users.filter(u => u.role === 'admin').length,
  }), [users])

  const handleInviteUser = async () => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user')
      }

      toast.success(`${inviteEmail} has been added to the team`)
      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('engineer')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite user')
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeRole = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role')
      }

      toast.success(`${selectedUser.name || selectedUser.email}'s role changed to ${ROLE_CONFIG[newRole as keyof typeof ROLE_CONFIG]?.label}`)
      setChangeRoleDialogOpen(false)
      setSelectedUser(null)
      setNewRole('')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to change role')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveUser = async () => {
    if (!selectedUser) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove user')
      }

      toast.success(`${selectedUser.name || selectedUser.email} has been removed`)
      setRemoveDialogOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user')
    } finally {
      setActionLoading(false)
    }
  }

  const openChangeRole = (user: TeamUser) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setChangeRoleDialogOpen(true)
  }

  const openRemoveUser = (user: TeamUser) => {
    setSelectedUser(user)
    setRemoveDialogOpen(true)
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldAlert className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to manage team members. Contact an admin to request access.
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your studio team and permissions
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)} disabled={!canManageUsers}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <UserCog className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.engineers}</p>
              <p className="text-sm text-muted-foreground">Engineers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            People who have access to your studio workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No team members yet</p>
              <Button
                className="mt-4"
                onClick={() => setInviteDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite your first team member
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG]
                  const RoleIcon = roleConfig?.icon || Eye
                  const hasSignedIn = !!user.last_sign_in_at
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-sm">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.name || 'Pending User'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`gap-1 ${roleConfig?.color || ''}`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleConfig?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasSignedIn ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm">Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-sm text-muted-foreground">
                              Never signed in
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatLastActive(user.last_sign_in_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openChangeRole(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openRemoveUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding what each role can do in the workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => {
              const Icon = config.icon
              return (
                <div
                  key={key}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                      key === 'admin' ? 'bg-purple-500/10' :
                      key === 'engineer' ? 'bg-blue-500/10' :
                      'bg-gray-500/10'
                    }`}>
                      <Icon className={`h-4 w-4 ${
                        key === 'admin' ? 'text-purple-600' :
                        key === 'engineer' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <h3 className="font-semibold">{config.label}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                  <ul className="text-sm space-y-1">
                    {key === 'admin' && (
                      <>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-purple-500" />
                          Manage team members & roles
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-purple-500" />
                          Account & billing settings
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-purple-500" />
                          All engineer permissions
                        </li>
                      </>
                    )}
                    {key === 'engineer' && (
                      <>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-blue-500" />
                          Create & edit assets
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-blue-500" />
                          Manage sessions & clients
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-blue-500" />
                          Projects, tracks & transactions
                        </li>
                      </>
                    )}
                    {key === 'viewer' && (
                      <>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-gray-500" />
                          View all assets & sessions
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-gray-500" />
                          View projects & clients
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-gray-500" />
                          No editing capabilities
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new user to your studio workspace. They will be able to sign in with this email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={actionLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole} disabled={actionLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        <span>{config.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {ROLE_CONFIG[inviteRole as keyof typeof ROLE_CONFIG]?.description}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser} disabled={!inviteEmail || actionLoading}>
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialogOpen} onOpenChange={setChangeRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getInitials(selectedUser.name, selectedUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.name || 'Pending User'}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Role</Label>
                <Select value={newRole} onValueChange={setNewRole} disabled={actionLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ROLE_CONFIG[newRole as keyof typeof ROLE_CONFIG]?.description}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={newRole === selectedUser?.role || actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedUser?.name || selectedUser?.email} from the workspace?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(selectedUser.name, selectedUser.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedUser.name || 'Pending User'}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveUser} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
