import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 }
    );
  }

  if (email === adminEmail && password === adminPassword) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set("adminAuth", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return response;
  }

  return NextResponse.json(
    { error: "Wrong email or password." },
    { status: 401 }
  );
}
