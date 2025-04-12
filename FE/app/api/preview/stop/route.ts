import { type NextRequest, NextResponse } from "next/server"

export async function POST(_req: NextRequest) {
  try {
    const res = await fetch("http://localhost:4000/preview/stop", {
      method: "POST",
    })

    const result = await res.json()
    return NextResponse.json(result, { status: res.status })
  } catch (error) {
    console.error("❌ Error stopping backend preview:", error)
    return NextResponse.json({ error: "Failed to stop preview" }, { status: 500 })
  }
}
