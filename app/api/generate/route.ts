import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * POST /api/generate
 *
 * Creates a google/nano-banana-2 virtual try-on prediction on Replicate.
 * Accepts one user photo + up to 13 garment images (files or URLs).
 * Returns immediately with prediction ID — poll GET /api/generate/[id] for status.
 *
 * Body: multipart/form-data
 *   human_img          File     (required) — photo of the user
 *   garments[]         File[]   (at least one required, up to 13)
 *   aspect_ratio       string   (optional, default: "1:1")
 *   resolution         string   (optional, default: "1K") — "1K" | "2K" | "4K"
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

  const humanImg = formData.get("human_img") as File | null;
  if (!humanImg) {
    return NextResponse.json({ error: "human_img is required" }, { status: 400 });
  }

  // Collect all garment files (sent as garments[] or garments)
  const garmentEntries = formData.getAll("garments[]").length
    ? formData.getAll("garments[]")
    : formData.getAll("garments");

  const garments = garmentEntries.filter(
    (g): g is File => g instanceof File && g.size > 0
  );

  if (garments.length === 0) {
    return NextResponse.json(
      { error: "At least one garment image is required" },
      { status: 400 }
    );
  }

  if (garments.length > 13) {
    return NextResponse.json(
      { error: "Maximum 13 garment images allowed" },
      { status: 400 }
    );
  }

  const aspectRatio = (formData.get("aspect_ratio") as string | null) ?? "1:1";
  const resolution = (formData.get("resolution") as string | null) ?? "1K";

  // image_input: user photo first, then garments
  const imageInput: File[] = [humanImg, ...garments];

  try {
    const prediction = await replicate.predictions.create({
      model: "google/nano-banana-2",
      input: {
        prompt:
          "Put the pieces of clothing on the person in the first image so they can see how the outfit looks. Keep the person's face, skin tone, and body identical. Show the full outfit naturally worn.",
        image_input: imageInput,
        aspect_ratio: aspectRatio,
        resolution,
        output_format: "jpg",
        google_search: false,
        image_search: false,
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
