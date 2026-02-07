import { NextResponse } from "next/server";
import { getAllSessions } from "@/agents/memory-agent";

export async function GET() {
  const sessions = getAllSessions();
  return NextResponse.json({ sessions }, { status: 200 });
}
