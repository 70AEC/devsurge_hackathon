import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // 🚨 content-type이나 body 여부 확인
    const contentType = req.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // 🧪 Try parsing JSON safely
    let data = {}
    try {
      data = await req.json()
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const res = await fetch("http://localhost:4000/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    const result = await res.json()
    return NextResponse.json(result, { status: res.status })
  } catch (error) {
    console.error("❌ Error forwarding to backend:", error)
    return NextResponse.json({ error: "Failed to start preview" }, { status: 500 })
  }
}
