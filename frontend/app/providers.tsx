'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

function TokenSyncer() {
  const { data: session } = useSession()
  
  useEffect(() => {
    if (session && (session as any).accessToken) {
      localStorage.setItem('levelup_token', (session as any).accessToken)
    } else {
      localStorage.removeItem('levelup_token')
    }
  }, [session])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TokenSyncer />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111118',
            color: '#F1F5F9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </SessionProvider>
  )
}
