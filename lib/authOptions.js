
import CredentialsProvider from "next-auth/providers/credentials";

const STAFF_USER_IDS = (process.env.STAFF_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

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
        const userId = credentials?.userId?.trim();
        const accessCode = credentials?.accessCode;

        console.log("[AUTH] Login attempt:", userId);

        if (!userId || !accessCode) {
          console.log("[AUTH] Missing credentials");
          return null;
        }

        // Discord IDs are numeric snowflakes.
        if (!/^\d{15,25}$/.test(userId)) {
          console.log("[AUTH] Invalid Discord ID");
          return null;
        }

        const expectedCode = process.env.DASHBOARD_ACCESS_CODE;

        if (!expectedCode) {
          console.error("[AUTH] DASHBOARD_ACCESS_CODE is not set");
          return null;
        }

        if (accessCode !== expectedCode) {
          console.log("[AUTH] Wrong access code");
          return null;
        }

        // Must be an approved staff member.
        if (!STAFF_USER_IDS.includes(userId)) {
          console.log("[AUTH] User is not an approved staff member");
          return null;
        }

        const isAdmin = ADMIN_USER_IDS.includes(userId);

        console.log("[AUTH] LOGIN SUCCESS", {
          userId,
          isAdmin,
        });

        return {
          id: userId,
          name: userId,
          discordId: userId,
          isAdmin,
          role: isAdmin ? "admin" : "staff",
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
        token.discordId = user.discordId || user.id;
        token.username = user.name;
        token.isAdmin = user.isAdmin;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.discordId = token.discordId;
      session.user.username = token.username;
      session.user.isAdmin = token.isAdmin;
      session.user.role = token.role;

      return session;
    },
  },
};