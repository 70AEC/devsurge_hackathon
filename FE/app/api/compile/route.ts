import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const COMPILER_SERVER_URL = process.env.COMPILER_SERVER_URL || "http://localhost:3001/compile"

    console.log("Proxying compile request to:", COMPILER_SERVER_URL)

    const response = await fetch(COMPILER_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend server error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Compilation proxy error:", error)
    return NextResponse.json(
      {
        errors: [
          {
            severity: "error",
            formattedMessage: `Server error: ${error.message}`,
            message: error.message,
            type: "ServerError",
          },
        ],
        success: false,
      },
      { status: 500 },
    )
  }
}
