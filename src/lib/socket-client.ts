'use client'

import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Lazily connect to the Socket.IO server.
 * Joins the user-specific room so they receive targeted notifications.
 * Returns null if the connection cannot be established (e.g. no custom server).
 */
export function getSocket(userId: string): Socket {
  if (!socket) {
    socket = io({
      path: '/api/socketio',
      auth: { userId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
