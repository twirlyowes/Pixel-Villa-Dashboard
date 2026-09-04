import CredentialsProvider from "next-auth/providers/credentials";

const STAFF_USER_IDS = (process.env.STAFF_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const ACCESS_CODE = process.env.DASHBOARD_ACCESS_CODE;

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Pixel Villa Dashboard",

      credentials: {
        discordId: {
          label: "Discord User ID",
          type: "text",
        },
        accessCode: {
          label: "Access Code",
          type: "password",
        },
      },

      async authorize(credentials) {
        const discordId =
          credentials?.discordId?.trim();

        const accessCode =
          credentials?.accessCode;

        if (!discordId || !accessCode) {
          return null;
        }

        if (!/^\d{15,25}$/.test(discordId)) {
          return null;
        }

        if (!ACCESS_CODE) {
          console.error(
            "DASHBOARD_ACCESS_CODE is not configured."
          );
          return null;
        }

        if (accessCode !== ACCESS_CODE) {
          return null;
        }

        const isAdmin =
          ADMIN_USER_IDS.includes(discordId);

        const isStaff =
          STAFF_USER_IDS.includes(discordId);

        if (!isStaff && !isAdmin) {
          return null;
        }

        return {
          id: discordId,
          discordId,
          username: discordId,
          name: discordId,
          isAdmin,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.discordId = user.discordId;
        token.username = user.username;
        token.isAdmin = user.isAdmin;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.discordId =
        token.discordId;

      session.user.username =
        token.username;

      session.user.isAdmin =
        token.isAdmin === true;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};