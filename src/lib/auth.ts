import { NextAuthOptions, Session, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from '@/lib/prisma';
import type { Role, Plan } from '@prisma/client';
import { compare } from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
      plan: Plan;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    plan: Plan;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'dualaihub-fallback-secret-change-in-production',
  trustHost: true,
  debug: process.env.NODE_ENV !== 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isValid = await compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        const credUser = user as { id: string; role?: Role; plan?: Plan };
        token.id = credUser.id;
        token.role = credUser.role ?? 'USER';
        token.plan = credUser.plan ?? 'FREE';
      }

      if (account?.provider && account.provider !== 'credentials' && token.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (existingUser) {
          token.id = existingUser.id;
          token.role = existingUser.role;
          token.plan = existingUser.plan;
        } else {
          const newUser = await prisma.user.create({
            data: {
              email: token.email,
              name: token.name as string,
              image: token.picture as string,
              passwordHash: 'OAUTH_USER_NO_PASSWORD',
              role: 'USER',
              plan: 'FREE',
              emailVerified: new Date(),
            },
          });
          await prisma.credit.create({
            data: {
              userId: newUser.id,
              amount: 0,
              points: 0,
              monthlyPoints: 0,
              shortDramaQuota: 0,
              shortDramaUsedThisMonth: 0,
              dailyUsed: 0,
              videoUsedThisMonth: 0,
              lastVideoReset: new Date(),
              lastReset: new Date(),
              lastPointsReset: new Date(),
              lastDailyReset: new Date(),
            },
          });
          token.id = newUser.id;
          token.role = newUser.role;
          token.plan = newUser.plan;
        }
      }

      if (trigger === 'update' && token.id) {
        const refreshedUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, plan: true },
        });
        if (refreshedUser) {
          token.role = refreshedUser.role;
          token.plan = refreshedUser.plan;
        }
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (!token?.id) {
        return session as Session;
      }
      return {
        ...session,
        user: {
          id: token.id as string,
          email: (token.email || session.user?.email || '') as string,
          name: (token.name || session.user?.name || null) as string | null,
          image: (token.picture || session.user?.image || null) as string | null,
          role: (token.role || 'USER') as Role,
          plan: (token.plan || 'FREE') as Plan,
        },
      };
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
