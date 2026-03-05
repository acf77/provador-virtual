import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * GET /api/generate/[id]
 *
 * Polls the status of a Replicate prediction.
 *
 * Response shape:
 *   { id, status, output, error, urls }
 *
 * Possible statuses: "starting" | "processing" | "succeeded" | "failed" | "canceled"
 * When status === "succeeded", `output` contains the generated image URL.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;

  try {
    const prediction = await replicate.predictions.get(id);

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output ?? null,   // string URL when succeeded
      error: prediction.error ?? null,
      created_at: prediction.created_at,
      started_at: prediction.started_at ?? null,
      completed_at: prediction.completed_at ?? null,
      metrics: prediction.metrics ?? null, // includes predict_time
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[/api/generate/${id}] Replicate error:`, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
