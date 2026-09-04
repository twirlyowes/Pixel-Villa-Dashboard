
import CredentialsProvider from "next-auth/providers/credentials";
import { getMemberInfo } from "@/lib/discord";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Staff Login",

      credentials: {
        userId: {
          label: "Discord User ID",
          type: "text",
        },
        accessCode: {
          label: "Access Code",
          type: "password",
        },
      },

      async authorize(credentials) {
        console.log("[AUTH DEBUG] Login attempt started");

        const ACCESS_CODE = process.env.DASHBOARD_ACCESS_CODE;

        // 1. Check credentials were submitted
        if (!credentials?.userId || !credentials?.accessCode) {
          console.log("[AUTH DEBUG] FAILED: Missing user ID or access code");
          return null;
        }

        // 2. Check access code
        if (!ACCESS_CODE) {
          console.log("[AUTH DEBUG] FAILED: DASHBOARD_ACCESS_CODE is not set");
          return null;
        }

        if (credentials.accessCode !== ACCESS_CODE) {
          console.log("[AUTH DEBUG] FAILED: Access code does not match");
          return null;
        }

        console.log("[AUTH DEBUG] Access code: OK");

        // 3. Validate Discord ID
        const userId = credentials.userId.trim();

        if (!/^\d{15,25}$/.test(userId)) {
          console.log("[AUTH DEBUG] FAILED: Invalid Discord User ID format");
          return null;
        }

        console.log("[AUTH DEBUG] Discord User ID format: OK");

        // 4. Check Discord member + staff role
        let info;

        try {
          info = await getMemberInfo(userId);
        } catch (error) {
          console.error("[AUTH DEBUG] FAILED: getMemberInfo threw an error");
          console.error("[AUTH DEBUG] Discord error:", error?.message || error);
          return null;
        }

        console.log("[AUTH DEBUG] Discord member check:", {
          isMember: info?.isMember,
          isStaff: info?.isStaff,
          isAdmin: info?.isAdmin,
          username: info?.username,
        });

        // 5. Check server membership
        if (!info?.isMember) {
          console.log("[AUTH DEBUG] FAILED: User is not a member of the Discord server");
          return null;
        }

        console.log("[AUTH DEBUG] Discord membership: OK");

        // 6. Check staff role
        if (!info?.isStaff) {
          console.log("[AUTH DEBUG] FAILED: User does not have a configured staff role");
          return null;
        }

        console.log("[AUTH DEBUG] Staff role: OK");
        console.log("[AUTH DEBUG] LOGIN SUCCESS");

        return {
          id: userId,
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