import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "NexusWave",
    mode: "live",
    message: "Clean production mode active - 100% real live users and content",
  });
}
