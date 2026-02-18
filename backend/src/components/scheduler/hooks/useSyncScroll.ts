import { useEffect, useRef, useCallback } from 'react'

/**
 * The solution to make headers sticky with overflow
 */
const useSyncScroll = () => {
  const headersRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback((event: Event) => {
    const el = event.currentTarget as HTMLElement
    const body = bodyRef.current
    const header = headersRef.current

    if (body) {
      body.scroll({ left: el.scrollLeft })
    }
    if (header) {
      header.scroll({ left: el.scrollLeft })
    }
  }, [])

  useEffect(() => {
    const header = headersRef.current
    const body = bodyRef.current

    if (!header || !body) return

    header.addEventListener('scroll', handleScroll)
    body.addEventListener('scroll', handleScroll)

    return () => {
      header.removeEventListener('scroll', handleScroll)
      body.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  return { headersRef, bodyRef }
}

export default useSyncScroll
