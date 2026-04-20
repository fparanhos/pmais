import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Run on all routes except Next internals, static assets, brand, favicon
  // and the NextAuth API handlers themselves.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|brand|favicon\\.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
