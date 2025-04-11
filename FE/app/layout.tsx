import type { ReactNode } from "react"
import "./globals.css"
import ClientLayout from "./clientLayout"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Web3 AI Builder",
  description: "Build smart contracts and dApps with AI assistance",
  icons: {
    icon: "/favicon.ico",
  },
}

interface LayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: LayoutProps) {
  return <ClientLayout>{children}</ClientLayout>
}
