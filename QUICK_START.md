# 🚀 Quick Start - Testing Package Leads

## ✅ Everything is Ready!

Your testing package can now receive 200 test leads (50 Instagram, 50 Twitter, 50 Facebook, 50 GMB) automatically.

---

## 3 Ways to Use (Pick One)

### Option 1: Add Button to Admin Dashboard (EASIEST) ⭐

**Step 1:** Add the button component to your contacts page

Edit `src/components/layout/ContactsLayout.jsx` and add near the top:

```jsx
import SeedTestLeadsButton from '../SeedTestLeadsButton'

// Then add the button in your UI, for example:
<div className="flex gap-2">
  <SeedTestLeadsButton />
  {/* your other buttons */}
</div>
```

**Step 2:** Click the button!

That's it! The button will:
- Create test user (test1@gmail.com) with testing package
- Generate 200 leads (50 per platform)
- Show success dialog with details

---

### Option 2: Call API Directly

**Step 1:** Start your server
```bash
cd server
npm run dev
```

**Step 2:** Call the endpoint
```bash
curl -X POST http://localhost:3001/api/seed-test-leads
```

Or in your browser console:
```javascript
fetch('/api/seed-test-leads', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
```

---

### Option 3: Run Seed Script

```bash
cd server
npm run seed:test-leads
```

---

## What Gets Created

**Test User:**
- Email: test1@gmail.com
- Name: Test User
- Package: testing (with 1000 limit per platform)

**200 Leads:**
- 50 Instagram leads (instagramuser1-50@example.com)
- 50 Twitter leads (twitteruser1-50@example.com)
- 50 Facebook leads (facebookuser1-50@example.com)
- 50 GMB leads (gmbuser1-50@example.com)

Each lead has: name, email, phone, location, profile URL, followers, bio, and active status.

---

## Verify It Worked

After seeding, check the response includes:
```json
{
  "ok": true,
  "leadsCreated": {
    "instagram": 50,
    "twitter": 50,
    "facebook": 50,
    "gmb": 50,
    "total": 200
  }
}
```

---

## Need Help?

📖 **Full Documentation:**
- `README_TESTING_PACKAGE_LEADS.md` - Complete guide
- `server/SEED_TEST_LEADS_GUIDE.md` - Detailed examples
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `TESTING_PACKAGE_LEADS_CHECKLIST.md` - Implementation checklist

---

## That's It! 🎉

Pick your preferred option and start seeding test leads in seconds.

**Tip:** Option 1 (button) is the easiest for regular use!

