# Test Leads Seeding Guide

This guide explains how to seed test leads for the testing package user.

## What Was Added

### 1. Lead Model
A new `Lead` model was added to the database with the following fields:
- `userId` - Reference to the user
- `platform` - One of: instagram, twitter, facebook, gmb
- `name` - Lead's name
- `email` - Lead's email
- `phone` - Lead's phone number
- `location` - Lead's location
- `profileUrl` - Social media profile URL
- `followers` - Number of followers
- `bio` - Biography/description
- `status` - Lead status (default: 'active')

### 2. Updated Testing Package Limits
The testing package now has the following limits:
- GMB: 1000
- Instagram: 1000
- Twitter: 1000
- Facebook: 1000

(Previously Instagram, Twitter, and Facebook were 0)

### 3. New API Endpoints

#### Seed Test Leads (POST)
```
POST /api/seed-test-leads
```
Creates a test user (test1@gmail.com) with testing package and seeds 200 leads:
- 50 Instagram leads
- 50 Twitter leads
- 50 Facebook leads
- 50 GMB leads

#### Get User Leads (GET)
```
GET /api/leads/:userId?platform=instagram
```
Retrieves all leads for a user. Optional `platform` query parameter to filter by platform.

Response includes:
- Total count
- Count by platform
- Array of lead objects

## How to Use

### Method 1: Run the Seed Script Directly
```bash
cd server
npm run seed:test-leads
```

This will:
1. Connect to your MongoDB database
2. Create/find test user (test1@gmail.com)
3. Create/update testing package subscription
4. Delete existing test leads
5. Insert 200 new test leads (50 per platform)
6. Display verification results

### Method 2: Use the API Endpoint
```bash
# Start the server first
cd server
npm run dev

# In another terminal, call the API endpoint
curl -X POST http://localhost:3001/api/seed-test-leads
```

### Method 3: Test from Frontend
You can create a button in your admin dashboard that calls the `/api/seed-test-leads` endpoint.

## Verify the Data

After seeding, you can verify the data using:

### Get All Leads for Test User
```bash
# First, get the user ID from the seed output or database
curl http://localhost:3001/api/leads/USER_ID_HERE
```

### Get Leads by Platform
```bash
curl http://localhost:3001/api/leads/USER_ID_HERE?platform=instagram
curl http://localhost:3001/api/leads/USER_ID_HERE?platform=twitter
curl http://localhost:3001/api/leads/USER_ID_HERE?platform=facebook
curl http://localhost:3001/api/leads/USER_ID_HERE?platform=gmb
```

## Test User Details

**Email:** test1@gmail.com  
**Password:** (depends on your user creation process)  
**Package:** testing  
**Subscription:** 12 months from seed date

## Sample Lead Data

The seed script generates realistic test data:

**Instagram Leads:**
- Names: InstaUser1-50, PhotoPro, ContentCreator, Influencer, BrandBuilder
- Emails: instagramuser1@example.com through instagramuser50@example.com
- Random followers (100-10,000)
- Random locations across 5 major US cities

**Twitter Leads:**
- Names: TwitterUser1-50, TechTweeter, NewsHawk, Blogger, Journalist
- Similar pattern for emails and profiles

**Facebook Leads:**
- Names: FBUser1-50, SocialBee, CommunityManager, PageAdmin, GroupMod

**GMB Leads:**
- Names: LocalBiz1-50, Restaurant, Cafe, Store, Service

All leads include:
- Unique email addresses
- Random phone numbers
- Rotating locations (NY, LA, Chicago, Houston, Phoenix)
- Platform-specific profile URLs
- Random follower counts
- Generic bios

## Notes

- Running the seed script multiple times will delete and recreate the leads
- The test user will be created if it doesn't exist
- The testing package subscription will be created/updated automatically
- All leads are marked as 'active' status by default

## Troubleshooting

**"MONGODB_URI is not set"**
- Make sure your `.env` file in the server folder has the `MONGODB_URI` variable set

**"Failed to seed test leads"**
- Check that MongoDB is running and accessible
- Verify your connection string in `.env`
- Check server logs for detailed error messages

**No leads showing up**
- Verify the user ID you're querying matches the test user
- Check MongoDB directly: `db.leads.find({ userId: ObjectId("...") })`
- Ensure the API endpoint `/api/leads/:userId` is working

