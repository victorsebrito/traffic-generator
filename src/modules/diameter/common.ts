
import * as diameter from 'diameter';
import * as diameterAvpObject from 'diameter-avp-object';
import fromServer from './handlers/fromServer';
import Peer from './peer';
import * as logger from 'winston';

function beforeAnyMessage(message: any) {
  logger.debug('\n' + diameter.messageToColoredString(message));
}

function afterAnyMessage(message: any) {
  logger.debug('\n' + diameter.messageToColoredString(message));
}

const originStateId = Math.floor(Date.now() / 1000);

class DiameterCommon {

  static async cer(params: {
    host: string,
    port: number,
    localPort?: number,
    productName?: string,
    originHost: string,
    originRealm: string,
    pingInterval?: number,
    applications: string[]
  }) {
    return new Promise((res, err) => {
      try {
        const tempSocketError = function (error: any) {
          err(error);
        };

        let socket = diameter.createConnection({
          beforeAnyMessage,
          afterAnyMessage,
          localPort: params.localPort,
          port: params.port,
          host: params.host,
        }, function () {
          const connection = socket.diameterConnection;
          const request = connection.createRequest(
            "Diameter Common Messages",
            "Capabilities-Exchange"
          );
          request.body = [];
          request.body = request.body.concat([
            ["Origin-Host", params.originHost],
            ["Origin-Realm", params.originRealm],
            ["Origin-State-Id", originStateId],
            ["Vendor-Id", 10415],
            ["Supported-Vendor-Id", 10415],
            ["Host-IP-Address", socket.localAddress]
          ]).concat(
            params.applications.map(app => ["Auth-Application-Id", app])
          );          

          if (params.productName) {
            request.body = request.body.concat([
              ["Product-Name", params.productName]
            ])
          }

          connection.sendRequest(request).then(
            function (response: any) {
              let responseObj = diameterAvpObject.toObject(response.body);
              if (responseObj.resultCode === "DIAMETER_SUCCESS") {
                let peer = new Peer({
                  origin: {
                    host: params.originHost,
                    port: socket.localPort,
                    realm: params.originRealm,
                    productName: params.productName
                  },
                  destination: {
                    host: responseObj.originHost,
                    realm: responseObj.originRealm,
                    ip: responseObj.hostIpAddress,
                    port: params.port,
                    productName: responseObj.productName
                  },
                  pingInterval: params.pingInterval,
                  applications: params.applications,
                }, connection);

                socket.removeListener('error', tempSocketError);
                socket.on('error', function (error: any) {
                  logger.error(error);
                });

                res(peer.config);
              }
              else err(responseObj);
            },
            function (error: any) {
              err(error);
              logger.error("Could not connect to peer", error);
            }
          );
        });

        socket.on("diameterMessage", async (event) => {
          await fromServer(socket, event);
        });

        socket.on("error", tempSocketError);
      }
      catch (error) {
        err(error);
      }
    });
  }

  static async dpr(peer: Peer): Promise<boolean> {
    return new Promise((res, err) => {
      try {
        var request = peer.connection.createRequest(
          "Diameter Common Messages",
          "Disconnect-Peer"
        );
        request.body = peer.originAvps();
        request.body = request.body.concat([
          ["Disconnect-Cause", "DO_NOT_WANT_TO_TALK_TO_YOU"]
        ]);

        peer.connection.sendRequest(request).then(
          function (response: any) {
            res(true);
          },
          function (error: any) {
            err(error);
            logger.error("Could not successfully disconnect from peer", error);
          }
        );
      }
      catch (error) {
        err(error);
      }
      finally {
        Peer.connected.delete(peer.id);
      }
    });
  }

  static async dwr(peer: Peer): Promise<boolean> {
    return new Promise((res, err) => {
      var request = peer.connection.createRequest(
        "Diameter Common Messages",
        "Device-Watchdog"
      );
      request.body = peer.originAvps();

      peer.connection.sendRequest(request).then(
        function (response: any) {
          const responseObj = diameterAvpObject.toObject(response.body);
          if (responseObj.resultCode === "DIAMETER_SUCCESS") {
            peer.lastDW = new Date();
            res(true);
          }
          else {
            Peer.connected.delete(peer.id);
            res(false);
          }
        },
        function (error: any) {
          err(error);
          Peer.connected.delete(peer.id);
        }
      );
    });
  }

  static async handleMessage(socket: any, event: any, avpObject: any) {
    switch (event.message.command) {
      case "Device-Watchdog":
        DiameterCommon.handleDWR(socket, event, avpObject);
        break;
    }
  }

  static async handleDWR(socket: any, event: any, avpObject: any) {
    let peer = Peer.get(socket.localPort);
    peer.lastDW = new Date();
    event.response.body = event.response.body.concat([
      ["Result-Code", "DIAMETER_SUCCESS"]
    ]);
    event.callback(event.response);
  }
}

export default DiameterCommon;