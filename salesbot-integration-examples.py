# Salesbot Integration Examples
# Add these to your Flask application

import requests
import hmac
import hashlib
import json
import os
from datetime import datetime
from urllib.parse import urlencode

# Configuration
POSSIBLEMINDS_PUBLISH_URL = "https://possibleminds.in/.netlify/functions/publish-report"
POSSIBLEMINDS_TRACK_URL = "https://possibleminds.in/.netlify/functions/click-tracking"
WEBHOOK_SECRET = os.getenv("SALESBOT_WEBHOOK_SECRET", "your-webhook-secret-key")

def generate_webhook_signature(payload, secret):
    """Generate HMAC signature for webhook security"""
    signature = hmac.new(
        secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"

def publish_report_to_website(company_id):
    """
    Publish a strategic report to the Possible Minds website
    Call this after generating a report in your Flask app
    """
    try:
        # Get company data from your database
        # This is pseudocode - replace with your actual database queries
        company = get_company_by_id(company_id)  # Your function
        
        if not company or not company.markdown_report:
            print(f"No report found for company {company_id}")
            return False
        
        # Prepare the payload for the website
        payload = {
            "company_id": company.id,
            "company_name": company.company_name,
            "company_website": company.website_url,
            "markdown_report": company.markdown_report,
            "generated_date": company.updated_at.isoformat() if company.updated_at else datetime.now().isoformat(),
            "contact_id": getattr(company, 'contact_id', None)  # If you track contacts
        }
        
        # Convert to JSON for signing
        payload_json = json.dumps(payload, sort_keys=True)
        
        # Generate webhook signature
        signature = generate_webhook_signature(payload_json, WEBHOOK_SECRET)
        
        # Send to Netlify function
        headers = {
            "Content-Type": "application/json",
            "X-Hub-Signature-256": signature,
            "User-Agent": "Salesbot/1.0"
        }
        
        response = requests.post(
            POSSIBLEMINDS_PUBLISH_URL,
            data=payload_json,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Report published successfully: {result}")
            
            # Update your database with the publication info
            company.published_url = result.get('data', {}).get('publishUrl')
            company.report_slug = result.get('data', {}).get('companySlug')
            company.published_at = datetime.now()
            # db.session.commit()  # Your database commit
            
            return True
        else:
            print(f"Failed to publish report: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Error publishing report: {e}")
        return False

def generate_utm_tracking_url(company_slug, contact_id, campaign_name="strategic-report"):
    """
    Generate a tracking URL for cold email campaigns
    """
    base_url = f"https://possibleminds.in/reports/{company_slug}"
    
    utm_params = {
        "utm_source": "salesbot",
        "utm_medium": "email",
        "utm_campaign": campaign_name,
        "contact_id": contact_id
    }
    
    tracking_url = f"{base_url}?{urlencode(utm_params)}"
    return tracking_url

def create_engagement_receiver_endpoint():
    """
    Flask route to receive engagement data from the website
    Add this to your Flask app routes
    """
    from flask import request, jsonify
    
    @app.route('/api/engagement', methods=['POST'])
    def receive_engagement_data():
        try:
            data = request.get_json()
            
            # Validate the data
            required_fields = ['event_type', 'report_id']
            if not all(field in data for field in required_fields):
                return jsonify({"error": "Missing required fields"}), 400
            
            # Store engagement data in your database
            engagement = EngagementEvent(  # Your model
                event_type=data['event_type'],
                report_id=data['report_id'],
                contact_id=data.get('contact_id'),
                target=data.get('target'),
                value=data.get('value'),
                utm_source=data.get('utm_source'),
                utm_medium=data.get('utm_medium'),
                utm_campaign=data.get('utm_campaign'),
                timestamp=datetime.fromisoformat(data['timestamp']),
                user_agent=data.get('user_agent'),
                ip_address=data.get('ip_address'),
                referrer=data.get('referrer')
            )
            
            # db.session.add(engagement)
            # db.session.commit()
            
            # Process the engagement (e.g., update lead scores, trigger follow-ups)
            process_engagement_event(engagement)
            
            return jsonify({"success": True, "message": "Engagement tracked"}), 200
            
        except Exception as e:
            print(f"Error receiving engagement data: {e}")
            return jsonify({"error": "Internal server error"}), 500

def process_engagement_event(engagement):
    """
    Process engagement events for sales automation
    """
    try:
        # High-value engagement indicators
        high_value_events = ['cta_click', 'contact', 'services', 'download']
        time_thresholds = {
            'quick_bounce': 30,    # Less than 30 seconds
            'engaged': 180,        # More than 3 minutes
            'highly_engaged': 600  # More than 10 minutes
        }
        
        # Score the engagement
        engagement_score = 0
        
        if engagement.event_type in high_value_events:
            engagement_score += 50
        
        if engagement.event_type == 'time_spent':
            time_spent = int(engagement.value) if engagement.value else 0
            if time_spent > time_thresholds['highly_engaged']:
                engagement_score += 100
            elif time_spent > time_thresholds['engaged']:
                engagement_score += 50
            elif time_spent < time_thresholds['quick_bounce']:
                engagement_score -= 10
        
        if engagement.event_type == 'scroll' and engagement.value:
            scroll_percent = int(engagement.value.replace('%', ''))
            if scroll_percent >= 75:
                engagement_score += 30
            elif scroll_percent >= 50:
                engagement_score += 15
        
        # Update contact/lead scoring if contact_id is available
        if engagement.contact_id:
            update_contact_score(engagement.contact_id, engagement_score)
            
            # Trigger sales automation workflows
            if engagement_score >= 100:
                trigger_high_priority_follow_up(engagement.contact_id, engagement.report_id)
            elif engagement_score >= 50:
                schedule_follow_up_email(engagement.contact_id, engagement.report_id)
        
        print(f"Processed engagement: {engagement.event_type} (Score: {engagement_score})")
        
    except Exception as e:
        print(f"Error processing engagement: {e}")

def update_contact_score(contact_id, score_change):
    """Update contact engagement score in your CRM/database"""
    # Implement your contact scoring logic here
    pass

def trigger_high_priority_follow_up(contact_id, report_id):
    """Trigger immediate sales follow-up for highly engaged prospects"""
    # Implement your sales automation logic here
    print(f"HIGH PRIORITY: Contact {contact_id} highly engaged with report {report_id}")
    # Could integrate with your CRM, send notifications to sales team, etc.

def schedule_follow_up_email(contact_id, report_id):
    """Schedule automated follow-up email"""
    # Implement your email automation logic here
    print(f"Scheduling follow-up for contact {contact_id} on report {report_id}")

# CLI Integration Example
def cli_publish_report(company_name):
    """
    CLI command to publish a report
    Add this to your cli.py file
    """
    import click
    
    @click.command()
    @click.argument('company_name')
    def publish_report(company_name):
        """Publish a strategic report to the website"""
        # Find company by name
        company = Company.query.filter_by(company_name=company_name).first()
        
        if not company:
            click.echo(f"Company '{company_name}' not found")
            return
        
        if not company.markdown_report:
            click.echo(f"No report found for company '{company_name}'")
            return
        
        click.echo(f"Publishing report for {company_name}...")
        
        success = publish_report_to_website(company.id)
        
        if success:
            tracking_url = generate_utm_tracking_url(
                company.report_slug, 
                company.id, 
                "cli-publish"
            )
            click.echo(f"✅ Report published successfully!")
            click.echo(f"📊 Report URL: {company.published_url}")
            click.echo(f"🔗 Tracking URL: {tracking_url}")
        else:
            click.echo("❌ Failed to publish report")

# Email Template Example
def generate_cold_email_template(company, tracking_url):
    """
    Generate a cold email template with the strategic report
    """
    template = f"""
Subject: Strategic Analysis: Exclusive Insights for {company.company_name}

Dear {company.contact_name or 'Leadership Team'},

I hope this message finds you well. I've been researching {company.company_name} and was impressed by your position in the {company.industry or 'market'}.

Based on my analysis, I've prepared a comprehensive strategic report specifically for {company.company_name} that identifies key opportunities for growth and operational optimization.

📊 **View Your Strategic Report**: {tracking_url}

This report includes:
• Market position analysis and competitive benchmarking
• Growth opportunities worth pursuing in the next 12-18 months  
• Strategic recommendations with clear implementation roadmaps
• Risk assessment and mitigation strategies

The insights in this report typically take our clients 2-3 months to develop internally. I'm sharing it with you because I believe {company.company_name} has significant untapped potential.

Would you be open to a brief 15-minute call this week to discuss how these insights could accelerate your strategic initiatives?

Best regards,
Pranav Modi
Principal Strategy Consultant
Possible Minds

P.S. The report is optimized for both viewing and printing if you'd like to share it with your team.
"""
    return template

# Database Models Example (SQLAlchemy)
"""
Add these models to your Flask app:

class EngagementEvent(db.Model):
    __tablename__ = 'engagement_events'
    
    id = db.Column(db.Integer, primary_key=True)
    event_type = db.Column(db.String(50), nullable=False)
    report_id = db.Column(db.String(255), nullable=False)
    contact_id = db.Column(db.String(255), nullable=True)
    target = db.Column(db.String(255), nullable=True)
    value = db.Column(db.String(255), nullable=True)
    utm_source = db.Column(db.String(100), nullable=True)
    utm_medium = db.Column(db.String(100), nullable=True)
    utm_campaign = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False)
    user_agent = db.Column(db.Text, nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    referrer = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Add these columns to your existing Company model:
# published_url = db.Column(db.String(255), nullable=True)
# report_slug = db.Column(db.String(255), nullable=True)
# published_at = db.Column(db.DateTime, nullable=True)
""" 