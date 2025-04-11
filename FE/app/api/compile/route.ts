import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Format the version correctly
    const version = body.version || "0.8.17"

    // Log the version being sent to the backend
    console.log("Received compile request with version:", version)

    const COMPILER_SERVER_URL = process.env.COMPILER_SERVER_URL || "http://localhost:3001/compile"

    console.log("Proxying compile request to:", COMPILER_SERVER_URL)

    // Create a new request body with the correct structure
    const modifiedBody = {
      source: body.source,
      fileName: body.fileName,
      version: version, // Make sure this is passed through
      optimize: body.optimize,
      runs: body.runs || 200,
    }

    console.log("Sending to backend with version:", modifiedBody.version)

    const response = await fetch(COMPILER_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modifiedBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Backend server error response:", errorText)
      throw new Error(`Backend server error: ${response.status} - ${errorText}`)
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
