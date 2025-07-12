# 🧹 Reports Cleanup System

## 🎯 Overview

The Reports Cleanup System provides comprehensive tools to clean reports from all storage locations on your website. This system is designed to handle the multi-layered storage architecture of your reports system.

## 📋 Storage Locations Managed

Your reports system uses multiple storage mechanisms:

1. **In-Memory Storage** (`global.reportsData`) - Temporary storage for immediate access
2. **Netlify Blobs** - Persistent storage using Netlify's blob storage
3. **External Database** - Supabase, Airtable, or FaunaDB (if configured)
4. **Static Reports** - Hardcoded sample reports (not cleaned by this system)

## 🛠️ Tools Available

### 1. Interactive Cleanup Script
```bash
./clean-reports.sh
```
An interactive shell script that provides a user-friendly interface for cleaning reports.

### 2. Direct API Calls
```bash
# Clean all reports
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{"action": "clean_all"}'

# Clean specific report
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{"action": "clean_specific", "slug": "company-name"}'

# Clean specific storage type
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{"action": "clean_storage", "storage_type": "blobs"}'
```

## 🚀 Quick Start

### Using the Interactive Script (Recommended)

1. **Run the script**:
   ```bash
   ./clean-reports.sh
   ```

2. **Choose your cleanup option**:
   - `1` - Clean all reports (recommended for complete cleanup)
   - `2` - Show current reports count
   - `3` - Clean + trigger rebuild
   - `4` - Clean specific report by slug
   - `5` - Clean by storage type
   - `6` - Exit

3. **Follow the prompts** for additional options

### Direct API Usage

For automation or integration into other systems:

```bash
# Example: Clean all reports and trigger rebuild
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_all",
    "trigger_rebuild": true
  }'
```

## 📊 API Reference

### Clean Reports Function
**Endpoint**: `/.netlify/functions/clean-reports`
**Method**: POST

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | ✅ | Action to perform: `clean_all`, `clean_specific`, `clean_storage` |
| `slug` | string | ⚠️ | Company slug (required for `clean_specific`) |
| `storage_type` | string | ⚠️ | Storage type (required for `clean_storage`): `memory`, `blobs`, `database` |
| `trigger_rebuild` | boolean | ❌ | Whether to trigger Netlify rebuild after cleanup |

#### Response Format

```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "action": "clean_all",
  "slug": null,
  "storage_type": null,
  "results": {
    "memory": {
      "removed": 5,
      "remaining": 0
    },
    "blobs": {
      "removed": 3,
      "remaining": 0
    },
    "database": {
      "removed": 2,
      "remaining": 0
    }
  },
  "totalRemoved": 10,
  "errors": null,
  "buildTriggered": false,
  "buildInfo": null
}
```

## 📋 Detailed Usage Examples

### 1. Complete Cleanup (Recommended)
Removes all reports from all storage locations:

```bash
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{"action": "clean_all"}'
```

### 2. Clean Specific Report
Removes a specific report by company slug:

```bash
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_specific",
    "slug": "test-company-inc"
  }'
```

### 3. Clean Specific Storage Type
Removes reports from a specific storage location:

```bash
# Clean only memory storage
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_storage",
    "storage_type": "memory"
  }'

# Clean only Netlify Blobs
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_storage",
    "storage_type": "blobs"
  }'

# Clean only database
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_storage",
    "storage_type": "database"
  }'
```

### 4. Clean and Trigger Rebuild
Removes all reports and triggers a Netlify rebuild:

```bash
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_all",
    "trigger_rebuild": true
  }'
```

## 🔧 Advanced Configuration

### Environment Variables
The cleanup system uses these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `SALESBOT_WEBHOOK_SECRET` | Webhook signature verification | ❌ |
| `NETLIFY_BUILD_HOOK` | URL for triggering rebuilds | ❌ |
| `DATABASE_TYPE` | Database type (`supabase`, `airtable`, `fauna`) | ❌ |
| `DATABASE_URL` | Database connection URL | ❌ |
| `DATABASE_KEY` | Database authentication key | ❌ |

### Webhook Signature Verification
If you set `SALESBOT_WEBHOOK_SECRET`, the cleanup function will verify webhook signatures:

```bash
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=YOUR_SIGNATURE_HERE" \
  -d '{"action": "clean_all"}'
```

## 📊 Monitoring and Logging

### Function Logs
Check Netlify function logs for cleanup operations:

```
Processing cleanup request: { action: 'clean_all', slug: null, storage_type: null, trigger_rebuild: false }
Cleared all 5 reports from memory
Removed 3 reports from blobs
Removed 2 reports from Supabase
Cleanup completed: { success: true, totalRemoved: 10 }
```

### Error Handling
The system provides detailed error information:

```json
{
  "success": false,
  "message": "Cleanup completed with errors",
  "results": {
    "memory": { "removed": 5, "remaining": 0 },
    "blobs": { "removed": 0, "remaining": 0 },
    "database": { "removed": 2, "remaining": 0 }
  },
  "totalRemoved": 7,
  "errors": [
    "Blobs cleanup failed: Connection timeout"
  ]
}
```

## 🧪 Testing the System

### 1. Check Current Reports
```bash
curl https://possibleminds.in/.netlify/functions/get-reports
```

### 2. Add a Test Report
```bash
curl -X POST https://possibleminds.in/.netlify/functions/publish-report \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Test Cleanup Company",
    "markdown_report": "# Test Report\n\nThis report will be cleaned up.",
    "company_website": "https://test.com"
  }'
```

### 3. Clean the Test Report
```bash
curl -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clean_specific",
    "slug": "test-cleanup-company"
  }'
```

### 4. Verify Cleanup
```bash
curl https://possibleminds.in/.netlify/functions/get-reports
```

## 🚨 Important Notes

### What Gets Cleaned
- ✅ **Dynamic reports** added via Salesbot
- ✅ **In-memory storage** (temporary reports)
- ✅ **Netlify Blobs** (persistent storage)
- ✅ **External database** (if configured)
- ❌ **Static reports** (hardcoded samples remain untouched)

### Safety Considerations
1. **Backup Important Reports**: The cleanup is permanent and irreversible
2. **Test in Development**: Always test cleanup operations in a development environment first
3. **Monitor Logs**: Check function logs to ensure cleanup operations complete successfully
4. **Database Permissions**: Ensure database credentials have delete permissions

### Best Practices
1. **Use Interactive Script** for manual cleanup operations
2. **Use API directly** for automation and integration
3. **Trigger rebuilds** after cleanup to ensure the website reflects changes
4. **Monitor storage usage** to optimize cleanup frequency

## 🎛️ Troubleshooting

### Common Issues

**Function not found (404)**
- Deploy the cleanup function: `git add . && git commit -m "Add cleanup function" && git push`

**Permission denied errors**
- Check database credentials and permissions
- Verify environment variables are set correctly

**Cleanup partially failed**
- Check function logs for specific error messages
- Some storage types may fail while others succeed

**Reports still visible after cleanup**
- Static reports are not cleaned by this system
- Try triggering a rebuild: `"trigger_rebuild": true`

### Debug Commands
```bash
# Check if cleanup function exists
curl -I https://possibleminds.in/.netlify/functions/clean-reports

# Get current reports count
curl https://possibleminds.in/.netlify/functions/get-reports | grep -o '"totalCount":[0-9]*'

# Test cleanup with verbose output
curl -v -X POST https://possibleminds.in/.netlify/functions/clean-reports \
  -H "Content-Type: application/json" \
  -d '{"action": "clean_all"}'
```

## 🎉 You're All Set!

The Reports Cleanup System is now ready to use. You can:

1. **Clean all reports** with one command
2. **Clean specific reports** by company slug
3. **Clean specific storage types** for targeted cleanup
4. **Monitor cleanup operations** through detailed logging
5. **Integrate with automation** using the API

For most use cases, simply run `./clean-reports.sh` and select option 1 to clean all reports.

---

📝 **Need Help?** Check the function logs in your Netlify dashboard or run the interactive script for guided cleanup operations. 