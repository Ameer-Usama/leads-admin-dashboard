# Testing Package Limits - Updated

## ✅ Change Applied

Updated the **testing package** limits from 1000 to **50 leads per platform**.

---

## 📊 Updated Testing Package Limits

| Platform  | Old Limit | New Limit |
|-----------|-----------|-----------|
| Instagram | 1,000     | **50**    |
| Twitter   | 1,000     | **50**    |
| Facebook  | 1,000     | **50**    |
| GMB       | 1,000     | **50**    |

---

## 🎯 When This Applies

When an admin **unblocks a user** and selects the **"testing" package**, the user will now receive:

✅ **50 Instagram leads**  
✅ **50 Twitter leads**  
✅ **50 Facebook leads**  
✅ **50 GMB leads**  

**Total: 200 leads** (instead of 4,000)

---

## 📝 Updated Files

1. **`server/src/index.js`**
   - Line 598: Subscription creation limits
   - Lines 214-217: Seed test leads API endpoint

2. **`server/seed-test-leads.js`**
   - Lines 137-140: Seed script limits

---

## 📋 All Package Limits (Updated)

| Package | Instagram | Twitter | Facebook | GMB   | Total  |
|---------|-----------|---------|----------|-------|--------|
| Starter | 1,000     | 1,000   | 1,000    | 1,000 | 4,000  |
| Growth  | 2,000     | 2,000   | 2,000    | 2,000 | 8,000  |
| Pro     | 3,000     | 3,000   | 3,000    | 3,000 | 12,000 |
| **Testing** | **50** | **50** | **50** | **50** | **200** |

---

## 🔍 How to Verify

1. **Unblock a user:**
   - Go to `/contacts` page
   - Find a blocked user
   - Click Actions → Unblock
   - Select "Testing" package

2. **Check the credits:**
   - Look at the platform credit columns
   - You should see:
     - 📸 Instagram: **50**
     - 🐦 Twitter: **50**
     - 📘 Facebook: **50**
     - 🏢 GMB: **50**

3. **Verify in database:**
   ```javascript
   // The subscription document should have:
   {
     package: "testing",
     gmbLimit: 50,
     instaLimit: 50,
     twitterLimit: 50,
     facebookLimit: 50
   }
   ```

---

## 💡 Purpose

The testing package is designed for:
- **Testing purposes** - Smaller limit for quick testing
- **Demo accounts** - Limited access for demonstrations  
- **Trial users** - Test the platform before committing to a paid plan
- **QA/Testing** - Quality assurance with controlled data

With **50 leads per platform**, it provides enough data to test all features without overwhelming the system with test data.

---

## ✅ Benefits

✅ **More appropriate for testing** - 50 is enough to test functionality  
✅ **Reduces test data** - Keeps database cleaner  
✅ **Matches seed script** - Seed script creates 50 leads per platform  
✅ **Clear distinction** - Easy to distinguish test users from real subscribers  

---

## 🚀 Next Steps

The changes are already live. When you:

1. **Unblock a user** with testing package → Gets 50 per platform
2. **Run seed script** → Creates user with 50 per platform  
3. **Call seed API** → Creates subscription with 50 per platform

All testing package subscriptions going forward will have the new 50-lead limits!

---

## 📚 Related Documentation

- Platform credits display: `PLATFORM_CREDITS_COLUMNS_SUMMARY.md`
- Test leads seeding: `README_TESTING_PACKAGE_LEADS.md`
- Quick reference: `CREDITS_COLUMNS_QUICK_GUIDE.md`

---

**Updated:** December 3, 2025  
**Status:** ✅ Complete - Testing package now assigns 50 leads per platform

