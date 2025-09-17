import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Add a GET handler for health checks
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Prospect API is running",
    hasBackendUrl: !!process.env.BACKEND_API_URL
  });
}

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json() as { company: string }; // domain or name (prefer domain)
    
    const BACKEND_BASE_URL = process.env.BACKEND_API_URL;
    
    if (!BACKEND_BASE_URL) {
      return NextResponse.json(
        { error: "Backend API URL must be configured" }, 
        { status: 500 }
      );
    }

    console.log(`Frontend: Requesting prospect analysis for ${company} from backend`);

    // Use the comprehensive prospect analysis endpoint
    const response = await fetch(`${BACKEND_BASE_URL}/api/prospect/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || "Backend analysis failed" }, 
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log(`Frontend: Received prospect analysis for ${company}`);
    
    return NextResponse.json(result, { status: 200 });

  } catch (err: any) {
    console.error("Frontend API error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}