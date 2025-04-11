"use client"

import { ArrowRight, Code, Coins, Database, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-block p-2 bg-purple-900/30 rounded-full mb-6">
            <Zap className="h-8 w-8 text-purple-400" />
          </div> <h1 className="text-7xl md:text-9xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-blue-500">
          DevSurge</h1>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500">
            Web3 AI Builder
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mb-8">
            Build smart contracts and dApps with AI assistance, powered by custom RAG for participant revenue generation
          </p>
          <Link href="/main">
            <Button className="text-lg px-8 py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full">
              Launch Platform <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-purple-500 transition-all">
            <div className="bg-purple-900/30 p-3 rounded-lg inline-block mb-4">
              <Code className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI-Powered Development</h3>
            <p className="text-gray-400">
              Create smart contracts and frontend code with AI assistance. Get suggestions, debug help, and optimization
              tips.
            </p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-purple-500 transition-all">
            <div className="bg-purple-900/30 p-3 rounded-lg inline-block mb-4">
              <Database className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Custom RAG System</h3>
            <p className="text-gray-400">
              Leverage our custom Retrieval-Augmented Generation system to access the latest Web3 knowledge and best
              practices.
            </p>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 hover:border-purple-500 transition-all">
            <div className="bg-purple-900/30 p-3 rounded-lg inline-block mb-4">
              <Coins className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Revenue Generation</h3>
            <p className="text-gray-400">
              Participants can earn rewards by contributing to the knowledge base and helping others build better Web3
              applications.
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-400 mb-6">Ready to revolutionize your Web3 development workflow?</p>
          <Link href="/main">
            <Button variant="outline" className="text-white border-purple-500 hover:bg-purple-500/20">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
