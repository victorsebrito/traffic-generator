export default interface SocketMsgHeader {
  peerId?: number,
  application: string,
  command: string,
  messageId: string,
  request: boolean,
  success?: boolean,
  error?: object
}