# Sui Teaching Platform

> Learn. Compete. Earn on chain. A decentralized classroom where tuition is escrowed in a Move contract, students compete in a **synchronized on-chain exam**, and the top 20% automatically win back a share of the pool.

Built on [Sui](https://sui.io) testnet · Live contract `0x4ef2…cbc6`

---

## The idea

Online courses have **zero skin in the game** — you pay, you watch, nobody measures whether you learned anything. We fix that by putting the whole loop on chain:

1. A teacher creates a course with a tuition amount, min/max students, and a set of multiple-choice questions.
2. Students pay the tuition into an **on-chain escrow** (held by the `Course` object itself, not by any human).
3. Once `min_students` enroll, the teacher starts the exam. Every student gets the **same deadline**, enforced by Sui's `Clock` shared object.
4. The contract verifies the correct-answer key against a **keccak256 hash** committed before the exam started — teachers cannot change answers after seeing submissions.
5. The top 20 % (floor, min 1) split the pool: rank 1 gets 100 % of a tuition, rank 2 gets 50 %, rank 3 gets 25 %, and so on. Whatever isn't distributed goes to the teacher.

The full spec lives in [`FINAL_REQUIREMENTS.md`](./FINAL_REQUIREMENTS.md). The 10-minute pitch is in [`PRESENTATION.md`](./PRESENTATION.md).

---

## Why Sui

| Requirement | Why Sui fits |
|---|---|
| Cheap micro-tuition (0.01 – 0.05 SUI) | Sub-cent fees make small transfers practical |
| Course as a first-class object | `Course` is a shared object that literally **contains** the escrow `Balance<SUI>` — no separate vault contract needed |
| Millisecond-accurate deadlines | `sui::clock::Clock` at `0x6` is readable in any tx |
| Safe, typed escrow | Move's resource model prevents double-spending, copying, or leaking SUI |
| Fast finality (~400 ms) | Submit-answer button feels like a real exam click |
| Event system | 9 contract events drive the off-chain cache + WebSocket push |

---

## Architecture

```
┌───────────────┐  HTTP + WS  ┌────────────────┐  Move calls   ┌──────────────┐
│  React 19 UI  │────────────▶│ Node/Express   │──────────────▶│ Sui testnet  │
│  dapp-kit     │◀───events───│ Postgres cache │◀───events─────│ course.move  │
│  Tailwind v4  │             │ WebSocket bus  │               │              │
└───────────────┘             └────────────────┘               └──────────────┘
```

- **Chain = truth** for money, enrollment list, deadline, submissions, scoring, rewards.
- **Postgres = cache** for fast reads + question storage (only the keccak hash lives on chain).
- **WebSocket = nervous system** — every chain state change fires a push event (`STUDENT_ENROLLED`, `EXAM_STARTED`, `EXAM_SUBMITTED`, `EXAM_SCORED`, `REWARDS_DISTRIBUTED`) so both sides stay in sync in < 1 s.

---

## Features

### Shipped
- ✅ Move contract with 16 passing unit tests (`move-contract/teaching_platform/tests/`)
- ✅ Two-layer role enforcement: on-chain `vec_set` + backend middleware
- ✅ On-chain escrow, synchronized exam, ranked reward distribution
- ✅ Split score flow: `prepare → chain reveal_and_score → commit` — DB never drifts ahead of chain
- ✅ WebSocket event bus (fixes the pre-session case-sensitivity bug that silently dropped every broadcast)
- ✅ `keccak256` answer commitment so teachers can't change the key post-submission
- ✅ Sui `Clock` integration — deadline enforcement and tamper-proof `time_taken_ms` tie-breaker
- ✅ **AI question generation** — teacher types a topic, the backend asks an OpenAI-compatible LLM for 5 MCQs with validated JSON output
- ✅ Sui-branded React UI (deep navy + `#4DA2FF` accent, glassmorphism cards, Lucide icons)
- ✅ Tab-focus refetch + 30 s safety-net poll so single-browser multi-wallet testing feels instant

### Planned
- 🔜 NFT certificates for top-20% students (soulbound, resume-worthy credential)
- 🔜 Refund path if `min_students` never met
- 🔜 Multi-section courses with cumulative leaderboards
- 🔜 Walrus integration for dispute resolution (teacher uploads answer-key rationale)
- 🔜 zkLogin for Google/Apple sign-in (no wallet extension needed)
- 🔜 Mainnet launch

---

## Repo layout

```
hackathon_project/
├── move-contract/teaching_platform/   # Sui Move package
│   ├── sources/course.move            # ~550 lines, all the contract logic
│   └── tests/teaching_platform_tests.move
│
├── backend/                           # Express + Sequelize + WebSocket
│   ├── controllers/                   # HTTP handlers
│   ├── services/                      # DB + chain + business logic
│   ├── utils/websocket.js             # Push event bus
│   └── config/database.js
│
├── frontend/                          # React 19 + Vite 6 + Tailwind v4
│   ├── src/pages/{HomePage, TeacherPage, StudentPage}.jsx
│   ├── src/contexts/{Wallet, Role}Context.jsx
│   ├── src/services/{api, websocket}.js
│   └── src/components/
│
├── FINAL_REQUIREMENTS.md              # Full spec (rewards math, edge cases)
├── PRESENTATION.md                    # 10-minute pitch script
├── CLAUDE.md                          # Codebase guidance for AI agents
└── sequenceDiagram.md                 # End-to-end flow diagram
```

---

## Quick start

### Prerequisites
- **Node.js 20+**
- **Docker** (for local Postgres on port 5433)
- **Sui CLI** ([install guide](https://docs.sui.io/guides/developer/getting-started/sui-install))
- A Sui wallet extension ([Sui Wallet](https://suiwallet.com) or [Slush](https://slush.app)) connected to **testnet**, with some testnet SUI from the faucet

### 1. Clone and install

```bash
git clone https://github.com/GSYNDRA/hackathon_project.git
cd hackathon_project

# Backend deps
cd backend && npm install && cd ..

# Frontend deps
cd frontend && npm install && cd ..
```

### 2. Start Postgres + backend

```bash
cd backend
docker-compose up -d            # Postgres 15 on localhost:5433
cp .env.example .env            # then fill in the values below
npm run dev                     # nodemon on :3001 + WebSocket
```

`backend/.env` must contain:
```env
DB_HOST=localhost
DB_PORT=5433
DB_NAME=sui_teaching
DB_USER=postgres
DB_PASSWORD=password

PORT=3001
CORS_ORIGIN=http://localhost:5173

SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
SUI_PACKAGE_ID=0x4ef21011c96b1a5fa1b14b1a58fe9ccb58946c9b8710d2e7752ef4befd4acbc6
SUI_PLATFORM_OBJECT_ID=0x6d63fa22fd5b41c0c5943069af88b925ef2b557d996557fc9b70ec6984ddbedd

# AI question generator — any OpenAI-compatible provider
AI_BASE_URL=https://opencode.ai/zen/v1
AI_MODEL=kimi-k2.5
AI_API_KEY=<your-key>
```

### 3. Start the frontend

```bash
cd frontend
cp .env.example .env            # optional — defaults work for local dev
npm run dev                     # Vite on :5173
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
VITE_SUI_NETWORK=testnet
VITE_SUI_PACKAGE_ID=0x4ef21011c96b1a5fa1b14b1a58fe9ccb58946c9b8710d2e7752ef4befd4acbc6
VITE_SUI_PLATFORM_OBJECT_ID=0x6d63fa22fd5b41c0c5943069af88b925ef2b557d996557fc9b70ec6984ddbedd
```

### 4. Open http://localhost:5173

Connect your Sui Wallet. Pick **Teacher** or **Student** (the role is permanent per wallet on chain). You're in.

---

## Smart contract

### Test locally

```bash
cd move-contract/teaching_platform
sui move build
sui move test       # expects: 16 passed; 0 failed
```

### Redeploy

```bash
# From move-contract/teaching_platform
sui client publish --gas-budget 100000000

# Capture the new PackageID and UpgradeCap from the output.
# Then call create_platform to mint the shared Platform object:
sui client call --package <NEW_PACKAGE_ID> --module course --function create_platform

# Update all three files with the new IDs:
#   frontend/.env       → VITE_SUI_PACKAGE_ID, VITE_SUI_PLATFORM_OBJECT_ID
#   backend/.env        → SUI_PACKAGE_ID, SUI_PLATFORM_OBJECT_ID
#   move-contract/.../Published.toml (auto-updated)
```

If you redeploy, also wipe the DB (old `on_chain_id`s point at the retired package):
```bash
cd backend && npm run db:reset
```

---

## Contract reference

Deployed on **Sui testnet**:

| Object | ID |
|---|---|
| Package | `0x4ef21011c96b1a5fa1b14b1a58fe9ccb58946c9b8710d2e7752ef4befd4acbc6` |
| Platform (shared) | `0x6d63fa22fd5b41c0c5943069af88b925ef2b557d996557fc9b70ec6984ddbedd` |
| Clock (Sui) | `0x6` |

### Course lifecycle

```
0 ENROLLING  ─── min students enroll ───▶  1 READY_FOR_EXAM
                                                  │
                                    teacher calls create_exam
                                                  ▼
                                            2 EXAM_ACTIVE
                                                  │
                                    teacher calls reveal_and_score
                                                  ▼
                                              3 SCORED
                                                  │
                                    teacher calls distribute_rewards
                                                  ▼
                                        4 REWARDS_DISTRIBUTED
```

### Reward math

```
n = number of students who submitted on chain
winner_count = max(1, floor(n × 0.20))
rank_i_reward = tuition / 2^i        (floor, rank 1-indexed → i = rank - 1)
```

Teacher receives whatever escrow remains after winner payouts.

---

## Testing the full flow (single browser)

1. Connect wallet 1 in your browser, register as **Teacher**.
2. Create a course (2+ min students, 10–15 min exam duration for comfort).
3. Disconnect, connect wallet 2, register as **Student**, enroll.
4. Repeat with wallet 3 if you want more than one submitter.
5. Back to the teacher wallet → **Create Exam** (or let the AI generate questions) → **Create & Start**.
6. Switch to each student wallet → **Take Exam** → answer → **Submit**.
7. Back to teacher → the **Reveal & Score** button auto-unlocks when all students submit (or the timer expires).
8. **Distribute** — rank 1 student's wallet gets their reward on chain.

Protip: two browser profiles (Chrome → teacher, Firefox/Brave → student) avoids disconnect/reconnect cycles entirely.

---

## Useful commands

```bash
# Backend
cd backend
npm run dev            # nodemon + :3001
npm run db:reset       # drop + recreate all tables
npm run db:init        # create tables without dropping
npm run db:sync        # regenerate Sequelize models from live schema
docker-compose up -d   # start Postgres
docker-compose down    # stop Postgres

# Frontend
cd frontend
npm run dev            # Vite :5173
npm run build          # production build
npm run lint

# Contract
cd move-contract/teaching_platform
sui move build
sui move test
sui client publish --gas-budget 100000000
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Smart contract | Sui Move edition 2024, `sui::clock`, `sui::balance`, `sui::vec_set`, `sui::hash::keccak256`, `sui::table`, `sui::event` |
| Chain RPC | `@mysten/sui` 1.21 |
| Wallet UX | `@mysten/dapp-kit` 0.14 (`ConnectButton`, `useSignAndExecuteTransaction`, `SuiClientProvider`) |
| Backend | Node 20, Express 4, Sequelize 6, `ws` 8, Postgres 15 (via Docker) |
| Frontend | React 19, Vite 6, Tailwind v4, Lucide icons, `@tanstack/react-query`, `react-router-dom` v7, `js-sha3` |
| AI generator | Any OpenAI-compatible endpoint (tested with OpenCode Zen / Kimi K2.5, GLM, Groq Llama 3.3) |

---

## License

MIT. See [LICENSE](./LICENSE) (to be added).

## Acknowledgements

Built during a hackathon. Huge thanks to the Sui documentation, the `@mysten/dapp-kit` examples, and testnet faucet operators.
