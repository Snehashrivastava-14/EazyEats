import mongoose from 'mongoose'

const uri = process.env.MONGO_URI
console.log('MONGO_URI set:', !!uri)

;(async () => {
  try {
    console.log('Attempting MongoDB connection (test-mongo)...')
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
    console.log('MongoDB connection successful')
    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('MongoDB connection failed (test-mongo):')
    console.error(err)
    process.exit(1)
  }
})()
