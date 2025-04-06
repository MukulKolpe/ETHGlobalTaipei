# OctoIntents

## 🌉 Project Overview

This project introduces a trust-minimized cross-chain interoperability framework that unifies the Bitcoin and Ethereum ecosystems using:

- **Cross-chain intents (ERC-7683)**
- **Hyperlane interchain messaging**
- **Custom Dutch auction-based solver mechanism**

It enables seamless and efficient token bridging between heterogeneous testnets like **Ethereum Sepolia**, **Rootstock**, and **Citrea**, while optimizing for **capital efficiency**, **decentralization**, and **settlement speed**.

## Contract Addresses -

### Citrea Network

DutchAuction.sol - https://explorer.testnet.citrea.xyz/address/0x94AA7d7A4e249ca9A12A834CeC057e91F886B92a

Escrow.sol - https://explorer.testnet.citrea.xyz/address/0x26e091fc21e20572126406cc2dd9a5869de0bffe

### Roostock Network

DutchAuction.sol - https://rootstock-testnet.blockscout.com/address/0xB6FD5839De303e991013C9EC011109db8AD3321D

Escrow.sol - https://rootstock-testnet.blockscout.com/address/0xee6cdc460274ed05cddf00cd3a5e810c3936cdfa

### Sepolia Network

Escrow.sol - https://sepolia.etherscan.io/address/0x52f2a27dadb3b6be0b7ff8729e28a9a73442cf8f

DutchAuction.sol - https://sepolia.etherscan.io/address/0x51396848b156a4575f5d096973a99e0eb89ab045

---

## 🔁 How It Works – End-to-End Flow

1. **User Opens Intent (Deposits Tokens to Escrow on Chain C1)**  
   A user deposits tokens to an ERC-7683-compliant escrow on Chain C1 (e.g., Sepolia). This creates a formal intent describing the desired action.

2. **Intent Message Dispatched via Hyperlane**  
   Intent metadata is securely dispatched from C1 to C2 using **Hyperlane Mailbox**, ensuring trustless cross-chain communication.

3. **Dutch Auction Starts on Chain C2**  
   Upon receipt, a **Dutch auction** is initiated on Chain C2. The price starts high and linearly decreases until accepted.

4. **Solver Selection via Dutch Auction**  
   The first solver to accept the current price wins the auction and locks in the right to fulfill the intent.

5. **Solver Executes and Fulfills Intent**  
   The winning solver delivers the requested tokens to the user on Chain C2.

6. **Escrow Settlement on Chain C1**  
   The solver provides proof of fulfillment. Once verified, the escrow on Chain C1 releases funds to the solver.

---

## 🧠 Why This Matters

### ❌ Traditional Bridging Issues

- Hours of wait time post-settlement
- Limited solver participation
- High trust assumptions and opaque systems

### ✅ Our Solution

- Trustless, escrow-enforced fulfillment
- Decentralized solver market via open auctions
- Near-instant post-verification settlements

### 📊 Capital Efficiency with Dutch Auctions

- Traditional bridges lock large liquidity for hours
- Our approach enables solver settlement every **minute**, reducing required liquidity by **60x**
  - From ~$800K → ~$13.5K for the same transaction throughput

---

## 🧱 Architecture Breakdown

### 1. Intent Creation & Escrow (Chain C1)

- User deposits into an ERC-7683 escrow contract
- Escrow holds funds while awaiting cross-chain fulfillment

### 2. Cross-Chain Intent Dispatch (Hyperlane)

- Intent dispatched using Hyperlane Mailbox + Messenger
- Enables programmable, secure intent routing across chains

### 3. Dutch Auction-Based Solver Selection (Chain C2)

- Auctions start high, decay linearly
- First solver to accept the price wins
- Fair, decentralized, and dynamic pricing

### 4. Solver Fulfillment & Final Settlement

- Solver sends tokens to user on Chain C2
- Provides fulfillment proof to Chain C1
- Escrow verifies and pays solver

---

## ⚙️ Tech Stack

| Tech/Tool     | Purpose                                          |
| ------------- | ------------------------------------------------ |
| **Solidity**  | Smart contracts for intents, escrow, auctions    |
| **ERC-7683**  | Intent encoding and settlement interface         |
| **Hyperlane** | Cross-chain messaging via Mailbox and Messenger  |
| **OIF**       | Open Intents Framework (intent modeling/routing) |
| **Rootstock** | Bitcoin-side smart contract support              |
| **Citrea**    | ZK rollup for Bitcoin, EVM compatible            |
| **Foundry**   | Smart contract development/testing framework     |
| **Ethers.js** | JS SDK for smart contract/frontend interactions  |

---

## 🤝 Partner Integrations

- **Hyperlane** – Manual deployment on Rootstock for messaging
- **Citrea** – ZK-rollup testbed for native BTC-EVM bridging
- **Rootstock** – Bitcoin-backed EVM chain supporting native escrow

---

## ⚙️ Notable Engineering Wins

- **Dutch Auction Solver System**  
  Per-intent auction contracts with price decay to encourage real-time solver competition.

- **Manual Hyperlane Deployment**  
  Full Hyperlane deployment on Rootstock Testnet to enable messaging in low-infra testnets.

- **Manual Message Relay**  
  Used CLI to manually relay intent messages across chains, proving robust E2E flow.

---

## 📈 Capital Efficiency Advantage

- With minute-level settlement, solvers only need ~$13.5K inventory vs ~$800K (if paid hourly)
- This enables 60x better capital utilization

---

## 🧩 Solving the Status Quo

| Problem             | Our Solution                               |
| ------------------- | ------------------------------------------ |
| Slow Settlements    | Real-time Dutch auction settlement         |
| Centralized Solvers | Open, decentralized solver market          |
| Capital Intensive   | High-frequency settlement, low inventory   |
| Opaque Systems      | Fully on-chain lifecycle and pricing logic |

---

## 🚀 Summary

A unified cross-chain settlement framework that leverages:

- **ERC-7683 Intents**
- **Dutch Auction Solver Selection**
- **Hyperlane Cross-Chain Messaging**

Built for efficient, transparent, and decentralized bridging between Ethereum, Rootstock, Citrea, and eventually Bitcoin.

---

## 🌐 Deployed Testnets

- Ethereum Sepolia
- Rootstock Testnet
- Citrea Testnet
