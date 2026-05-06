import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const formData = await req.formData();
    const storagePath = (formData.get("storagePath") as string) || null;
    const fileName = (formData.get("fileName") as string) || "recording.mp3";

    if (!storagePath) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const script = (formData.get("script") as string) || "";
    const noteTemplate = (formData.get("noteTemplate") as string) || "";
    const icp = (formData.get("icp") as string) || "";
    const product = (formData.get("product") as string) || "";
    const dealStages = (formData.get("dealStages") as string) || "";
    const objectionFocus = (formData.get("objectionFocus") as string) || "";

    // Download the audio from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from("audio-uploads")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error("Failed to retrieve uploaded audio");
    }

    // Write to temp file for Whisper
    const ext = fileName.endsWith(".m4a") ? ".m4a" : ".mp3";
    tmpPath = join(tmpdir(), `klosi-${randomUUID()}${ext}`);
    const buffer = Buffer.from(await fileData.arrayBuffer());
    await writeFile(tmpPath, buffer);

    // Delete from Supabase immediately — privacy first
    await supabaseAdmin.storage.from("audio-uploads").remove([storagePath]).catch(() => {});

    // Transcribe with Whisper
    const { createReadStream } = await import("fs");
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tmpPath) as Parameters<typeof openai.audio.transcriptions.create>[0]["file"],
      model: "whisper-1",
      response_format: "text",
    });

    await unlink(tmpPath).catch(() => {});
    tmpPath = null;

    const transcript = typeof transcription === "string"
      ? transcription
      : (transcription as { text: string }).text;

    const context = [
      product && `Product/Service: ${product}`,
      icp && `Ideal Customer Profile: ${icp}`,
      dealStages && `Deal Stages: ${dealStages}`,
      objectionFocus && `Key Pain Points to Listen For: ${objectionFocus}`,
      script && `\nSales Script:\n${script}`,
      noteTemplate && `\nNote Template Example (match this format):\n${noteTemplate}`,
    ].filter(Boolean).join("\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are an AI assistant for a sales team. Analyze the following call transcript and extract structured CRM notes.

${context ? `CONTEXT ABOUT THIS SALES REP:\n${context}\n\n` : ""}

CALL TRANSCRIPT:
${transcript}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "summary": "2-3 sentence summary of the call",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "nextSteps": ["next step 1", "next step 2", "next step 3"],
  "objections": ["objection 1", "objection 2"],
  "crmNote": "One concise paragraph suitable for pasting directly into a CRM"
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response from Claude");

    const raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const notes = JSON.parse(raw);
    return NextResponse.json(notes);

  } catch (e: unknown) {
    if (tmpPath) await unlink(tmpPath).catch(() => {});
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
