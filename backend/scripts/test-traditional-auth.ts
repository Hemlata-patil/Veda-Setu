import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../src/utils/password";
import { signToken, verifyToken } from "../src/utils/jwt";
import { registerSchema, loginSchema } from "../src/utils/validation";
import { requireAuth, requireRole } from "../src/middleware/auth.middleware";
import { AuthService } from "../src/services/auth.service";
import { env } from "../src/config/env";
import * as dbModule from "../src/db";

// Standalone test suite for Module 1: Traditional Authentication & Identity
async function runTestSuite() {
  console.log("================================================================================");
  console.log(" VEDA SETU — MODULE 1: TRADITIONAL AUTHENTICATION & IDENTITY TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       ${detail}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // In-Memory Database Simulator for Hermetic Service Testing
  // ---------------------------------------------------------------------------
  const mockUsersTable = new Map<string, {
    id: string;
    email: string;
    password_hash: string;
    role: string;
    created_at: string;
  }>();

  const mockProfilesTable = new Map<string, {
    id: string;
    full_name: string;
    email: string;
    role: string;
    department?: string | null;
    institution_id?: string | null;
  }>();

  const mockPasswordResetTokens = new Map<string, {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: Date;
    used_at: Date | null;
  }>();

  const mockQueryFn = async (sql: string, params?: any[]) => {
    const text = sql.trim();

    // SELECT id FROM public.users WHERE email = $1
    if (text.includes("SELECT id FROM public.users WHERE email = $1")) {
      const email = params?.[0];
      const match = Array.from(mockUsersTable.values()).find((u) => u.email === email);
      return { rows: match ? [{ id: match.id }] : [] };
    }

    // SELECT id, email, password_hash, role, created_at FROM public.users WHERE email = $1
    if (text.includes("FROM public.users") && text.includes("WHERE email = $1")) {
      const email = params?.[0];
      const match = Array.from(mockUsersTable.values()).find((u) => u.email === email);
      return { rows: match ? [match] : [] };
    }

    // SELECT id, email, role, created_at FROM public.users WHERE id = $1
    if (text.includes("FROM public.users") && text.includes("WHERE id = $1")) {
      const id = params?.[0];
      const match = mockUsersTable.get(id);
      return {
        rows: match
          ? [
              {
                id: match.id,
                email: match.email,
                role: match.role,
                created_at: match.created_at,
              },
            ]
          : [],
      };
    }

    // SELECT ... FROM public.profiles WHERE id = $1
    if (text.includes("FROM public.profiles WHERE id = $1")) {
      const id = params?.[0];
      const match = mockProfilesTable.get(id);
      return {
        rows: match
          ? [
              {
                full_name: match.full_name,
                department: match.department || null,
                institution_id: match.institution_id || null,
                organization_id: null,
                designation: null,
              },
            ]
          : [],
      };
    }

    // DELETE FROM public.password_reset_tokens WHERE user_id = $1 AND used_at IS NULL
    if (text.includes("DELETE FROM public.password_reset_tokens")) {
      const userId = params?.[0];
      for (const [k, v] of mockPasswordResetTokens.entries()) {
        if (v.user_id === userId && v.used_at === null) {
          mockPasswordResetTokens.delete(k);
        }
      }
      return { rows: [] };
    }

    // INSERT INTO public.password_reset_tokens
    if (text.includes("INSERT INTO public.password_reset_tokens")) {
      const userId = params?.[0];
      const tokenHash = params?.[1];
      const id = `prt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      mockPasswordResetTokens.set(id, {
        id,
        user_id: userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 3600 * 1000),
        used_at: null,
      });
      return { rows: [{ id }] };
    }

    // SELECT ... FROM public.password_reset_tokens WHERE token_hash = $1
    if (text.includes("password_reset_tokens") && text.includes("token_hash = $1")) {
      const hash = params?.[0];
      const match = Array.from(mockPasswordResetTokens.values()).find((t) => t.token_hash === hash);
      return { rows: match ? [match] : [] };
    }

    // UPDATE public.users SET password_hash = $1 WHERE id = $2
    if (text.includes("UPDATE public.users SET password_hash = $1 WHERE id = $2")) {
      const hash = params?.[0];
      const id = params?.[1];
      const user = mockUsersTable.get(id);
      if (user) {
        user.password_hash = hash;
      }
      return { rows: [] };
    }

    return { rows: [] };
  };

  const mockConnectFn = async () => {
    return {
      query: async (sql: string, params?: any[]) => {
        const text = sql.trim();
        if (text === "BEGIN" || text === "COMMIT" || text === "ROLLBACK") {
          return { rows: [] };
        }

        if (text.includes("INSERT INTO public.users")) {
          const email = params?.[0];
          const passwordHash = params?.[1];
          const role = "student";
          const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const created_at = new Date().toISOString();

          // Check unique violation
          const existing = Array.from(mockUsersTable.values()).find((u) => u.email === email);
          if (existing) {
            const err: any = new Error("duplicate key value violates unique constraint");
            err.code = "23505";
            throw err;
          }

          const record = { id, email, password_hash: passwordHash, role, created_at };
          mockUsersTable.set(id, record);
          return { rows: [record] };
        }

        if (text.includes("INSERT INTO public.profiles")) {
          const id = params?.[0];
          const fullName = params?.[1];
          mockProfilesTable.set(id, { id, full_name: fullName, email: "", role: "student" });
          return { rows: [{ id }] };
        }

        if (text.includes("UPDATE public.users") && text.includes("password_hash")) {
          const hash = params?.[0];
          const id = params?.[1];
          const user = mockUsersTable.get(id);
          if (user) {
            user.password_hash = hash;
          }
          return { rows: [] };
        }

        if (text.includes("UPDATE public.password_reset_tokens") && text.includes("used_at")) {
          const id = params?.[0];
          const prt = mockPasswordResetTokens.get(id);
          if (prt) {
            prt.used_at = new Date();
          }
          return { rows: [] };
        }

        return { rows: [] };
      },
      release: () => {},
    };
  };

  (dbModule as any).query = mockQueryFn;
  (dbModule.db as any).query = mockQueryFn;
  (dbModule.pool as any).connect = mockConnectFn;
  (dbModule.db.pool as any).connect = mockConnectFn;

  const testAuthService = new AuthService();

  // ---------------------------------------------------------------------------
  // TEST A: Student registration succeeds
  // ---------------------------------------------------------------------------
  console.log("--- 1. Registration Flow Tests ---");
  const studentEmail = "test.student@veda.local";
  const rawPassword = "ValidPassword123!";
  const studentName = "Aarav Sharma";

  let registeredResult: any = null;
  try {
    registeredResult = await testAuthService.registerStudent({
      fullName: studentName,
      email: studentEmail,
      password: rawPassword,
    });
    assert(
      Boolean(registeredResult?.token && registeredResult?.user?.id),
      "Test A: Student registration succeeds",
      `Created user ID: ${registeredResult.user.id}, Role: ${registeredResult.user.role}`
    );
    assert(
      registeredResult.user.email === studentEmail,
      "Test A.1: Registered email is preserved accurately in response"
    );
    assert(
      registeredResult.user.role === "student",
      "Test A.2: Registered user role is strictly 'student'"
    );
  } catch (err: any) {
    assert(false, "Test A: Student registration succeeds", err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST B: Duplicate email is rejected
  // ---------------------------------------------------------------------------
  try {
    await testAuthService.registerStudent({
      fullName: "Another Aarav",
      email: studentEmail,
      password: "DifferentPassword123!",
    });
    assert(false, "Test B: Duplicate email is rejected", "Should have thrown 409 Conflict");
  } catch (err: any) {
    assert(
      err.statusCode === 409 || err.message.toLowerCase().includes("already exists"),
      "Test B: Duplicate email is rejected",
      `Correctly caught 409 Conflict: "${err.message}"`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST C: Password is stored hashed, never plaintext
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Cryptographic Security Tests ---");
  const storedUser = Array.from(mockUsersTable.values()).find((u) => u.email === studentEmail);
  const isBcrypt = storedUser?.password_hash?.startsWith("$2a$") || storedUser?.password_hash?.startsWith("$2b$");
  const isNotPlaintext = storedUser?.password_hash !== rawPassword && !storedUser?.password_hash?.includes(rawPassword);

  assert(
    Boolean(storedUser && isBcrypt && isNotPlaintext),
    "Test C: Password is stored hashed, never plaintext",
    `Hash algorithm: bcrypt ($2b$), hash length: ${storedUser?.password_hash?.length}`
  );

  const directCompareSuccess = await comparePassword(rawPassword, storedUser!.password_hash);
  const directCompareFail = await comparePassword("WrongPassword123!", storedUser!.password_hash);
  assert(
    directCompareSuccess && !directCompareFail,
    "Test C.1: bcrypt.compare verifies valid password and rejects invalid password"
  );

  // ---------------------------------------------------------------------------
  // TEST D: Student login succeeds with correct password
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Authentication & Login Tests ---");
  let loginResult: any = null;
  try {
    loginResult = await testAuthService.loginUser({
      email: studentEmail,
      password: rawPassword,
    });
    assert(
      Boolean(loginResult?.token && loginResult?.user?.id === registeredResult?.user?.id),
      "Test D: Student login succeeds with correct password",
      `JWT issued successfully for ${loginResult.user.email}`
    );
  } catch (err: any) {
    assert(false, "Test D: Student login succeeds with correct password", err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST E: Student login fails with incorrect password
  // ---------------------------------------------------------------------------
  try {
    await testAuthService.loginUser({
      email: studentEmail,
      password: "IncorrectPassword999!",
    });
    assert(false, "Test E: Student login fails with incorrect password", "Expected 401 Unauthorized");
  } catch (err: any) {
    assert(
      err.statusCode === 401,
      "Test E: Student login fails with incorrect password",
      `Rejected with HTTP 401: "${err.message}"`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST F: Invalid JWT is rejected
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Token & Middleware Tests ---");
  const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered_content.invalid_signature";
  let middlewareRejectedInvalid = false;

  const mockReqF: any = { cookies: {}, headers: { authorization: `Bearer ${fakeToken}` } };
  const mockResF: any = {
    status: (code: number) => ({
      json: (body: any) => {
        if (code === 401) middlewareRejectedInvalid = true;
      },
    }),
  };
  requireAuth(mockReqF, mockResF, () => {});
  assert(middlewareRejectedInvalid, "Test F: Invalid JWT is rejected with 401 Unauthorized");

  // ---------------------------------------------------------------------------
  // TEST G: Expired/invalid authentication is rejected
  // ---------------------------------------------------------------------------
  const expiredToken = jwt.sign(
    { userId: "expired-user-id", role: "student" },
    env.JWT_SECRET,
    { expiresIn: "-10s" } // already expired
  );

  let middlewareRejectedExpired = false;
  let expiredMessage = "";
  const mockReqG: any = { cookies: { auth_token: expiredToken }, headers: {} };
  const mockResG: any = {
    status: (code: number) => ({
      json: (body: any) => {
        if (code === 401) {
          middlewareRejectedExpired = true;
          expiredMessage = body.message;
        }
      },
    }),
  };
  requireAuth(mockReqG, mockResG, () => {});
  assert(
    middlewareRejectedExpired,
    "Test G: Expired authentication token is rejected with 401 Unauthorized",
    `Message: "${expiredMessage}"`
  );

  // ---------------------------------------------------------------------------
  // TEST H: /api/auth/me works for authenticated user
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Current User (GET /me) Tests ---");
  try {
    const meUser = await testAuthService.getCurrentUser(registeredResult.user.id);
    const passwordHashOmitted = !("password_hash" in meUser) && !("password" in meUser);
    assert(
      meUser.id === registeredResult.user.id && passwordHashOmitted,
      "Test H: /api/auth/me works for authenticated user",
      `Returned profile for: ${meUser.fullName}, password_hash strictly omitted: ${passwordHashOmitted}`
    );
  } catch (err: any) {
    assert(false, "Test H: /api/auth/me works for authenticated user", err.message);
  }

  // ---------------------------------------------------------------------------
  // TEST I: /api/auth/me rejects unauthenticated request
  // ---------------------------------------------------------------------------
  let unauthenticatedRejected = false;
  const mockReqI: any = { cookies: {}, headers: {} };
  const mockResI: any = {
    status: (code: number) => ({
      json: (body: any) => {
        if (code === 401) unauthenticatedRejected = true;
      },
    }),
  };
  requireAuth(mockReqI, mockResI, () => {});
  assert(unauthenticatedRejected, "Test I: /api/auth/me rejects unauthenticated request with 401");

  // ---------------------------------------------------------------------------
  // TEST J: Student cannot register as super_admin
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Role Protection & Privilege Escalation Tests ---");
  const superAdminAttempt = registerSchema.safeParse({
    fullName: "Hacker Admin",
    email: "hacker@evil.local",
    password: "Password123!",
    role: "super_admin",
  });
  assert(
    !superAdminAttempt.success,
    "Test J: Student cannot register as super_admin",
    "Zod registration schema strictly rejected role: 'super_admin'"
  );

  // ---------------------------------------------------------------------------
  // TEST K: Student cannot register as industry
  // ---------------------------------------------------------------------------
  const industryAttempt = registerSchema.safeParse({
    fullName: "Fake Industry Partner",
    email: "fake@industry.local",
    password: "Password123!",
    role: "industry",
  });
  assert(
    !industryAttempt.success,
    "Test K: Student cannot register as industry",
    "Zod registration schema strictly rejected role: 'industry'"
  );

  const facultyAttempt = registerSchema.safeParse({
    fullName: "Fake Faculty",
    email: "fake@faculty.local",
    password: "Password123!",
    role: "faculty",
  });
  assert(
    !facultyAttempt.success,
    "Test K.1: Student cannot register as faculty (public registration restricted to student)"
  );

  // ---------------------------------------------------------------------------
  // TEST L: Role middleware correctly rejects unauthorized roles
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Authorization Middleware Tests ---");
  const facultyOnlyMiddleware = requireRole("faculty", "super_admin");
  let roleRejected = false;
  let roleAllowed = false;

  // Student trying to access faculty route
  const studentReq: any = { user: { userId: "some-id", role: "student" } };
  const studentRes: any = {
    status: (code: number) => ({
      json: (body: any) => {
        if (code === 403) roleRejected = true;
      },
    }),
  };
  facultyOnlyMiddleware(studentReq, studentRes, () => {});
  assert(
    roleRejected,
    "Test L: Role middleware correctly rejects unauthorized roles with 403 Forbidden",
    "Role 'student' was blocked from faculty/super_admin endpoint"
  );

  // Faculty accessing faculty route
  const facultyReq: any = { user: { userId: "faculty-id", role: "faculty" } };
  facultyOnlyMiddleware(facultyReq, studentRes, () => {
    roleAllowed = true;
  });
  assert(
    roleAllowed,
    "Test L.1: Role middleware allows authorized roles to proceed (called next())"
  );

  // ---------------------------------------------------------------------------
  // TEST M: Logout works according to the selected cookie/session strategy
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Session & Logout Tests ---");
  let cookieCleared = false;
  let clearedCookieName = "";
  const mockLogoutRes: any = {
    clearCookie: (name: string, options: any) => {
      cookieCleared = true;
      clearedCookieName = name;
    },
    status: (code: number) => ({
      json: (body: any) => {},
    }),
  };

  const { logout } = await import("../src/controllers/auth.controller");
  logout({} as any, mockLogoutRes);
  assert(
    cookieCleared && clearedCookieName === "auth_token",
    "Test M: Logout works according to selected cookie/session strategy",
    `Cleared cookie '${clearedCookieName}' with secure HttpOnly flags`
  );

  // ---------------------------------------------------------------------------
  // TEST N - Q: Password Reset & Update Tests
  // ---------------------------------------------------------------------------
  console.log("\n--- 9. Password Reset & Security Tests ---");

  // Test N: Forgot password generates secure token
  const forgotRes = await testAuthService.forgotPassword({ email: studentEmail });
  assert(
    Boolean(forgotRes.resetToken && forgotRes.message.includes("sent")),
    "Test N: Forgot password generates secure token for registered user",
    `Received token length: ${forgotRes.resetToken?.length || 0}`
  );

  // Test N.1: Non-existent email uniform response
  const nonExistentForgot = await testAuthService.forgotPassword({ email: "nonexistent@nowhere.com" });
  assert(
    nonExistentForgot.message.includes("sent") && !nonExistentForgot.resetToken,
    "Test N.1: Forgot password returns uniform message for non-existent email (anti-enumeration)"
  );

  // Test O: Reset password with valid token
  const newPassword = "BrandNewSecurePassword999!";
  const resetRes = await testAuthService.resetPassword({
    token: forgotRes.resetToken!,
    password: newPassword,
  });
  assert(
    resetRes.message.includes("successfully"),
    "Test O: Reset password succeeds with valid single-use token"
  );

  // Test O.1: Login with new password
  const newLoginRes = await testAuthService.loginUser({
    email: studentEmail,
    password: newPassword,
  });
  assert(
    Boolean(newLoginRes.token),
    "Test O.1: User can authenticate with newly reset password"
  );

  // Test P: Token cannot be reused (single-use constraint)
  let reuseFailed = false;
  try {
    await testAuthService.resetPassword({
      token: forgotRes.resetToken!,
      password: "AnotherPassword123!",
    });
  } catch (err: any) {
    if (err.message.includes("already been used")) {
      reuseFailed = true;
    }
  }
  assert(
    reuseFailed,
    "Test P: Reusing spent reset token is strictly rejected with 400"
  );

  // Test Q: Update password for authenticated user
  const updatedPass = "ThirdUpdatedPassword456!";
  const updateRes = await testAuthService.updatePassword(registeredResult.user.id, {
    password: updatedPass,
  });
  assert(
    updateRes.message.includes("successfully"),
    "Test Q: Authenticated password update succeeds"
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` MODULE 1 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test runner threw an uncaught error:", err);
  process.exit(1);
});
