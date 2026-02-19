import { NextRequest, NextResponse } from "next/server";

const PINATA_BASE = "https://api.pinata.cloud";

export async function POST(req: NextRequest) {
  const apiKey = process.env.PINATA_API_KEY;
  const apiSecret = process.env.PINATA_SECRET_API_KEY;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "Pinata not configured" }, { status: 500 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  // Image upload (multipart/form-data with a 'file' field)
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      return NextResponse.json({ error: "Only PNG/JPEG accepted" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const pinataForm = new FormData();
    pinataForm.append("file", file, "palimpsest.png");

    const res = await fetch(`${PINATA_BASE}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: pinataForm,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Pinata error: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ cid: data.IpfsHash });
  }

  // JSON metadata upload
  if (contentType.includes("application/json")) {
    const body = await req.json();

    const res = await fetch(`${PINATA_BASE}/pinning/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: apiKey,
        pinata_secret_api_key: apiSecret,
      },
      body: JSON.stringify({ pinataContent: body }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Pinata error: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ cid: data.IpfsHash });
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
}
