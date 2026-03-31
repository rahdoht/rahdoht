import { NextRequest, NextResponse } from "next/server";

const CID = "bafybeigvhgkcqqamlukxcmjodalpk2kuy5qzqtx6m4i6pvb7o3ammss3y4";

// Try gateways in order until one responds
const GATEWAYS = [
  `https://${CID}.ipfs.dweb.link`,
  `https://${CID}.ipfs.cf-ipfs.com`,
  `https://ipfs.io/ipfs/${CID}`,
  `https://gateway.pinata.cloud/ipfs/${CID}`,
];

const TIMEOUT_MS = 8000;

async function tryGateway(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.ok) return res;
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  const { packId } = await params;
  const id = parseInt(packId, 10);

  if (isNaN(id) || id < 1 || id > 9999) {
    return new NextResponse("Invalid pack ID", { status: 400 });
  }

  for (const base of GATEWAYS) {
    const res = await tryGateway(`${base}/${id}.jpg`);
    if (res) {
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  return new NextResponse("Failed to fetch pack image from all gateways", { status: 502 });
}
