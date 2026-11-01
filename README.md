# Stellar API Playground

A responsive React + TypeScript playground for making live, read-only requests to the **Stellar Horizon Testnet**.

## Features
- Live Horizon requests for network health, ledgers, fee stats, assets, payments, transactions, operations, and accounts.
- Editable endpoint paths and readable JSON responses with status and latency.
- Copy response JSON and inspect request metadata.
- Optional Friendbot funding helper for a public testnet account address.
- Responsive dark interface built with React, TypeScript, Vite, and Lucide icons.

## Run locally
```bash
npm install
npm run dev
```

Build production files with `npm run build`.

## Deploy with GitHub Pages
1. In the repository, open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main`; the workflow builds and publishes the app.

Expected URL: https://kennyedyoletu.github.io/Stellar-API-Playground/

## Network and safety
All Horizon requests target `https://horizon-testnet.stellar.org`. The Friendbot helper calls `https://friendbot.stellar.org` to fund testnet accounts. Never enter a secret key or seed phrase. The app does not generate, collect, or sign with secret keys and does not submit transactions. Testnet assets and XLM have no real-world value.

## References
- [Stellar Horizon API documentation](https://developers.stellar.org/docs/data/horizon)
- [Stellar Laboratory](https://laboratory.stellar.org/)
