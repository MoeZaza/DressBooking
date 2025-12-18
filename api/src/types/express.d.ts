import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      nonce?: string
    }
  }

  namespace NodeJS {
    interface Global {
      corsTracker?: Map<string, number[]>
    }
  }

  var corsTracker: Map<string, number[]> | undefined
}
