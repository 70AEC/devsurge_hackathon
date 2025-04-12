import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Check required fields
    if (!body.source || !body.fileName) {
      return NextResponse.json(
        {
          errors: [
            {
              severity: "error",
              formattedMessage: "Missing required fields: source and fileName must be provided",
              message: "Missing required fields",
              type: "ValidationError",
            },
          ],
          success: false,
        },
        { status: 400 },
      )
    }

    // Format the version correctly
    const version = body.version || "0.8.17"

    // Log the version being sent to the backend
    console.log("Received compile request with version:", version)
    console.log("Source file:", body.fileName)

    // Extract contract name from source code with improved regex
    // This regex looks for "contract Name is" or "contract Name {" patterns
    let entryContract = ""
    const contractMatch = body.source.match(/contract\s+([a-zA-Z0-9_]+)(?:\s+is|\s*\{)/)
    if (contractMatch && contractMatch[1]) {
      entryContract = contractMatch[1]
      console.log("Extracted contract name from source:", entryContract)
    } else {
      // Fallback to file name without extension
      entryContract = body.fileName.split(".")[0]
      console.log("Using filename as contract name:", entryContract)
    }

    const COMPILER_SERVER_URL = process.env.COMPILER_SERVER_URL || "http://localhost:3001/compile"

    console.log("Proxying compile request to:", COMPILER_SERVER_URL)

    // Create a new request body with the correct structure
    const modifiedBody = {
      source: body.source,
      fileName: body.fileName,
      version: version,
      optimize: body.optimize,
      runs: body.runs || 200,
      entryContract: entryContract, // Add the extracted contract name
    }

    console.log("Sending to backend with version:", modifiedBody.version)
    console.log("Entry contract:", modifiedBody.entryContract)

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

    // If compilation was successful, return the full contract data
    if (data.success) {
      return NextResponse.json({
        success: true,
        contracts: {
          [body.fileName]: {
            [entryContract]: data.contract,
          },
        },
        errors: data.errors || [],
      })
    } else {
      // If compilation failed, return the errors
      return NextResponse.json({
        success: false,
        errors: data.errors || [{ message: "Unknown compilation error", severity: "error" }],
      })
    }
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
