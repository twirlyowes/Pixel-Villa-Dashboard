import CredentialsProvider from "next-auth/providers/credentials";
import crypto from "crypto";

import { db } from "@/lib/firebaseAdmin";

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
        const accessCode = credentials?.accessCode?.trim();

        if (!userId || !accessCode) {
          return null;
        }

        if (!/^\d{15,25}$/.test(userId)) {
          return null;
        }

        /*
         * ADMIN LOGIN
         *
         * Admins authenticate using the one-time code
         * sent to their Discord DMs.
         */
        if (ADMIN_USER_IDS.includes(userId)) {
          const ref = db
            .collection("dashboardLoginCodes")
            .doc(userId);

          const snapshot = await ref.get();

          if (!snapshot.exists) {
            return null;
          }

          const challenge = snapshot.data();

          if (challenge.used) {
            return null;
          }

          if (
            !challenge.expiresAt ||
            Date.now() > challenge.expiresAt
          ) {
            await ref.delete().catch(() => {});
            return null;
          }

          if (!challenge.codeHash) {
            return null;
          }

          const codeHash = crypto
            .createHash("sha256")
            .update(accessCode)
            .digest("hex");

          const expectedHash = Buffer.from(
            challenge.codeHash,
            "hex"
          );

          const receivedHash = Buffer.from(
            codeHash,
            "hex"
          );

          if (
            expectedHash.length !== receivedHash.length ||
            !crypto.timingSafeEqual(
              receivedHash,
              expectedHash
            )
          ) {
            return null;
          }

          /*
           * Consume the code so it cannot be reused.
           */
          await ref.update({
            used: true,
            verifiedAt: Date.now(),
          });

          return {
            id: userId,
            name: userId,
            discordId: userId,
            username: userId,
            isAdmin: true,
            role: "admin",
          };
        }

        /*
         * NORMAL STAFF LOGIN
         *
         * Staff continue using the shared dashboard access code.
         */
        if (!STAFF_USER_IDS.includes(userId)) {
          return null;
        }

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

        return {
          id: userId,
          name: userId,
          discordId: userId,
          username: userId,
          isAdmin: false,
          role: "staff",
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