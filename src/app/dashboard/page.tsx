"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Twitter,
  Globe,
  User,
  ExternalLink,
  Copy,
  RefreshCw,
} from "lucide-react";

export default function Dashboard() {
  const { user } = usePrivy();
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateContext = async () => {
    setIsUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <div className="flex-1 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Manage your AI-enhanced ENS profile</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  ENS Profile
                </h3>
                <p className="text-2xl font-bold text-gray-900">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Twitter className="w-6 h-6 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  X Connected
                </h3>
                <p className="text-2xl font-bold text-gray-900">✓</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  AI Contexts
                </h3>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">
                  Last Updated
                </h3>
                <p className="text-sm font-bold text-gray-900">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: "profile", label: "Profile" },
              { id: "ai-context", label: "AI Context" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    ENS Profile
                  </h2>
                  <button
                    onClick={handleUpdateContext}
                    disabled={isUpdating}
                    className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${
                        isUpdating ? "animate-spin" : ""
                      }`}
                    />
                    {isUpdating ? "Updating..." : "Update Context"}
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ENS Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value="john.base.eth"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        readOnly
                      />
                      <button
                        onClick={() => copyToClipboard("john.base.eth")}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                        Upload New
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wallet Address
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={user?.wallet?.address || ""}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(user?.wallet?.address || "")
                        }
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai-context" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  AI Context
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio Lines
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Tell AI about yourself..."
                      defaultValue="Frontend developer passionate about Web3 and AI. Building the future one commit at a time. Love exploring new technologies and contributing to open source projects."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Communication Style
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Casual",
                        "Technical",
                        "Concise",
                        "Detailed",
                        "Friendly",
                      ].map((style) => (
                        <span
                          key={style}
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Topics of Interest
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "React",
                        "Next.js",
                        "Web3",
                        "AI/ML",
                        "DeFi",
                        "Base",
                        "TypeScript",
                        "Blockchain",
                      ].map((topic) => (
                        <span
                          key={topic}
                          className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Personality Traits
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Curious",
                        "Builder",
                        "Helpful",
                        "Analytical",
                        "Creative",
                        "Collaborative",
                      ].map((trait) => (
                        <span
                          key={trait}
                          className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Settings
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Auto-update from X
                      </h3>
                      <p className="text-sm text-gray-600">
                        Automatically sync changes from your X profile
                      </p>
                    </div>
                    <button className="bg-blue-500 relative inline-flex h-6 w-11 items-center rounded-full">
                      <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Public AI Context
                      </h3>
                      <p className="text-sm text-gray-600">
                        Allow AI agents to read your context
                      </p>
                    </div>
                    <button className="bg-blue-500 relative inline-flex h-6 w-11 items-center rounded-full">
                      <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-600">
                        Get notified when your context is accessed
                      </p>
                    </div>
                    <button className="bg-gray-300 relative inline-flex h-6 w-11 items-center rounded-full">
                      <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                    </button>
                  </div>

                  <div className="pt-4">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Danger Zone
                    </h3>
                    <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors">
                      Reset AI Context
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connected Accounts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Connected Accounts
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Twitter className="w-5 h-5 text-blue-500 mr-3" />
                    <span className="text-sm text-gray-900">@john_doe</span>
                  </div>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-500">GitHub</span>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">
                    Connect
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-500">Farcaster</span>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-700">
                    Connect
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-900">
                    Update AI Context
                  </div>
                  <div className="text-xs text-gray-600">
                    Refresh from X profile
                  </div>
                </button>

                <button className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-900">
                    Test AI Chat
                  </div>
                  <div className="text-xs text-gray-600">
                    Try your profile with Claude
                  </div>
                </button>

                <button className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-900">
                    Share Profile
                  </div>
                  <div className="text-xs text-gray-600">
                    Get shareable link
                  </div>
                </button>

                <button className="w-full text-left px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="text-sm font-medium text-gray-900">
                    Export Data
                  </div>
                  <div className="text-xs text-gray-600">
                    Download your AI context
                  </div>
                </button>
              </div>
            </div>

            {/* AI Context Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                AI Context Preview
              </h3>
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg font-mono">
                {`{
  "ai.bio": ["Frontend dev", "Web3 builder"],
  "ai.style": ["casual", "technical"],
  "ai.topics": ["react", "web3", "ai"],
  "ai.traits": ["curious", "helpful"]
}`}
              </div>
              <button className="mt-3 text-xs text-blue-600 hover:text-blue-700">
                View Full JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
