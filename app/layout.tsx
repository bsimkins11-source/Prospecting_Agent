import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transparent Partners Prospecting Agent',
  description: 'AI-powered B2B prospect intelligence with Apollo.io and OpenAI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
