import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { WagmiWrapper } from '@/components/wagmi-wrapper' // 새로 분리된 Client 컴포넌트

export const metadata: Metadata = {
  title: "Web3 AI Builder",
  description: "Build smart contracts and dApps with AI assistance",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WagmiWrapper>
          {children}
        </WagmiWrapper>
      </body>
    </html>
  )
}

