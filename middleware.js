export { default } from "next-auth/middleware";

// Every route needs a signed-in, staff-verified session EXCEPT
// the login page and the NextAuth API routes themselves.
export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
