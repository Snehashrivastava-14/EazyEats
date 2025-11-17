import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user', required: true },
  // Persistent cart stored per user. We store a lightweight snapshot of items
  // to avoid complex joins with nested menu documents. Each entry contains
  // itemId (string), name, price, imageUrl and qty.
  cart: [
    {
      itemId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      imageUrl: { type: String, default: '' },
      qty: { type: Number, default: 1, min: 1 }
    }
  ]
}, { timestamps: true })

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

UserSchema.statics.hashPassword = async function (plain) {
  const saltRounds = 10
  return bcrypt.hash(plain, saltRounds)
}

export const User = mongoose.model('User', UserSchema)
