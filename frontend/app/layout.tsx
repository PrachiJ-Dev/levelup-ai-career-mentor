import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'LevelUp — AI Career Mentor',
  description: 'AI-powered resume analysis, skill gap detection, mock interviews, and career path prediction. Level up your career with deep learning.',
  keywords: 'AI career mentor, resume analysis, skill gap, mock interview, career prediction',
  openGraph: {
    title: 'LevelUp — AI Career Mentor',
    description: 'Level up your career with AI-powered mentoring.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="noise antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
