"use client";

import { SessionProvider } from "next-auth/react";

// useSession() (used by Sidebar to know if someone's an admin) needs this
// context provider somewhere above it in the tree — the original scaffold
// never needed it since nothing read session client-side before now.
export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}