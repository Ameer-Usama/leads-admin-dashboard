import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Home,
  MessageSquare,
  User,
  ShieldCheck,
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  LogOut,
} from 'lucide-react'

export default function PendingVerificationLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const planOptions = ['starter', 'growth', 'pro', 'testing', 'trail mode']
  const [selectedPlans, setSelectedPlans] = useState({})
  const [txnImgs, setTxnImgs] = useState({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [loadingIds, setLoadingIds] = useState({})
  const [user, setUser] = useState({ name: 'Admin', email: 'admin@example.com' })

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
    setLoading(true)
    setError(null)
    fetch('/api/contacts')
      .then((r) => r.json())
      .then((json) => {
        if (!mounted) return
        const data = Array.isArray(json?.data) ? json.data : []
        const mapped = data.map((d) => ({
          ...d,
          payment: d.exp ? 'Confirmed' : 'Pending',
          pkg: (d.pkg || '').toLowerCase(),
        }))
        const filtered = mapped
          .filter((r) => r.payment === 'Pending' || r.status === 'Blocked')
          .sort((a, b) => (a.id < b.id ? 1 : -1))
        setRows(filtered)
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setError('Server se data load nahi ho saka.')
        setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const handleActivate = async (id) => {
    const pkg = selectedPlans[id] || ''
    if (!pkg) return
    try {
      const row = rows.find((x) => x.id === id)
      if (row && row.payment === 'Pending' && !(txnImgs[id]?.base64)) {
        alert('Pending status ke liye transaction image upload karna zaroori hai.')
        return
      }
      setLoadingIds((prev) => ({ ...prev, [id]: true }))
      const resSub = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, package: pkg, transactionImageBase64: txnImgs[id]?.base64 || '', transactionImageName: txnImgs[id]?.name || '' }),
      })
      const jsonSub = await resSub.json().catch(() => ({}))
      if (!resSub.ok || jsonSub?.ok === false) {
        throw new Error(jsonSub?.error || 'Subscription create failed')
      }
      const resUser = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      })
      const jsonUser = await resUser.json().catch(() => ({}))
      if (!resUser.ok || jsonUser?.ok === false) {
        throw new Error(jsonUser?.error || 'User update failed')
      }
      setRows((prev) => prev.filter((r) => r.id !== id))
      setTxnImgs((prev) => ({ ...prev, [id]: { base64: '', name: '' } }))
      setSelectedPlans((prev) => ({ ...prev, [id]: '' }))
    } catch (err) {
      alert(`Operation fail ho gaya: ${err?.message || err}`)
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDelete = async (id) => {
    try {
      setLoadingIds((prev) => ({ ...prev, [id]: true }))
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || 'Delete failed')
      }
      setRows((prev) => prev.filter((r) => r.id !== id))
      setSelectedPlans((prev) => ({ ...prev, [id]: '' }))
      setTxnImgs((prev) => ({ ...prev, [id]: { base64: '', name: '' } }))
    } catch (err) {
      alert(`Delete fail ho gaya: ${err?.message || err}`)
    } finally {
      setLoadingIds((prev) => ({ ...prev, [id]: false }))
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

          <SidebarSeparator />

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
        <div className="sticky top-0 z-0 flex h-14 sm:h-16 items-center gap-3 border-b bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <span className="text-base font-semibold">Pending Verification</span>
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
        </div>

        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
          {loading && (
            <div className="text-sm text-muted-foreground">Loading…</div>
          )}
          {error && !loading && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map((r) => (
              <Card key={r.id} className="relative overflow-hidden">
                <CardHeader className="pb-2">
                  <Badge className={r.payment === 'Pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}>{r.payment === 'Pending' ? 'Pending' : 'Blocked'}</Badge>
                  <CardTitle className="mt-2 text-lg">{r.name || 'Unknown'}</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">{r.email || '-'}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <div className="flex-1">
                    <div className="aspect-[4/3] w-full rounded-md border bg-muted overflow-hidden">
                      {(txnImgs[r.id]?.base64 || r.transaction_img) ? (
                        <img
                          src={txnImgs[r.id]?.base64 || (r.transaction_img?.startsWith('/uploads') ? `/api${r.transaction_img}` : r.transaction_img)}
                          alt="Transaction"
                          className="h-full w-full object-cover cursor-pointer"
                          onClick={() => {
                            const src = txnImgs[r.id]?.base64 || (r.transaction_img?.startsWith('/uploads') ? `/api${r.transaction_img}` : r.transaction_img)
                            if (src) {
                              setPreviewSrc(src)
                              setPreviewOpen(true)
                            }
                          }}
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
                    <div className="mt-3">
                      <input
                        id={`file-${r.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (!f) {
                            setTxnImgs((prev) => ({ ...prev, [r.id]: { base64: '', name: '' } }))
                            return
                          }
                          const reader = new FileReader()
                          reader.onload = () => {
                            const result = reader.result
                            if (typeof result === 'string') {
                              setTxnImgs((prev) => ({ ...prev, [r.id]: { base64: result, name: f.name } }))
                            }
                          }
                          reader.readAsDataURL(f)
                        }}
                      />
                      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-md border bg-background">
                          {(txnImgs[r.id]?.base64 || r.transaction_img) ? (
                            <ImageIcon className="size-5 text-muted-foreground" />
                          ) : (
                            <UploadCloud className="size-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-sm font-medium">Upload transaction image</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">JPEG, PNG ya WEBP</div>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => document.getElementById(`file-${r.id}`)?.click()}>
                            {(txnImgs[r.id]?.base64 || r.transaction_img) ? 'Change Image' : 'Choose Image'}
                          </Button>
                          {(txnImgs[r.id]?.base64) && (
                            <Button variant="outline" size="sm" onClick={() => setTxnImgs((prev) => ({ ...prev, [r.id]: { base64: '', name: '' } }))}>
                              Remove
                            </Button>
                          )}
                        </div>
                        {txnImgs[r.id]?.name && (
                          <div className="mt-2 text-xs text-muted-foreground">Selected: {txnImgs[r.id]?.name}</div>
                        )}
                      </div>
                      {(txnImgs[r.id]?.base64) && (
                        <div className="mt-2">
                          <img src={txnImgs[r.id]?.base64} alt="Preview" className="h-24 w-24 rounded-md object-cover border" />
                        </div>
                      )}
                      {r.payment === 'Pending' && !txnImgs[r.id]?.base64 && (
                        <div className="mt-2 text-xs text-destructive">Pending status users ke liye image upload required hai.</div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">Choose Package</div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {planOptions.map((p) => (
                        <Button key={p} variant={(selectedPlans[r.id] || r.pkg) === p ? 'secondary' : 'outline'} onClick={() => setSelectedPlans((prev) => ({ ...prev, [r.id]: p }))}>{p}</Button>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button onClick={() => handleActivate(r.id)} disabled={!!loadingIds[r.id] || (r.payment === 'Pending' ? !txnImgs[r.id]?.base64 : false) || (!selectedPlans[r.id] && !r.pkg)}>
                        {loadingIds[r.id] ? (<><Loader2 className="mr-2 size-4 animate-spin" />Processing…</>) : 'Active'}
                      </Button>
                      <Button variant="destructive" onClick={() => handleDelete(r.id)} disabled={!!loadingIds[r.id]}>
                        {loadingIds[r.id] ? (<><Loader2 className="mr-2 size-4 animate-spin" />Deleting…</>) : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                {loadingIds[r.id] && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm grid place-items-center">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-5xl p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-sm font-medium">Image Preview</div>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
          <div className="max-h-[80vh] overflow-auto">
            {previewSrc && (
              <img src={previewSrc} alt="Preview" className="block max-w-full h-auto object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
