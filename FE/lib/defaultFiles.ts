// src/lib/defaultFiles.ts

const defaultFiles: Record<string, string> = {
    "app/page.tsx": `export default function Home() {
    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h1 className="text-4xl font-bold">Welcome to Next.js</h1>
        <p>Edit app/page.tsx and save to see your changes!</p>
      </main>
    )
  }`,
    "app/layout.tsx": `export const metadata = {
    title: 'Next.js App',
    description: 'Created with Next.js',
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
  }`,
    "app/globals.css": `@tailwind base;
  @tailwind components;
  @tailwind utilities;
  
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background-color: #f0f0f0;
  }
  `,
  }
  
  export default defaultFiles
  