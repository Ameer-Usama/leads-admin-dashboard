import { useEffect, useState, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarInset,
} from '@/components/ui/sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Home,
  MessageSquare,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Trash,
  ChevronDown,
  Minus,
  Plus,
  UploadCloud,
  Image as ImageIcon,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function ContactsLayout() {
  const [dbStatus, setDbStatus] = useState('checking')
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: 'Julio Morgan', email: 'julio.morgan12@gmail.com' })

  useEffect(() => {
    const stored = localStorage.getItem('adminUser')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser({ name: u.name || u.username || 'Admin', email: u.email || 'admin@example.com' })
      } catch (e) { }
    }
  }, [])

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

  // Contacts data and filters
  const filters = [
    'all',
    'active',
    'blocked',
    'waiting',
    'pro',
    'growth',
    'starter',
    'testing',
    'trail mode',
  ]

  const [activeFilter, setActiveFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const selectAllRef = useRef(null)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const pageSizeOptions = [5, 10, 20, 50, 100]

  // Unblock-with-plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [planDialogUserId, setPlanDialogUserId] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [planSubmitting, setPlanSubmitting] = useState(false)
  const planOptions = ['starter', 'growth', 'pro', 'testing', 'trail mode', 'lifetime']
  const [transactionImageBase64, setTransactionImageBase64] = useState('')
  const [transactionImageName, setTransactionImageName] = useState('')
  const fileInputRef = useRef(null)

  const paymentBadgeClass = (p) =>
    p === 'Confirmed'
      ? 'bg-lime-500/20 text-lime-400'
      : p === 'Refund'
        ? 'bg-amber-500/20 text-amber-400'
        : 'bg-pink-500/20 text-pink-400'

  const statusBadgeClass = (s) =>
    s === 'Active'
      ? 'bg-lime-500/20 text-lime-400'
      : s === 'Blocked'
        ? 'bg-red-500/20 text-red-400'
        : 'bg-amber-500/20 text-amber-400'

  const filteredRows = rows.filter((r) => {
    const q = query.toLowerCase()
    const matchesQuery =
      !query ||
      r.email.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)

    if (activeFilter === 'all') return matchesQuery
    if (['active', 'blocked', 'waiting'].includes(activeFilter)) {
      return matchesQuery && (r.status || '').toLowerCase() === activeFilter
    }
    return matchesQuery && (r.pkg || '').toLowerCase() === activeFilter
  })

  // Pagination derived values
  const total = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pageRows = filteredRows.slice(startIndex, endIndex)

  // Clamp current page if filters or page size change
  useEffect(() => {
    setCurrentPage((p) => {
      const tp = Math.max(1, Math.ceil(filteredRows.length / pageSize))
      return Math.min(p, tp)
    })
  }, [filteredRows, pageSize])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        const data = Array.isArray(json?.data) ? json.data : []
        setRows(
          data
            .map((d) => ({
              ...d,
              payment: d.exp ? 'Confirmed' : 'Pending',
            }))
            .sort((a, b) => (a.id < b.id ? 1 : -1))
        )
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError('Server se data load nahi ho saka.')
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const allChecked = filteredRows.length > 0 && filteredRows.every((r) => selectedIds.includes(r.id))
  useEffect(() => {
    if (selectAllRef.current) {
      const someChecked = filteredRows.some((r) => selectedIds.includes(r.id))
      selectAllRef.current.indeterminate = someChecked && !allChecked
    }
  }, [selectedIds, filteredRows, allChecked])

  const handleSelectAllChange = (e) => {
    if (e.target.checked) {
      setSelectedIds((prev) => {
        const ids = new Set(prev)
        filteredRows.forEach((r) => ids.add(r.id))
        return Array.from(ids)
      })
    } else {
      setSelectedIds((prev) => prev.filter((id) => !filteredRows.some((r) => r.id === id)))
    }
  }

  const handleToggleActive = async (id, nextActive) => {
    try {
      // If we are unblocking and payment is pending, ask for plan first
      if (nextActive) {
        const row = rows.find((r) => r.id === id)
        if (row && row.payment === 'Pending' && row.status === 'Blocked') {
          setPlanDialogUserId(id)
          setSelectedPlan('')
          setTransactionImageBase64('')
          setTransactionImageName('')
          setPlanDialogOpen(true)
          return
        }
      }

      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'Update failed')
      }
      const nextStatus = nextActive ? 'Active' : 'Blocked'
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)))
    } catch (err) {
      alert(`Update fail ho gaya: ${err?.message || err}`)
    }
  }

  const handleConfirmPlanAndUnblock = async () => {
    const isLifetime = (selectedPlan || '').toLowerCase() === 'lifetime'
    if (!planDialogUserId || !selectedPlan || (!transactionImageBase64 && !isLifetime)) return
    try {
      setPlanSubmitting(true)
      // 1) Create subscription with selected plan
      const resSub = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: planDialogUserId, package: selectedPlan, transactionImageBase64, transactionImageName }),
      })
      const jsonSub = await resSub.json().catch(() => ({}))
      if (!resSub.ok || jsonSub?.ok === false) {
        throw new Error(jsonSub?.error || 'Subscription create failed')
      }

      // 2) Unblock user
      const resUser = await fetch(`/api/users/${planDialogUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      const jsonUser = await resUser.json().catch(() => ({}))
      if (!resUser.ok || jsonUser?.ok === false) {
        throw new Error(jsonUser?.error || 'User update failed')
      }

      // 3) Update UI row
      const expStr = jsonSub?.subscription?.expirationDate ? new Date(jsonSub.subscription.expirationDate).toISOString().slice(0, 10) : ''
      const sub = jsonSub?.subscription || {}
      setRows((prev) => prev.map((r) => (r.id === planDialogUserId ? {
        ...r,
        status: 'Active',
        pkg: selectedPlan,
        exp: expStr,
        payment: expStr ? 'Confirmed' : r.payment,
        instagramCredits: sub.instaLimit || 0,
        twitterCredits: sub.twitterLimit || 0,
        facebookCredits: sub.facebookLimit || 0,
        gmbCredits: sub.gmbLimit || 0,
      } : r)))

      // Close dialog
      setPlanDialogOpen(false)
      setPlanDialogUserId(null)
      setSelectedPlan('')
      setTransactionImageBase64('')
      setTransactionImageName('')
    } catch (err) {
      alert(`Operation fail ho gaya: ${err?.message || err}`)
    } finally {
      setPlanSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'Delete failed')
      }
      setRows((prev) => prev.filter((r) => r.id !== id))
      setSelectedIds((prev) => prev.filter((x) => x !== id))
    } catch (err) {
      alert(`Delete fail ho gaya: ${err?.message || err}`)
    }
  }

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
            <SidebarGroupLabel className="uppercase tracking-wide">Account</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="sm"
                    tooltip="Logout"
                    onClick={() => {
                      localStorage.removeItem('adminUser')
                      navigate('/login')
                    }}
                  >
                    <LogOut />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        {/* Top bar */}
        <div className="sticky top-0 z-0 flex h-14 sm:h-16 items-center gap-3 border-b bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <span className="text-base font-semibold">Contacts</span>
          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="ml-auto flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
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
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">Subscribers</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button className="flex-1 sm:flex-none" variant="outline" size="sm">Export</Button>
                  <Button
                    className="flex-1 sm:flex-none"
                    size="sm"
                    onClick={() => window.open('https://app.leadsengine.ai/auth/register', '_blank', 'noopener,noreferrer')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 sm:flex-wrap flex-nowrap overflow-x-auto -mx-2 px-2">
                  {filters.map((f) => (
                    <Button
                      key={f}
                      variant={activeFilter === f ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setActiveFilter(f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
                <div className="relative w-full sm:w-auto">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full sm:w-[220px] pl-8"
                    placeholder="Search"
                  />
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="mt-3 w-full overflow-x-auto">
                <Table className="min-w-[1200px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          role="checkbox"
                          aria-label="select all"
                          checked={allChecked}
                          onChange={handleSelectAllChange}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone No</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-center">📸 Insta</TableHead>
                      <TableHead className="text-center">🐦 Twitter</TableHead>
                      <TableHead className="text-center">📘 FB</TableHead>
                      <TableHead className="text-center">🏢 GMB</TableHead>
                      <TableHead>Exp-date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-sm text-muted-foreground">Loading…</TableCell>
                      </TableRow>
                    )}
                    {error && !loading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-sm text-destructive">{error}</TableCell>
                      </TableRow>
                    )}
                    {pageRows.map((r) => (
                      <TableRow key={r.id} data-state={selectedIds.includes(r.id) ? 'selected' : undefined}>
                        <TableCell>
                          <input
                            type="checkbox"
                            role="checkbox"
                            aria-label="select"
                            checked={selectedIds.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => Array.from(new Set([...prev, r.id])))
                              } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== r.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{r.email}</TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.phone || '-'}</TableCell>
                        <TableCell>{r.pkg}</TableCell>
                        <TableCell>
                          <Badge className={paymentBadgeClass(r.payment)}>{r.payment}</Badge>
                        </TableCell>
                        <TableCell>{r.role}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${r.instagramCredits > 0 ? 'bg-pink-500/10 text-pink-600' : 'bg-gray-500/10 text-gray-500'}`}>
                            {r.instagramCredits || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${r.twitterCredits > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-500'}`}>
                            {r.twitterCredits || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${r.facebookCredits > 0 ? 'bg-blue-700/10 text-blue-700' : 'bg-gray-500/10 text-gray-500'}`}>
                            {r.facebookCredits || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium ${r.gmbCredits > 0 ? 'bg-green-600/10 text-green-600' : 'bg-gray-500/10 text-gray-500'}`}>
                            {r.gmbCredits || 0}
                          </span>
                        </TableCell>
                        <TableCell>{r.exp}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(r.status)}>{r.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon-sm" aria-label="Actions">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleToggleActive(r.id, r.status !== 'Active') }}>
                                {r.status === 'Active' ? 'Block' : 'Unblock'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                    Delete
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete user?</DialogTitle>
                                    <DialogDescription>
                                      Is action se user aur us ke subscriptions delete ho jayenge. Yeh action undo nahi ho sakta.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline" size="sm">Cancel</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>Delete</Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Unblock with plan selection dialog */}
              <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>User ko unblock karne se pehle plan select karein</DialogTitle>
                    <DialogDescription>Payment pending hai. Transaction image upload karein (lifetime ke liye optional), phir plan select karein.</DialogDescription>
                  </DialogHeader>
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) {
                          setTransactionImageBase64('')
                          setTransactionImageName('')
                          return
                        }
                        setTransactionImageName(f.name)
                        const reader = new FileReader()
                        reader.onload = () => {
                          const result = reader.result
                          if (typeof result === 'string') {
                            setTransactionImageBase64(result)
                          }
                        }
                        reader.readAsDataURL(f)
                      }}
                    />
                    <div className="flex flex-col gap-3">
                      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                          {transactionImageBase64 ? (
                            <ImageIcon className="size-5 text-muted-foreground" />
                          ) : (
                            <UploadCloud className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-sm font-medium">Upload transaction image</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">JPEG, PNG ya WEBP — clear receipt screenshot</div>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                            {transactionImageBase64 ? 'Change Image' : 'Choose Image'}
                          </Button>
                          {transactionImageBase64 && (
                            <Button variant="outline" size="sm" onClick={() => { setTransactionImageBase64(''); setTransactionImageName(''); }}>
                              Remove
                            </Button>
                          )}
                        </div>
                        {transactionImageName && (
                          <div className="mt-2 text-xs text-muted-foreground">Selected: {transactionImageName}</div>
                        )}
                      </div>
                      {transactionImageBase64 && (
                        <div className="flex items-center gap-3">
                          <img src={transactionImageBase64} alt="Transaction preview" className="h-24 w-24 rounded-md object-cover border" />
                          <div className="text-xs text-muted-foreground">Preview</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {planOptions.map((p) => (
                      <Button key={p} variant={selectedPlan === p ? 'secondary' : 'outline'} size="sm" onClick={() => setSelectedPlan(p)}>
                        {p}
                      </Button>
                    ))}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" size="sm" disabled={planSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button size="sm" onClick={handleConfirmPlanAndUnblock} disabled={!selectedPlan || (!transactionImageBase64 && selectedPlan.toLowerCase() !== 'lifetime') || planSubmitting}>
                      {planSubmitting ? 'Saving…' : 'Confirm & Unblock'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="sm:hidden">{total === 0 ? '0 of 0' : `${startIndex + 1} - ${Math.min(endIndex, total)} of ${total}`}</span>
                  <span className="hidden sm:inline">{total === 0 ? '0 of 0' : `${startIndex + 1} - ${Math.min(endIndex, total)} of ${total}`}</span>
                  <span className="hidden sm:inline">· Results per page</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        {pageSize}
                        <ChevronDown className="ml-1 size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      <DropdownMenuLabel>Page size</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {pageSizeOptions.map((n) => (
                        <DropdownMenuItem key={n} onSelect={(e) => { e.preventDefault(); setPageSize(n) }}>
                          {n}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="hidden sm:flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPageSize((s) => Math.max(pageSizeOptions[0], s - 5))}
                      disabled={pageSize <= pageSizeOptions[0]}
                      aria-label="Decrease page size"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPageSize((s) => Math.min(pageSizeOptions[pageSizeOptions.length - 1], s + 5))}
                      disabled={pageSize >= pageSizeOptions[pageSizeOptions.length - 1]}
                      aria-label="Increase page size"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1 || total === 0}
                  >
                    <ChevronsLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || total === 0}
                  >
                    <ChevronLeft />
                  </Button>
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => i + 1).map((n) => (
                      <Button
                        key={n}
                        variant={n === currentPage ? 'default' : 'outline'}
                        size="icon-sm"
                        aria-current={n === currentPage ? 'page' : undefined}
                        onClick={() => setCurrentPage(n)}
                      >
                        {n}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || total === 0}
                  >
                    <ChevronRight />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || total === 0}
                  >
                    <ChevronsRight />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
