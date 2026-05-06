import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { pathname } = await request.json();

    const clientToken = await generateClientTokenFromReadWriteToken({
      token: process.env.BLOB_READ_WRITE_TOKEN!,
      pathname: pathname || "recording.mp3",
      maximumSizeInBytes: 500 * 1024 * 1024, // 500MB
      validUntil: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
      allowedContentTypes: [
        "audio/mpeg",
        "audio/mp3",
        "audio/mp4",
        "audio/m4a",
        "audio/x-m4a",
        "audio/ogg",
        "audio/wav",
        "video/mp4",
      ],
    });

    return NextResponse.json({ clientToken });
  } catch (error) {
    console.error("Blob token error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
