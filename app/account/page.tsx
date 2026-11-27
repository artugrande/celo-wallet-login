"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { supabase, type CustomClaims } from "@/lib/supabase"

type Note = { id: number; body: string; created_at: string }

export default function Account() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState("")
  const [error, setError] = useState("")

  const loadNotes = useCallback(async () => {
    // Row level security returns only this user's notes, and only after a Celo sign-in.
    const { data, error } = await supabase.from("notes").select("id, body, created_at").order("created_at", { ascending: false })
    if (error) setError(error.message)
    else setNotes(data)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return router.replace("/")
      setUser(data.user)
      loadNotes()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/")
    })
    return () => sub.subscription.unsubscribe()
  }, [router, loadNotes])

  async function addNote(e: React.FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setError("")
    const { error } = await supabase.from("notes").insert({ body })
    if (error) return setError(error.message)
    setDraft("")
    loadNotes()
  }

  async function deleteNote(id: number) {
    const { error } = await supabase.from("notes").delete().eq("id", id)
    if (error) return setError(error.message)
    loadNotes()
  }

  if (!user) return <main className="card muted">Loading your session…</main>

  const claims = (user.user_metadata.custom_claims ?? {}) as CustomClaims
  const identity = user.identities?.find((i) => i.provider === "web3")

  return (
    <main className="card wide">
      <p className="eyebrow">
        <span className="ok">●</span> Signed in with Supabase Auth
      </p>
      <h1>You&apos;re in</h1>
      <p className="lead">This session came from a wallet signature on Celo. No email or password exists for this user.</p>

      <div className="grid">
        <div className="field full">
          <b>Wallet address</b>
          <a href={`https://celoscan.io/address/${claims.address}`} target="_blank" rel="noopener noreferrer">
            <code>{claims.address}</code>
          </a>
        </div>
        <div className="field">
          <b>Chain ID (network)</b>
          <code>{claims.network}</code>
        </div>
        <div className="field">
          <b>Provider</b>
          <code>{identity?.provider ?? user.app_metadata.provider}</code>
        </div>
        <div className="field full">
          <b>Supabase user ID</b>
          <code>{user.id}</code>
        </div>
      </div>

      <h2>Your notes, protected by row level security</h2>
      <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>
        Only you can read these, and only while your latest sign-in was on Celo. The policy reads the chain from{" "}
        <code>auth.identities</code>, which users can&apos;t edit.
      </p>
      <form className="row" style={{ marginTop: 14 }} onSubmit={addNote}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={280} placeholder="Write a note" aria-label="New note" />
        <button className="btn primary small" type="submit">
          Add
        </button>
      </form>
      <ul className="notes">
        {notes.map((n) => (
          <li key={n.id}>
            <span>{n.body}</span>
            <button onClick={() => deleteNote(n.id)}>Delete</button>
          </li>
        ))}
        {notes.length === 0 && <li className="muted">No notes yet.</li>}
      </ul>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <h2>What Supabase stored</h2>
      <pre>{JSON.stringify({ app_metadata: user.app_metadata, user_metadata: { custom_claims: claims } }, null, 2)}</pre>

      <div style={{ marginTop: 22 }}>
        <button className="btn small" onClick={() => supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    </main>
  )
}
