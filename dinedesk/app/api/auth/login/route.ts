import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as {
    email?: string;
    password?: string;
  };
  if (!email || !password)
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const user = await prisma.staffUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
