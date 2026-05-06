import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { pathname } = await request.json();

    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname: pathname || "recording.mp3",
      maximumSizeInBytes: 500 * 1024 * 1024,
      validUntil: Date.now() + 30 * 60 * 1000, // 30 minutes
    });

    return NextResponse.json({ clientToken });
  } catch (error) {
    console.error("Blob token error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
