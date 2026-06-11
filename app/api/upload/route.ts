import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string) || "uploads";
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const safeFolder = folder === "posters" ? "posters" : "uploads";
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", safeFolder);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({ url: `/${safeFolder}/${filename}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
