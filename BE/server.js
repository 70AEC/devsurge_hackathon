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
                            return res.json({
                                contracts: output.contracts,
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

                // 서버 시작
                app.listen(PORT, () => {
                    console.log(`Solidity compiler server running on port ${PORT}`)
                })

                console.log("Compilation failed with errors")
                return res.json({
                    errors: output.errors,
                    success: false,
                })
            }
        }

        // If contracts are successfully compiled
        if (output.contracts) {
            console.log("Compilation succeeded")
            return res.json({
                contracts: output.contracts,
                success: true,
                errors: output.errors, // May contain warnings
            })
        } else {
            // Compilation succeeded but no contracts found      
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

// Start the server
app.listen(PORT, () => {
    console.log(`Solidity compiler server running on port ${PORT}`)
})
