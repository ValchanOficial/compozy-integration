import type { Session, User, AuthError } from "@supabase/supabase-js";

/**
 * Re-export Supabase auth types for convenience.
 */
export type { Session, User, AuthError };

/**
 * Result of authentication operations (signup, login, getSession).
 */
export interface AuthResult {
  /** User session if authentication succeeded */
  session: Session | null;
  /** User data if authentication succeeded */
  user: User | null;
  /** Error message if authentication failed */
  error: string | null;
}

/**
 * Result of logout operation.
 */
export interface LogoutResult {
  /** True if logout succeeded */
  success: boolean;
  /** Error message if logout failed */
  error: string | null;
}

/**
 * Credentials for email/password authentication.
 */
export interface EmailPasswordCredentials {
  /** User email address */
  email: string;
  /** User password */
  password: string;
}

/**
 * Options for signup operation.
 */
export interface SignupOptions {
  /** Custom user metadata to store with the account */
  data?: Record<string, unknown>;
  /** URL to redirect to after email confirmation */
  emailRedirectTo?: string;
}
