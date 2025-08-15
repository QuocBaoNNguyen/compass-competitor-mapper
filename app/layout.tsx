import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ProductLens – Competitive Analysis Mapper',
  description: 'Map competitors, compare features, and find differentiation opportunities.',
   icons: {
    icon: '/favicon-32x32.png', 
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="max-w-6xl mx-auto p-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">🔍 ProductLens</h1>
            <nav className="text-sm text-slate-600">Competitive Analysis Mapper</nav>
          </header>
          {children}
          <footer className="mt-12 text-xs text-slate-500">
            Built by Tony Nguyen · This open-source tool demonstrates PM craft (research, prioritization, analytics).
          </footer>
        </div>
      </body>
    </html>
  )
}
