#!/usr/bin/env node
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { User } from '../src/models/User.js'

// Load .env from backend folder if present
dotenv.config({ path: new URL('../.env', import.meta.url).pathname })

const argv = process.argv.slice(2)
function getArg(key, fallback) {
  const idx = argv.findIndex((a) => a === `--${key}`)
  if (idx === -1) return fallback
  return argv[idx + 1]
}

async function main() {
  const email = getArg('email') || process.env.ADMIN_EMAIL
  const name = getArg('name') || 'Admin'
  const password = getArg('password') || 'password123'
  const role = getArg('role') || 'admin'

  if (!email) {
    console.error('Usage: node create-role.js --email user@example.com [--name "Name"] [--password secret] [--role admin|staff|user]')
    process.exit(1)
  }
  if (!['user','staff','admin'].includes(role)) {
    console.error('role must be one of user, staff, admin')
    process.exit(1)
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eazyeats'
  await mongoose.connect(uri, { dbName: undefined })

  // Find user
  let user = await User.findOne({ email })
  if (!user) {
    // create user
    const passwordHash = await User.hashPassword(password)
    user = await User.create({ email, name, passwordHash, role })
    console.log(`Created user ${email} with role ${role}`)
  } else {
    user.role = role
    await user.save()
    console.log(`Updated user ${email} to role ${role}`)
  }

  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
