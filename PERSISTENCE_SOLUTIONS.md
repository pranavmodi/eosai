# 🗄️ Persistent Storage Solutions for Reports

## ⚠️ Current Limitation

**The current in-memory storage does NOT persist after Netlify rebuilds.** Reports will be lost when:
- Code is deployed (git push)
- Manual Netlify deployment
- Environment variables are changed
- Any site rebuild occurs

## 🔧 Persistent Storage Options

### Option 1: Supabase (Recommended) ⭐

**Cost**: Free tier available, $25/month for production
**Setup Time**: 10 minutes
**Reliability**: Excellent

#### Setup Steps:
1. Create a Supabase project at https://supabase.com
2. Create a reports table:
```sql
CREATE TABLE reports (
  id TEXT PRIMARY KEY,
  company_slug TEXT UNIQUE,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```
3. Add environment variables to Netlify:
```bash
DATABASE_TYPE=supabase
DATABASE_URL=https://your-project.supabase.co
DATABASE_KEY=your-anon-key
```

### Option 2: Airtable (Easy Setup)

**Cost**: Free tier available, $20/month for production
**Setup Time**: 5 minutes
**Reliability**: Good

#### Setup Steps:
1. Create an Airtable base with a "Reports" table
2. Add columns: ID, Company Slug, Company Name, Title, Published Date, Data
3. Get your API key and base ID
4. Add environment variables:
```bash
DATABASE_TYPE=airtable
DATABASE_URL=your-base-id
DATABASE_KEY=your-api-key
```

### Option 3: FaunaDB (Serverless)

**Cost**: Free tier available, pay-per-use
**Setup Time**: 15 minutes  
**Reliability**: Excellent

#### Setup Steps:
1. Create a FaunaDB database
2. Create a reports collection
3. Add environment variables:
```bash
DATABASE_TYPE=fauna
DATABASE_KEY=your-fauna-secret
```

### Option 4: PostgreSQL/MySQL (Traditional)

**Cost**: $5-50/month depending on provider
**Setup Time**: 20 minutes
**Reliability**: Excellent

#### Providers:
- **Neon** (PostgreSQL, serverless): https://neon.tech
- **Railway** (PostgreSQL/MySQL): https://railway.app
- **PlanetScale** (MySQL, serverless): https://planetscale.com

## 🚀 Quick Implementation

### 1. Replace Current Function
Replace `netlify/functions/publish-report.js` with the persistent version:

```bash
mv netlify/functions/publish-report.js netlify/functions/publish-report-backup.js
mv netlify/functions/publish-report-persistent.js netlify/functions/publish-report.js
```

### 2. Choose Your Database
Pick one of the options above and add the environment variables to Netlify.

### 3. Update Retrieval Functions
Update `get-reports.js` and `get-report.js` to fetch from your chosen database.

## 📋 Supabase Implementation (Recommended)

### Complete Working Example:

#### 1. Database Schema
```sql
-- Run this in Supabase SQL editor
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  company_slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  published_date DATE,
  author JSONB,
  metrics JSONB,
  tags TEXT[],
  read_time TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_company_slug ON reports(company_slug);
CREATE INDEX IF NOT EXISTS idx_reports_published_date ON reports(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_industry ON reports(industry);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access
CREATE POLICY "Allow read access to reports" ON reports FOR SELECT USING (true);

-- Create policy to allow insert/update (you might want to restrict this)
CREATE POLICY "Allow insert/update to reports" ON reports FOR ALL USING (true);
```

#### 2. Environment Variables
In Netlify dashboard, add:
```
DATABASE_TYPE=supabase
DATABASE_URL=https://your-project-id.supabase.co
DATABASE_KEY=your-anon-public-key
```

## 🔄 Migration from Memory Storage

### Step 1: Export Current Data
Run this to see what's currently in memory:
```bash
curl https://possibleminds.in/.netlify/functions/get-reports
```

### Step 2: Setup Database
Choose a database option and set it up (Supabase recommended).

### Step 3: Deploy Updated Functions
The new functions will automatically use the database when environment variables are set.

### Step 4: Import Existing Static Data
If you want to move your static reports to the database:
```bash
# This would need to be a one-time migration script
# Post each static report to the new endpoint
```

## 🧪 Testing Persistence

### Before Database Setup:
```bash
# Publish a report
curl -X POST https://possibleminds.in/.netlify/functions/publish-report \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Test Co", "markdown_report": "# Test"}'

# Deploy something (triggers rebuild)
# Check if report still exists - it won't!
```

### After Database Setup:
```bash
# Publish a report
curl -X POST https://possibleminds.in/.netlify/functions/publish-report \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Test Co", "markdown_report": "# Test"}'

# Deploy something (triggers rebuild)
# Check if report still exists - it will!
```

## 🎯 Recommendation

**For immediate production use**: Set up Supabase
- Free tier is generous
- Excellent documentation
- Built-in auth if needed later
- Real-time subscriptions available
- Easy to scale

**Setup time**: 10 minutes to get persistent storage working!

## 🚨 Action Required

1. **Choose a database solution** (Supabase recommended)
2. **Set up the database and get credentials**
3. **Add environment variables to Netlify**
4. **Replace the function file**
5. **Test persistence by publishing a report, then triggering a rebuild**

Would you like me to walk you through setting up Supabase specifically? 