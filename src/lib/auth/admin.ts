export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const adminEmailsStr = process.env.ADMIN_EMAILS || '';
  if (!adminEmailsStr) return false;

  const adminEmails = adminEmailsStr
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}
