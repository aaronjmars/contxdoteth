'use client'

import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowRight, Twitter, Zap, Shield, Sparkles, Globe, Brain, Link } from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()

  const handleGetStarted = () => {
    if (authenticated) {
      router.push('/dashboard')
    } else {
      login()
    }
  }

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-sm text-blue-700 font-medium">AI-Enhanced ENS Profiles</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Your AI-Aware
            <br />
            <span className="text-blue-500">Web3 Identity</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Connect your X account and create an AI-enhanced .base.eth profile in 30 seconds. 
            Make every AI interaction more personal and meaningful.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button 
              onClick={handleGetStarted}
              disabled={!ready}
              className="group bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-sm hover:shadow-lg flex items-center"
            >
              {authenticated ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button className="flex items-center text-gray-600 hover:text-gray-900 px-8 py-4 transition-colors">
              <Globe className="w-5 h-5 mr-2" />
              View Demo
            </button>
          </div>

          {/* Preview Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Twitter className="w-5 h-5 text-blue-500 mr-2" />
                <span className="font-semibold text-gray-900">Connect X Profile</span>
              </div>
              <p className="text-gray-600 text-sm">
                We analyze your X profile and tweets to create personalized AI context
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center mb-4">
                <Brain className="w-5 h-5 text-purple-500 mr-2" />
                <span className="font-semibold text-gray-900">AI-Enhanced ENS</span>
              </div>
              <p className="text-gray-600 text-sm">
                Your .base.eth domain becomes an AI-aware identity for better interactions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for the AI Era
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your ENS profile becomes a rich context source for AI interactions, 
              making every conversation more relevant and personal.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Setup</h3>
              <p className="text-gray-600">
                Connect your X account and get an AI-enhanced ENS profile in under a minute
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fully Owned</h3>
              <p className="text-gray-600">
                Your AI context lives on-chain in your ENS profile. You own and control it completely
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Link className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Universal</h3>
              <p className="text-gray-600">
                Works with any AI that reads ENS profiles - Claude, ChatGPT, and future AI agents
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How Contx.eth Works
          </h2>
          <p className="text-xl text-gray-600 mb-16">
            From X profile to AI-aware ENS in three simple steps
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Connect & Analyze</h3>
              <p className="text-gray-600">
                Connect your X account and we will analyze your profile, bio, and recent tweets to understand your communication style and interests.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate Context</h3>
              <p className="text-gray-600">
                Our AI creates rich context about your personality, expertise, and communication preferences to enhance AI interactions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Deploy to ENS</h3>
              <p className="text-gray-600">
                Your AI context is stored in your .base.eth ENS profile, making it accessible to any AI that supports ENS lookups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500">
            © 2025 Contx.eth. Built for the ENS Hackathon.
          </p>
        </div>
      </footer>
    </div>
  )
}