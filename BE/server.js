const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const solc = require("solc")

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const VERSION_MAP = {
  "0.8.20": "v0.8.20+commit.a1b79de6",
  "0.8.19": "v0.8.19+commit.7dd6d404",
  "0.8.18": "v0.8.18+commit.87f61d96",
  "0.8.17": "v0.8.17+commit.8df45f5f",
  "0.8.16": "v0.8.16+commit.07a7930e",
  "0.8.15": "v0.8.15+commit.e14f2714",
  "0.8.14": "v0.8.14+commit.80d49f37",
  "0.8.13": "v0.8.13+commit.abaa5c0e",
  "0.8.12": "v0.8.12+commit.f00d7308",
  "0.8.11": "v0.8.11+commit.d7f03943",
  "0.8.10": "v0.8.10+commit.fc410830",
  "0.8.9": "v0.8.9+commit.e5eed63a",
  "0.8.8": "v0.8.8+commit.dddeac2f",
  "0.8.7": "v0.8.7+commit.e28d00a7",
  "0.8.6": "v0.8.6+commit.11564f7e",
  "0.8.5": "v0.8.5+commit.a4f2e591",
  "0.8.4": "v0.8.4+commit.c7e474f2",
  "0.8.3": "v0.8.3+commit.8d00100c",
  "0.8.2": "v0.8.2+commit.661d1103",
  "0.8.1": "v0.8.1+commit.df193b15",
  "0.8.0": "v0.8.0+commit.c7dfd78e",
}

async function loadSolcVersion(version) {
  const cleanVersion = version.startsWith("v") ? version : "v" + version
  const fullVersion = VERSION_MAP[version] || cleanVersion

  console.log(`▶ Loading Solidity compiler version: ${fullVersion}`)

  return new Promise((resolve, reject) => {
    solc.loadRemoteVersion(fullVersion, (err, solcInstance) => {
      if (err) {
        console.error(`❌ Failed to load solc version: ${fullVersion}`, err)
        resolve(solc) // fallback
      } else {
        console.log(`✅ Loaded solc version: ${solcInstance.version()}`)
        resolve(solcInstance)
      }
    })
  })
}

function resolveImports(importPath) {
  if (importPath.startsWith("@openzeppelin/")) {
    const fullPath = path.join(__dirname, "node_modules", importPath)
    try {
      return { contents: fs.readFileSync(fullPath, "utf8") }
    } catch (err) {
      return { error: `Library not found: ${importPath}` }
    }
  }
  return { error: `Import not found: ${importPath}` }
}

app.post("/compile", async (req, res) => {
  const { source, fileName, version, optimize, runs, entryContract } = req.body

  if (!source || !fileName || !entryContract) {
    return res.status(400).json({
      success: false,
      errors: [{ message: "Missing required fields: source, fileName, entryContract" }],
    })
  }

  const requestedVersion = version || "0.8.17"
  console.log(`📥 Compilation requested with Solidity version: ${requestedVersion}`)

  try {
    const compiler = await loadSolcVersion(requestedVersion)

    const input = {
      language: "Solidity",
      sources: {
        [fileName]: { content: source },
      },
      settings: {
        optimizer: { enabled: !!optimize, runs: runs || 200 },
        outputSelection: {
          "*": {
            "*": [
              "abi",
              "evm.bytecode",
              "evm.deployedBytecode",
              "evm.methodIdentifiers",
              "metadata",
              "userdoc",
              "devdoc",
              "storageLayout"
            ],
          },
        },
      },
    }

    console.log("📤 Compiling with input:")
    console.dir(input, { depth: null })

    const output = JSON.parse(compiler.compile(JSON.stringify(input), { import: resolveImports }))

    console.log("✅ Compilation output received")

    const hasError = output.errors?.some((e) => e.severity === "error")
    if (hasError) {
      console.warn("⚠️ Compilation had errors:")
      console.dir(output.errors, { depth: null })
      return res.status(200).json({ success: false, errors: output.errors })
    }

    // Entry 컨트랙트 기준으로 ABI 추출
    const contractData = output.contracts?.[fileName]?.[entryContract]

    if (!contractData || !contractData.abi) {
      return res.status(400).json({
        success: false,
        errors: [{ message: `Entry contract "${entryContract}" not found in compiled output.` }],
      })
    }

    return res.json({
      success: true,
      abi: contractData.abi, // ✅ Remix처럼 상속 포함된 ABI
      contract: contractData, // full bytecode, metadata 포함
      errors: output.errors || [],
    })
  } catch (err) {
    console.error("❌ Compilation error:", err)
    return res.status(500).json({
      success: false,
      errors: [{ message: err.message || "Internal error", severity: "error" }],
    })
  }
})

app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    time: new Date().toISOString(),
    supportedVersions: Object.keys(VERSION_MAP),
  })
})

app.listen(PORT, () => {
  console.log(`🟢 Solidity compiler server running at http://localhost:${PORT}`)
})
