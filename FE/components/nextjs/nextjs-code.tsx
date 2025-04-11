"use client"

import { useState } from "react"
import { FileCode } from "lucide-react"

//mock up code with gpt4.0

export function NextJSCode() {
    const [frontendCode] = useState<Record<string, string>>({
        "app/page.tsx": `"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { ConnectWallet } from "@/components/connect-wallet";
import { NFTCard } from "@/components/nft-card";
import contractABI from "@/lib/contract-abi.json";

const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [nfts, setNfts] = useState([]);

  const mintNFT = async () => {
    try {
      setIsMinting(true);
      // Minting logic would go here
      setIsMinting(false);
    } catch (error) {
      console.error("Error minting NFT:", error);
      setIsMinting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">My NFT Collection</h1>
        
        <div className="flex justify-center mb-8">
          <ConnectWallet onConnect={() => setIsConnected(true)} />
        </div>
        
        {isConnected && (
          <div className="text-center mb-12">
            <Button 
              onClick={mintNFT} 
              disabled={isMinting}
              className="bg-gradient-to-r from-purple-600 to-blue-500"
            >
              {isMinting ? "Minting..." : "Mint NFT (0.05 ETH)"}
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nfts.map((nft, index) => (
            <NFTCard key={index} nft={nft} />
          ))}
        </div>
      </div>
    </main>
  );
}`,
    "components/connect-wallet.tsx": `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from 'lucide-react';

interface ConnectWalletProps {
  onConnect: () => void;
}

export function ConnectWallet({ onConnect }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      // Connection logic would go here
      const mockAccount = "0x1234...5678";
      setAccount(mockAccount);
      onConnect();
      setIsConnecting(false);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div>
      {!account ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      ) : (
        <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm">{account}</span>
        </div>
      )}
    </div>
  );
}`,
    "components/nft-card.tsx": `import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface NFTCardProps {
  nft: {
    id: string;
    name: string;
    image: string;
  };
}

export function NFTCard({ nft }: NFTCardProps) {
  return (
    <Card className="overflow-hidden bg-gray-800 border-gray-700">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <Image
            src={nft.image || "/placeholder.svg?height=300&width=300"}
            alt={nft.name}
            fill
            className="object-cover"
          />
        </div>
      </CardContent>
      <CardFooter className="p-4">
        <div>
          <h3 className="font-medium">{nft.name}</h3>
          <p className="text-sm text-gray-400">#{nft.id}</p>
        </div>
      </CardFooter>
    </Card>
  );
}`,
  })

  const [activeFile, setActiveFile] = useState("app/page.tsx")

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-800 p-4 overflow-auto">
        <h3 className="font-medium mb-2 text-sm">PROJECT FILES</h3>
        <ul className="space-y-1">
          <li className="text-sm text-gray-400">
            <details open>
              <summary className="cursor-pointer">app</summary>
              <ul className="pl-4 pt-1 space-y-1">
                <li
                  className={`flex items-center cursor-pointer ${activeFile === "app/page.tsx" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"}`}
                  onClick={() => setActiveFile("app/page.tsx")}
                >
                  <FileCode className="h-3 w-3 mr-2" />
                  page.tsx
                </li>
                <li className="text-gray-400 flex items-center">
                  <FileCode className="h-3 w-3 mr-2" />
                  layout.tsx
                </li>
              </ul>
            </details>
          </li>
          <li className="text-sm text-gray-400">
            <details open>
              <summary className="cursor-pointer">components</summary>
              <ul className="pl-4 pt-1 space-y-1">
                <li
                  className={`flex items-center cursor-pointer ${activeFile === "components/connect-wallet.tsx" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"}`}
                  onClick={() => setActiveFile("components/connect-wallet.tsx")}
                >
                  <FileCode className="h-3 w-3 mr-2" />
                  connect-wallet.tsx
                </li>
                <li
                  className={`flex items-center cursor-pointer ${activeFile === "components/nft-card.tsx" ? "text-purple-400" : "text-gray-400 hover:text-gray-300"}`}
                  onClick={() => setActiveFile("components/nft-card.tsx")}
                >
                  <FileCode className="h-3 w-3 mr-2" />
                  nft-card.tsx
                </li>
              </ul>
            </details>
          </li>
          <li className="text-sm text-gray-400">
            <details>
              <summary className="cursor-pointer">lib</summary>
              <ul className="pl-4 pt-1 space-y-1">
                <li className="text-gray-400 flex items-center">
                  <FileCode className="h-3 w-3 mr-2" />
                  contract-abi.json
                </li>
                <li className="text-gray-400 flex items-center">
                  <FileCode className="h-3 w-3 mr-2" />
                  compile.ts
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-sm font-mono h-full overflow-auto">
          <code className="language-typescript">{frontendCode[activeFile] || "// File not found"}</code>
        </pre>
      </div>
    </div>
  )
}
