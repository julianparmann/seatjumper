import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check for test accounts first (for development)
        const testAccounts = [
          { email: 'user@test.com', password: 'password123', name: 'Test User', isAdmin: false },
          { email: 'admin@test.com', password: 'admin123', name: 'Admin User', isAdmin: true },
          { email: 'vip@test.com', password: 'vip123', name: 'VIP User', isAdmin: false },
        ];

        const testAccount = testAccounts.find(acc => acc.email === credentials.email);
        if (testAccount && credentials.password === testAccount.password) {
          // Create or get test user from database
          const user = await prisma.user.upsert({
            where: { email: testAccount.email },
            update: {},
            create: {
              email: testAccount.email,
              name: testAccount.name,
              password: await bcrypt.hash(testAccount.password, 10),
              isAdmin: testAccount.isAdmin,
              emailVerified: new Date(),
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
          };
        }

        // Check real user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Return user even if not verified - we'll handle verification in callbacks
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin || user.email === 'julianparmann@gmail.com',
          emailVerified: user.emailVerified,
        };
      }
    }),
    // Google provider (optional)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create user in database if signing in with OAuth
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        try {
          // Upsert user in database
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email,
              name: user.name,
              image: user.image,
              isAdmin: email === 'julianparmann@gmail.com', // Make you admin automatically
            },
          });

          // Update user object with database ID
          user.id = dbUser.id;
          (user as any).isAdmin = dbUser.isAdmin;
        } catch (error) {
          console.error('Error creating/updating user:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isAdmin = (user as any).isAdmin || false;
        token.emailVerified = (user as any).emailVerified;
      } else if (token.email) {
        // Fetch user from database to get current status
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin;
          token.emailVerified = dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).isAdmin = token.isAdmin as boolean;
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
};