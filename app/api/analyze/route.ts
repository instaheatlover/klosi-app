import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

export const maxDuration = 120;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  let tmpPath: string | null = null;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const script = (formData.get("script") as string) || "";
    const noteTemplate = (formData.get("noteTemplate") as string) || "";
    const icp = (formData.get("icp") as string) || "";
    const product = (formData.get("product") as string) || "";
    const dealStages = (formData.get("dealStages") as string) || "";
    const objectionFocus = (formData.get("objectionFocus") as string) || "";

    // Write file to temp disk
    const ext = file.name.endsWith(".m4a") ? ".m4a" : ".mp3";
    tmpPath = join(tmpdir(), `klosi-${randomUUID()}${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tmpPath, buffer);

    // Transcribe with Whisper
    const { createReadStream } = await import("fs");
    const transcription = await openai.audio.transcriptions.create({
      file: createReadStream(tmpPath) as Parameters<typeof openai.audio.transcriptions.create>[0]["file"],
      model: "whisper-1",
      response_format: "text",
    });

    // Delete temp file immediately
    await unlink(tmpPath).catch(() => {});
    tmpPath = null;

    const transcript = typeof transcription === "string"
      ? transcription
      : (transcription as { text: string }).text;

    // Build context for Claude
    const context = [
      product && `Product/Service: ${product}`,
      icp && `Ideal Customer Profile: ${icp}`,
      dealStages && `Deal Stages: ${dealStages}`,
      objectionFocus && `Key Pain Points to Listen For: ${objectionFocus}`,
      script && `\nSales Script:\n${script}`,
      noteTemplate && `\nNote Template Example (match this format):\n${noteTemplate}`,
    ].filter(Boolean).join("\n");

    // Generate notes with Claude
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
