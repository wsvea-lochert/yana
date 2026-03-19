import { useEffect } from 'react'

export function useIpcListener(
  subscribe: (callback: (...args: unknown[]) => void) => () => void,
  callback: (...args: unknown[]) => void
): void {
  useEffect(() => {
    const unsubscribe = subscribe(callback)
    return unsubscribe
  }, [subscribe, callback])
}
