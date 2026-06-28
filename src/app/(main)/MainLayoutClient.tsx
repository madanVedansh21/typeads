'use client'

import { WordFeederProvider } from '@/contexts/WordFeederContext'
import { ReactNode } from 'react'

export default function MainLayoutClient({ children }: { children: ReactNode }) {
  return <WordFeederProvider>{children}</WordFeederProvider>
}
