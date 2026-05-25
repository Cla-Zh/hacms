#!/usr/bin/env node
// Try token-only Basic auth
const https = require('https');

function fetch(path) {
  return new Promise((resolve, reject) => {
    const token = 'Calvin25165';
    const creds = Buffer.from(`${token}:${token}`).toString('base64');
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + creds,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AAM-CMS-Push/1.0'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({status: res.statusCode, body: data}));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  // Test: token:x-token-auth
  let r = await fetch('/user');
  console.log('Basic token:token -', r.status, r.body.substring(0, 200));
  
  // Test: x-access-token header
  const options2 = {
    hostname: 'api.github.com', port: 443, path: '/user', method: 'GET',
    headers: {
      'Authorization': 'token Calvin25165',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AAM-CMS-Push/1.0'
    }
  };
  const req2 = https.request(options2, res => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      console.log('\nHeader token -', res.statusCode, data.substring(0, 200));
    });
  });
  req2.on('error', e => console.log(e));
  req2.end();
}

main();