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

function getAllowedDomains() {
  return (process.env.AUTH_ALLOWED_DOMAINS ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

function emailMatchesAllowedDomain(email: string, domains: string[]) {
  return domains.some((domain) => email.endsWith(`@${domain}`));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;

      const email =
        typeof profile?.email === "string" ? profile.email.toLowerCase() : "";

      const emailVerified = profile?.email_verified === true;
      const allowedEmails = getAllowedEmails();
      const allowedDomains = getAllowedDomains();

      return Boolean(
        email &&
          emailVerified &&
          (allowedEmails.has(email) ||
            emailMatchesAllowedDomain(email, allowedDomains))
      );
    },
  },
});