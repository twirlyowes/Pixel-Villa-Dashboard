import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Access Code",

      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        accessCode: {
          label: "Access Code",
          type: "password",
          placeholder: "Enter access code",
        },
      },

      async authorize(credentials) {
        const ACCESS_CODE = process.env.DASHBOARD_ACCESS_CODE;

        if (
          credentials?.username &&
          credentials?.accessCode === ACCESS_CODE
        ) {
          return {
            id: credentials.username,
            name: credentials.username,
          };
        }

        return null;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };