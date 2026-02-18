import { useState, useEffect, useRef, useCallback } from 'react'

export function useWindowResize() {
  const [state, setState] = useState({
    width: 0,
    height: 0,
  })

  const handler = useCallback(() => {
    const { innerWidth, innerHeight } = window

    // Check state for change, return same state if no change happened to prevent rerender
    setState((_state) => {
      return _state.width !== innerWidth || _state.height !== innerHeight
          ? {
            width: innerWidth,
            height: innerHeight,
          }
          : _state
    })
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      handler()
      window.addEventListener('resize', handler, {
        capture: false,
        passive: true,
      })
    }

    return () => {
      window.removeEventListener('resize', handler)
    }
  }, [handler])

  return state
}
