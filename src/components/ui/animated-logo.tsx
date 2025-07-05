"use client";

import React from "react";

export function AnimatedLogo() {
  return (
    <div className="flex items-baseline">
      {/* Static "Contx" part */}
      <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Contx
      </span>
      
      {/* Animated ".eth" / ".name" part - they should alternate, not overlap */}
      <div className="relative min-w-[6rem] flex items-baseline">
        {/* .eth shows first */}
        <span className="absolute left-[5px] bottom-[-7px] text-4xl md:text-5xl font-bold tracking-tight from-gradient-1-start to-gradient-1-end animate-gradient-foreground-1 bg-gradient-to-r bg-clip-text text-transparent">
          .eth
        </span>
        {/* .name shows second */}
        <span className="absolute left-[5px] bottom-[-7px] text-4xl md:text-5xl font-bold tracking-tight from-gradient-2-start to-gradient-2-end animate-gradient-foreground-3 bg-gradient-to-r bg-clip-text text-transparent">
          .name
        </span>
      </div>
    </div>
  );
}