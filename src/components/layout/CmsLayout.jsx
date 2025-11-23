import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInset,
  SidebarRail,
  SidebarTrigger,
  SidebarInput,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Home,
  MessageSquare,
  Settings,
  User,
  LifeBuoy,
  ShieldCheck,
} from 'lucide-react'

export default function CmsLayout() {
  const [dbStatus, setDbStatus] = useState('checking')
  const [contacts, setContacts] = useState({ ok: false, count: 0, data: [] })
  const [conversations, setConversations] = useState({ ok: false, conversations: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (mounted) setDbStatus(data?.db || 'unknown')
      })
      .catch(() => {
        if (mounted) setDbStatus('disconnected')
      })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      fetch('/api/contacts').then((r) => r.json()).catch(() => ({ ok: false, count: 0, data: [] })),
      fetch('/api/chat/conversations?onlyMessaged=true').then((r) => r.json()).catch(() => ({ ok: false, conversations: [] })),
    ])
      .then(([c, conv]) => {
        if (!alive) return
        setContacts(c?.ok ? c : { ok: false, count: 0, data: [] })
        setConversations(conv?.ok ? conv : { ok: false, conversations: [] })
        setError(!c?.ok && !conv?.ok ? 'Failed to load data' : '')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const totalUsers = contacts.count || 0
  const activeUsers = (contacts.data || []).filter((d) => String(d.status).toLowerCase() === 'active').length
  const blockedUsers = (contacts.data || []).filter((d) => String(d.status).toLowerCase() === 'blocked').length
  const pendingUsers = totalUsers - activeUsers - blockedUsers
  const txnImages = (contacts.data || []).filter((d) => d.transaction_img).length
  const pkgCounts = (contacts.data || []).reduce((acc, cur) => {
    const key = (cur.pkg || '').trim() || 'None'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const pkgKeys = Object.keys(pkgCounts)
  const pkgMax = pkgKeys.length ? Math.max(...pkgKeys.map((k) => pkgCounts[k])) : 0
  const activePct = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0
  const messagedCount = (conversations.conversations || []).length

  return (
    <SidebarProvider open={false}>
      <Sidebar side="left" collapsible="icon" variant="inset">
        <SidebarHeader className="h-14 sm:h-16 border-b border-border flex-row items-center p-0">
          <div className="px-2">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md border border-border bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">LS</div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Main navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase tracking-wide">Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/'} size="sm" tooltip="Dashboard">
                    <Link to="/">
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/contacts'} size="sm" tooltip="Contacts">
                    <Link to="/contacts">
                      <User />
                      <span>Contacts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/pending-verification'} size="sm" tooltip="Pending Verification">
                    <Link to="/pending-verification">
                      <ShieldCheck />
                      <span>Pending Verification</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/messages'} size="sm" tooltip="Messages">
                    <Link to="/messages">
                      <MessageSquare />
                      <span>Messages</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Divider */}
          <SidebarSeparator />

          {/* Advanced section */}
          <SidebarGroup>
            <SidebarGroupLabel className="uppercase tracking-wide">Advanced</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" tooltip="Account">
                    <User />
                    <span>Account</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton size="sm" tooltip="Help & Supports">
                    <LifeBuoy />
                    <span>Help & Supports</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>
        {/* SidebarFooter removed */}
        {/* Rail disabled to keep sidebar permanently collapsed */}
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <div className="sticky top-0 z-0 flex h-14 sm:h-16 items-center gap-3 border-b bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <span className="text-base font-semibold">Dashboard Overview</span>
          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="ml-auto flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=JM" />
                  <AvatarFallback>JM</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">Julio Morgan</div>
                  <div className="text-xs text-muted-foreground">julio.morgan12@gmail.com</div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content area */}
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Row: Key Metrics + Goal */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Metrics */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-5 rounded-full bg-violet-400" />
                        <span>Total Users</span>
                      </div>
                      <span className="text-xs">Live</span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">Users</div>
                    <div className="text-2xl font-bold">{loading ? '—' : totalUsers}</div>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-5 rounded-full bg-lime-400" />
                        <span>Active</span>
                      </div>
                      <span className="text-xs">Live</span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">Active Users</div>
                    <div className="text-2xl font-bold">{loading ? '—' : activeUsers}</div>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-5 rounded-full bg-red-400" />
                        <span>Blocked</span>
                      </div>
                      <span className="text-xs">Live</span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">Blocked Users</div>
                    <div className="text-2xl font-bold">{loading ? '—' : blockedUsers}</div>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-5 rounded-full bg-amber-400" />
                        <span>Pending</span>
                      </div>
                      <span className="text-xs">Live</span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">Pending/Other</div>
                    <div className="text-2xl font-bold">{loading ? '—' : pendingUsers}</div>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="size-5 rounded-full bg-sky-400" />
                        <span>Messaged</span>
                      </div>
                      <span className="text-xs">Live</span>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">Conversations</div>
                    <div className="text-2xl font-bold">{loading ? '—' : messagedCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Goal gauge */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Your Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mx-auto my-2 grid place-items-center">
                  <div className={`relative size-32 rounded-full bg-[conic-gradient(theme(colors.lime.400)_${activePct}%,theme(colors.muted.DEFAULT)_0)]`}>
                    <div className="absolute inset-2 rounded-full bg-background" />
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="text-xl font-bold">{loading ? '—' : `${activePct}%`}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Active {loading ? '—' : activeUsers} / {loading ? '—' : totalUsers}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row: Revenue Analytics + Recent Sales */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Packages Distribution</CardTitle>
                <CardDescription className="text-xs">By latest subscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pkgKeys.length === 0 ? (
                    <div className="h-56 rounded-md border bg-gradient-to-b from-background to-muted/10 grid place-items-center text-xs text-muted-foreground">No subscriptions</div>
                  ) : (
                    pkgKeys.map((k) => {
                      const val = pkgCounts[k]
                      const pct = pkgMax ? Math.round((val / pkgMax) * 100) : 0
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <div className="w-24 text-xs text-muted-foreground">{k}</div>
                          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-sky-400" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="w-10 text-xs text-right">{val}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(conversations.conversations || []).slice(0, 5).map((s) => (
                    <div key={s.email + s.time} className="flex items-center justify-between rounded-md border p-2">
                      <div className="flex items-center gap-2">
                        <span className="size-6 rounded-md bg-muted" />
                        <div className="text-sm">{s.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{s.last || '—'}</div>
                    </div>
                  ))}
                  {(!loading && (conversations.conversations || []).length === 0) && (
                    <div className="text-xs text-muted-foreground">No recent conversations</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users snapshot */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Users Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead className="text-right">Txn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(contacts.data || []).slice(0, 8).map((u) => {
                      const s = String(u.status || '')
                      const lower = s.toLowerCase()
                      const tone = lower === 'active' ? 'bg-lime-500/20 text-lime-400' : lower === 'blocked' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      return (
                        <TableRow key={u.id}>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.name || '—'}</TableCell>
                          <TableCell><Badge className={tone}>{s || '—'}</Badge></TableCell>
                          <TableCell>{u.pkg || '—'}</TableCell>
                          <TableCell>{u.exp || '—'}</TableCell>
                          <TableCell className="text-right">{u.transaction_img ? 'Yes' : 'No'}</TableCell>
                        </TableRow>
                      )
                    })}
                    {(!loading && (contacts.data || []).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-xs text-muted-foreground">No users found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
