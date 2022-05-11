#!/usr/bin/env node

// using a cjs file here so phusion passenger can require() this file

async function main(){
  require('dotenv').config()
  const { default: server } = await import('../index.js')
  server.start()
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
