import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

async function performLogout() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (token) {
      await apiFetch("/auth/logout", {
        method: "POST",
        headers: {
          Cookie: `auth_token=${token}`,
        },
      });
    }
    cookieStore.delete("auth_token");
  } catch {
    // Ignore if session already closed
  }
}

export async function POST(request: Request) {
  await performLogout();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/auth/login", url.origin), {
    status: 302,
  });
}

export async function GET(request: Request) {
  await performLogout();
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/auth/login", url.origin), {
    status: 302,
  });
}
