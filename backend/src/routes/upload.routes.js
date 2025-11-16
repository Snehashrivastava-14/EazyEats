import { Router } from 'express'
import multer from 'multer'
import cloudinary from 'cloudinary'
import streamifier from 'streamifier'
import dotenv from 'dotenv'
import { authRequired, hasRole } from '../middleware/auth.js'

// Ensure environment variables from .env are loaded when this module runs.
// server.js imports this route file; since ES module imports are evaluated
// before the importing module's body runs, dotenv may not yet have been
// called in the importer. Load it here to guarantee process.env is populated.
dotenv.config()

const router = Router()

// configure cloudinary from env
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const CLOUDY_CONFIGURED = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

// multer with memory storage and limits (5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image uploads are allowed'))
    cb(null, true)
  }
})

// POST /upload - upload an image (field: image)
router.post('/', authRequired, hasRole('staff', 'admin'), upload.single('image'), async (req, res) => {
  if (!CLOUDY_CONFIGURED) return res.status(500).json({ error: 'Cloudinary not configured on server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in environment.' })
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
    const buffer = req.file.buffer

    // use upload_stream to avoid writing to disk
    const uploadStream = cloudinary.v2.uploader.upload_stream({ folder: 'eazyeats' }, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error)
        return res.status(500).json({ error: 'Upload failed', details: error.message || error })
      }
      return res.json({ url: result.secure_url })
    })

    streamifier.createReadStream(buffer).pipe(uploadStream)
  } catch (e) {
    console.error('Upload route exception:', e)
    res.status(500).json({ error: 'Upload failed', details: e.message })
  }
})

export default router
