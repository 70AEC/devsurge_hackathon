const express = require("express")
const cors = require("cors")
const solc = require("solc")
const fs = require("fs")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 3001

// CORS 설정
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
)

app.use(express.json())

// OpenZeppelin 라이브러리 경로
const OPENZEPPELIN_PATH = path.join(__dirname, "node_modules", "@openzeppelin")

// 라이브러리 파일 로드 함수
function loadLibraryFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8")
  } catch (error) {
    console.error(`Error loading library file ${filePath}:`, error)
    return null
  }
}

// 라이브러리 임포트 해석 함수
function resolveImports(importPath) {
  // OpenZeppelin 라이브러리 임포트 처리
  if (importPath.startsWith("@openzeppelin/")) {
    const fullPath = path.join(__dirname, "node_modules", importPath)
    try {
      return { contents: fs.readFileSync(fullPath, "utf8") }
    } catch (error) {
      console.error(`Error resolving import ${importPath}:`, error)
      return { error: `Library not found: ${importPath}` }
    }
  }

  // 다른 임포트 처리 (필요한 경우)
  return { error: `Import not found: ${importPath}` }
}

// 컴파일 엔드포인트
app.post("/compile", async (req, res) => {
  try {
    const { source, fileName, version, optimize, runs, libraries } = req.body

    console.log(`Compiling ${fileName} with Solidity ${version}`)

    // 컴파일러 입력 생성
    const input = {
      language: "Solidity",
      sources: {
        [fileName]: {
          content: source,
        },
      },
      settings: {
        optimizer: {
          enabled: optimize === true,
          runs: runs || 200,
        },
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
        // OpenZeppelin 라이브러리 경로 추가
        libraries: libraries || {},
      },
    }

    // 컴파일 옵션
    const compilerOptions = {
      import: resolveImports,
    }

    // 컴파일 실행
    const output = JSON.parse(solc.compile(JSON.stringify(input), compilerOptions))

    // 컴파일 결과 확인
    if (output.errors && output.errors.length > 0) {
      // 오류가 있는지 확인
      const hasError = output.errors.some((error) => error.severity === "error")

      if (hasError) {
        console.log("Compilation failed with errors")
        return res.json({
          errors: output.errors,
          success: false,
        })
      }
    }

    // 컴파일 성공
    if (output.contracts) {
      console.log("Compilation succeeded")

      // OpenZeppelin 인터페이스 감지 및 ABI 추가
      const contractsWithInterfaces = enhanceContractsWithInterfaces(source, output.contracts)

      return res.json({
        contracts: contractsWithInterfaces,
        success: true,
        errors: output.errors, // 경고가 있을 수 있음
      })
    } else {
      // 컴파일은 되었지만 계약이 없는 경우
      console.log("Compilation succeeded but no contracts found")
      return res.json({
        success: false,
        errors: [
          {
            severity: "error",
            formattedMessage: "No contracts found in source code",
            message: "No contracts found in source code",
            type: "CompilerError",
          },
        ],
      })
    }
  } catch (error) {
    console.error("Compilation error:", error)
    return res.status(500).json({
      errors: [
        {
          severity: "error",
          formattedMessage: `Server error: ${error.message}`,
          message: error.message,
          type: "ServerError",
        },
      ],
      success: false,
    })
  }
})

// OpenZeppelin 인터페이스 감지 및 ABI 추가 함수
function enhanceContractsWithInterfaces(sourceCode, contracts) {
  // 소스 코드에서 OpenZeppelin 임포트 감지
  const hasERC20 =
    sourceCode.includes("@openzeppelin/contracts/token/ERC20") ||
    sourceCode.includes("openzeppelin-solidity/contracts/token/ERC20")
  const hasERC721 =
    sourceCode.includes("@openzeppelin/contracts/token/ERC721") ||
    sourceCode.includes("openzeppelin-solidity/contracts/token/ERC721")
  const hasERC1155 =
    sourceCode.includes("@openzeppelin/contracts/token/ERC1155") ||
    sourceCode.includes("openzeppelin-solidity/contracts/token/ERC1155")
  const hasOwnable =
    sourceCode.includes("@openzeppelin/contracts/access/Ownable") ||
    sourceCode.includes("openzeppelin-solidity/contracts/access/Ownable")
  const hasPausable =
    sourceCode.includes("@openzeppelin/contracts/security/Pausable") ||
    sourceCode.includes("openzeppelin-solidity/contracts/security/Pausable")

  // 계약 복사본 생성
  const enhancedContracts = JSON.parse(JSON.stringify(contracts))

  // 각 파일의 각 계약에 대해 처리
  for (const fileName in enhancedContracts) {
    for (const contractName in enhancedContracts[fileName]) {
      const contract = enhancedContracts[fileName][contractName]

      // 계약 소스 코드에서 상속 확인
      const contractSource = sourceCode

      // 인터페이스 ABI 추가
      if (hasERC20 && contractSource.includes("ERC20")) {
        addERC20Interface(contract)
      }

      if (hasERC721 && contractSource.includes("ERC721")) {
        addERC721Interface(contract)
      }

      if (hasERC1155 && contractSource.includes("ERC1155")) {
        addERC1155Interface(contract)
      }

      if (hasOwnable && contractSource.includes("Ownable")) {
        addOwnableInterface(contract)
      }

      if (hasPausable && contractSource.includes("Pausable")) {
        addPausableInterface(contract)
      }
    }
  }

  return enhancedContracts
}

// ERC20 인터페이스 ABI 추가
function addERC20Interface(contract) {
  const erc20Abi = [
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "sender", type: "address" },
        { internalType: "address", name: "recipient", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "from", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "owner", type: "address" },
        { indexed: true, internalType: "address", name: "spender", type: "address" },
        { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "Approval",
      type: "event",
    },
  ]

  // 기존 ABI에 없는 항목만 추가
  mergeAbi(contract.abi, erc20Abi)
}

// ERC721 인터페이스 ABI 추가
function addERC721Interface(contract) {
  const erc721Abi = [
    {
      inputs: [{ internalType: "address", name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
      name: "ownerOf",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "approve",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
      name: "getApproved",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "operator", type: "address" },
        { internalType: "bool", name: "approved", type: "bool" },
      ],
      name: "setApprovalForAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "operator", type: "address" },
      ],
      name: "isApprovedForAll",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "safeTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "from", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "owner", type: "address" },
        { indexed: true, internalType: "address", name: "approved", type: "address" },
        { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "owner", type: "address" },
        { indexed: true, internalType: "address", name: "operator", type: "address" },
        { indexed: false, internalType: "bool", name: "approved", type: "bool" },
      ],
      name: "ApprovalForAll",
      type: "event",
    },
  ]

  // 기존 ABI에 없는 항목만 추가
  mergeAbi(contract.abi, erc721Abi)
}

// ERC1155 인터페이스 ABI 추가
function addERC1155Interface(contract) {
  const erc1155Abi = [
    {
      inputs: [
        { internalType: "address", name: "account", type: "address" },
        { internalType: "uint256", name: "id", type: "uint256" },
      ],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address[]", name: "accounts", type: "address[]" },
        { internalType: "uint256[]", name: "ids", type: "uint256[]" },
      ],
      name: "balanceOfBatch",
      outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "operator", type: "address" },
        { internalType: "bool", name: "approved", type: "bool" },
      ],
      name: "setApprovalForAll",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "operator", type: "address" },
      ],
      name: "isApprovedForAll",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "id", type: "uint256" },
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "safeTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256[]", name: "ids", type: "uint256[]" },
        { internalType: "uint256[]", name: "amounts", type: "uint256[]" },
        { internalType: "bytes", name: "data", type: "bytes" },
      ],
      name: "safeBatchTransferFrom",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "operator", type: "address" },
        { indexed: true, internalType: "address", name: "from", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        { indexed: false, internalType: "uint256", name: "id", type: "uint256" },
        { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "TransferSingle",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "operator", type: "address" },
        { indexed: true, internalType: "address", name: "from", type: "address" },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        { indexed: false, internalType: "uint256[]", name: "ids", type: "uint256[]" },
        { indexed: false, internalType: "uint256[]", name: "values", type: "uint256[]" },
      ],
      name: "TransferBatch",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "owner", type: "address" },
        { indexed: true, internalType: "address", name: "operator", type: "address" },
        { indexed: false, internalType: "bool", name: "approved", type: "bool" },
      ],
      name: "ApprovalForAll",
      type: "event",
    },
  ]

  // 기존 ABI에 없는 항목만 추가
  mergeAbi(contract.abi, erc1155Abi)
}

// Ownable 인터페이스 ABI 추가
function addOwnableInterface(contract) {
  const ownableAbi = [
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
        { indexed: true, internalType: "address", name: "newOwner", type: "address" },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
  ]

  // 기존 ABI에 없는 항목만 추가
  mergeAbi(contract.abi, ownableAbi)
}

// Pausable 인터페이스 ABI 추가
function addPausableInterface(contract) {
  const pausableAbi = [
    {
      inputs: [],
      name: "paused",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
      name: "Paused",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, internalType: "address", name: "account", type: "address" }],
      name: "Unpaused",
      type: "event",
    },
  ]

  // 기존 ABI에 없는 항목만 추가
  mergeAbi(contract.abi, pausableAbi)
}

// ABI 병합 함수 (중복 항목 방지)
function mergeAbi(existingAbi, newAbi) {
  if (!existingAbi) return

  for (const item of newAbi) {
    // 이미 존재하는지 확인
    const exists = existingAbi.some((existing) => {
      if (existing.type !== item.type) return false

      if (item.type === "function") {
        return existing.name === item.name && JSON.stringify(existing.inputs) === JSON.stringify(item.inputs)
      }

      if (item.type === "event") {
        return existing.name === item.name && JSON.stringify(existing.inputs) === JSON.stringify(item.inputs)
      }

      return false
    })

    // 존재하지 않으면 추가
    if (!exists) {
      existingAbi.push(item)
    }
  }
}

// 상태 확인 엔드포인트 추가
app.get("/status", (req, res) => {
  res.json({
    status: "ok",
    solcVersion: solc.version(),
    openzeppelinSupport: true,
  })
})

// 서버 시작
app.listen(PORT, () => {
  console.log(`Solidity compiler server running on port ${PORT}`)
})
