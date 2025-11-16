import mongoose from 'mongoose'

const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  category: { type: String },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  imageUrl: { type: String, default: '' },
  // Reviews as subdocuments on each menu item
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      comment: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true })

const MenuSchema = new mongoose.Schema({
  title: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  dateRange: {
    start: { type: Date },
    end: { type: Date }
  },
  items: [MenuItemSchema]
}, { timestamps: true })

export const Menu = mongoose.model('Menu', MenuSchema)
