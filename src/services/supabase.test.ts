import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  getSupabaseClient,
  signup,
  login,
  logout,
  getSession,
  getUser,
} from "./supabase";

// Get the mocked createClient
const mockCreateClient = createClient as Mock;

describe("supabase service", () => {
  let mockAuth: {
    signUp: Mock;
    signInWithPassword: Mock;
    signOut: Mock;
    getSession: Mock;
    getUser: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Get reference to mock auth from the mocked client
    mockAuth = mockCreateClient()?.auth;
  });

  describe("isSupabaseConfigured", () => {
    it("returns true when environment variables are set", () => {
      expect(isSupabaseConfigured()).toBe(true);
    });
  });

  describe("getSupabaseClient", () => {
    it("returns the Supabase client", () => {
      const client = getSupabaseClient();
      expect(client).toBeDefined();
      expect(client.auth).toBeDefined();
    });
  });

  describe("signup", () => {
    it("creates new user and returns session on success", async () => {
      const mockSession = {
        access_token: "test-token",
        refresh_token: "test-refresh",
        user: { id: "user-123", email: "test@example.com" },
      };
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockAuth.signUp.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const result = await signup({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: undefined,
      });
    });

    it("returns session null when email confirmation is required", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockAuth.signUp.mockResolvedValue({
        data: { session: null, user: mockUser },
        error: null,
      });

      const result = await signup({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.session).toBeNull();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it("passes signup options when provided", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });

      await signup(
        { email: "test@example.com", password: "password123" },
        {
          data: { username: "testuser" },
          emailRedirectTo: "https://example.com/confirm",
        }
      );

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          data: { username: "testuser" },
          emailRedirectTo: "https://example.com/confirm",
        },
      });
    });

    it("returns error for invalid credentials", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Password should be at least 6 characters" },
      });

      const result = await signup({
        email: "test@example.com",
        password: "short",
      });

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe("Password should be at least 6 characters");
    });

    it("returns error for duplicate email", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "User already registered" },
      });

      const result = await signup({
        email: "existing@example.com",
        password: "password123",
      });

      expect(result.error).toBe("User already registered");
    });

    it("handles network errors gracefully", async () => {
      mockAuth.signUp.mockRejectedValue(new Error("Network error"));

      const result = await signup({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.error).toBe("Network error");
      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });

    it("handles non-Error exceptions", async () => {
      mockAuth.signUp.mockRejectedValue("Unknown error");

      const result = await signup({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.error).toBe("Signup failed");
    });
  });

  describe("login", () => {
    it("returns session for valid credentials", async () => {
      const mockSession = {
        access_token: "test-token",
        refresh_token: "test-refresh",
        user: { id: "user-123", email: "test@example.com" },
      };
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const result = await login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("returns error for invalid credentials", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBe("Invalid login credentials");
    });

    it("returns error for non-existent user", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: "Invalid login credentials" },
      });

      const result = await login({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(result.error).toBe("Invalid login credentials");
    });

    it("handles network errors gracefully", async () => {
      mockAuth.signInWithPassword.mockRejectedValue(new Error("Network error"));

      const result = await login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockAuth.signInWithPassword.mockRejectedValue("Unknown error");

      const result = await login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.error).toBe("Login failed");
    });
  });

  describe("logout", () => {
    it("clears session on success", async () => {
      mockAuth.signOut.mockResolvedValue({ error: null });

      const result = await logout();

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it("returns error on failure", async () => {
      mockAuth.signOut.mockResolvedValue({
        error: { message: "Logout failed" },
      });

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Logout failed");
    });

    it("handles network errors gracefully", async () => {
      mockAuth.signOut.mockRejectedValue(new Error("Network error"));

      const result = await logout();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockAuth.signOut.mockRejectedValue("Unknown error");

      const result = await logout();

      expect(result.error).toBe("Logout failed");
    });
  });

  describe("getSession", () => {
    it("returns current session", async () => {
      const mockSession = {
        access_token: "test-token",
        refresh_token: "test-refresh",
        user: { id: "user-123", email: "test@example.com" },
      };

      mockAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await getSession();

      expect(result.session).toEqual(mockSession);
      expect(result.user).toEqual(mockSession.user);
      expect(result.error).toBeNull();
    });

    it("returns null session when not authenticated", async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getSession();

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Session expired" },
      });

      const result = await getSession();

      expect(result.error).toBe("Session expired");
    });

    it("handles network errors gracefully", async () => {
      mockAuth.getSession.mockRejectedValue(new Error("Network error"));

      const result = await getSession();

      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockAuth.getSession.mockRejectedValue("Unknown error");

      const result = await getSession();

      expect(result.error).toBe("Failed to get session");
    });
  });

  describe("getUser", () => {
    it("returns current user from server", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };

      mockAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getUser();

      expect(result.user).toEqual(mockUser);
      expect(result.session).toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns null user when not authenticated", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const result = await getUser();

      expect(result.user).toBeNull();
      expect(result.error).toBe("Not authenticated");
    });

    it("handles network errors gracefully", async () => {
      mockAuth.getUser.mockRejectedValue(new Error("Network error"));

      const result = await getUser();

      expect(result.error).toBe("Network error");
    });

    it("handles non-Error exceptions", async () => {
      mockAuth.getUser.mockRejectedValue("Unknown error");

      const result = await getUser();

      expect(result.error).toBe("Failed to get user");
    });
  });
});
