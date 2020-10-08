import DiameterCommon from '../common';
import * as diameterAvpObject from 'diameter-avp-object';
import Session from '../session';
import Peer from '../peer';
import { Socket } from 'socket.io';
import { deserializeBuffers } from '../utils';
import SocketMsgHeader from './socketMsgHeader';

const addIdentityAvps = function(body: any, peer: Peer) {

  const hasUndefinedKey = function(obj: any, key: string) {
    return obj.hasOwnProperty(key) && obj[key] == undefined;
  }

  if (hasUndefinedKey(body, 'originHost')) {
    body.originHost = peer.config.origin.host;
  }

  if (hasUndefinedKey(body, 'originRealm')) {
    body.originRealm = peer.config.origin.realm;
  }

  if (hasUndefinedKey(body, 'destinationHost')) {
    body.destinationHost = peer.config.destination.host;
  }

  if (hasUndefinedKey(body, 'destinationRealm')) {
    body.destinationRealm = peer.config.destination.realm;
  }
}

export default async function fromClient(
  socket: Socket,
  message: {
    header: SocketMsgHeader,
    body: any
  }) {

  const header = message.header;
  const body = message.body;
  deserializeBuffers(body);

  try {

    if (!body.sessionId) {
      header.request = false;
      header.success = false;
      header.error = { message: 'AVP Session-Id is mandatory' };
      socket.send({ header });
      return;
    }

    // TODO: Validate duplicate session Ids

    let session: Session;
    if (Session.open.has(body.sessionId)) {
      session = Session.fromSessionId(body.sessionId);
    }
    else {
      const peer = header.peerId ? Peer.get(header.peerId) : Peer.forApplication(header.application);

      if (!peer) {
        header.request = false;
        header.success = false;
        header.error = { message: 'Peer not found' };
        socket.send({ header });
        return;
      }

      session = new Session(body.sessionId, socket, peer);
    }

    if (header.request) {
      header.request = false;
      const peer = session.peer;

      const request = peer.connection.createRequest(
        header.application,
        header.command
      );
      request.header.flags.proxiable = true;
      addIdentityAvps(body, peer);
      request.body = diameterAvpObject.fromObject(body);

      peer.connection.sendRequest(request).then(
        function (response: any) {
          const responseObj = diameterAvpObject.toObject(response.body);
          header.success = true;
          socket.send({
            header,
            body: responseObj
          });
        },
        function (error: any) {
          header.success = false;
          socket.send({
            header,
            body: error
          });
        });
    } else {
      const event = session.pendingReponses.get(header.messageId);

      if (!event) {
        header.success = false;
        header.error = { message: 'Message ID not found' };
        socket.send({ header });
        return;
      }

      event.response.body = event.response.body.concat(diameterAvpObject.fromObject(body));
      event.callback(event.response);
      session.pendingReponses.delete(header.messageId);
    }
  }
  catch (err) {
    header.success = false;
    header.error = {
      code: err.name,
      message: err.message,
      stack: err.stack
    };
    socket.send({ header });
  }
}