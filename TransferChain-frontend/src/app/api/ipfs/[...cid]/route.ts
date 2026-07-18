import { NextResponse } from 'next/server';

const IPFS_GATEWAY = "https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/";

export async function GET(
  request: Request,
  { params }: { params: { cid: string[] } }
) {
  // The `cid` param will be an array of path segments.
  // e.g., /api/ipfs/bafy.../metadata.json -> ['bafy...', 'metadata.json']
  const cidPath = params.cid.join('/');

  if (!cidPath) {
    return new NextResponse('CID path is required', { status: 400 });
  }

  try {
    const ipfsUrl = `${IPFS_GATEWAY}${cidPath}`;
    const ipfsResponse = await fetch(ipfsUrl, {
      // Forward the cache policy from the original request
      cache: request.cache,
    });

    if (!ipfsResponse.ok) {
      return new NextResponse(ipfsResponse.statusText, { status: ipfsResponse.status });
    }

    // Pass the stream directly from the IPFS gateway to the client.
    const headers = new Headers();
    headers.set('Content-Type', ipfsResponse.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    // The body of the response from `fetch` is a ReadableStream.
    return new NextResponse(ipfsResponse.body, {
      status: 200,
      headers: headers,
    });
  } catch (error) {
    console.error(`Failed to proxy IPFS request for ${cidPath}:`, error);
    return new NextResponse('Error fetching from IPFS gateway.', { status: 500 });
  }
}
