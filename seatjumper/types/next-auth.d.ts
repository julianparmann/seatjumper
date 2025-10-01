import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    isAdmin?: boolean;
    emailVerified?: Date | null;
  }

  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      emailVerified?: Date | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
    emailVerified?: Date | null;
  }
}