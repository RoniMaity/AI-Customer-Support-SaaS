import { createServer } from 'http';
import app from './app';
import { initSocket } from './socket';

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

// Initialize Socket.io with the HTTP server
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
