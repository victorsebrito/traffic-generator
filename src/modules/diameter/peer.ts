import DiameterCommon from './common';

export interface PeerConfig {
  origin: {
    host: string;
    port: number;
    realm: string;
    productName?: string;    
  },
  destination: {
    host: string;
    ip: string;
    port: number;
    realm: string;
    productName?: string;    
  },
  pingInterval?: number;
  applications: string[];
}

export default class Peer {
  static connected = new Map<number, Peer>();
  static reconnectPool = new Map<number, Peer>();
  config: PeerConfig
  connection: any;
  lastDW: Date;

  constructor(config: PeerConfig, connection: any) {
    this.config = config;
    this.connection = connection;
    this.lastDW = new Date();
    Peer.connected.set(this.id, this);
    this.ping();
  }

  get id(): number {
    return this.config.origin.port;
  }

  identityAvps(): any[] {
    return this.originAvps().concat(this.destinationAvps())
  }

  originAvps(): any[] {
    return [
      ["Origin-Host", this.config.origin.host],
      ["Origin-Realm", this.config.origin.realm],
    ]
  };

  destinationAvps(): any[] {
    return [
      ["Destination-Host", this.config.destination.host],
      ["Destination-Realm", this.config.destination.realm]
    ]
  };

  private async ping() {
    while (Peer.connected.has(this.id)) {
      const interval = this.config.pingInterval || 10000;
      await new Promise(resolve => setTimeout(resolve, interval));
      if ((new Date().getTime() - this.lastDW.getTime() > interval) && !(await DiameterCommon.dwr(this))) {
        Peer.connected.delete(this.id);
      }
    }
  }

  static get(id: number): Peer {
    let peer = Peer.connected.get(id);
    if (!peer) {
      throw new Error(`Peer ${id} not found`);
    }
    return peer;
  }

  static forApplication(application: string) {
    return Array.from(this.connected.values())
      .find(p => p.config.applications.includes(application));
  }

}