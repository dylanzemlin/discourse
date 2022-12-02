import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session/edge";
import { DiscouseUserFlags, hasFlag } from "@lib/api/DiscourseUserFlags";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const { user } = await getIronSession(request, res, {
    password: process.env.IRON_PASSWORD as string,
    cookieName: "discourse-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production"
    }
  });

  if (user?.id == null) {
    request.cookies.delete("discourse-session");
    return NextResponse.redirect(new URL("/", request.url));
  }

  if(request.nextUrl.pathname.startsWith("/admin") && !hasFlag(user.flags, DiscouseUserFlags.Admin)) {
    return new NextResponse(null, { status: 404 });
  }

  return res;
}

export const config = {
  matcher: ["/api/v1/:endpoint?", "/chaos", "/admin/:endpoint?"]
}