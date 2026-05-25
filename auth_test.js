#!/usr/bin/env node
// Quick auth test - does Basic auth with GitHub REST API work?
const http = require('http');
const https = require('https');

const creds = Buffer.from('myzqz@163.com:Calvin25165').toString('base64');
const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/user',
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + creds,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'AAM-CMS-Push/1.0'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data.substring(0, 500));
  });
});
req.on('error', e => console.log('Error:', e.message));
req.end();