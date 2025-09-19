import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "@/middlewares/auth";

export async function GET(req: NextRequest) {
  const authCheck = await authMiddleware(["admin"])(req);
  if (authCheck) return authCheck; // return error response if unauthorized

  // If token is valid and role = admin
  return NextResponse.json({ message: "Welcome Admin, token verified ✅" });
}
