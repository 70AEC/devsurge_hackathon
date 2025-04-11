"use client"

import { Wallet } from "lucide-react"

export function PreviewPanel() {
  return (
    <div className="h-full bg-white flex items-center justify-center">
      <div className="bg-gradient-to-br from-gray-900 to-black text-white p-8 max-w-4xl w-full rounded-lg">
        <h1 className="text-4xl font-bold mb-8 text-center">My NFT Collection</h1>

        <div className="flex justify-center mb-8">
          <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 rounded-lg text-white">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((id) => (
            <div key={id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="aspect-square bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">NFT Preview</div>
              </div>
              <div className="p-4">
                <h3 className="font-medium">CryptoArt #{id}</h3>
                <p className="text-sm text-gray-400">#{id.toString().padStart(4, "0")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
