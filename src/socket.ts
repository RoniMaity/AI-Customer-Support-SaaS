import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict this to your actual frontend domain
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Admin joins a specific room for their tenant to listen for escalations
    socket.on('join_tenant_room', (tenantId: string) => {
      socket.join(tenantId);
      console.log(`Socket ${socket.id} joined tenant room: ${tenantId}`);
    });

    // Admin sends a reply manually (Handoff mode)
    socket.on('admin_reply', (data: { tenantId: string; conversationId: string; content: string }) => {
      // In a real app, you would also save this message to the database here!
      // Emit back to the specific conversation or to the tenant
      io.to(data.tenantId).emit('new_bot_message', {
        conversationId: data.conversationId,
        content: data.content,
        sender: 'admin'
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
