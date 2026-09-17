import crypto from "crypto";
import { db } from "../db";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken, UserRole } from "../utils/jwt";
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput, UpdatePasswordInput } from "../utils/validation";
import { AppError } from "../middleware/error.middleware";

export interface AuthUserResponse {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  department?: string | null;
  institutionId?: string | null;
  organizationId?: string | null;
  designation?: string | null;
  createdAt: string;
}

export interface AuthResult {
  user: AuthUserResponse;
  token: string;
}

export class AuthService {
  /**
   * Registers a new student account
   */
  async registerStudent(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();

    // 1. Check for duplicate email in users table
    const existingUser = await db.query("SELECT id FROM public.users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError("An account with this email already exists. Please sign in.", 409);
    }

    // 2. Hash password securely
    const passwordHash = await hashPassword(input.password);

    // 3. Atomically create users record and linked profiles record using a database client
    const client = await db.pool.connect();

    try {
      await client.query("BEGIN");

      // Insert authentication record into users
      const userRes = await client.query<{
        id: string;
        email: string;
        role: UserRole;
        created_at: string;
      }>(
        `INSERT INTO public.users (email, password_hash, role)
         VALUES ($1, $2, 'student')
         RETURNING id, email, role, created_at`,
        [email, passwordHash]
      );

      const newUser = userRes.rows[0];

      // Insert linked application profile into profiles (retaining existing profile table schema)
      await client.query(
        `INSERT INTO public.profiles (id, full_name)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE
         SET full_name = EXCLUDED.full_name, updated_at = NOW()`,
        [newUser.id, fullName]
      );

      await client.query("COMMIT");

      // Generate JWT
      const token = signToken({
        userId: newUser.id,
        role: newUser.role,
      });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          fullName,
          createdAt: newUser.created_at,
        },
        token,
      };
    } catch (err: any) {
      await client.query("ROLLBACK");
      // If a concurrent insert occurred that violated unique constraint
      if (err.code === "23505") {
        throw new AppError("An account with this email already exists. Please sign in.", 409);
      }
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Authenticates an existing user and produces a session token
   */
  async loginUser(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    // 1. Locate user in users table
    const userRes = await db.query<{
      id: string;
      email: string;
      password_hash: string;
      role: UserRole;
      created_at: string;
    }>(
      `SELECT id, email, password_hash, role, created_at
       FROM public.users
       WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      // Use uniform message to prevent account enumeration
      throw new AppError("Invalid email or password", 401);
    }

    const user = userRes.rows[0];

    // 2. Compare password hash
    const isMatch = await comparePassword(input.password, user.password_hash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    // 3. Retrieve associated profile metadata
    const profileRes = await db.query<{
      full_name: string;
      department: string | null;
      institution_id: string | null;
      designation: string | null;
    }>(
      `SELECT full_name, department, institution_id, designation
       FROM public.profiles
       WHERE id = $1`,
      [user.id]
    );

    const profile = profileRes.rows[0];
    const fullName = profile?.full_name || "Ayush User";

    // 4. Generate JWT
    const token = signToken({
      userId: user.id,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName,
        department: profile?.department || null,
        institutionId: profile?.institution_id || null,
        organizationId: null,
        designation: profile?.designation || null,
        createdAt: user.created_at,
      },
      token,
    };
  }

  /**
   * Retrieves the current authenticated user's identity and profile
   */
  async getCurrentUser(userId: string): Promise<AuthUserResponse> {
    // Strictly omit password_hash from SELECT query
    const userRes = await db.query<{
      id: string;
      email: string;
      role: UserRole;
      created_at: string;
    }>(
      `SELECT id, email, role, created_at
       FROM public.users
       WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw new AppError("User account not found", 404);
    }

    const user = userRes.rows[0];

    const profileRes = await db.query<{
      full_name: string;
      department: string | null;
      institution_id: string | null;
      designation: string | null;
    }>(
      `SELECT full_name, department, institution_id, designation
       FROM public.profiles
       WHERE id = $1`,
      [user.id]
    );

    const profile = profileRes.rows[0];

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: profile?.full_name || "Ayush User",
      department: profile?.department || null,
      institutionId: profile?.institution_id || null,
      organizationId: null,
      designation: profile?.designation || null,
      createdAt: user.created_at,
    };
  }

  /**
   * Initiates password reset for a given email.
   * Generates a single-use cryptographically secure reset token, hashes it with SHA-256,
   * stores the hash with a 1-hour expiration, and invalidates older unused tokens.
   */
  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string; resetToken?: string }> {
    const email = input.email.trim().toLowerCase();

    const userRes = await db.query<{ id: string }>(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    );

    // Uniform response to prevent account enumeration
    const successMessage = "If an account with that email exists, password reset instructions have been sent.";

    if (userRes.rows.length === 0) {
      return { message: successMessage };
    }

    const userId = userRes.rows[0].id;

    // Generate secure random 32-byte hex token (64 characters)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Invalidate existing unused tokens for this user
    await db.query(
      "DELETE FROM public.password_reset_tokens WHERE user_id = $1 AND used_at IS NULL",
      [userId]
    );

    // Insert new token hash with 1 hour expiration
    await db.query(
      `INSERT INTO public.password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, tokenHash]
    );

    return {
      message: successMessage,
      // Provide rawToken for local development/testing or email delivery
      resetToken: rawToken,
    };
  }

  /**
   * Resets password using a time-limited single-use reset token
   */
  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const token = input.token.trim();
    if (!token) {
      throw new AppError("Invalid or missing reset token", 400);
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const tokenRes = await db.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      used_at: Date | null;
    }>(
      `SELECT id, user_id, expires_at, used_at
       FROM public.password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      throw new AppError("Invalid or expired password reset token", 400);
    }

    const tokenRow = tokenRes.rows[0];

    if (tokenRow.used_at !== null) {
      throw new AppError("This password reset token has already been used", 400);
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      throw new AppError("This password reset token has expired", 400);
    }

    const newPasswordHash = await hashPassword(input.password);

    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");

      // Update password
      await client.query(
        "UPDATE public.users SET password_hash = $1 WHERE id = $2",
        [newPasswordHash, tokenRow.user_id]
      );

      // Invalidate token
      await client.query(
        "UPDATE public.password_reset_tokens SET used_at = NOW() WHERE id = $1",
        [tokenRow.id]
      );

      await client.query("COMMIT");

      return {
        message: "Password has been reset successfully.",
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Updates password for currently authenticated user
   */
  async updatePassword(userId: string, input: UpdatePasswordInput): Promise<{ message: string }> {
    const newPasswordHash = await hashPassword(input.password);

    await db.query(
      "UPDATE public.users SET password_hash = $1 WHERE id = $2",
      [newPasswordHash, userId]
    );

    return {
      message: "Password updated successfully.",
    };
  }
}

export const authService = new AuthService();
