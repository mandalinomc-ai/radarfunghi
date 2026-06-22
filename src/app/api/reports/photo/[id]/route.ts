import { NextRequest, NextResponse } from "next/server";
import { getLocalPhoto } from "@/lib/reportStore";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^rpt_\d+_[a-z0-9]+$/.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await getLocalPhoto(id);
  if (!buffer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
