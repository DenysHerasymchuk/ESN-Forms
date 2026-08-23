// Mirrors supabase/config.toml's auth policy (minimum_password_length = 8,
// password_requirements = "lower_upper_letters_digits") - kept in sync by
// hand since the Admin API (used by create-user/update-user) doesn't
// necessarily re-enforce the project's password policy itself.
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include a lowercase letter, an uppercase letter, and a digit'
  }
  return null
}
