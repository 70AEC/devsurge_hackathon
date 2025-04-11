const express = require("express")
const cors = require("cors")
const fs = require("fs")
const path = require("path")
const solc = require("solc")
const parser = require("@solidity-parser/parser")

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Define available versions that are known to work with their commit hashes
const VERSION_MAP = {
  "0.8.20": "0.8.20+commit.a1b79de6",
  "0.8.19": "0.8.19+commit.7dd6d404",
  "0.8.18": "0.8.18+commit.87f61d96",
  "0.8.17": "0.8.17+commit.8df45f5f",
  "0.8.16": "0.8.16+commit.07a7930e",
  "0.8.15": "0.8.15+commit.e14f2714",
  "0.8.14": "0.8.14+commit.80d49f37",
  "0.8.13": "0.8.13+commit.abaa5c0e",
  "0.8.12": "0.8.12+commit.f00d7308",
  "0.8.11": "0.8.11+commit.d7f03943",
  "0.8.10": "0.8.10+commit.fc410830",
  "0.8.9": "0.8.9+commit.e5eed63a",
  "0.8.8": "0.8.8+commit.dddeac2f",
  "0.8.7": "0.8.7+commit.e28d00a7",
  "0.8.6": "0.8.6+commit.11564f7e",
  "0.8.5": "0.8.5+commit.a4f2e591",
  "0.8.4": "0.8.4+commit.c7e474f2",
  "0.8.3": "0.8.3+commit.8d00100c",
  "0.8.2": "0.8.2+commit.661d1103",
  "0.8.1": "0.8.1+commit.df193b15",
  "0.8.0": "0.8.0+commit.c7dfd78e",
}

// 개선된 버전 로딩 함수
async function loadSolcVersion(version) {
  // Remove 'v' prefix if present
  const cleanVersion = version.startsWith("v") ? version.substring(1) : version

  // Try to get the full version string with commit hash
  const fullVersion = VERSION_MAP[cleanVersion] || cleanVersion

  console.log(`Attempting to load Solidity compiler version: ${fullVersion}`)

  return new Promise((resolve, reject) => {
    solc.loadRemoteVersion(fullVersion, (err, solcInstance) => {
      if (err) {
        console.error(`Failed to load solc version: ${fullVersion}`, err)

        // Try with just the clean version as fallback
        if (fullVersion !== cleanVersion) {
          console.log(`Trying fallback with version: ${cleanVersion}`)
          solc.loadRemoteVersion(cleanVersion, (err2, solcInstance2) => {
            if (err2) {
              console.error(`Fallback also failed for version: ${cleanVersion}`, err2)

              // Last resort: use the default installed version
              console.log("Using default installed solc version as last resort")
              resolve(solc)
            } else {
              console.log(`Successfully loaded fallback version: ${cleanVersion}`)
              resolve(solcInstance2)
            }
          })
        } else {
          // If we're already using the clean version, fall back to default
          console.log("Using default installed solc version")
          resolve(solc)
        }
      } else {
        console.log(`Successfully loaded solc version: ${fullVersion}`)
        resolve(solcInstance)
      }
    })
  })
}

// OpenZeppelin import 처리 (기존 코드 유지)
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

// ABI 병합 (중복 제거) (기존 코드 유지)
function mergeAbi(existing, additional) {
  const key = (item) => `${item.type}:${item.name}:${JSON.stringify(item.inputs)}`
  const seen = new Set(existing.map(key))
  for (const item of additional) {
    if (!seen.has(key(item))) {
      existing.push(item)
    }
  }
}

// solidity-parser로 public 함수 ABI 추출 (기존 코드 유지)
function extractFullABIFromParser(sourceCode) {
  const abi = []
  try {
    const ast = parser.parse(sourceCode, { tolerant: true })

    parser.visit(ast, {
      FunctionDefinition(node) {
        if (node.visibility === "public" && node.name && node.parameters) {
          const inputs = node.parameters.map((param) => ({
            name: param.name,
            type: param.typeName?.name || "unknown",
          }))
          const outputs = (node.returnParameters || []).map((param) => ({
            name: param.name,
            type: param.typeName?.name || "unknown",
          }))
          abi.push({
            type: "function",
            name: node.name,
            inputs,
            outputs,
            stateMutability: node.stateMutability || "nonpayable",
          })
        }
      },
    })
  } catch (err) {
    console.error("Parser error:", err.message)
  }
  return abi
}

// 컴파일 엔드포인트 (개선된 오류 처리)
app.post("/compile", async (req, res) => {
  const { source, fileName, version, optimize, runs } = req.body

  if (!source || !fileName) {
    return res.status(400).json({
      success: false,
      errors: [{ message: "Missing required fields: source, fileName" }],
    })
  }

  // Default to 0.8.17 if no version specified
  const requestedVersion = version || "0.8.17"
  console.log(`Compilation requested with Solidity version: ${requestedVersion}`)

  try {
    // Try to load the compiler with better error handling
    let compiler
    try {
      compiler = await loadSolcVersion(requestedVersion)
      console.log(`Using compiler version: ${compiler.version ? compiler.version() : "unknown"}`)
    } catch (loadErr) {
      console.error("Failed to load compiler, using default:", loadErr)
      compiler = solc
    }

    const input = {
      language: "Solidity",
      sources: {
        [fileName]: { content: source },
      },
      settings: {
        optimizer: { enabled: !!optimize, runs: runs || 200 },
        outputSelection: { "*": { "*": ["*"] } },
      },
    }

    console.log("Compiling with input:", JSON.stringify(input, null, 2).substring(0, 500) + "...")

    const output = JSON.parse(compiler.compile(JSON.stringify(input), { import: resolveImports }))
    console.log("Compilation completed")

    const hasError = output.errors?.some((e) => e.severity === "error")

    if (hasError) {
      console.log("Compilation had errors:", output.errors)
      return res.status(200).json({ success: false, errors: output.errors })
    }

    const contracts = output.contracts || {}
    console.log(`Compiled contracts: ${Object.keys(contracts).length} files`)

    // ABI 병합
    for (const file in contracts) {
      for (const contractName in contracts[file]) {
        console.log(`Processing ABI for ${file}:${contractName}`)
        const contract = contracts[file][contractName]
        const fullAbi = extractFullABIFromParser(source)
        mergeAbi(contract.abi, fullAbi)
      }
    }

    return res.json({
      success: true,
      contracts,
      errors: output.errors || [],
    })
  } catch (err) {
    console.error("Compilation error:", err)
    return res.status(500).json({
      success: false,
      errors: [{ message: err.message || "Internal error", severity: "error" }],
    })
  }
})

// 상태 확인 (기존 코드 유지)
app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    version: "1.0.0",
    time: new Date().toISOString(),
    supportedVersions: Object.keys(VERSION_MAP),
  })
})

// 서버 시작 (기존 코드 유지)
app.listen(PORT, () => {
  console.log(`🟢 Solidity compiler server running at http://localhost:${PORT}`)
})
