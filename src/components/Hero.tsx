"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { renderCanvas } from "@/components/ui/canvas"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export function Hero() {
  const router = useRouter()
  const { ready, authenticated, login } = usePrivy()

  useEffect(() => {
    renderCanvas();
  }, []);

  const handleGetStarted = () => {
    if (authenticated) {
      router.push('/dashboard')
    } else {
      login()
    }
  }

  return (
    <section id="home" className="relative overflow-hidden min-h-screen flex items-center justify-center pt-16">
      <div className="z-10 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          The context layer
          <br />
          <span className="text-primary">of Ethereum</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted mb-12 max-w-2xl">
          Claim your AI-aware ENS profile.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <InteractiveHoverButton 
            text={authenticated ? 'Claim Username' : 'Claim Username Free'}
            onClick={handleGetStarted}
            disabled={!ready}
            className="text-lg"
          />
        </div>

        <div className="mt-8 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          <p className="text-sm text-muted">Live on Base • Free for the next week</p>
        </div>
      </div>
      
      <canvas
        className="pointer-events-none absolute inset-0"
        id="canvas"
      ></canvas>
    </section>
  );
}