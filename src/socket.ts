import * as SocketIO from 'socket.io';
import { Server } from 'http';
import * as logger from 'winston';

export const handlers: {
  [key: string]: (...args: any[]) => Promise<void>
} = { };

export const bind = function (server: Server): SocketIO.Server {
  const io = new SocketIO(server);

  io.on('connection', (socket) => {
    logger.info('Socket connected', socket);

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', socket);
    });

    Object.keys(handlers).forEach(handler => {
      socket.on(handler, async (...args) => {
        await handlers[handler](socket, ...args);
      });
    });
  });

  return io;
}