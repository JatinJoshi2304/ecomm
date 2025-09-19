import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Middleware factory: pass allowed roles
export const authMiddleware = (allowedRoles: string[] = []) => {
  return async (req: NextRequest) => {
    try {
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        role: string;
      };

      // If specific roles are required, check them
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Attach user to request (so handlers can use it)
      (req as any).user = decoded;

      // ✅ Continue request
      return null;
    } catch (error) {
      return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }
  };
};
