declare module 'diameter' {
    import { Server, Socket } from "net";

    export function createConnection(options: any, connectionListener: any): Socket & { diameterConnection: any };

    export function createServer(options: any, connectionListener: any): Server;

    export function getAvpValue(message: any, path: any): any;

    export function logMessage(message: any): void;

    export function messageToColoredString(message: any): string;
}