import type { Server as SocketServer } from 'socket.io'

/**
 * Socket.IO server singleton.
 * Set by the custom server (server.ts), consumed by API routes to emit events.
 */
declare global {
  // eslint-disable-next-line no-var
  var _io: SocketServer | undefined
}

export function getIO(): SocketServer | null {
  return globalThis._io ?? null
}

export function setIO(io: SocketServer) {
  globalThis._io = io
}

/** Emit a real-time notification to a specific user's room. */
export function emitNotification(
  userId: string,
  notification: { id: string; type: string; title: string; message: string; createdAt: string }
) {
  const io = getIO()
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification)
  }
}
