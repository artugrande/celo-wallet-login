"use client"

import { useEffect, useState } from "react"
import type { EthereumWallet } from "@supabase/supabase-js"

// EIP-6963: every installed wallet extension announces itself, so the user can pick one
// instead of whichever extension grabbed window.ethereum first.
export type AnnouncedWallet = {
  info: { uuid: string; name: string; icon: string; rdns: string }
  provider: EthereumWallet // an EIP-1193 provider, passed straight to signInWithWeb3
}

export function useWallets() {
  const [wallets, setWallets] = useState<AnnouncedWallet[]>([])
  const [checked, setChecked] = useState(false)
  const [miniPay, setMiniPay] = useState(false)

  useEffect(() => {
    const seen = new Map<string, AnnouncedWallet>()
    const onAnnounce = (event: Event) => {
      const detail = (event as CustomEvent<AnnouncedWallet>).detail
      if (!detail?.info?.rdns || seen.has(detail.info.rdns)) return
      seen.set(detail.info.rdns, detail)
      setWallets([...seen.values()])
    }
    window.addEventListener("eip6963:announceProvider", onAnnounce)
    window.dispatchEvent(new Event("eip6963:requestProvider"))
    setMiniPay(Boolean((window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum?.isMiniPay))
    const t = setTimeout(() => setChecked(true), 400)
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce)
      clearTimeout(t)
    }
  }, [])

  return { wallets, checked, miniPay }
}

// Map Supabase Auth and wallet errors to something a user can act on.
// Strings verified against Supabase Auth; see the Troubleshooting table in the Celo docs guide.
export function explain(message: string) {
  if (message.includes("eth_requestAccounts is missing or invalid"))
    return "Your wallet didn't share an address. If you rejected the request, try again. If nothing popped up, open the wallet extension: it may have a pending request from this site."
  if (message.includes("signature must be 65 bytes"))
    return "This looks like a smart contract wallet. Supabase Auth only accepts regular wallet (EOA) signatures."
  if (message.includes("not allowed on this server"))
    return "This page's URL isn't in the Supabase project's Redirect URLs."
  if (message.includes("issued too long ago")) return "The signature expired. Please sign again."
  if (message.includes("provider is disabled")) return "Web3 sign-in is turned off in this Supabase project."
  if (/user rejected|denied/i.test(message)) return "You cancelled the signature."
  return message
}
