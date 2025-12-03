import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set in .env file')
  process.exit(1)
}

// Define models
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

// Helper to generate test leads
const generateLeads = (userId, platform, count) => {
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
      userId: userId,
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

// Main seed function
async function seedTestLeads() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find or create test user with testing package
    console.log('Finding/creating test user...')
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
      console.log('Test user created:', testUser.email)
    } else {
      console.log('Test user found:', testUser.email)
    }

    // Ensure testing package subscription exists
    console.log('Checking subscription...')
    const existingSub = await Subscription.findOne({ userId: testUser._id, package: 'testing' })
    if (!existingSub) {
      const exp = new Date()
      exp.setMonth(exp.getMonth() + 12) // 12 months
      await Subscription.create({
        userId: testUser._id,
        package: 'testing',
        subscriptionDate: new Date(),
        expirationDate: exp,
        gmbLimit: 50,
        instaLimit: 50,
        twitterLimit: 50,
        facebookLimit: 50,
      })
      console.log('Testing package subscription created')
    } else {
      console.log('Testing package subscription already exists')
    }

    // Remove existing test leads for this user
    console.log('Removing existing test leads...')
    const deleteResult = await Lead.deleteMany({ userId: testUser._id })
    console.log(`Deleted ${deleteResult.deletedCount} existing leads`)

    // Create 50 leads for each platform
    console.log('Generating leads...')
    const instagramLeads = generateLeads(testUser._id, 'instagram', 50)
    const twitterLeads = generateLeads(testUser._id, 'twitter', 50)
    const facebookLeads = generateLeads(testUser._id, 'facebook', 50)
    const gmbLeads = generateLeads(testUser._id, 'gmb', 50)

    console.log('Inserting leads into database...')
    await Lead.insertMany([...instagramLeads, ...twitterLeads, ...facebookLeads, ...gmbLeads])

    console.log('✅ Successfully seeded test leads!')
    console.log('-----------------------------------')
    console.log('User:', testUser.email)
    console.log('User ID:', String(testUser._id))
    console.log('Package: testing')
    console.log('-----------------------------------')
    console.log('Leads created:')
    console.log('  Instagram: 50')
    console.log('  Twitter: 50')
    console.log('  Facebook: 50')
    console.log('  GMB: 50')
    console.log('  Total: 200')
    console.log('-----------------------------------')

    // Verify counts
    const counts = {
      instagram: await Lead.countDocuments({ userId: testUser._id, platform: 'instagram' }),
      twitter: await Lead.countDocuments({ userId: testUser._id, platform: 'twitter' }),
      facebook: await Lead.countDocuments({ userId: testUser._id, platform: 'facebook' }),
      gmb: await Lead.countDocuments({ userId: testUser._id, platform: 'gmb' }),
    }

    console.log('Verification:')
    console.log(`  Instagram: ${counts.instagram}`)
    console.log(`  Twitter: ${counts.twitter}`)
    console.log(`  Facebook: ${counts.facebook}`)
    console.log(`  GMB: ${counts.gmb}`)
    console.log(`  Total: ${counts.instagram + counts.twitter + counts.facebook + counts.gmb}`)

    await mongoose.connection.close()
    console.log('Database connection closed')
    process.exit(0)
  } catch (err) {
    console.error('Error seeding test leads:', err)
    process.exit(1)
  }
}

// Run the seed function
seedTestLeads()

