import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAllowedEmails() {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ profile }) {
      const email =
        typeof profile?.email === "string" ? profile.email.toLowerCase() : "";

      const emailVerified = profile?.email_verified === true;
      const allowedEmails = getAllowedEmails();

      return Boolean(email && emailVerified && allowedEmails.has(email));
    },
  },
});