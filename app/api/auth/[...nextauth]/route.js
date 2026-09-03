import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { isStaff } from "@/lib/discord";

const handler = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Runs on every sign-in attempt — block non-staff here
    async signIn({ user }) {
      const allowed = await isStaff(user.id);
      return allowed; // false = NextAuth shows an "access denied" page
    },
    // Persist the Discord user id onto the session so pages/APIs can use it
    async jwt({ token, user }) {
      if (user) token.discordId = user.id;
      return token;
    },
    async session({ session, token }) {
      session.user.discordId = token.discordId;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { handler as GET, handler as POST };
