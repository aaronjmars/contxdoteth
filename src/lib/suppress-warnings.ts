// Ultra aggressive warning suppression for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  console.error = (...args: any[]) => {
    const message = String(args[0] || '')
    
    // Suppress ALL styled-components and React prop warnings
    if (
      message.includes('styled-components:') ||
      message.includes('React does not recognize the') ||
      message.includes('isActive') ||
      message.includes('isactive') ||
      message.includes('unknown prop') ||
      message.includes('shouldForwardProp') ||
      message.includes('transient props')
    ) {
      return
    }
    
    originalConsoleError.apply(console, args)
  }

  console.warn = (...args: any[]) => {
    const message = String(args[0] || '')
    
    // Suppress ALL warnings related to:
    if (
      message.includes('was preloaded using link preload') ||
      message.includes('styled-components:') ||
      message.includes('isActive') ||
      message.includes('isactive') ||
      message.includes('unknown prop') ||
      message.includes('Privy') ||
      message.includes('shouldForwardProp')
    ) {
      return
    }
    
    originalConsoleWarn.apply(console, args)
  }

  // Also suppress console.log for styled-components
  const originalConsoleLog = console.log
  console.log = (...args: any[]) => {
    const message = String(args[0] || '')
    
    if (
      message.includes('styled-components:') ||
      message.includes('isActive') ||
      message.includes('unknown prop')
    ) {
      return
    }
    
    originalConsoleLog.apply(console, args)
  }
}

// Also globally handle React error boundaries for these warnings
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('styled-components') ||
      event.message?.includes('isActive') ||
      event.message?.includes('unknown prop')
    ) {
      event.preventDefault()
      event.stopPropagation()
    }
  })
}