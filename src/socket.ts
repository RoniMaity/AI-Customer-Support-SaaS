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
      socket.join(`tenant_${tenantId}`);
      console.log(`Socket ${socket.id} joined tenant room: tenant_${tenantId}`);
    });

    // Customer widget joins a specific room for their conversation
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Socket ${socket.id} joined conversation room: conversation_${conversationId}`);
    });

    // Admin sends a reply manually (Handoff mode)
    socket.on('admin_reply', (data: { tenantId: string; conversationId: string; content: string }) => {
      // Broadcast to the user via their conversation room
      io.to(`conversation_${data.conversationId}`).emit('admin_message', {
        id: Date.now(),
        sender: 'admin',
        text: data.content
      });
      // Optionally broadcast to the tenant room so other admins see it too
      io.to(`tenant_${data.tenantId}`).emit('admin_message_echo', {
        conversationId: data.conversationId,
        content: data.content
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
