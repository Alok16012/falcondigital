import { NextResponse } from "next/server";
import { getKeyStatus, updateKeys } from "@/lib/settings";

export async function GET() {
  const status = await getKeyStatus();
  return NextResponse.json({ status });
}

export async function POST(req: Request) {
  try {
    const updates = await req.json();
    await updateKeys(updates);
    const status = await getKeyStatus();
    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save settings." }, { status: 500 });
  }
}
