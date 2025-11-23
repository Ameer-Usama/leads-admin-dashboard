import { Link, useLocation } from 'react-router-dom'
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Home, MessageSquare, Settings, User, LifeBuoy, ShieldCheck, Search, Send, Loader2, Paperclip, Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function MessagesLayout() {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [selectedEmail, setSelectedEmail] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)
  const [emailReady, setEmailReady] = useState(true)
  const [healthMsg, setHealthMsg] = useState('')

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const r = await fetch('/api/chat/conversations')
        const j = await r.json()
        const list = Array.isArray(j?.conversations) ? j.conversations : []
        setUsers(list)
        if (!selectedEmail && list.length > 0) {
          setSelectedEmail(list[0].email)
          setSelectedName(list[0].name || list[0].email)
        }
      } catch (_) {}
    }
    const checkEmailHealth = async () => {
      try {
        const r = await fetch('/api/email/health')
        const j = await r.json()
        if (!j?.ok || j?.ready === false) {
          setEmailReady(false)
          const host = j?.host ? String(j.host) : ''
          const port = j?.port ? String(j.port) : ''
          const reason = j?.error ? `: ${String(j.error)}` : ''
          setHealthMsg('Email service not ready' + (host || port ? ` (${host}:${port})` : '') + reason)
        } else {
          setEmailReady(true)
          setHealthMsg('')
        }
      } catch (_) {
        setEmailReady(false)
        setHealthMsg('Email service unreachable')
      }
    }
    loadUsers()
    checkEmailHealth()
  }, [])

  const filteredUsers = users.filter((u) => {
    const q = query.toLowerCase()
    return !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  })

  const canSend = selectedEmail && subject.trim().length > 0 && body.trim().length > 0 && !sending

  const handleSend = async () => {
    if (!canSend) return
    setSending(true)
    setResultMsg('')
    try {
      const base64Files = await Promise.all(
        files.map((f) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const r = reader.result
              const b64 = typeof r === 'string' ? r.replace(/^data:.*;base64,/, '') : ''
              resolve({ filename: f.name, contentBase64: b64, contentType: f.type })
            }
            reader.readAsDataURL(f)
          })
        )
      )
      const payload = { fromName: 'Leads Engine AI', to: selectedEmail, subject: subject.trim(), body: body.trim(), attachments: base64Files }
      const res = await fetch('/api/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      let json = {}
      try { json = await res.json() } catch (_) { json = {} }
      if (!res.ok || json?.ok === false) {
        const msg = (json && json.error) ? String(json.error) : `HTTP ${res.status}`
        throw new Error(msg)
      }
      setResultMsg('Email sent')
      setBody('')
      setFiles([])
    } catch (e) {
      const m = e && e.message ? String(e.message) : 'unknown error'
      setResultMsg(`Send failed: ${m}`)
    } finally {
      setSending(false)
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
                <SidebarMenuItem></SidebarMenuItem>
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
      </Sidebar>

      <SidebarInset>
        <div className="sticky top-0 z-0 flex h-14 sm:h-16 items-center gap-3 border-b bg-background/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <span className="text-base font-semibold">Messages</span>
          <div className="ml-auto flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=MS" />
              <AvatarFallback>MS</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <div className="text-sm font-medium">Admin</div>
              <div className="text-xs text-muted-foreground">admin@example.com</div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <Card className="md:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Users</CardTitle>
                <div className="relative">
                  <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" placeholder="Search users" />
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[48vh] sm:h-[56vh] lg:h-[60vh] overflow-y-auto space-y-2">
                  {filteredUsers.map((u) => (
                    <button key={u.email} className={`w-full rounded-md border p-2 text-left ${selectedEmail === u.email ? 'bg-muted' : 'bg-card'}`} onClick={() => { setSelectedEmail(u.email); setSelectedName(u.name || u.email) }}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.seed || 'US')}`} />
                          <AvatarFallback>{u.seed || 'US'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent((selectedName?.split(' ')?.map((s) => s[0]).join('')) || 'US')}`} />
                    <AvatarFallback>{(selectedName?.split(' ')?.map((s) => s[0]).join('')) || 'US'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{selectedName || 'Select a user'}</div>
                    <div className="text-xs text-muted-foreground">{selectedEmail || '—'}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="grid gap-2">
                    <div className="text-sm text-muted-foreground">Subject</div>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Write email subject" />
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <div className="text-sm text-muted-foreground">Message</div>
                    <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your email" className="min-h-[180px]" />
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                  <div className="md:col-span-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Attachments</div>
                      <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="mr-2 size-4" />Choose Files
                      </Button>
                    </div>
                    {files.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {files.map((f, i) => (
                          <div key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs">
                            <Paperclip className="size-3" />
                            <span className="truncate max-w-[160px]">{f.name}</span>
                            <Button variant="ghost" size="icon-sm" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                              <Trash className="size-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                <div className="md:col-span-2 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">{healthMsg || resultMsg}</div>
                    <Button onClick={handleSend} disabled={!canSend}>
                      {sending ? (<><Loader2 className="mr-2 size-4 animate-spin" />Sending…</>) : (<><Send className="mr-2 size-4" />Send</>)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
