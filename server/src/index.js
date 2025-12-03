import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename_env = fileURLToPath(import.meta.url)
const __dirname_env = path.dirname(__filename_env)
dotenv.config({ path: path.resolve(__dirname_env, '../.env') })

console.log('Loaded Env:', {
  SMTP_USER: process.env.SMTP_USER ? 'Set' : 'Not Set',
  SMTP_HOST: process.env.SMTP_HOST,
  PWD: process.cwd()
})

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))
const baseDir = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(baseDir, '../../public')
const defaultUploadsRoot = path.join(publicDir, 'uploads')
const altUploadsRoot = path.resolve(baseDir, '../../../leadsEngineAI/public/uploads')
const envUploadsRoot = process.env.UPLOADS_ROOT && process.env.UPLOADS_ROOT.trim().length > 0 ? process.env.UPLOADS_ROOT : ''
const uploadsRoot = envUploadsRoot || (fs.existsSync(defaultUploadsRoot) ? defaultUploadsRoot : (fs.existsSync(altUploadsRoot) ? altUploadsRoot : defaultUploadsRoot))

// Serve public and uploads (with fallback root detection)
app.use(express.static(publicDir))
app.get('/api/uploads/transactions/:filename', (req, res) => {
  const { filename } = req.params
  const p1 = path.join(uploadsRoot, 'transactions', filename)
  if (fs.existsSync(p1)) return res.sendFile(p1)
  const p2 = path.join(defaultUploadsRoot, 'transactions', filename)
  if (fs.existsSync(p2)) return res.sendFile(p2)
  const p3 = path.join(altUploadsRoot, 'transactions', filename)
  if (fs.existsSync(p3)) return res.sendFile(p3)
  res.status(404).json({ ok: false, error: 'File not found' })
})
app.use('/api/uploads', express.static(uploadsRoot))

const MONGODB_URI = process.env.MONGODB_URI
const PORT = process.env.PORT || 3001

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log(`MongoDB connected: ${MONGODB_URI}`)
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err?.message || err)
  })

// Minimal models for users and subscriptions
const User = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      email: String,
      firstName: String,
      lastName: String,
      phone: String,
      role: String,
      status: String,
      isActive: Boolean,
    },
    { collection: 'users' }
  )
)

const Subscription = mongoose.model(
  'Subscription',
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.Mixed },
      package: String,
      subscriptionDate: Date,
      expirationDate: Date,
      gmbLimit: { type: Number, default: 0 },
      instaLimit: { type: Number, default: 0 },
      twitterLimit: { type: Number, default: 0 },
      facebookLimit: { type: Number, default: 0 },
      transaction_img: String,
    },
    { collection: 'subscriptions', timestamps: true }
  )
)

const MailMessage = mongoose.model(
  'MailMessage',
  new mongoose.Schema(
    {
      from: String,
      to: [String],
      cc: [String],
      bcc: [String],
      subject: String,
      body: String,
      date: Date,
      direction: String,
      contactEmail: String,
      messageId: String,
      status: String,
      error: String,
    },
    { collection: 'mail_messages', timestamps: true }
  )
)

const MailThread = mongoose.model(
  'MailThread',
  new mongoose.Schema(
    {
      contactEmail: { type: String, index: true },
      subject: String,
    },
    { collection: 'mail_threads', timestamps: true }
  )
)

const Admin = mongoose.model(
  'Admin',
  new mongoose.Schema(
    {
      username: String,
      email: String,
      password: String,
    },
    { collection: 'admin_dashboard' }
  )
)

const Lead = mongoose.model(
  'Lead',
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.Mixed },
      platform: { type: String, enum: ['instagram', 'twitter', 'facebook', 'gmb'] },
      name: String,
      email: String,
      phone: String,
      location: String,
      profileUrl: String,
      followers: Number,
      bio: String,
      status: { type: String, default: 'active' },
    },
    { collection: 'leads', timestamps: true }
  )
)

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const admin = await Admin.findOne({ email, password }).lean()
    if (admin) {
      res.json({ ok: true, user: { email: admin.email, username: admin.username } })
    } else {
      res.status(401).json({ ok: false, error: 'Invalid credentials' })
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Login failed' })
  }
})

app.post('/api/seed-admin', async (req, res) => {
  try {
    const exists = await Admin.findOne({ email: 'admin@test.com' })
    if (!exists) {
      await Admin.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'password123'
      })
      res.json({ ok: true, message: 'Test admin created' })
    } else {
      res.json({ ok: true, message: 'Test admin already exists' })
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to seed admin' })
  }
})

app.post('/api/seed-test-leads', async (req, res) => {
  try {
    // Find or create test user with testing package
    let testUser = await User.findOne({ email: 'test1@gmail.com' })
    if (!testUser) {
      testUser = await User.create({
        email: 'test1@gmail.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        role: 'user',
        status: 'Active',
        isActive: true,
      })
    }

    // Ensure testing package subscription exists
    const existingSub = await Subscription.findOne({ userId: testUser._id, package: 'testing' })
    if (!existingSub) {
      const exp = new Date()
      exp.setMonth(exp.getMonth() + 12) // 12 months
      await Subscription.create({
        userId: testUser._id,
        package: 'testing',
        subscriptionDate: new Date(),
        expirationDate: exp,
        gmbLimit: 1000,
        instaLimit: 1000,
        twitterLimit: 1000,
        facebookLimit: 1000,
      })
    }

    // Remove existing test leads for this user
    await Lead.deleteMany({ userId: testUser._id })

    // Helper to generate test leads
    const generateLeads = (platform, count) => {
      const leads = []
      const platformNames = {
        instagram: ['InstaUser', 'PhotoPro', 'ContentCreator', 'Influencer', 'BrandBuilder'],
        twitter: ['TwitterUser', 'TechTweeter', 'NewsHawk', 'Blogger', 'Journalist'],
        facebook: ['FBUser', 'SocialBee', 'CommunityManager', 'PageAdmin', 'GroupMod'],
        gmb: ['LocalBiz', 'Restaurant', 'Cafe', 'Store', 'Service'],
      }
      
      const names = platformNames[platform] || ['User']
      
      for (let i = 1; i <= count; i++) {
        const baseName = names[i % names.length]
        leads.push({
          userId: testUser._id,
          platform: platform,
          name: `${baseName}${i}`,
          email: `${platform}user${i}@example.com`,
          phone: `+1${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`,
          location: ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ'][i % 5],
          profileUrl: `https://${platform}.com/${baseName.toLowerCase()}${i}`,
          followers: Math.floor(Math.random() * 10000) + 100,
          bio: `${platform} enthusiast and content creator. Love connecting with people!`,
          status: 'active',
        })
      }
      return leads
    }

    // Create 50 leads for each platform
    const instagramLeads = generateLeads('instagram', 50)
    const twitterLeads = generateLeads('twitter', 50)
    const facebookLeads = generateLeads('facebook', 50)
    const gmbLeads = generateLeads('gmb', 50)

    // Batch insert all leads
    await Lead.insertMany([...instagramLeads, ...twitterLeads, ...facebookLeads, ...gmbLeads])

    res.json({
      ok: true,
      message: 'Test leads created successfully',
      user: {
        id: String(testUser._id),
        email: testUser.email,
        name: `${testUser.firstName} ${testUser.lastName}`,
      },
      leadsCreated: {
        instagram: 50,
        twitter: 50,
        facebook: 50,
        gmb: 50,
        total: 200,
      },
    })
  } catch (err) {
    console.error('seed test leads error:', err)
    res.status(500).json({ ok: false, error: 'Failed to seed test leads', details: err.message })
  }
})

app.get('/api/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  const state = states[mongoose.connection.readyState] || 'unknown'
  res.json({ ok: true, db: state })
})

// Get leads for a user (with optional platform filter)
app.get('/api/leads/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { platform } = req.query
    
    const query = { userId }
    if (platform) {
      query.platform = platform
    }
    
    const leads = await Lead.find(query).sort({ createdAt: -1 }).lean()
    
    // Count by platform
    const counts = {
      instagram: await Lead.countDocuments({ userId, platform: 'instagram' }),
      twitter: await Lead.countDocuments({ userId, platform: 'twitter' }),
      facebook: await Lead.countDocuments({ userId, platform: 'facebook' }),
      gmb: await Lead.countDocuments({ userId, platform: 'gmb' }),
    }
    
    res.json({
      ok: true,
      count: leads.length,
      counts,
      total: counts.instagram + counts.twitter + counts.facebook + counts.gmb,
      leads: leads.map(l => ({
        id: String(l._id),
        platform: l.platform,
        name: l.name,
        email: l.email,
        phone: l.phone,
        location: l.location,
        profileUrl: l.profileUrl,
        followers: l.followers,
        bio: l.bio,
        status: l.status,
        createdAt: l.createdAt,
      })),
    })
  } catch (err) {
    console.error('get leads error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch leads' })
  }
})

// Aggregate users with subscriptions for contacts table
app.get('/api/contacts', async (req, res) => {
  try {
    const users = await User.find({}, 'email firstName lastName phone role status isActive').sort({ _id: -1 }).lean()
    const userIds = users.map((u) => String(u._id))

    const subs = await Subscription.find({}, 'userId user package expirationDate transaction_img gmbLimit instaLimit twitterLimit facebookLimit createdAt').sort({ createdAt: -1 }).lean()
    const latestByUser = new Map()
    const withImageByUser = new Map()
    for (const s of subs) {
      const key = String(s.userId ?? s.user ?? s.user_id ?? s.userID ?? '')
      if (!key) continue
      if (!latestByUser.has(key)) latestByUser.set(key, s)
      if (s.transaction_img && !withImageByUser.has(key)) withImageByUser.set(key, s)
    }

    const data = users.map((u) => {
      const key = String(u._id)
      const latest = latestByUser.get(key)
      const withImg = withImageByUser.get(key)
      const exp = latest?.expirationDate ? new Date(latest.expirationDate).toISOString().slice(0, 10) : ''
      const computedStatus = typeof u.isActive === 'boolean' ? (u.isActive ? 'Active' : 'Blocked') : (u.status || '')
      return {
        id: String(u._id),
        email: u.email || '',
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        phone: u.phone || '',
        role: u.role || 'User',
        status: computedStatus,
        pkg: latest?.package || '',
        exp,
        transaction_img: withImg?.transaction_img || '',
        // Platform credits/limits
        instagramCredits: latest?.instaLimit || 0,
        twitterCredits: latest?.twitterLimit || 0,
        facebookCredits: latest?.facebookLimit || 0,
        gmbCredits: latest?.gmbLimit || 0,
      }
    })

    res.json({ ok: true, count: data.length, data })
  } catch (err) {
    console.error('contacts error:', err)
    res.status(500).json({ ok: false, error: 'Failed to fetch contacts' })
  }
})

// Delete a user and associated subscriptions
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params
  try {
    const deletedUser = await User.findByIdAndDelete(id)
    if (!deletedUser) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }

    // Attempt to delete subscriptions linked by various possible fields
    const candidates = [id]
    if (mongoose.Types.ObjectId.isValid(id)) {
      candidates.push(new mongoose.Types.ObjectId(id))
    }
    const orClauses = [
      { userId: { $in: candidates } },
      { user: { $in: candidates } },
      { user_id: { $in: candidates } },
      { userID: { $in: candidates } },
    ]
    await Subscription.deleteMany({ $or: orClauses })

    res.json({ ok: true, deletedUserId: String(deletedUser._id) })
  } catch (err) {
    console.error('delete user error:', err)
    res.status(500).json({ ok: false, error: 'Failed to delete user' })
  }
})

// Update a user (e.g., toggle isActive or update status)
app.patch('/api/users/:id', async (req, res) => {
  const { id } = req.params
  const { isActive, status } = req.body || {}
  try {
    const update = {}
    const prev = await User.findById(id).lean()
    if (typeof isActive === 'boolean') update.isActive = isActive
    if (typeof status === 'string') update.status = status

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ ok: false, error: 'No valid fields to update' })
    }

    const updated = await User.findByIdAndUpdate(id, update, { new: true })
    if (!updated) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }

    res.json({ ok: true, user: { id: String(updated._id), isActive: !!updated.isActive, status: updated.status || (updated.isActive ? 'Active' : 'Blocked') } })

    const wasActive = !!(prev && prev.isActive)
    const nowActive = !!updated.isActive
    const prevStatus = String(prev?.status || (wasActive ? 'Active' : 'Blocked')).trim()
    const nowStatus = String(updated.status || (nowActive ? 'Active' : 'Blocked')).trim()
    const recipient = updated.email || ''
    if (recipient && pooledTransporter) {
      const senderEmail = SMTP_USER
      let mail = null
      const loginUrl = 'http://localhost:3000/auth/login'
      if (!wasActive && nowActive) {
        mail = {
          from: `Leads Engine AI <${senderEmail}>`,
          to: recipient,
          subject: 'Account status updated: Active',
          text: `Your Leads Engine AI account is now Active. Login: ${loginUrl}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
              <h2 style="margin:0 0 8px">Your account is now Active</h2>
              <p style="margin:0 0 12px">Welcome back! Click the button below to login.</p>
              <p style="margin:0 0 16px">
                <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Login</a>
              </p>
              <p style="font-size:12px;color:#555;margin:0">If the button doesn’t work, copy and paste this link: ${loginUrl}</p>
            </div>`,
        }
      } else if (wasActive && !nowActive) {
        mail = {
          from: `Leads Engine AI <${senderEmail}>`,
          to: recipient,
          subject: 'Account status updated: Blocked',
          text: `Your Leads Engine AI account has been Blocked. You may try to login here: ${loginUrl}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
              <h2 style="margin:0 0 8px">Your account has been Blocked</h2>
              <p style="margin:0 0 12px">If you believe this is a mistake, please reach out to support.</p>
              <p style="margin:0 0 16px">
                <a href="${loginUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Login</a>
              </p>
              <p style="font-size:12px;color:#555;margin:0">If the button doesn’t work, copy and paste this link: ${loginUrl}</p>
            </div>`,
        }
      } else {
        const p = prevStatus.toLowerCase()
        const n = nowStatus.toLowerCase()
        if (p !== 'active' && n === 'active') {
          mail = {
            from: `Leads Engine AI <${senderEmail}>`,
            to: recipient,
            subject: 'Account status updated: Active',
            text: `Your Leads Engine AI account is now Active. Login: ${loginUrl}`,
            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
                <h2 style="margin:0 0 8px">Your account is now Active</h2>
                <p style="margin:0 0 12px">Welcome back! Click the button below to login.</p>
                <p style="margin:0 0 16px">
                  <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Login</a>
                </p>
                <p style="font-size:12px;color:#555;margin:0">If the button doesn’t work, copy and paste this link: ${loginUrl}</p>
              </div>`,
          }
        } else if (p !== 'blocked' && n === 'blocked') {
          mail = {
            from: `Leads Engine AI <${senderEmail}>`,
            to: recipient,
            subject: 'Account status updated: Blocked',
            text: `Your Leads Engine AI account has been Blocked. You may try to login here: ${loginUrl}`,
            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
                <h2 style="margin:0 0 8px">Your account has been Blocked</h2>
                <p style="margin:0 0 12px">If you believe this is a mistake, please reach out to support.</p>
                <p style="margin:0 0 16px">
                  <a href="${loginUrl}" style="display:inline-block;background:#ef4444;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px">Login</a>
                </p>
                <p style="font-size:12px;color:#555;margin:0">If the button doesn’t work, copy and paste this link: ${loginUrl}</p>
              </div>`,
          }
        }
      }
      if (mail) {
        setImmediate(async () => {
          try {
            const info = await pooledTransporter.sendMail(mail)
            await MailMessage.create({
              from: senderEmail,
              to: [recipient],
              cc: [],
              bcc: [],
              subject: mail.subject,
              body: mail.text,
              date: new Date(),
              direction: 'out',
              contactEmail: recipient,
              messageId: info.messageId || '',
              status: 'sent',
            })
          } catch (err) {
            const msg = (err && (err.response || err.message)) ? String(err.response || err.message).slice(0, 500) : 'unknown error'
            await MailMessage.create({
              from: senderEmail,
              to: [recipient],
              cc: [],
              bcc: [],
              subject: mail.subject,
              body: mail.text,
              date: new Date(),
              direction: 'out',
              contactEmail: recipient,
              messageId: '',
              status: 'failed',
              error: msg,
            })
          }
        })
      }
    }
  } catch (err) {
    console.error('patch user error:', err)
    res.status(500).json({ ok: false, error: 'Failed to update user' })
  }
})

// Create a subscription for a user
app.post('/api/subscriptions', async (req, res) => {
  try {
    const { userId, package: pkg, expirationDate, months, transactionImageBase64, transactionImageName } = req.body || {}
    if (!userId || !pkg) {
      return res.status(400).json({ ok: false, error: 'userId and package are required' })
    }

    // Ensure user exists
    const user = await User.findById(userId).lean()
    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' })
    }

    // Compute expiration
    let exp = null
    if (expirationDate) {
      const d = new Date(expirationDate)
      exp = isNaN(d.getTime()) ? null : d
    } else if (typeof months === 'number' && months > 0) {
      const d = new Date()
      d.setMonth(d.getMonth() + months)
      exp = d
    } else {
      // Default: 30 days
      const d = new Date()
      d.setDate(d.getDate() + 30)
      exp = d
    }

    // Store Mixed user id (ObjectId if valid, else string)
    const userIdValue = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId

    // Plan limits mapping (case-insensitive)
    const key = String(pkg).trim().toLowerCase()
    const limits =
      key === 'starter'
        ? { gmbLimit: 1000, instaLimit: 1000, twitterLimit: 1000, facebookLimit: 1000 }
        : key === 'growth'
          ? { gmbLimit: 2000, instaLimit: 2000, twitterLimit: 2000, facebookLimit: 2000 }
          : key === 'pro'
            ? { gmbLimit: 3000, instaLimit: 3000, twitterLimit: 3000, facebookLimit: 3000 }
            : key === 'testing'
              ? { gmbLimit: 1000, instaLimit: 1000, twitterLimit: 1000, facebookLimit: 1000 }
              : { gmbLimit: 0, instaLimit: 0, twitterLimit: 0, facebookLimit: 0 }

    // Optional: save transaction image if provided (base64 data URL or raw base64)
    let transactionImageUrl = ''
    if (typeof transactionImageBase64 === 'string' && transactionImageBase64.length > 0) {
      ensureUploadsDir()
      try {
        const isDataUrl = transactionImageBase64.startsWith('data:')
        let base64 = transactionImageBase64
        let ext = ''
        if (isDataUrl) {
          const match = transactionImageBase64.match(/^data:(.+?);base64,(.*)$/)
          if (match) {
            const mime = match[1]
            base64 = match[2]
            ext = mime === 'image/png' ? '.png' : mime === 'image/jpeg' ? '.jpg' : mime === 'image/webp' ? '.webp' : ''
          }
        }
        if (!ext && typeof transactionImageName === 'string') {
          const parsed = path.parse(transactionImageName)
          ext = parsed.ext || ext
        }

        const safeExt = ext && ext.length <= 6 ? ext : '.png'
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const filename = `txn-${unique}${safeExt}`
        const filePath = path.join(uploadsDir, filename)
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'))
        transactionImageUrl = `/uploads/transactions/${filename}`
      } catch (e) {
        console.error('transaction image save error:', e)
      }
    }

    const created = await Subscription.create({
      userId: userIdValue,
      package: pkg,
      subscriptionDate: new Date(),
      expirationDate: exp,
      ...limits,
      transaction_img: transactionImageUrl,
    })

    res.json({
      ok: true,
      subscription: {
        id: String(created._id),
        userId: String(userId),
        package: created.package,
        subscriptionDate: created.subscriptionDate ? created.subscriptionDate.toISOString() : null,
        expirationDate: created.expirationDate ? created.expirationDate.toISOString() : null,
        gmbLimit: created.gmbLimit,
        instaLimit: created.instaLimit,
        twitterLimit: created.twitterLimit,
        facebookLimit: created.facebookLimit,
        transaction_img: created.transaction_img || '',
        createdAt: created.createdAt?.toISOString?.() ?? null,
        updatedAt: created.updatedAt?.toISOString?.() ?? null,
      },
    })
  } catch (err) {
    console.error('create subscription error:', err)
    res.status(500).json({ ok: false, error: 'Failed to create subscription' })
  }
})

// Reusable pooled SMTP transporter to reduce handshake latency
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com'
const SMTP_PORT = Number(process.env.SMTP_PORT || 465)
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true'
let pooledTransporter = null
if (SMTP_USER && SMTP_PASS) {
  pooledTransporter = nodemailer.createTransport({
    pool: true,
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    maxConnections: 1,
    maxMessages: Infinity,
  })
  pooledTransporter.verify()
    .then(() => { console.log('SMTP ready') })
    .catch((err) => { try { console.error('SMTP verify failed:', String(err && (err.response || err.message) || '').slice(0, 200)) } catch (_) { } })
}

app.get('/api/email/health', async (req, res) => {
  let ready = false
  let error = ''
  if (pooledTransporter) {
    try {
      await pooledTransporter.verify()
      ready = true
    } catch (e) {
      ready = false
      error = String(e && (e.response || e.message) || '').slice(0, 200)
    }
  }
  res.json({ ok: true, ready, host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, userSet: !!SMTP_USER, error })
})

app.post('/api/email/send', async (req, res) => {
  try {
    const { fromName, fromEmail, to, cc, bcc, subject, body, attachments } = req.body || {}
    if (!SMTP_USER || !SMTP_PASS) {
      return res.status(400).json({ ok: false, error: 'SMTP credentials missing' })
    }
    if (!to || !subject) {
      return res.status(400).json({ ok: false, error: 'to and subject required' })
    }

    const normalizedAttachments = Array.isArray(attachments)
      ? attachments
        .filter((a) => a && a.filename && a.contentBase64)
        .map((a) => ({ filename: a.filename, content: Buffer.from(a.contentBase64, 'base64'), contentType: a.contentType || undefined }))
      : []
    const senderEmail = fromEmail && fromEmail.includes('@') ? fromEmail : SMTP_USER
    let threadSubject = subject
    try {
      const existingThread = await MailThread.findOne({ contactEmail: String(to).trim().toLowerCase() }).lean()
      if (existingThread && existingThread.subject) threadSubject = existingThread.subject
    } catch (_) { }
    const mail = {
      from: fromName ? `${fromName} <${senderEmail}>` : senderEmail,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject: threadSubject || subject || '',
      text: body || '',
      html: body || '',
      attachments: normalizedAttachments,
    }

    const recipients = []
    if (Array.isArray(mail.to)) recipients.push(...mail.to)
    else if (typeof mail.to === 'string') recipients.push(...String(mail.to).split(',').map((s) => s.trim()).filter(Boolean))
    const contact = recipients[0] || ''
    const queued = await MailMessage.create({
      from: senderEmail,
      to: recipients,
      cc: typeof mail.cc === 'string' ? mail.cc.split(',').map((s) => s.trim()).filter(Boolean) : [],
      bcc: typeof mail.bcc === 'string' ? mail.bcc.split(',').map((s) => s.trim()).filter(Boolean) : [],
      subject: mail.subject || '',
      body: mail.text || mail.html || '',
      date: new Date(),
      direction: 'out',
      contactEmail: contact,
      messageId: '',
      status: 'queued',
    })

    // Respond immediately
    res.json({ ok: true, queued: true, id: String(queued._id) })

    // Send in background using pooled transporter
    setImmediate(async () => {
      try {
        const info = await pooledTransporter.sendMail(mail)
        await MailMessage.findByIdAndUpdate(queued._id, { status: 'sent', messageId: info.messageId || '' })
      } catch (err) {
        const msg = (err && (err.response || err.message)) ? String(err.response || err.message).slice(0, 500) : 'unknown error'
        try { console.error('SMTP send error:', msg) } catch (_) { }
        await MailMessage.findByIdAndUpdate(queued._id, { status: 'failed', error: msg })
      }
    })
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to queue email' })
  }
})

app.get('/api/chat/thread', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase()
  if (!email) return res.status(400).json({ ok: false, error: 'email required' })
  try {
    const t = await MailThread.findOne({ contactEmail: email }).lean()
    res.json({ ok: true, subject: t?.subject || '' })
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch thread subject' })
  }
})

app.post('/api/chat/thread', async (req, res) => {
  const { email, subject } = req.body || {}
  const e = String(email || '').trim().toLowerCase()
  const s = String(subject || '').trim()
  if (!e || !s) return res.status(400).json({ ok: false, error: 'email and subject required' })
  try {
    const t = await MailThread.findOneAndUpdate({ contactEmail: e }, { subject: s }, { upsert: true, new: true })
    res.json({ ok: true, subject: t.subject })
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to set thread subject' })
  }
})

app.post('/api/chat/sync-inbox', async (req, res) => {
  const user = process.env.IMAP_USER || process.env.SMTP_USER || ''
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS || ''
  const host = process.env.IMAP_HOST || 'imap.hostinger.com'
  const port = Number(process.env.IMAP_PORT || 993)
  const secure = String(process.env.IMAP_SECURE || 'true').toLowerCase() === 'true'
  if (!user || !pass) {
    return res.status(400).json({ ok: false, error: 'IMAP credentials missing' })
  }
  const client = new ImapFlow({ host, port, secure, auth: { user, pass } })
  try {
    await client.connect()
    await client.mailboxOpen('INBOX')
    const total = client.mailbox.exists || 0
    const startSeq = Math.max(1, total - 50)
    for await (const msg of client.fetch({ seq: `${startSeq}:*` }, { envelope: true, bodyStructure: true })) {
      const env = msg.envelope || {}
      const fromAddr = Array.isArray(env.from) && env.from[0] ? `${env.from[0].mailbox}@${env.from[0].host}` : ''
      const toList = (Array.isArray(env.to) ? env.to : []).map((a) => `${a.mailbox}@${a.host}`)
      const subject = env.subject || ''
      const date = env.date ? new Date(env.date) : new Date()
      const contact = fromAddr && fromAddr.toLowerCase() !== user.toLowerCase() ? fromAddr : (toList[0] || '')
      let body = ''
      const bs = msg.bodyStructure || {}
      const findPlain = (node) => {
        if (!node) return null
        if (node.type === 'text' && node.subtype === 'plain') return node.part
        if (Array.isArray(node.childNodes)) {
          for (const ch of node.childNodes) {
            const p = findPlain(ch)
            if (p) return p
          }
        }
        return null
      }
      const partId = findPlain(bs)
      if (partId) {
        const { content } = await client.download(msg.uid, partId)
        body = await new Promise((resolve) => {
          const chunks = []
          content.on('data', (d) => chunks.push(d))
          content.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
          content.on('error', () => resolve(''))
        })
      }
      const exists = await MailMessage.findOne({ messageId: msg.messageId }).lean()
      if (!exists) {
        await MailMessage.create({
          from: fromAddr,
          to: toList,
          cc: [],
          bcc: [],
          subject,
          body,
          date,
          direction: fromAddr.toLowerCase() === (user || '').toLowerCase() ? 'out' : 'in',
          contactEmail: contact,
          messageId: msg.messageId || '',
        })
      }
    }
    await client.logout()
    res.json({ ok: true })
  } catch (err) {
    try { await client.logout() } catch (_) { }
    res.status(500).json({ ok: false, error: 'Failed to sync inbox' })
  }
})

app.get('/api/chat/conversations', async (req, res) => {
  try {
    const onlyMessaged = String(req.query.onlyMessaged || '').toLowerCase() === 'true'
    if (onlyMessaged) {
      // Build list from mail_messages distinct contacts
      const aggr = await MailMessage.aggregate([
        { $match: { contactEmail: { $ne: '' } } },
        { $group: { _id: '$contactEmail', lastDate: { $max: '$date' } } },
        { $sort: { lastDate: -1 } },
      ])
      const emails = aggr.map((a) => a._id)
      const users = await User.find({ email: { $in: emails } }, 'email firstName lastName status isActive').lean()
      const userByEmail = new Map(users.map((u) => [u.email, u]))
      const data = []
      for (const e of emails) {
        const u = userByEmail.get(e) || {}
        const last = await MailMessage.findOne({ contactEmail: e }).sort({ date: -1 }).lean()
        const computedStatus = typeof u.isActive === 'boolean' ? (u.isActive ? 'Active' : 'Blocked') : (u.status || '')
        const seed = `${(u.firstName?.[0] || e?.[0] || '').toUpperCase()}${(u.lastName?.[0] || '')}`
        data.push({
          email: e,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || e,
          last: last?.subject || (last?.body || '').slice(0, 80),
          time: last?.date ? last.date.toISOString() : '',
          seed,
          status: computedStatus || '',
        })
      }
      return res.json({ ok: true, conversations: data })
    }

    // Default: full users list
    const users = await User.find({}, 'email firstName lastName status isActive').sort({ _id: -1 }).lean()
    const data = []
    for (const u of users) {
      const email = u.email || ''
      const last = await MailMessage.findOne({ contactEmail: email }).sort({ date: -1 }).lean()
      const computedStatus = typeof u.isActive === 'boolean' ? (u.isActive ? 'Active' : 'Blocked') : (u.status || '')
      data.push({
        email,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || email,
        last: last?.subject || (last?.body || '').slice(0, 80),
        time: last?.date ? last.date.toISOString() : '',
        seed: (u.firstName?.[0] || '') + (u.lastName?.[0] || ''),
        status: computedStatus,
      })
    }
    res.json({ ok: true, conversations: data })
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch conversations' })
  }
})

app.get('/api/chat/messages', async (req, res) => {
  const email = String(req.query.email || '').trim()
  const subject = String(req.query.subject || '').trim()
  if (!email) return res.status(400).json({ ok: false, error: 'email required' })
  try {
    const me = (process.env.SMTP_USER || '').toLowerCase()
    const query = { contactEmail: email }
    if (subject) query.subject = subject
    const items = await MailMessage.find(query).sort({ date: 1 }).lean()
    const messages = items.map((m) => ({
      id: String(m._id),
      author: (m.from || '').toLowerCase() === me ? 'me' : (m.direction === 'out' ? 'me' : 'them'),
      text: m.body || m.subject || '',
      at: m.date ? m.date.toISOString() : '',
      status: m.status || '',
      messageId: m.messageId || '',
    }))
    res.json({ ok: true, messages })
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Failed to fetch messages' })
  }
})

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`)
})
// Resolve paths for saving uploads into admin-dashboard/public/uploads
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(uploadsRoot, 'transactions')
function ensureUploadsDir() {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true })
  } catch (_) { }
}
