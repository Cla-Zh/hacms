#!/usr/bin/env node
// Test GitHub with proper User-Agent that corporate proxy might allow
const https = require('https');

function request(path, headers={}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        ...headers
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({status: res.statusCode, body: data}));
    });
    req.on('error', e => reject(e));
    req.end();
  });
}

async function main() {
  // Try GitHub API with browser-like UA
  const r = await request('/user', {
    'Authorization': 'Basic ' + Buffer.from('myzqz@163.com:Calvin25165').toString('base64'),
    'Accept': 'application/vnd.github.v3+json'
  });
  console.log('With GitHub API:', r.status, r.body.substring(0, 300));
}

main().catch(e => console.log('Error:', e.message));