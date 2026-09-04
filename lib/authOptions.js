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

        // Missing credentials
        if (!userId || !accessCode) {
          return null;
        }

        // Discord IDs are numeric and normally 15–25 digits
        if (!/^\d{15,25}$/.test(userId)) {
          return null;
        }

        // Check common dashboard access code
        const expectedAccessCode =
          process.env.DASHBOARD_ACCESS_CODE;

        if (!expectedAccessCode) {
          console.error(
            "DASHBOARD_ACCESS_CODE is not configured."
          );
          return null;
        }

        if (accessCode !== expectedAccessCode) {
          return null;
        }

        // Check staff allowlist
        if (!STAFF_USER_IDS.includes(userId)) {
          return null;
        }

        // Check admin allowlist
        const isAdmin = ADMIN_USER_IDS.includes(userId);

        return {
          id: userId,
          name: userId,
          discordId: userId,
          username: userId,
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
        token.username = user.username || user.name;
        token.isAdmin = user.isAdmin === true;
        token.role = user.role || "staff";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.username = token.username;
        session.user.isAdmin = token.isAdmin === true;
        session.user.role = token.role || "staff";
      }

      return session;
    },
  },
};