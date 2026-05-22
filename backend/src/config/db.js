import mongoose from 'mongoose'

function isSrvLookupFailure(error) {
  const message = String(error?.message || '')
  return error?.code === 'ECONNREFUSED' && message.includes('querySrv')
}

async function connectWithLogging(uri, label) {
  await mongoose.connect(uri)
  console.log(`MongoDB connected (${label})`)
}

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eazyeats'
  const fallbackUri = process.env.MONGO_URI_FALLBACK || 'mongodb://127.0.0.1:27017/eazyeats'
  mongoose.set('strictQuery', true)

  try {
    await connectWithLogging(uri, 'primary')
  } catch (error) {
    if (uri !== fallbackUri && isSrvLookupFailure(error)) {
      console.warn('Primary MongoDB URI could not resolve its Atlas SRV record. Retrying fallback URI...')
      await connectWithLogging(fallbackUri, 'fallback')
    } else {
      throw error
    }
  }

  // Development helper: drop stale username index that may have been left behind
  // This prevents E11000 duplicate key errors on `username: null` when the schema
  // no longer defines a username field. We only perform this in non-production
  // environments to avoid unexpected index changes in production.
  if (process.env.NODE_ENV !== 'production') {
    try {
      const db = mongoose.connection.db
      const indexes = await db.collection('users').indexes()
      const idxNames = indexes.map(i => i.name)
      if (idxNames.includes('username_1')) {
        console.log('Dropping stale index username_1 on users collection (dev only)...')
        await db.collection('users').dropIndex('username_1')
        console.log('Dropped username_1 index')
      }
    } catch (err) {
      // If the collection doesn't exist yet or another error occurs, log it and continue
      console.warn('Could not inspect/drop username index:', err.message)
    }
  }
}
