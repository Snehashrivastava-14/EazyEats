import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/eazyeats'
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('MongoDB connected')

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
