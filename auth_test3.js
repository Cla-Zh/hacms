#!/usr/bin/env node
// Check GitHub token format
const https = require('https');

const token = 'Calvin25165';
console.log('Token length:', token.length);
console.log('Is hex?', /^[a-f0-9]+$/i.test(token));

// Try Bearer auth
const options = {
  hostname: 'api.github.com', port: 443, path: '/user', method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AAM-CMS-Push/1.0'
  }
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log('Bearer:', res.statusCode, data.substring(0, 200)));
});
req.on('error', e => console.log('Error:', e.message));
req.end();