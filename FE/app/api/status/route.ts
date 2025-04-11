import { NextResponse } from "next/server"

export async function GET() {
  try {
    const COMPILER_SERVER_STATUS_URL =
      process.env.COMPILER_SERVER_URL?.replace("/compile", "/status") || "http://localhost:3001/status"

    console.log("Checking compiler server status at:", COMPILER_SERVER_STATUS_URL)

    const response = await fetch(COMPILER_SERVER_STATUS_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Prevent caching
    })

    if (!response.ok) {
      throw new Error(`Backend server error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Status check error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: `Could not connect to compiler server: ${error.message}`,
      },
      { status: 500 },
    )
  }
}
