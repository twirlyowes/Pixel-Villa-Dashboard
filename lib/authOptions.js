import CredentialsProvider from "next-auth/providers/credentials";
import { getMemberInfo } from "@/lib/discord";

// Pulled out into its own file (rather than living inside the
// [...nextauth]/route.js handler) so other server-side code — API
// routes, server components — can call getServerSession(authOptions)
// too, not just the auth route itself.
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Staff Login",
      credentials: {
        userId: { label: "Discord User ID", type: "text" },
        accessCode: { label: "Access Code", type: "password" },
      },
      async authorize(credentials) {
        const ACCESS_CODE = process.env.DASHBOARD_ACCESS_CODE;

        if (!credentials?.userId || !credentials?.accessCode) return null;
        if (credentials.accessCode !== ACCESS_CODE) return null;

        const userId = credentials.userId.trim();
        if (!/^\d{15,25}$/.test(userId)) return null; // must look like a real Discord ID

        const info = await getMemberInfo(userId);
        if (!info.isMember) return null; // not actually in the server
        if (!info.isStaff) return null; // in the server, but no staff role

        return {
          id: userId,
          name: info.username,
          isAdmin: info.isAdmin,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

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