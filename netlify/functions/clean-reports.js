const crypto = require('crypto');
const { getStore, connectLambda } = require('@netlify/blobs');

// Environment variables
const WEBHOOK_SECRET = process.env.SALESBOT_WEBHOOK_SECRET || 'your-webhook-secret-key';
const NETLIFY_BUILD_HOOK = process.env.NETLIFY_BUILD_HOOK;
const DATABASE_TYPE = process.env.DATABASE_TYPE;
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_KEY = process.env.DATABASE_KEY;

// Access the global reports data (shared with other functions)
global.reportsData = global.reportsData || [];

// Helper function to verify webhook signature
function verifySignature(body, signature) {
  if (!signature || !body) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}

// Function to clean memory storage
function cleanMemoryStorage(slug = null) {
  const originalCount = global.reportsData.length;
  
  if (slug) {
    // Clean specific report
    global.reportsData = global.reportsData.filter(r => r.companySlug !== slug);
    const removedCount = originalCount - global.reportsData.length;
    console.log(`Removed ${removedCount} report(s) from memory for slug: ${slug}`);
    return { removed: removedCount, remaining: global.reportsData.length };
  } else {
    // Clean all reports
    global.reportsData = [];
    console.log(`Cleared all ${originalCount} reports from memory`);
    return { removed: originalCount, remaining: 0 };
  }
}

// Function to clean Netlify Blobs storage
async function cleanBlobsStorage(event, slug = null) {
  try {
    connectLambda(event);
    const store = getStore('reports');
    
    if (slug) {
      // Clean specific report
      const exists = await store.get(slug);
      if (exists) {
        await store.delete(slug);
        console.log(`Removed report from blobs: ${slug}`);
        return { removed: 1, remaining: 'unknown' };
      } else {
        console.log(`Report not found in blobs: ${slug}`);
        return { removed: 0, remaining: 'unknown' };
      }
    } else {
      // Clean all reports
      const listResult = await store.list();
      const blobs = listResult?.blobs || [];
      
      let removedCount = 0;
      for (const blob of blobs) {
        try {
          await store.delete(blob.key);
          removedCount++;
          console.log(`Removed report from blobs: ${blob.key}`);
        } catch (deleteError) {
          console.error(`Failed to delete blob ${blob.key}:`, deleteError);
        }
      }
      
      console.log(`Removed ${removedCount} reports from blobs`);
      return { removed: removedCount, remaining: 0 };
    }
  } catch (error) {
    console.error('Error cleaning blobs storage:', error);
    throw error;
  }
}

// Function to clean Supabase database
async function cleanSupabaseStorage(slug = null) {
  if (DATABASE_TYPE !== 'supabase' || !DATABASE_URL || !DATABASE_KEY) {
    throw new Error('Supabase not configured');
  }
  
  try {
    let url = `${DATABASE_URL}/rest/v1/reports`;
    let method = 'DELETE';
    
    if (slug) {
      url += `?company_slug=eq.${slug}`;
    }
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${DATABASE_KEY}`,
        'apikey': DATABASE_KEY,
        'Prefer': 'return=representation'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase cleanup error: ${response.status}`);
    }
    
    const result = await response.json();
    const removedCount = Array.isArray(result) ? result.length : 0;
    
    console.log(`Removed ${removedCount} reports from Supabase`);
    return { removed: removedCount, remaining: 'unknown' };
  } catch (error) {
    console.error('Supabase cleanup error:', error);
    throw error;
  }
}

// Function to clean Airtable database
async function cleanAirtableStorage(slug = null) {
  if (DATABASE_TYPE !== 'airtable' || !DATABASE_URL || !DATABASE_KEY) {
    throw new Error('Airtable not configured');
  }
  
  try {
    // First, get all records to find IDs
    const listResponse = await fetch(`https://api.airtable.com/v0/${DATABASE_URL}/Reports`, {
      headers: {
        'Authorization': `Bearer ${DATABASE_KEY}`
      }
    });
    
    if (!listResponse.ok) {
      throw new Error(`Airtable list error: ${listResponse.status}`);
    }
    
    const listData = await listResponse.json();
    const records = listData.records || [];
    
    let recordsToDelete = records;
    if (slug) {
      recordsToDelete = records.filter(record => 
        record.fields['Company Slug'] === slug
      );
    }
    
    // Delete records in batches of 10 (Airtable limit)
    let removedCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < recordsToDelete.length; i += batchSize) {
      const batch = recordsToDelete.slice(i, i + batchSize);
      const recordIds = batch.map(record => record.id);
      
      const deleteResponse = await fetch(`https://api.airtable.com/v0/${DATABASE_URL}/Reports`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${DATABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          records: recordIds
        })
      });
      
      if (deleteResponse.ok) {
        removedCount += batch.length;
      }
    }
    
    console.log(`Removed ${removedCount} reports from Airtable`);
    return { removed: removedCount, remaining: 'unknown' };
  } catch (error) {
    console.error('Airtable cleanup error:', error);
    throw error;
  }
}

// Function to clean FaunaDB database
async function cleanFaunaStorage(slug = null) {
  if (DATABASE_TYPE !== 'fauna' || !DATABASE_KEY) {
    throw new Error('FaunaDB not configured');
  }
  
  try {
    let query;
    
    if (slug) {
      query = {
        delete: {
          collection: 'reports',
          where: {
            companySlug: slug
          }
        }
      };
    } else {
      query = {
        delete: {
          collection: 'reports'
        }
      };
    }
    
    const response = await fetch('https://db.fauna.com/query/1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DATABASE_KEY}`
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error(`FaunaDB cleanup error: ${response.status}`);
    }
    
    const result = await response.json();
    const removedCount = result.data?.deletedCount || 0;
    
    console.log(`Removed ${removedCount} reports from FaunaDB`);
    return { removed: removedCount, remaining: 'unknown' };
  } catch (error) {
    console.error('FaunaDB cleanup error:', error);
    throw error;
  }
}

// Function to clean database storage
async function cleanDatabaseStorage(slug = null) {
  switch (DATABASE_TYPE) {
    case 'supabase':
      return await cleanSupabaseStorage(slug);
    case 'airtable':
      return await cleanAirtableStorage(slug);
    case 'fauna':
      return await cleanFaunaStorage(slug);
    default:
      console.log('No database configured for cleanup');
      return { removed: 0, remaining: 0 };
  }
}

// Function to trigger Netlify rebuild
async function triggerNetlifyRebuild(reason = 'Reports cleanup') {
  if (!NETLIFY_BUILD_HOOK) {
    console.log('No build hook configured - skipping rebuild');
    return { triggered: false, message: 'No build hook configured' };
  }
  
  try {
    const response = await fetch(NETLIFY_BUILD_HOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trigger_title: `Reports Cleanup: ${reason}`,
        trigger_metadata: {
          cleanup_reason: reason,
          triggered_at: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Rebuild triggered successfully:', result);
      return { triggered: true, buildId: result.id, message: 'Rebuild triggered successfully' };
    } else {
      console.error('Failed to trigger rebuild:', response.status);
      return { triggered: false, message: `Failed to trigger rebuild: ${response.status}` };
    }
  } catch (error) {
    console.error('Error triggering rebuild:', error);
    return { triggered: false, message: `Error triggering rebuild: ${error.message}` };
  }
}

// Main function handler
exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Hub-Signature-256',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed. Use POST.' 
      })
    };
  }
  
  try {
    const body = event.body;
    const signature = event.headers['x-hub-signature-256'] || event.headers['X-Hub-Signature-256'];
    
    // Verify webhook signature (optional)
    if (signature && !verifySignature(body, signature)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid signature' 
        })
      };
    }
    
    // Parse the request body
    const requestData = JSON.parse(body);
    const { action, slug, storage_type, trigger_rebuild } = requestData;
    
    console.log('Processing cleanup request:', { action, slug, storage_type, trigger_rebuild });
    
    const cleanupResults = {
      memory: { removed: 0, remaining: 0 },
      blobs: { removed: 0, remaining: 0 },
      database: { removed: 0, remaining: 0 }
    };
    
    let cleanupSuccess = true;
    const errors = [];
    
    switch (action) {
      case 'clean_all':
        // Clean all storage types
        try {
          cleanupResults.memory = cleanMemoryStorage();
        } catch (error) {
          errors.push(`Memory cleanup failed: ${error.message}`);
          cleanupSuccess = false;
        }
        
        try {
          cleanupResults.blobs = await cleanBlobsStorage(event);
        } catch (error) {
          errors.push(`Blobs cleanup failed: ${error.message}`);
          cleanupSuccess = false;
        }
        
        try {
          cleanupResults.database = await cleanDatabaseStorage();
        } catch (error) {
          errors.push(`Database cleanup failed: ${error.message}`);
          cleanupSuccess = false;
        }
        break;
        
      case 'clean_specific':
        if (!slug) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Missing slug parameter for specific cleanup' 
            })
          };
        }
        
        // Clean specific report from all storage types
        try {
          cleanupResults.memory = cleanMemoryStorage(slug);
        } catch (error) {
          errors.push(`Memory cleanup failed: ${error.message}`);
          cleanupSuccess = false;
        }
        
        try {
          cleanupResults.blobs = await cleanBlobsStorage(event, slug);
        } catch (error) {
          errors.push(`Blobs cleanup failed: ${error.message}`);
          cleanupSuccess = false;
        }
        
        try {
          cleanupResults.database = await cleanDatabaseStorage(slug);
        } catch (error) {
          errors.push(`Database cleanup failed: ${error.message}`);
          cleanupSuccess = false;
        }
        break;
        
      case 'clean_storage':
        if (!storage_type) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Missing storage_type parameter' 
            })
          };
        }
        
        // Clean specific storage type
        switch (storage_type) {
          case 'memory':
            try {
              cleanupResults.memory = cleanMemoryStorage();
            } catch (error) {
              errors.push(`Memory cleanup failed: ${error.message}`);
              cleanupSuccess = false;
            }
            break;
          case 'blobs':
            try {
              cleanupResults.blobs = await cleanBlobsStorage(event);
            } catch (error) {
              errors.push(`Blobs cleanup failed: ${error.message}`);
              cleanupSuccess = false;
            }
            break;
          case 'database':
            try {
              cleanupResults.database = await cleanDatabaseStorage();
            } catch (error) {
              errors.push(`Database cleanup failed: ${error.message}`);
              cleanupSuccess = false;
            }
            break;
          default:
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ 
                error: 'Invalid storage_type. Use: memory, blobs, or database' 
              })
            };
        }
        break;
        
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid action. Use: clean_all, clean_specific, or clean_storage' 
          })
        };
    }
    
    // Trigger rebuild if requested
    let buildResult = null;
    if (trigger_rebuild) {
      buildResult = await triggerNetlifyRebuild(`${action} - ${slug || 'all reports'}`);
    }
    
    // Calculate total removed
    const totalRemoved = cleanupResults.memory.removed + 
                        cleanupResults.blobs.removed + 
                        cleanupResults.database.removed;
    
    const response = {
      success: cleanupSuccess,
      message: cleanupSuccess ? 'Cleanup completed successfully' : 'Cleanup completed with errors',
      action: action,
      slug: slug || null,
      storage_type: storage_type || null,
      results: cleanupResults,
      totalRemoved: totalRemoved,
      errors: errors.length > 0 ? errors : null,
      buildTriggered: buildResult ? buildResult.triggered : false,
      buildInfo: buildResult
    };
    
    console.log('Cleanup completed:', response);
    
    return {
      statusCode: cleanupSuccess ? 200 : 207, // 207 = Multi-Status (partial success)
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error processing cleanup request:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}; 