// d:/nodejs/WorkpaperMarket/WorkpaperMarket/server/express.d.ts
import { User as AppUser } from '../shared/schema'; // Adjusted path for schema relative to server directory

declare global {
  namespace Express {
    export interface Request {
      user?: AppUser; // Define user property on Request, matching the type from your shared schema
    }
  }
}

// Export something to make it a module, if it's not already considered one.
export {};
