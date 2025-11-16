import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user', required: true }
}, { timestamps: true })

UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

UserSchema.statics.hashPassword = async function (plain) {
  const saltRounds = 10
  return bcrypt.hash(plain, saltRounds)
}

export const User = mongoose.model('User', UserSchema)
