'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'
import isPropValid from '@emotion/is-prop-valid'

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode
}) {
  // Only create stylesheet once with lazy initial state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement()
    styledComponentsStyleSheet.instance.clearTag()
    return <>{styles}</>
  })

  if (typeof window !== 'undefined') {
    return (
      <StyleSheetManager
        shouldForwardProp={(prop) => {
          // Filter out problematic props that shouldn't reach DOM
          if (prop === 'isActive' || prop === 'isactive' || prop === 'active') {
            return false
          }
          // Use emotion's isPropValid for standard validation
          return isPropValid(prop)
        }}
      >
        {children}
      </StyleSheetManager>
    )
  }

  return (
    <StyleSheetManager
      sheet={styledComponentsStyleSheet.instance}
      shouldForwardProp={(prop) => {
        // Filter out problematic props that shouldn't reach DOM
        if (prop === 'isActive' || prop === 'isactive' || prop === 'active') {
          return false
        }
        // Use emotion's isPropValid for standard validation
        return isPropValid(prop)
      }}
    >
      {children}
    </StyleSheetManager>
  )
}