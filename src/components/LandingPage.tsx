'use client'

import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { ArrowRight, Zap, Shield, Sparkles, Brain, CheckCircle } from 'lucide-react'

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
          <div className="inline-flex items-center bg-primary/10 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-primary font-medium">AI-Enhanced ENS Profiles</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-semibold text-[#1d1d1f] mb-6 leading-tight tracking-tight">
            Transform your X profile into an
            <br />
            <span className="text-primary">AI-aware identity</span>
          </h1>
          
          <p className="text-xl text-muted mb-10 leading-relaxed max-w-2xl mx-auto">
            Connect your X account and create an AI-enhanced .base.eth profile in 30 seconds. 
            Make every AI interaction more personal.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={handleGetStarted}
              disabled={!ready}
              className="btn-primary text-lg px-8 py-4"
            >
              {authenticated ? 'Go to Dashboard' : 'Connect X to Get Started'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">30-Second Setup</h3>
              <p className="text-muted">
                From X profile to AI-enhanced ENS in less than a minute
              </p>
            </div>

            <div className="card text-center">
              <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You Own It</h3>
              <p className="text-muted">
                Your AI context lives on-chain. You control it completely
              </p>
            </div>

            <div className="card text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Universal AI Context</h3>
              <p className="text-muted">
                Works with Claude, ChatGPT, and future AI agents
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-secondary">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold mb-4">How it works</h2>
            <p className="text-xl text-muted">Three simple steps to your AI-enhanced identity</p>
          </div>

          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect your X account</h3>
                <p className="text-muted">
                  Securely connect via OAuth. We analyze your profile, bio, and recent tweets to understand your style and interests.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI generates your context</h3>
                <p className="text-muted">
                  Our AI creates rich context about your personality, expertise, and communication preferences. You can review and edit before publishing.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Deploy to your ENS profile</h3>
                <p className="text-muted">
                  Your AI context is stored in your .base.eth ENS profile. Any AI that supports ENS can now provide personalized interactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Gets Stored */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold mb-4">What gets stored in your ENS</h2>
            <p className="text-xl text-muted">AI-readable context that enhances every interaction</p>
          </div>

          <div className="card">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Communication Style</h4>
                  <p className="text-muted text-sm">How you prefer to communicate - formal, casual, technical, etc.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Areas of Expertise</h4>
                  <p className="text-muted text-sm">Your knowledge domains extracted from your tweets and bio</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Personality Traits</h4>
                  <p className="text-muted text-sm">Key personality characteristics that help AI understand you better</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Current Interests</h4>
                  <p className="text-muted text-sm">Topics you are actively engaged with based on recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-secondary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-semibold mb-4">Ready to enhance your AI interactions?</h2>
          <p className="text-xl text-muted mb-8">
            Join the future of personalized AI with your own .base.eth identity
          </p>
          <button 
            onClick={handleGetStarted}
            disabled={!ready}
            className="btn-primary text-lg px-8 py-4"
          >
            Get Your AI Profile
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-12 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted text-sm">
            Built for the ENS Hackathon • Targeting all three prize categories
          </p>
        </div>
      </footer>
    </div>
  )
}