import { NextRequest, NextResponse } from "next/server";

const IPFS_BASE =
  "https://bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4.ipfs.dweb.link";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;
  const id = parseInt(packId, 10);

  if (isNaN(id) || id < 1 || id > 9999) {
    return new NextResponse("Invalid pack ID", { status: 400 });
  }

  const upstream = await fetch(`${IPFS_BASE}/${id}.jpg`);
  if (!upstream.ok) {
    return new NextResponse("Failed to fetch pack image", { status: 502 });
  }

  const buffer = await upstream.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
