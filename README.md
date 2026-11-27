# celo-wallet-login

Sign in with a browser wallet on Celo through Sign-In with Ethereum ([EIP-4361](https://eips.ethereum.org/EIPS/eip-4361)) and [Supabase Auth](https://supabase.com/docs/guides/auth/auth-web3). The user signs a message, nothing goes on chain, no gas, no email or password. Supabase returns a normal session, and row level security only lets a user read their own notes after a sign-in on Celo mainnet (chain ID `42220`).

Live demo: https://siwe-demo.desafia.tech (use a desktop browser with MetaMask or another wallet extension).

## What it shows

- **Wallet picker** with [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963): one button per installed extension, instead of whichever one grabbed `window.ethereum`.
- **`signInWithWeb3` forced to Celo** with `options.signInWithEthereum.chainId: 42220`, so the message names Celo even when the wallet is on another network.
- **A Celo-only check** after sign-in, and the same rule enforced in the database.
- **Row level security that can't be spoofed.** The policy reads the chain from `auth.identities`, which only Supabase Auth writes, never from `user_metadata`, which users can rewrite with `updateUser()`.
- **MiniPay**: MiniPay doesn't support `personal_sign`, so the app shows a notice there instead of a sign-in that would never resolve.

## Run it

1. Create a Supabase project.
2. In **Auth providers**, enable **Web3 Wallet → Ethereum**.
3. In **URL Configuration → Redirect URLs**, add your URLs, for example `http://localhost:3000/**` and `https://your-app.vercel.app/**`. Supabase rejects messages signed for any other URL.
4. Run [`supabase/migrations/0001_notes.sql`](supabase/migrations/0001_notes.sql) in the SQL editor.
5. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key.
6. Start it:

```bash
npm install
npm run dev
```

Requires `@supabase/supabase-js` 2.58.0 or later, the first release with Ethereum support in `signInWithWeb3`.

## Files

| File | What it does |
|---|---|
| `app/page.tsx` | Wallet picker, `signInWithWeb3` on Celo, the Celo-only check |
| `app/account/page.tsx` | Session data and notes protected by row level security |
| `lib/wallets.ts` | EIP-6963 discovery, MiniPay detection, error messages |
| `supabase/migrations/0001_notes.sql` | `private.signed_in_on_celo()` and the notes policies |

## Errors you may see

| Error | Meaning |
|---|---|
| `@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid` | The wallet didn't share an address. Supabase shows this for a user rejection and for a request already pending in the wallet (MetaMask `-32002`), not only for unsupported wallets |
| `signature must be 65 bytes long, encoded as a 130 character-long hexadecimal string` | A smart contract wallet signed. Supabase Auth only accepts EOA signatures; verify with viem `verifySiweMessage` on your own server instead |
| `Signed Ethereum message is using URI which is not allowed on this server, message was signed for another app` | The page URL isn't in Redirect URLs |
| `Ethereum message was issued too long ago` | More than 10 minutes passed between building and sending the message |

## License

MIT
