// Type augmentation to resolve Vite ServerOptions type conflict
// This fixes the deployment issue where allowedHosts: true is inferred as boolean
// instead of the literal true type that Vite expects

import { ServerOptions } from 'vite'

declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: true | boolean | string[] | undefined
  }
}