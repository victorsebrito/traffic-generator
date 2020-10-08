import DiameterCommon from '../common';
import * as diameterAvpObject from 'diameter-avp-object';
import Session from '../session';
import Peer from '../peer';
import * as logger from 'winston';
import SocketMsgHeader from './socketMsgHeader';

export default async function fromServer(socket: any, event: any) {
  try {
    let peer = Peer.get(socket.localPort);
    event.response.body = peer.originAvps();
    let avpObject = diameterAvpObject.toObject(event.message.body);

    // Check if contains session ID and if session exists
    if (avpObject.sessionId) {
      if (Session.open.has(avpObject.sessionId)) {
        const session = Session.fromSessionId(avpObject.sessionId);
        const messageId = event.message.header.endToEndId.toString();
        session.pendingReponses.set(messageId, event);
        session.socket.send({
          header: {
            peerId: session.peer.id,
            application: event.message.header.application,
            command: event.message.command,
            messageId,
            request: true
          } as SocketMsgHeader,
          body: avpObject
        });
      }
      else {
        event.response.body = event.response.body.concat([
          ["Result-Code", "DIAMETER_UNKNOWN_SESSION_ID"]
        ]);
        event.callback(event.response);
      }
    }
    else {
      DiameterCommon.handleMessage(socket, event, avpObject);
    }
  }
  catch (err) {
    logger.error(err);
  }
}