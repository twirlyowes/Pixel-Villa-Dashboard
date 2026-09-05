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
      name: "Pixel Villa Dashboard",

      credentials: {
        userId: {
          label: "Discord User ID",
          type: "text",
        },
        accessCode: {
          label: "Staff Access Code",
          type: "password",
        },
        adminCode: {
          label: "Administrator DM Code",
          type: "text",
        },
      },

      async authorize(credentials) {
        const userId = credentials?.userId?.trim();
        const accessCode = credentials?.accessCode?.trim();
        const adminCode = credentials?.adminCode?.trim();

        if (!userId) {
          return null;
        }

        if (!/^\d{15,25}$/.test(userId)) {
          return null;
        }

        /*
         * ==========================================
         * ADMIN LOGIN
         * ==========================================
         *
         * Admins use the one-time code sent to
         * their Discord DMs.
         */

        if (ADMIN_USER_IDS.includes(userId)) {
          if (!adminCode) {
            return null;
          }

          if (!/^\d{6}$/.test(adminCode)) {
            return null;
          }

          const ref = db
            .collection("dashboardLoginCodes")
            .doc(userId);

          const snapshot = await ref.get();

          if (!snapshot.exists) {
            return null;
          }

          const challenge = snapshot.data();

          if (!challenge) {
            return null;
          }

          /*
           * Code can only be used once.
           */
          if (challenge.used === true) {
            return null;
          }

          /*
           * Check expiry.
           */
          if (
            !challenge.expiresAt ||
            Date.now() > Number(challenge.expiresAt)
          ) {
            await ref.delete().catch(() => {});
            return null;
          }

          /*
           * Make sure a hash exists.
           */
          if (
            typeof challenge.codeHash !== "string" ||
            !/^[a-f0-9]{64}$/i.test(challenge.codeHash)
          ) {
            return null;
          }

          /*
           * Hash the code entered on the dashboard.
           */
          const receivedHash = crypto
            .createHash("sha256")
            .update(adminCode)
            .digest("hex");

          const expectedHash = challenge.codeHash;

          /*
           * Constant-time comparison.
           */
          const expectedBuffer = Buffer.from(
            expectedHash,
            "hex"
          );

          const receivedBuffer = Buffer.from(
            receivedHash,
            "hex"
          );

          if (
            expectedBuffer.length !== receivedBuffer.length ||
            !crypto.timingSafeEqual(
              receivedBuffer,
              expectedBuffer
            )
          ) {
            return null;
          }

          /*
           * Consume the code.
           */
          await ref.update({
            used: true,
            verifiedAt: Date.now(),
          });

          console.log(
            `[Dashboard Auth] Administrator ${userId} logged in successfully.`
          );

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
         * ==========================================
         * STAFF LOGIN
         * ==========================================
         *
         * Normal staff continue using the shared
         * DASHBOARD_ACCESS_CODE.
         */

        if (!STAFF_USER_IDS.includes(userId)) {
          return null;
        }

        if (!accessCode) {
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

        console.log(
          `[Dashboard Auth] Staff ${userId} logged in successfully.`
        );

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