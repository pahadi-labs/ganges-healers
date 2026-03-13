import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketServer } from 'socket.io'
import { setIO } from './src/lib/socket'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res, parse(req.url!, true))
  })

  const io = new SocketServer(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  setIO(io)

  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId
    if (typeof userId === 'string' && userId.length > 0) {
      socket.join(`user:${userId}`)
    }

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io
    })
  })

  const port = parseInt(process.env.PORT || '3000', 10)
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  })
})
