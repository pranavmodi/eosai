# 🔄 Automatic Rebuild Setup for Reports

## 🎯 Overview

Your website now automatically triggers rebuilds when new reports are published! This approach provides:
- **Automatic deployment** when reports are posted
- **Persistent storage** (reports survive rebuilds)
- **Simple setup** (no external database needed)
- **Reliable delivery** (reports are permanently available after build)

## ⚡ How It Works

```
Salesbot → POST /publish-report → Store + Trigger Build → 2-4 min → Live Report
```

### Process Flow:
1. **Report Received**: Salesbot posts report to `/publish-report`
2. **Immediate Storage**: Report stored in memory for immediate access
3. **Build Triggered**: Automatic Netlify rebuild initiated
4. **Build Completes**: Report permanently available (2-4 minutes)
5. **Memory Cleared**: Old memory cleared, but report is now in build

## 🛠️ Setup Instructions

### 1. Get Your Netlify Build Hook

1. Go to your Netlify dashboard
2. Navigate to **Site Settings** → **Build & Deploy** → **Build Hooks**
3. Click **Add Build Hook**
4. Name it: "Report Publishing"
5. Copy the webhook URL (looks like: `https://api.netlify.com/build_hooks/abcd1234...`)

### 2. Add Environment Variable

In your Netlify dashboard:
1. Go to **Site Settings** → **Environment Variables**
2. Add new variable:
   - **Key**: `NETLIFY_BUILD_HOOK`
   - **Value**: Your build hook URL from step 1

### 3. Deploy the Updated Function

The updated `publish-report.js` function is ready to use! It will:
- ✅ Store reports immediately
- ✅ Automatically trigger rebuilds
- ✅ Provide build status in response

## 📊 Response Format

When a report is published, you'll get:

```json
{
  "success": true,
  "message": "Report published successfully",
  "data": {
    "reportId": "company-name-1234567890",
    "companySlug": "company-name",
    "publishUrl": "https://possibleminds.in/reports/company-name",
    "buildTriggered": true,
    "estimatedAvailableAt": "2024-01-15T10:33:00.000Z",
    "estimatedWaitTime": "2-4 minutes"
  },
  "buildInfo": {
    "triggered": true,
    "buildId": "build-123",
    "message": "Rebuild triggered successfully"
  }
}
```

## ⏱️ Timeline

| Time | Status | Description |
|------|--------|-------------|
| 0s | ✅ Posted | Report received and stored |
| 2s | 🔄 Building | Netlify build triggered |
| 2-4min | 🚀 Live | Report available on website |

## 🧪 Testing the Setup

### 1. Publish a Test Report
```bash
curl -X POST https://possibleminds.in/.netlify/functions/publish-report \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Auto-Rebuild Company",
    "markdown_report": "# Test Report\n\nThis report tests automatic rebuilds.",
    "company_website": "https://testcompany.com"
  }'
```

### 2. Check Response
Look for:
- `"buildTriggered": true`
- `"estimatedAvailableAt"` timestamp
- Build info in response

### 3. Monitor Build
1. Go to Netlify dashboard → **Deploys**
2. You should see a new build triggered
3. Build name: "New Report: Test Auto-Rebuild Company"

### 4. Verify Report is Live
After 2-4 minutes, visit:
`https://possibleminds.in/reports/test-auto-rebuild-company`

## 📋 Monitoring & Logs

### Build Monitoring
- **Netlify Dashboard**: See all triggered builds
- **Build Names**: Automatically named with company name
- **Build Metadata**: Includes report ID and trigger time

### Function Logs
Check Netlify function logs for:
```
Processing report for: [Company Name]
Report added. Total reports in store: X
Triggering rebuild for new report: [Company Name]
Build triggered successfully: {buildId: "..."}
```

## 🚨 Troubleshooting

### Build Not Triggering
**Symptoms**: `"buildTriggered": false` in response

**Solutions**:
1. Check `NETLIFY_BUILD_HOOK` environment variable is set
2. Verify build hook URL is correct
3. Check function logs for error messages

### Build Triggered But Report Not Visible
**Symptoms**: Build completes but report not on site

**Possible Causes**:
1. Build failed - check build logs
2. Report data not properly formatted
3. SSR pages not fetching correctly

### Function Timeout
**Symptoms**: Function takes too long to respond

**Solutions**:
1. Build triggering is async - function returns before build completes
2. Check if multiple builds are being triggered simultaneously
3. Monitor function execution time in logs

## 🎛️ Configuration Options

### Build Hook Settings
```javascript
// In publish-report.js, customize trigger metadata:
trigger_metadata: {
  report_id: reportData.id,
  company_name: reportData.companyName,
  company_slug: reportData.companySlug,
  triggered_at: new Date().toISOString(),
  // Add custom fields here
}
```

### Build Naming
Builds are automatically named: `"New Report: [Company Name]"`

To customize, modify the `trigger_title` in the function.

## 🔐 Security

### Webhook Signature Verification
The function supports webhook signature verification. To enable:

1. Add to Netlify environment variables:
   ```
   SALESBOT_WEBHOOK_SECRET=your-secret-key
   ```
2. Configure Salesbot to sign requests with the same secret

### Build Hook Security
- Build hooks are safe to use in environment variables
- They only allow triggering builds, not accessing data
- Netlify handles authentication automatically

## 📈 Performance & Scalability

### Build Frequency
- **Recommended**: Max 1 build per 5 minutes
- **Netlify Limit**: ~300 builds/month on free tier
- **Best Practice**: For high-frequency publishing, consider batching

### Cost Considerations
- **Build Minutes**: Each report uses ~2-3 build minutes
- **Function Invocations**: Minimal cost per report
- **Storage**: No additional storage costs

## 🎉 Benefits of This Approach

✅ **Simple Setup**: No external database required  
✅ **Persistent Storage**: Reports survive all rebuilds  
✅ **Automatic Deployment**: Zero manual intervention  
✅ **Reliable**: Uses Netlify's robust build system  
✅ **Scalable**: Handles multiple reports efficiently  
✅ **Traceable**: Full build history and logs  

## 🚀 You're All Set!

Your automatic rebuild system is now configured! When Salesbot publishes reports:

1. **Immediate**: Report stored and build triggered
2. **2-4 minutes**: Report live on website
3. **Forever**: Report persists through all future deployments

The system provides the perfect balance of automation and reliability for your use case! 