import Peer from './peer';
import { Socket } from 'socket.io';

export default class Session {
  static open = new Map<string, Session>();
  static count = 0;

  sessionId: string;
  socket: Socket;
  peer: Peer;
  pendingReponses = new Map<string, any>();

  constructor(sessionId: string, socket: Socket, peer: Peer) {
    this.sessionId = sessionId;
    this.socket = socket;
    this.peer = peer;
    Session.open.set(this.sessionId, this);
    this.socket.on('disconnect', () => { Session.onSocketDisconnect(this.sessionId) });
  }

  static fromSessionId(id: string): Session {
    let session = Session.open.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found`);
    }
    return session;
  }

  static fromSocketId(id: string): Session {
    let session = Array.from(Session.open.values()).find(s => s.socket.id == id);
    if (!session) {
      throw new Error(`Socket ${id} not found`);
    }
    return session;
  }

  private static onSocketDisconnect(sessionId: string) {
    Session.open.delete(sessionId);
  }

}