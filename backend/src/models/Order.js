import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu.items', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 }
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: { type: [OrderItemSchema], required: true },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'cancelled'], default: 'placed' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paidAt: { type: Date },
  scheduledPickupAt: { type: Date, required: true },
  instructions: { type: String }
}, { timestamps: true })

// Virtual shortId (last 6 characters of _id) for easy sharing
OrderSchema.virtual('shortId').get(function () {
  return this._id ? this._id.toString().slice(-6) : ''
})

// Ensure virtuals are included when converting to JSON
OrderSchema.set('toJSON', { virtuals: true })
OrderSchema.set('toObject', { virtuals: true })

const OrderStatusHistorySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  status: { type: String, required: true },
  byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now }
})

export const Order = mongoose.model('Order', OrderSchema)
export const OrderStatusHistory = mongoose.model('OrderStatusHistory', OrderStatusHistorySchema)
