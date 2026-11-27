"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CELO_CHAIN_ID, supabase, type CustomClaims } from "@/lib/supabase"
import { explain, useWallets, type AnnouncedWallet } from "@/lib/wallets"

export default function SignIn() {
  const router = useRouter()
  const { wallets, checked, miniPay } = useWallets()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && router.replace("/account"))
  }, [router])

  async function signIn(wallet: AnnouncedWallet) {
    setError("")
    setBusy(wallet.info.rdns)
    try {
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: "ethereum", // Supabase's name for every EVM chain, Celo included
        statement: "Sign in to the Celo wallet login demo. This doesn't move any funds or cost gas.",
        wallet: wallet.provider,
        options: { signInWithEthereum: { chainId: CELO_CHAIN_ID } }, // the message names Celo even if the wallet is on another chain
      })
      if (error) throw error
      const claims = data.user.user_metadata.custom_claims as CustomClaims | undefined
      if (claims?.network !== String(CELO_CHAIN_ID)) {
        await supabase.auth.signOut()
        throw new Error("Sign in on Celo mainnet (chain ID 42220)")
      }
      router.replace("/account")
    } catch (e) {
      setError(explain((e as Error).message ?? String(e)))
      setBusy(null)
    }
  }

  return (
    <main className="card">
      <p className="eyebrow">Demo · Sign-In with Ethereum on Celo · Supabase Auth</p>
      <h1>Sign in with your Celo wallet</h1>
      <p className="lead">
        No email, no password. Your wallet signs a message, Supabase Auth checks it and gives you a session. Signing doesn&apos;t move
        any funds or cost gas.
      </p>

      {miniPay ? (
        <div className="notice">
          Message signing isn&apos;t available inside MiniPay, so this sign-in can&apos;t run here. Open this page in a desktop
          browser with a wallet extension such as MetaMask.
        </div>
      ) : !checked ? (
        <div className="muted">Looking for wallets…</div>
      ) : wallets.length === 0 ? (
        <div className="notice">
          No wallet found in this browser. Install{" "}
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
            MetaMask
          </a>{" "}
          or another wallet extension, then reload.
        </div>
      ) : (
        <div className="wallets">
          <p className="label">Choose your wallet</p>
          {wallets.map((w, i) => (
            <button key={w.info.uuid} className={i === 0 ? "btn primary" : "btn"} disabled={!!busy} onClick={() => signIn(w)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.info.icon} alt="" width={22} height={22} />
              {busy === w.info.rdns ? "Check your wallet…" : `Continue with ${w.info.name}`}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <ol className="steps">
        <li>Pick a wallet and share your address</li>
        <li>Sign the message for Celo mainnet (chain ID 42220)</li>
        <li>Supabase Auth verifies it and you get a session</li>
      </ol>
    </main>
  )
}
