import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthResult,
  LogoutResult,
  EmailPasswordCredentials,
  SignupOptions,
} from "@/types/auth";

/**
 * Environment variable keys for Supabase configuration.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

/**
 * Validates that required Supabase environment variables are set.
 * @returns true if both URL and anon key are configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Creates a Supabase client instance.
 * Returns null if environment variables are not configured.
 * @returns Supabase client or null
 */
function createSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    console.warn(
      "Supabase is not configured. Set VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_ANON_KEY environment variables."
    );
    return null;
  }

  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Singleton Supabase client instance.
 * May be null if environment variables are not configured.
 */
export const supabase: SupabaseClient | null = createSupabaseClient();

/**
 * Gets the Supabase client, throwing if not configured.
 * Use this when Supabase operations are required.
 * @returns Supabase client
 * @throws Error if Supabase is not configured
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and " +
        "VITE_SUPABASE_ANON_KEY environment variables."
    );
  }
  return supabase;
}

/**
 * Signs up a new user with email and password.
 * @param credentials - Email and password for the new account
 * @param options - Optional signup configuration
 * @returns AuthResult with session, user, or error
 */
export async function signup(
  credentials: EmailPasswordCredentials,
  options?: SignupOptions
): Promise<AuthResult> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: options
        ? {
            data: options.data,
            emailRedirectTo: options.emailRedirectTo,
          }
        : undefined,
    });

    if (error) {
      return {
        session: null,
        user: null,
        error: error.message,
      };
    }

    return {
      session: data.session,
      user: data.user,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed";
    return {
      session: null,
      user: null,
      error: message,
    };
  }
}

/**
 * Logs in an existing user with email and password.
 * @param credentials - Email and password for authentication
 * @returns AuthResult with session, user, or error
 */
export async function login(
  credentials: EmailPasswordCredentials
): Promise<AuthResult> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        session: null,
        user: null,
        error: error.message,
      };
    }

    return {
      session: data.session,
      user: data.user,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return {
      session: null,
      user: null,
      error: message,
    };
  }
}

/**
 * Logs out the current user.
 * @returns LogoutResult with success status or error
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Logout failed";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Retrieves the current user session.
 * Sessions from local storage may not be fully authentic;
 * use getUser() for server-verified user data.
 * @returns AuthResult with session data or error
 */
export async function getSession(): Promise<AuthResult> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      return {
        session: null,
        user: null,
        error: error.message,
      };
    }

    return {
      session: data.session,
      user: data.session?.user ?? null,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get session";
    return {
      session: null,
      user: null,
      error: message,
    };
  }
}

/**
 * Fetches the authenticated user from the server.
 * Unlike getSession(), this makes a network request to verify authenticity.
 * @returns AuthResult with user data or error
 */
export async function getUser(): Promise<AuthResult> {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser();

    if (error) {
      return {
        session: null,
        user: null,
        error: error.message,
      };
    }

    return {
      session: null,
      user: data.user,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get user";
    return {
      session: null,
      user: null,
      error: message,
    };
  }
}
