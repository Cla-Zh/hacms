#!/usr/bin/env node
// Final comprehensive connectivity and auth test
const https = require('https');
const http = require('http');

function request(url, options={}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: data}));
    });
    req.on('error', e => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

async function main() {
  const tests = [
    {url: 'https://api.github.com/zen'},
    {url: 'https://api.github.com', headers: {'Authorization': 'Basic ' + Buffer.from('myzqz@163.com:Calvin25165').toString('base64'), 'Accept': 'application/vnd.github.v3+json'}},
    {url: 'https://api.github.com/user', headers: {'Authorization': 'Basic ' + Buffer.from('myzqz@163.com:Calvin25165').toString('base64'), 'Accept': 'application/vnd.github.v3+json'}},
  ];
  
  for (const t of tests) {
    try {
      const r = await request(t.url, {headers: t.headers});
      console.log(`${t.url} => ${r.status}`, r.body.substring(0, 100));
    } catch(e) {
      console.log(`${t.url} => ERROR: ${e.message}`);
    }
  }
}

main();