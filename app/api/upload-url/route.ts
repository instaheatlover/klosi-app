import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { fileName } = await req.json();
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${safeName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("audio-uploads")
      .createSignedUploadUrl(path);

    if (error) throw error;

    return NextResponse.json({ signedUrl: data.signedUrl, path });
  } catch (e) {
    console.error("Upload URL error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
