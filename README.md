# 🌿 HerbChain
### Blockchain-Powered Traceability for Ayurvedic Herbs

> *"From root to remedy — every step, on-chain."*

HerbChain is a decentralized supply chain transparency platform for the Ayurvedic herb industry. Every herb batch — from farm harvest to final formulation — is recorded immutably on Ethereum. Consumers scan a QR code and instantly see the complete provenance: who grew it, how it was processed, whether it passed quality testing, and every hand it passed through.

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         React Frontend                               │
│        Vite · TypeScript · React Router · Zustand · TanStack Query  │
│                                                                      │
│   Farmer │ Lab │ Processor │ Manufacturer │ Admin │ Consumer (Public)│
└────────────────────────────┬─────────────────────────────────────────┘
                             │ ethers.js (writes)   │ Supabase SDK (reads)
             ┌───────────────▼──────────┐   ┌───────▼──────────────────┐
             │  Hardhat Local Node      │   │  Supabase (PostgreSQL)   │
             │  localhost:8545          │   │  6 tables · RLS policies │
             │                          │   └──────────────────────────┘
             │  Provenance.sol          │              ▲
             │  ├─ Formulation.sol      │              │ listens & writes
             │  ├─ SupplyChain.sol      │   ┌──────────┴───────────────┐
             │  ├─ QualityTest.sol      │   │  Node.js Indexer         │
             │  ├─ Processing.sol       │   │  Express · ethers.js     │
             │  ├─ HerbBatch.sol        │   │  localhost:3001          │
             │  └─ RoleManager.sol      │   └──────────────────────────┘
             │  (OpenZeppelin RBAC)     │
             └──────────────────────────┘
```

**How data flows:**
1. A role-holder (farmer, lab, etc.) submits a MetaMask transaction
2. The Provenance contract executes and emits a typed event
3. The backend indexer (`server.js`) catches the event and writes it to Supabase
4. The frontend reads fast from Supabase; the blockchain is the immutable source of truth
5. Consumers hit `/verify/:id` to see the full on-chain history — no login required

---

## 🗂️ Project Structure

```
herbchain/
│
├── contracts/                              # Solidity smart contracts
│   ├── Provenance.sol                      # ← Deploy only this one
│   ├── Formulation.sol                     # Manufacturer formulation records
│   ├── SupplyChain.sol                     # Ownership transfer tracking
│   ├── QualityTest.sol                     # Lab quality test records
│   ├── Processing.sol                      # Processing step records
│   ├── HerbBatch.sol                       # Herb batch creation & lifecycle
│   └── RoleManager.sol                     # OpenZeppelin RBAC role definitions
│
├── scripts/                                # Hardhat utility scripts
│   ├── deploy.cjs                          # Deploy Provenance contract
│   ├── seed-data.cjs                       # Seed roles + sample blockchain data
│   ├── grant-roles.cjs                     # Grant all roles to a specific wallet
│   └── fix-my-wallet.cjs                   # Emergency: fund wallet + grant roles
│
├── backend/
│   └── server.js                           # Blockchain event indexer → Supabase
│
├── supabase/
│   └── schema.sql                          # Full DB schema + RLS policies + indexes
│
├── src/
│   ├── lib/
│   │   ├── blockchain.ts                   # Full ABI + all ethers.js write helpers
│   │   ├── auth-store.ts                   # Zustand store: MetaMask auth + session
│   │   ├── supabase.ts                     # Supabase singleton client
│   │   └── demo-data.ts                    # Role labels, colors, demo user list
│   │
│   ├── components/
│   │   ├── AppLayout.tsx                   # Top nav, mobile menu, logout
│   │   ├── ProtectedRoute.tsx              # Auth + role guard for all routes
│   │   ├── BlockchainBadge.tsx             # Tx hash pill → Etherscan link
│   │   └── StatCard.tsx                    # Reusable stat tile for dashboards
│   │
│   └── pages/
│       ├── LoginPage.tsx                   # MetaMask wallet connect screen
│       ├── DashboardPage.tsx               # Role-dispatched dashboard (5 variants)
│       │
│       ├── FarmerCollectPage.tsx           # Record new herb harvest on-chain
│       ├── FarmerHistoryPage.tsx           # View own batch history from Supabase
│       │
│       ├── LabPendingPage.tsx              # Batches awaiting quality testing
│       ├── LabTestsPage.tsx                # Full quality test registry
│       │
│       ├── ProcessorBatchesPage.tsx        # Processor's processing step history
│       ├── ProcessorProcessPage.tsx        # Log a new processing step on-chain
│       │
│       ├── ManufacturerFormulatePage.tsx   # Register new formulation on-chain
│       ├── ManufacturerQRPage.tsx          # View formulations + generate QR codes
│       │
│       ├── ConsumerVerifyPage.tsx          # Public provenance page (QR scan target)
│       │
│       ├── AdminNetworkPage.tsx            # Blockchain node health dashboard
│       ├── AdminCompliancePage.tsx         # Compliance analytics & region charts
│       ├── AdminUsersPage.tsx              # User management panel
│       │
│       ├── App.tsx                         # Root router + global providers
│       └── NotFound.tsx                    # 404 fallback
│
├── hardhat.config.cjs                      # Hardhat compiler & network config
├── package.json
├── .env                                    # Environment variables (never commit!)
├── .env.example                            # Template for .env
└── README.md
```

---

## 🔗 Smart Contract Inheritance Chain

```
Provenance            ← deploy this
  └── Formulation
        └── SupplyChain
              └── QualityTest
                    └── Processing
                          └── HerbBatch
                                └── RoleManager
                                      └── OpenZeppelin AccessControl
```

Deploying `Provenance.sol` automatically includes all functionality from every contract in the chain.

---

## 👥 Roles & Permissions

| Role | On-Chain Constant | Capabilities |
|---|---|---|
| **Admin** | `DEFAULT_ADMIN_ROLE` | Grant & revoke all roles · Full admin dashboard |
| **Farmer** | `COLLECTOR_ROLE` | Create herb batches · Transfer batch ownership |
| **Processor** | `PROCESSOR_ROLE` | Add processing steps to batches they own |
| **Lab** | `LAB_ROLE` | Record quality test results (pass/fail) |
| **Manufacturer** | `MANUFACTURER_ROLE` | Register product formulations · Generate QR codes |
| **Distributor** | `DISTRIBUTOR_ROLE` | Receive batch ownership transfers |
| **Retailer** | `RETAILER_ROLE` | Receive batch ownership transfers |

> Roles are read directly from the blockchain at login. No passwords. No JWTs. No central authority.

---

## 📦 Full Dependency Reference

### Frontend Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18 | Core UI framework |
| `react-dom` | ^18 | DOM rendering |
| `react-router-dom` | ^6 | Client-side routing — `<Routes>`, `<Navigate>`, `useParams` |
| `@tanstack/react-query` | ^5 | Server-state management — `QueryClient`, `QueryClientProvider` |
| `zustand` | ^4 | Lightweight global auth state (`useAuthStore`) |
| `ethers` | ^6 | Ethereum wallet connection + smart contract calls via MetaMask |
| `@supabase/supabase-js` | ^2 | Supabase database client for all reads & user upserts |
| `qrcode.react` | ^3 | QR code SVG generation in `ManufacturerQRPage` |
| `lucide-react` | ^0.383 | Icon library used across all pages and components |
| `recharts` | ^2 | Bar & line charts in `AdminCompliancePage` |
| `sonner` | ^1 | Toast notifications — `toast.success()` / `toast.error()` |

### shadcn/ui Components

HerbChain uses [shadcn/ui](https://ui.shadcn.com/) for accessible, unstyled primitives styled with Tailwind.

| Component | Used In |
|---|---|
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | Every page |
| `Button` | Every page |
| `Input` | All form pages |
| `Label` | All form pages |
| `Badge` | Batch lists, test verdicts, network node status |
| `Progress` | `AdminCompliancePage`, `ConsumerVerifyPage` |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | `ProcessorProcessPage` |
| `Toaster` | `App.tsx` |
| `Sonner` | `App.tsx` |
| `TooltipProvider` | `App.tsx` |

> shadcn also pulls in `@radix-ui/*` primitives, `class-variance-authority`, `clsx`, and `tailwind-merge` automatically.

### Development Dependencies

| Package | Version | Purpose |
|---|---|---|
| `vite` | ^5 | Frontend build tool & hot-reload dev server |
| `typescript` | ^5 | Static type checking across the entire codebase |
| `@types/react` | ^18 | TypeScript types for React |
| `@types/react-dom` | ^18 | TypeScript types for React DOM |
| `@vitejs/plugin-react-swc` | ^3 | SWC-powered fast React compilation |
| `tailwindcss` | ^3 | Utility-first CSS — all styling |
| `postcss` | ^8 | CSS pipeline for Tailwind |
| `autoprefixer` | ^10 | Automatic vendor prefix injection |
| `hardhat` | ^2 | Ethereum development environment |
| `@nomicfoundation/hardhat-toolbox` | ^5 | Hardhat compile, test, deploy utilities |
| `@openzeppelin/contracts` | ^5 | `AccessControl.sol` used by `RoleManager.sol` |
| `dotenv` | ^16 | `.env` loading in Hardhat scripts |

### Backend Dependencies (`node backend/server.js`)

| Package | Purpose |
|---|---|
| `express` | Minimal HTTP server — health check endpoint at `/api/health` |
| `cors` | Cross-origin header support |
| `dotenv` | Loads `.env` for Supabase credentials |
| `ethers` | Connects to Hardhat node, subscribes to contract events |
| `@supabase/supabase-js` | Writes indexed events to the 6 Supabase tables |

---

## ⚡ Install Everything

```bash
# Core frontend + backend packages
npm install react react-dom react-router-dom \
  @tanstack/react-query zustand ethers \
  @supabase/supabase-js qrcode.react \
  lucide-react recharts sonner

# Dev / build toolchain
npm install -D vite typescript \
  @vitejs/plugin-react-swc \
  @types/react @types/react-dom \
  tailwindcss postcss autoprefixer \
  hardhat @nomicfoundation/hardhat-toolbox \
  @openzeppelin/contracts dotenv

# shadcn/ui — run from project root
npx shadcn@latest init
npx shadcn@latest add card button input label badge \
  progress select tooltip sonner toaster
```

---

## 🚀 Running HerbChain (Step by Step)

You need **4 terminals** running simultaneously once everything is set up.

### Prerequisites
- Node.js 18+
- MetaMask browser extension installed
- A free [Supabase](https://supabase.com) account

---

### Step 1 — Environment Variables

Create `.env` in the project root:

```env
# ── Supabase (get from: supabase.com → your project → Settings → API) ──
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# ── Blockchain ──
VITE_RPC_URL=http://127.0.0.1:8545
RPC_URL=http://127.0.0.1:8545
PORT=3001
```

---

### Step 2 — Supabase Database

1. Open [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste the entire contents of `supabase/schema.sql`
3. Click **Run**
4. Confirm 6 tables exist: `users` · `batches` · `processing_steps` · `quality_tests` · `transfers` · `formulations`

---

### Step 3 — Add Hardhat Network to MetaMask

MetaMask → Networks → **Add Network Manually**:

| Field | Value |
|---|---|
| Network Name | `HerbChain Localhost` |
| New RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

---

### Step 4 — Terminal 1: Start Hardhat Node

```bash
npx hardhat node
```

Keep this running the entire session. Copy the printed account addresses — you'll need them.

---

### Step 5 — Terminal 2: Deploy the Contract

```bash
npx hardhat run scripts/deploy.cjs --network localhost
```

Expected output:
```
Provenance Contract Deployed!
Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

> ⚠️ If the address differs from the above, update it in two places:
> - `src/lib/blockchain.ts` → `PROVENANCE_CONTRACT_ADDRESS`
> - `backend/server.js` → `CONTRACT_ADDRESS`

---

### Step 6 — Seed Roles + Sample Data

```bash
npx hardhat run scripts/seed-data.cjs --network localhost
```

This grants blockchain roles to Hardhat accounts #1–#3 and creates 2 demo herb batches.

---

### Step 7 — Import Hardhat Accounts into MetaMask

From the `npx hardhat node` output, copy a private key:
**MetaMask → Account icon → Import Account → Paste private key**

| Hardhat Account | Seeded Role |
|---|---|
| `#0` (deployer) | Admin |
| `#1` | Farmer (`COLLECTOR_ROLE`) |
| `#2` | Processor (`PROCESSOR_ROLE`) |
| `#3` | Lab (`LAB_ROLE`) |

> Use `scripts/grant-roles.cjs` to assign roles to any additional wallet address.

---

### Step 8 — Terminal 3: Start the Backend Indexer

```bash
node backend/server.js
```

Output: `📡 HerbChain Indexer running at http://localhost:3001`

> This must stay running whenever you submit transactions. It listens for contract events and writes them to Supabase so the frontend can query them quickly.

---

### Step 9 — Terminal 4: Start the Frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) → **Connect MetaMask** → done.

---

## 🔑 Authentication Flow

```
User clicks "Connect MetaMask"
            │
            ▼
  MetaMask popup → user approves
            │
            ▼
  wallet address returned (lowercase)
            │
            ▼
  blockchain.ts: hasRole() called for each
  role constant on the Provenance contract
            │
      ┌─────▼──────┐
      │ Role found │ ──► Supabase: SELECT * FROM users WHERE wallet_address = ?
      │            │         │
      │            │    Found ──► load name, org, role from DB
      │            │    Not found ──► INSERT new profile using on-chain role
      └────────────┘
            │
            ▼
  Zustand: { user, isAuthenticated: true }
  persisted to localStorage across refreshes
            │
            ▼
  AppLayout: role-specific nav rendered
  DashboardPage: role-specific view loaded
```

**Security properties:**
- Wallet address is the only identity — no passwords stored anywhere
- Role is verified on-chain at every login, not from the database
- MetaMask account switches are watched — changing accounts logs you out automatically
- Database profile is created on first login if the wallet has a valid on-chain role

---

## 🌐 Route Map

| Path | Access | Page |
|---|---|---|
| `/login` | Public | MetaMask connect screen |
| `/verify/:qrCode` | Public | Consumer product verification (QR scan) |
| `/dashboard` | All roles | Role-dispatched dashboard |
| `/farmer/collect` | Farmer only | Record new herb harvest |
| `/farmer/history` | Farmer only | Own batch history |
| `/lab/pending` | Lab only | Batches awaiting quality testing |
| `/lab/tests` | Lab only | Full quality test registry |
| `/processor/batches` | Processor only | Processing step history |
| `/processor/process` | Processor only | Log a new processing step |
| `/manufacturer/formulate` | Manufacturer only | Register new product formulation |
| `/manufacturer/qr-codes` | Manufacturer only | Formulation list + QR codes |
| `/admin/users` | Admin only | Registered user management |
| `/admin/network` | Admin only | Blockchain node health |
| `/admin/compliance` | Admin only | Regional compliance analytics |

---

## 🗄️ Supabase Tables

| Table | Indexed From | Description |
|---|---|---|
| `users` | Login flow (auto-create) | wallet_address → name, role, organization |
| `batches` | `BatchCreated` event | Core herb batch info + current owner |
| `processing_steps` | `ProcessingStepAdded` event | Each processing stage per batch |
| `quality_tests` | `QualityTestRecorded` event | Lab test results (moisture, pesticide, pass/fail) |
| `transfers` | `OwnershipTransferred` event | Complete chain of custody records |
| `formulations` | `FormulationCreated` event | Manufacturer product registry |

All tables have **Row Level Security** enabled. Public read is allowed on all tables. Inserts are open for the indexer and login auto-create flow.

---

## 📜 Smart Contract Function Reference

### `HerbBatch.sol`
| Function | Role | Description |
|---|---|---|
| `createBatch(herbName, lat, lon, harvestDate, isSustainable, species, qty, unit, weather, temp, quality, ipfsHash)` | `COLLECTOR_ROLE` | Create a new herb harvest batch on-chain |
| `getBatch(batchId)` | Anyone | Fetch complete batch struct |
| `getAllBatchIds()` | Anyone | List all batch IDs ever created |
| `getCurrentOwner(batchId)` | Anyone | Get current custodian address |

### `Processing.sol`
| Function | Role | Description |
|---|---|---|
| `addProcessingStep(batchId, processType, conditions, notes, temp, humidity, facilityId, ipfsHash)` | `PROCESSOR_ROLE` | Record a processing stage (Drying/Grinding/Storage/Extraction/Sorting/Packaging) |
| `getProcessingSteps(batchId)` | Anyone | Fetch all steps for a batch |

### `QualityTest.sol`
| Function | Role | Description |
|---|---|---|
| `recordQualityTest(batchId, moisture, pesticide, dnaAuth, passed, remarks, ipfsHash)` | `LAB_ROLE` | Submit a quality test result |
| `getQualityTests(batchId)` | Anyone | Fetch all tests for a batch |
| `isBatchApproved(batchId)` | Anyone | Quick pass/fail check on latest test |

### `SupplyChain.sol`
| Function | Role | Description |
|---|---|---|
| `transferOwnership(batchId, to, location, notes, ipfsHash)` | Current batch owner | Transfer custody to another role holder |
| `getTransferHistory(batchId)` | Anyone | Fetch full chain of custody |

### `Formulation.sol`
| Function | Role | Description |
|---|---|---|
| `recordFormulation(productName, dosage, herbNames[], percentages[], ipfsHash)` | `MANUFACTURER_ROLE` | Register a new Ayurvedic product formulation |
| `getFormulation(formulationId)` | Anyone | Fetch formulation details |
| `getFormulationComponents(formulationId)` | Anyone | Fetch herb composition breakdown |

### `Provenance.sol`
| Function | Role | Description |
|---|---|---|
| `viewBatchProvenance(batchId)` | Anyone | Full batch history — no gas (view) |
| `getBatchProvenance(batchId)` | Anyone | Full batch history — emits `ProvenanceQueried` event |
| `getBatchSummary(batchId)` | Anyone | Lightweight summary for QR scanning |
| `getAllBatchIds()` | Anyone | Enumerate all batches |
| `getAllFormulationIds()` | Anyone | Enumerate all formulations |

### `RoleManager.sol`
| Function | Role | Description |
|---|---|---|
| `grantSupplyChainRole(role, address)` | `ADMIN_ROLE` | Assign a role to a wallet |
| `revokeSupplyChainRole(role, address)` | `ADMIN_ROLE` | Remove a role from a wallet |
| `hasRole(role, address)` | Anyone | Check if a wallet holds a role |
| `hasSupplyChainRole(role, address)` | Anyone | Alias of `hasRole` |

---

## 🔄 End-to-End Supply Chain Walkthrough

```
[Farmer]         Creates batch → BatchCreated event
                      │
                      ▼
[Farmer]         Transfers to Processor → OwnershipTransferred event
                      │
                      ▼
[Processor]      Logs Drying step → ProcessingStepAdded event
[Processor]      Logs Grinding step → ProcessingStepAdded event
                      │
                      ▼
[Processor]      Transfers to Lab → OwnershipTransferred event
                      │
                      ▼
[Lab]            Records quality test (passed) → QualityTestRecorded event
                      │
                      ▼
[Lab]            Transfers to Manufacturer → OwnershipTransferred event
                      │
                      ▼
[Manufacturer]   Records formulation → FormulationCreated event
                 Generates QR code linking to /verify/<formulationId>
                      │
                      ▼
[Consumer]       Scans QR → /verify/<id> shows complete provenance
                 All data pulled from Supabase (indexed from chain)
```

Every arrow above is an **immutable on-chain transaction**. Nothing can be deleted or altered retroactively.

---

## 🐛 Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `"Your wallet has no supply chain role"` | MetaMask wallet not granted any role | Edit `TARGET_ADDRESS` in `grant-roles.cjs` → run it |
| `"caller is not a collector"` | Contract reverts — role missing | Same as above |
| Batches/steps don't appear after tx | Backend indexer not running | Run `node backend/server.js` in a terminal |
| `"Nonce too high"` in MetaMask | Hardhat node was restarted | MetaMask → Settings → Advanced → **Reset Account** |
| Wrong network / chain | MetaMask on wrong chain | Switch to `HerbChain Localhost` (Chain ID 31337) |
| `PGRST116` from Supabase | User row not found (first-ever login) | Normal — profile is auto-created on first login |
| `Missing VITE_SUPABASE_URL` error | `.env` not filled in | Create `.env` from `.env.example` and fill in values |
| Contract address mismatch | Re-deployed but forgot to update code | Update `PROVENANCE_CONTRACT_ADDRESS` in `blockchain.ts` and `CONTRACT_ADDRESS` in `server.js` |
| MetaMask shows old balance after restart | Hardhat restarted with fresh state | Reset MetaMask account (see Nonce fix above) |

---

## 📄 License

MIT — built for transparent, trustworthy Ayurvedic herb supply chains.

---

<div align="center">
  <strong>HerbChain</strong> — Because every herb has a story. Now it's on-chain.
</div>