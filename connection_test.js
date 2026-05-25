#!/usr/bin/env node
// Test GitHub connection - measure TCP handshake time
const https = require('https');
const net = require('net');

const start = Date.now();
const socket = net.connect(443, 'github.com', () => {
  const elapsed = Date.now() - start;
  console.log(`TCP handshake: ${elapsed}ms`);
  socket.destroy();
});

socket.on('error', e => {
  console.log(`TCP error: ${e.message} after ${Date.now() - start}ms`);
});

// Try HTTPS request
const req = https.get('https://github.com/', {headers: {'User-Agent': 'git/2.0'}}, res => {
  console.log(`HTTPS Status: ${res.statusCode}, elapsed: ${Date.now() - start}ms`);
  res.resume();
  res.on('end', () => process.exit(0));
});
req.on('error', e => console.log(`HTTPS error: ${e.message} after ${Date.now() - start}ms`));
req.setTimeout(10000, () => { console.log('Timeout'); req.destroy(); });