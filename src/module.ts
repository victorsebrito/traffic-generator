import { Router } from 'express';

export default interface Module {
  apiRouter?: Router,
  socketHandler?: (...args: any[]) => Promise<void>
  onRegistered?: (config: any) => Promise<void>
}