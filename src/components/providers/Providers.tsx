'use client'

import { ReactNode, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './ThemeProvider'
import { ReduxProvider } from './ReduxProvider'
import { LazyWeb3Provider } from './LazyWeb3Provider'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('4')) {
          return false
        }
        return failureCount < 3
      },
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

function WalletConnectInitializer() {
  useEffect(() => {
    // Lazy initialize WalletConnect only when needed
    if (typeof window !== 'undefined') {
      // Use requestIdleCallback for better performance
      const initializeWhenIdle = () => {
        import('@/lib/web3/appkit').then(({ initializeWalletConnect }) => {
          initializeWalletConnect().then(provider => {
            if (process.env.NODE_ENV === 'development') {
              if (provider) {
                console.log('✅ WalletConnect initialized successfully')
              } else {
                console.warn('⚠️ WalletConnect initialization skipped')
              }
            }
          })
        }).catch(error => {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ WalletConnect initialization failed:', error)
          }
        })
      }

      if ('requestIdleCallback' in window) {
        requestIdleCallback(initializeWhenIdle, { timeout: 5000 })
      } else {
        setTimeout(initializeWhenIdle, 1000)
      }
    }
  }, [])

  return null
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ReduxProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LazyWeb3Provider>
            <WalletConnectInitializer />
            {children}
          </LazyWeb3Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  )
}
