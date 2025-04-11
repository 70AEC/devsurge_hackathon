import { Plus, Archive, Zap, Code, History } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const archivedChats = [
    { id: 1, name: "ERC721 NFT Collection" },
    { id: 2, name: "DeFi Staking Contract" },
    { id: 3, name: "DAO Governance" },
  ]

  return (
    <div className="w-full h-full border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-2 mb-6">
          <Zap className="h-6 w-6 text-purple-500" />
          <h1 className="text-xl font-bold">Web3 Studio</h1>
        </div>
        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 flex items-center mb-3">
            <History className="h-4 w-4 mr-2" />
            RECENT PROJECTS
          </h2>
          <ul className="space-y-2">
            {archivedChats.map((chat) => (
              <li key={chat.id} className="group">
                <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-800 transition-colors">
                  <Code className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm truncate">{chat.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-400 flex items-center mb-3">
            <Archive className="h-4 w-4 mr-2" />
            ARCHIVED
          </h2>
          <ul className="space-y-2">
            {archivedChats.map((chat) => (
              <li key={chat.id} className="group">
                <a href="#" className="flex items-center p-2 rounded-md hover:bg-gray-800 transition-colors">
                  <Code className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm truncate">{chat.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-xs font-bold">WS</span>
          </div>
          <div className="text-sm">Web3 Studio</div>
        </div>
      </div>
    </div>
  )
}
