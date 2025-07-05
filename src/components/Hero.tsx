"use client";

import { useEffect } from "react";
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { renderCanvas } from "@/components/ui/canvas"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Plus } from "lucide-react";

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
    <section id="home" className="relative overflow-hidden min-h-screen">
      <div className="animation-delay-8 animate-fadeIn mt-20 flex flex-col items-center justify-center px-4 text-center md:mt-20">
        <div className="mb-10 mt-4 md:mt-6">
          <div className="px-2">
            <div className="relative mx-auto h-full max-w-7xl border border-primary/20 p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
              <h1 className="flex select-none flex-col px-3 py-2 text-center text-5xl font-semibold leading-none tracking-tight md:flex-col md:text-8xl lg:flex-row lg:text-8xl">
                <Plus
                  strokeWidth={4}
                  className="text-primary absolute -left-5 -top-5 h-10 w-10"
                />
                <Plus
                  strokeWidth={4}
                  className="text-primary absolute -bottom-5 -left-5 h-10 w-10"
                />
                <Plus
                  strokeWidth={4}
                  className="text-primary absolute -right-5 -top-5 h-10 w-10"
                />
                <Plus
                  strokeWidth={4}
                  className="text-primary absolute -bottom-5 -right-5 h-10 w-10"
                />
                The context layer of Ethereum
              </h1>
              <div className="flex items-center justify-center gap-1 mt-4">
                <span className="relative flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                </span>
                <p className="text-xs text-blue-500">Live on Base • Free for the next week</p>
              </div>

              <div className="flex justify-center gap-2 mt-8 relative z-20">
                <InteractiveHoverButton 
                  text={authenticated ? 'Claim Username' : 'Claim Username Free'}
                  onClick={handleGetStarted}
                  disabled={!ready}
                  className="text-lg relative z-20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <canvas
        className="pointer-events-none absolute inset-0"
        id="canvas"
      ></canvas>
    </section>
  );
}