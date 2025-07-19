# 🎯 Click Tracking System for Sales Report Analytics

## 📋 Overview

This click tracking system captures clicks on report links sent from your sales automation system (salesbot) and forwards the data to free third-party analytics services. It bridges the gap between your private salesbot system and public website.

## 🏗️ Architecture

```
Salesbot → Email with Tracked URL → possibleminds.in → Click Tracking → Analytics Services
                                                      ↓
                                               Report Display
```

### Data Flow:
1. **User clicks report link** → lands on possibleminds.in
2. **possibleminds.in captures click data** → extracts UTM parameters and metadata
3. **Data is sent to analytics service** → Google Analytics 4, Mixpanel, webhooks
4. **Report is displayed to user** → seamless user experience

## 🔧 Setup Instructions

### 1. Environment Variables

Add these environment variables to your Netlify dashboard:

#### Google Analytics 4 (Recommended - 100% FREE)
```bash
GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Free from Google Analytics
GA4_API_SECRET=your_ga4_api_secret  # Free API secret
```

#### Optional Analytics Services (All Free Tiers Available)
```bash
# Mixpanel (100K events/month free)
MIXPANEL_TOKEN=your_mixpanel_token

# Webhook notifications (Free - your own endpoint)
ANALYTICS_WEBHOOK_URL=https://your-webhook-endpoint.com
ANALYTICS_WEBHOOK_SECRET=your_webhook_secret

# Custom analytics (Free - your own service)
CUSTOM_ANALYTICS_URL=https://your-custom-analytics.com/api
CUSTOM_ANALYTICS_TOKEN=your_custom_token
```

### 2. Get GA4 Credentials (100% FREE)

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property or use existing (no cost)
3. Go to **Admin** → **Data Streams** → **Web**
4. Copy your **Measurement ID** (G-XXXXXXXXXX)
5. Go to **Admin** → **Property** → **Measurement Protocol API secrets**
6. Create a new secret and copy the value

📋 **Detailed setup guide**: [GA4_FREE_SETUP.md](GA4_FREE_SETUP.md)  
📋 **Visual signup guide**: [GA4_SIGNUP_GUIDE.md](GA4_SIGNUP_GUIDE.md)

### 3. Deploy the Functions

The following function is automatically deployed:

- `/.netlify/functions/click-tracking` - Unified tracking endpoint (handles both clicks and engagement)

## 🚀 Usage

### For Salesbot Integration

Use this URL format for tracked links:

```
https://possibleminds.in/.netlify/functions/click-tracking?company_id={company_slug}&utm_source=email&utm_medium=outreach&utm_campaign=deep_research&utm_content=strategic_analysis&company={company_name}&recipient={recipient_id}&campaign_id={campaign_id}&tracking_id={tracking_id}&timestamp={timestamp}
```

#### Parameters:
- `company_id` or `slug` - Company identifier for the report
- `utm_source` - Traffic source (e.g., "email", "linkedin")
- `utm_medium` - Marketing medium (e.g., "outreach", "newsletter")
- `utm_campaign` - Campaign name (e.g., "deep_research", "q1_2024")
- `utm_content` - Content identifier (e.g., "strategic_analysis")
- `utm_term` - Search term (optional)
- `company` - Company name
- `recipient` - Recipient identifier
- `campaign_id` - Campaign identifier
- `tracking_id` - Unique tracking identifier
- `timestamp` - Original timestamp

### Example URL:
```
https://possibleminds.in/.netlify/functions/click-tracking?company_id=acme-corp&utm_source=email&utm_medium=outreach&utm_campaign=deep_research&company=Acme Corp&recipient=john_doe&campaign_id=123&tracking_id=tr_abc123
```

### Direct API Usage

For programmatic tracking:

```bash
curl -X POST https://possibleminds.in/.netlify/functions/click-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "company_slug": "acme-corp",
    "utm_source": "email",
    "utm_medium": "outreach",
    "utm_campaign": "deep_research",
    "recipient": "john_doe",
    "campaign_id": "123",
    "tracking_id": "tr_abc123"
  }'
```

## 📊 Analytics Data Structure

### Google Analytics 4 Events

**Event Name**: `report_click`
**Parameters**:
- `event_category`: "strategic_reports"
- `event_label`: Company slug
- `campaign_source`: UTM source
- `campaign_medium`: UTM medium
- `campaign_name`: UTM campaign
- `campaign_content`: UTM content
- `campaign_term`: UTM term
- `company_name`: Company name
- `recipient_id`: Recipient identifier
- `campaign_id`: Campaign identifier
- `tracking_id`: Tracking identifier
- `custom_parameter_1`: Visitor IP
- `custom_parameter_2`: Referrer
- `session_id`: Request ID

### Webhook Payload

```json
{
  "event": "report_click",
  "data": {
    "company_slug": "acme-corp",
    "utm_source": "email",
    "utm_medium": "outreach",
    "utm_campaign": "deep_research",
    "utm_content": "strategic_analysis",
    "company": "Acme Corp",
    "recipient": "john_doe",
    "campaign_id": "123",
    "tracking_id": "tr_abc123",
    "click_timestamp": "2024-01-15T10:30:00Z",
    "visitor_ip": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "referrer": "https://email.client.com",
    "session_data": {
      "cloudfront_viewer_country": "US",
      "cloudfront_viewer_country_region": "CA",
      "cloudfront_viewer_city": "San Francisco"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔍 Testing

### 1. Test Click Tracking

```bash
# Test with minimal parameters
curl -I "https://possibleminds.in/.netlify/functions/click-tracking?company_id=test-company&utm_source=test"

# Should return 302 redirect to /reports/test-company
```

### 2. Test Direct Tracking

```bash
curl -X POST https://possibleminds.in/.netlify/functions/click-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "company_slug": "test-company",
    "utm_source": "test",
    "utm_medium": "api",
    "utm_campaign": "testing"
  }'
```

### 3. Check Analytics

- **GA4**: Real-time reports in Google Analytics
- **Webhooks**: Check your webhook endpoint logs
- **Netlify**: Function logs in Netlify dashboard

## 🎯 Features

### ✅ What's Tracked

- **Click Events**: Every click on report links
- **UTM Parameters**: Full campaign attribution
- **Visitor Metadata**: IP, user-agent, referrer, timestamp
- **Geographic Data**: Country, region, city (via CloudFront)
- **Campaign Data**: Recipient, campaign ID, tracking ID
- **Session Data**: Request ID, session metadata

### ✅ Analytics Integrations

- **Google Analytics 4**: Custom events with parameters
- **Mixpanel**: Event tracking (optional)
- **Webhooks**: Real-time notifications
- **Netlify Blobs**: Local storage for analytics
- **Custom Analytics**: Configurable endpoint

### ✅ Error Handling

- **Graceful Degradation**: Redirects to report even if tracking fails
- **Comprehensive Logging**: Detailed error logs for debugging
- **Async Processing**: Non-blocking analytics calls
- **Fallback Behavior**: Preserves user experience

## 🔧 Advanced Configuration

### Custom Event Names

Modify the event names in the functions:

```javascript
// In click-tracking.cjs
name: 'report_click'  // Change to your preference

// In click-tracking.cjs
name: 'report_engagement'  // For engagement events
name: 'report_click'       // For click events
```

### Additional Parameters

Add custom parameters to GA4 events:

```javascript
params: {
  // ... existing parameters
  custom_dimension_1: 'your_value',
  custom_dimension_2: 'another_value'
}
```

### Webhook Signature Verification

The system includes webhook signature verification:

```javascript
// Webhook receives signature in header
'X-Hub-Signature-256': 'sha256=...'
```

## 📋 Troubleshooting

### Common Issues

**No tracking data in GA4**
- Check `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` are set
- Verify the measurement ID format (G-XXXXXXXXXX)
- Check function logs for errors

**Redirects not working**
- Ensure `company_id` or `slug` parameter is provided
- Check that the target report exists
- Verify function deployment

**Webhook not receiving data**
- Check `ANALYTICS_WEBHOOK_URL` is correct
- Verify webhook endpoint is accessible
- Check webhook signature if using `ANALYTICS_WEBHOOK_SECRET`

### Debug Commands

```bash
# Test click tracking endpoint
curl -I "https://possibleminds.in/.netlify/functions/click-tracking?company_id=test"

# Check function logs
netlify functions:log click-tracking

# Test webhook
curl -X POST https://possibleminds.in/.netlify/functions/click-tracking \
  -H "Content-Type: application/json" \
  -d '{"company_slug": "test"}'
```

## 📈 Analytics Dashboards

### Google Analytics 4

Create custom reports using these dimensions:
- Event name: `report_click`
- Event category: `strategic_reports`
- Campaign source, medium, name
- Custom parameters for detailed analysis

### Mixpanel

Track funnel conversions:
1. Report Click → Report View → Engagement → Conversion

## 🎉 You're All Set!

The click tracking system is now ready to capture comprehensive analytics data from your sales campaigns. The system will:

1. **Capture every click** on report links
2. **Extract UTM parameters** for campaign attribution
3. **Send data to GA4** for comprehensive analytics
4. **Provide real-time webhooks** for immediate notifications
5. **Maintain user experience** with seamless redirects

For questions or support, check the function logs in your Netlify dashboard or test the endpoints directly.

---

🔗 **Related Documentation**:
- [Reports System](REPORTS_CLEANUP_GUIDE.md)
- [Salesbot Integration](SALESBOT_INTEGRATION_README.md)
- [SSR Setup](SSR_SETUP_GUIDE.md) 