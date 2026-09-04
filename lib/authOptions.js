
import CredentialsProvider from "next-auth/providers/credentials";
import { getMemberInfoByUsername } from "@/lib/discord";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Staff Login",

      credentials: {
        username: {
          label: "Discord Username",
          type: "text",
        },
        accessCode: {
          label: "Access Code",
          type: "password",
        },
      },

      async authorize(credentials) {
        const ACCESS_CODE = process.env.DASHBOARD_ACCESS_CODE;

        if (
          !credentials?.username ||
          !credentials?.accessCode
        ) {
          return null;
        }

        // Check common dashboard password.
        if (!ACCESS_CODE) {
          console.error(
            "DASHBOARD_ACCESS_CODE is not configured."
          );
          return null;
        }

        if (credentials.accessCode !== ACCESS_CODE) {
          return null;
        }

        const username = credentials.username
          .trim()
          .replace(/^@/, "");

        if (!username) {
          return null;
        }

        // Find the real Discord member.
        const info = await getMemberInfoByUsername(username);

        if (!info.isMember) {
          return null;
        }

        // User must have one of the configured staff roles.
        if (!info.isStaff) {
          return null;
        }

        return {
          id: info.userId,
          name: info.username,
          isAdmin: info.isAdmin,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.discordId = user.id;
        token.username = user.name;
        token.isAdmin = user.isAdmin;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.discordId = token.discordId;
      session.user.username = token.username;
      session.user.isAdmin = token.isAdmin;

      return session;
    },
  },
};