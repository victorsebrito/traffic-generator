declare module 'diameter-avp-object' {
    export function fromObject(obj: any): any[];

    export function toObject(avpList: any[]): any;
}