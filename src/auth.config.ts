import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    // Add simple session callback if needed here, but avoid DB calls
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        // role might not be available here without DB,
        // but we can add it in auth.ts later
      }
      return session;
    },
  },
  providers: [], // We start with empty providers here to satisfy Edge compatibility
} satisfies NextAuthConfig;
