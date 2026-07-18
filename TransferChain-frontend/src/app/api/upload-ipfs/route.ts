import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Server Configuration Error: PINATA_JWT token is missing from environment variables." },
        { status: 500 }
      );
    }

    // 1. Handle JSON Object Pinning (e.g. Player Metadata Document)
    if (contentType.includes("application/json")) {
      const jsonBody = await request.json();

      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: JSON.stringify({
          pinataContent: jsonBody,
          pinataMetadata: {
            name: `transferchain-player-metadata-${Date.now()}`,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Pinata JSON Pin error details:", errText);
        return NextResponse.json({ error: `Pinata JSON API Error: ${errText}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({ ipfsHash: data.IpfsHash });
    } 
    
    // 2. Handle Binary File Pinning (e.g. Player Portrait Image)
    else {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const pinataFormData = new FormData();
      pinataFormData.append("file", file);

      const pinataMetadata = JSON.stringify({
        name: `transferchain-player-portrait-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
      });
      pinataFormData.append("pinataMetadata", pinataMetadata);

      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      pinataFormData.append("pinataOptions", pinataOptions);

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: pinataFormData,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Pinata File Pin error details:", errText);
        return NextResponse.json({ error: `Pinata File API Error: ${errText}` }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json({ ipfsHash: data.IpfsHash });
    }
  } catch (err: any) {
    console.error("IPFS Server Pin handler crashed:", err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
