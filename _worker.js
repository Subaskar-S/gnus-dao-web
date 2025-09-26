/**
 * Cloudflare Pages Worker
 * Custom worker for handling IPFS requests and optimizations
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Handle IPFS gateway requests
    if (url.pathname.startsWith('/ipfs/')) {
      return handleIPFSRequest(request, env)
    }
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPIRequest(request, env)
    }
    
    // Default to Next.js handler
    return env.ASSETS.fetch(request)
  }
}

/**
 * Handle IPFS gateway requests with caching
 */
async function handleIPFSRequest(request, env) {
  const url = new URL(request.url)
  const hash = url.pathname.replace('/ipfs/', '')
  
  // Validate IPFS hash
  if (!isValidIPFSHash(hash)) {
    return new Response('Invalid IPFS hash', { status: 400 })
  }
  
  // Check cache first
  const cacheKey = `ipfs:${hash}`
  const cached = await env.IPFS_CACHE?.get(cacheKey)
  
  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000', // 1 year
        'X-Cache': 'HIT'
      }
    })
  }
  
  // Try multiple IPFS gateways
  const gateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
  ]
  
  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}${hash}`, {
        cf: {
          cacheTtl: 86400, // 24 hours
          cacheEverything: true
        }
      })
      
      if (response.ok) {
        const content = await response.arrayBuffer()
        
        // Cache the content
        await env.IPFS_CACHE?.put(cacheKey, content, {
          expirationTtl: 86400 // 24 hours
        })
        
        return new Response(content, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000',
            'X-Cache': 'MISS',
            'X-Gateway': gateway
          }
        })
      }
    } catch (error) {
      console.error(`Failed to fetch from ${gateway}:`, error)
    }
  }
  
  return new Response('IPFS content not found', { status: 404 })
}

/**
 * Handle API requests
 */
async function handleAPIRequest(request, env) {
  const url = new URL(request.url)
  
  // IPFS upload endpoint
  if (url.pathname === '/api/ipfs/upload' && request.method === 'POST') {
    return handleIPFSUpload(request, env)
  }
  
  // IPFS pin endpoint
  if (url.pathname === '/api/ipfs/pin' && request.method === 'POST') {
    return handleIPFSPin(request, env)
  }
  
  return new Response('Not found', { status: 404 })
}

/**
 * Handle IPFS upload via Pinata
 */
async function handleIPFSUpload(request, env) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return new Response('No file provided', { status: 400 })
    }
    
    // Upload to Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', file)
    
    const metadata = {
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        source: 'cloudflare-pages'
      }
    }
    pinataFormData.append('pinataMetadata', JSON.stringify(metadata))
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PINATA_JWT}`
      },
      body: pinataFormData
    })
    
    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    return new Response(JSON.stringify({
      hash: result.IpfsHash,
      name: file.name,
      size: file.size,
      url: `https://ipfs.io/ipfs/${result.IpfsHash}`
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Handle IPFS pinning
 */
async function handleIPFSPin(request, env) {
  try {
    const { hash } = await request.json()
    
    if (!isValidIPFSHash(hash)) {
      return new Response('Invalid IPFS hash', { status: 400 })
    }
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinByHash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.PINATA_JWT}`
      },
      body: JSON.stringify({
        hashToPin: hash
      })
    })
    
    if (!response.ok) {
      throw new Error(`Pinata pin failed: ${response.statusText}`)
    }
    
    return new Response(JSON.stringify({
      hash,
      pinned: true,
      pinDate: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

/**
 * Validate IPFS hash format
 */
function isValidIPFSHash(hash) {
  if (!hash || typeof hash !== 'string') return false
  
  // CIDv0 format
  if (hash.startsWith('Qm') && hash.length === 46) {
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash)
  }
  
  // CIDv1 format (basic check)
  if (hash.length > 10 && /^[a-zA-Z0-9]+$/.test(hash)) {
    return true
  }
  
  return false
}
