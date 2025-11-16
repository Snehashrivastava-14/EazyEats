import { Server } from 'socket.io'

let io

export function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    // Client may join rooms like user:<userId> or orders
    socket.on('join', (room) => {
      if (typeof room === 'string') socket.join(room)
    })
  })

  return io
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export function emitOrderStatusUpdate(order) {
  const userRoom = `user:${order.userId}`
  getIO().to(userRoom).emit('order_status_updated', {
    orderId: order._id,
    status: order.status,
    updatedAt: new Date().toISOString()
  })
  // Targeted room for tracking a single order
  const orderRoom = `order:${order._id}`
  getIO().to(orderRoom).emit('order_status_updated', {
    orderId: order._id,
    status: order.status,
    updatedAt: new Date().toISOString()
  })
  getIO().to('orders').emit('order_updated', {
    orderId: order._id,
    status: order.status
  })
}

export function emitNewOrder(order) {
  getIO().to('orders').emit('new_order', { orderId: order._id, total: order.total })
}
