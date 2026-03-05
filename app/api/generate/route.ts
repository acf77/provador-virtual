import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODEL_VERSION =
  "subhash25rawat/flux-vton:a02643ce418c0e12bad371c4adbfaec0dd1cb34b034ef37650ef205f92ad6199";

/**
 * POST /api/generate
 *
 * Creates a flux-vton virtual try-on prediction on Replicate.
 * Returns immediately with the prediction ID — poll GET /api/generate/[id] for status.
 *
 * Body: multipart/form-data
 *   image    File   (required) — photo of the subject
 *   garment  File   (required if garment_url not provided) — garment image
 *   garment_url  string (required if garment not provided) — product page URL
 *   part     string (optional) — "upper_body" | "lower_body" | "lower_half" | "dresses" (default: "upper_body")
 */
export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN not configured" },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data body" },
      { status: 400 }
    );
  }

  const imageFile = formData.get("human_img") as File | null;
  const garmentFile = formData.get("garm_img") as File | null;
  const garmentUrl = formData.get("clothes_url") as string | null;
  const part = (formData.get("category") as string | null) ?? "upper_body";

  if (!imageFile) {
    return NextResponse.json({ error: "human_img is required" }, { status: 400 });
  }

  if (!garmentFile && !garmentUrl) {
    return NextResponse.json(
      { error: "Either garm_img (file) or clothes_url must be provided" },
      { status: 400 }
    );
  }

  const validParts = ["upper_body", "lower_body", "lower_half", "dresses"];
  if (!validParts.includes(part)) {
    return NextResponse.json(
      { error: `part must be one of: ${validParts.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const prediction = await replicate.predictions.create({
      version: MODEL_VERSION.split(":")[1],
      input: {
        image: imageFile,
        garment: garmentFile ?? garmentUrl,
        part,
      },
    });

    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate] Replicate error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
