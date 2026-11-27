import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Celo wallet login · Supabase Auth demo",
  description: "Sign in with a browser wallet on Celo through Sign-In with Ethereum and Supabase Auth, with row level security on Celo sign-ins.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="top">
            <span className="mark">celo-wallet-login</span>
            <span className="chain">Celo mainnet · 42220</span>
          </header>
          {children}
          <footer className="foot">
            Open source demo ·{" "}
            <a href="https://github.com/artugrande/celo-wallet-login" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>{" "}
            ·{" "}
            <a href="https://supabase.com/docs/guides/auth/auth-web3" target="_blank" rel="noopener noreferrer">
              Supabase Web3 auth
            </a>
          </footer>
        </div>
      </body>
    </html>
  )
}
