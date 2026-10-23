import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string | null;
    } & DefaultSession["user"];
    /** Id of this device's sign-in (DeviceSession), absent for sign-ins made before it existed */
    sessionId?: string;
  }

  interface User {
    username?: string | null;
    /** DeviceSession id */
    sid?: string;
    /** Last time (ms) the device row was confirmed to exist */
    sidCheckedAt?: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    /** DeviceSession id */
    sid?: string;
    /** Last time (ms) the device row was confirmed to exist */
    sidCheckedAt?: number;
  }
}
