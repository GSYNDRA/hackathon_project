# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sui Teaching Platform — a hackathon MVP where teachers create courses, students pay tuition to enroll, all students take a synchronized on-chain-timed exam, and the top 20% (floor, minimum 1) win a share of the escrowed tuition pool. The repo has three pieces that must stay aligned: a Move smart contract (source of truth for money + timing), a Node/Express + Postgres backend (cache + question storage + WebSocket push), and a React/Vite frontend that talks to both.

`FINAL_REQUIREMENTS.md` is the authoritative spec for lifecycle, rewards math, and anti-cheat rules. Read it before changing flows. Note: the spec describes 6 statuses (0–5) with a separate `EXAM_READY` state, but the deployed contract collapses to 5 statuses (0=ENROLLING, 1=READY_FOR_EXAM, 2=EXAM_ACTIVE, 3=SCORED, 4=REWARDS_DISTRIBUTED) — see `move-contract/teaching_platform/sources/course.move` and `frontend/src/config/constants.js`. The contract is the ground truth when they disagree.

## Repo Layout

- `backend/` — Express + Sequelize + PostgreSQL + `ws` WebSocket server. Entry: `server.js`. HTTP on `:3001`, WS on same port.
- `frontend/` — React 19 + Vite 8 + `@mysten/dapp-kit` for wallet, `@tanstack/react-query` for data, `react-router-dom` v7.
- `move-contract/teaching_platform/` — Sui Move package. Main module: `sources/course.move`. Already published to testnet (see `Published.toml`).

## Common Commands

### Backend (from `backend/`)
```bash
docker-compose up -d          # PostgreSQL on host :5433 (NOT 5432 — port conflict)
npm install
npm run dev                   # nodemon + auto-reload on :3001
npm start                     # production
npm run db:init               # create tables
npm run db:reset              # drop + recreate (use when Sequelize sync fails)
npm run db:sync               # regenerate models from live DB schema
```

On dev start, `server.js` runs `sequelize.sync({ alter: true })` — this mutates the schema to match models. If you change a model, a restart migrates the DB automatically; for destructive changes use `db:reset`.

### Frontend (from `frontend/`)
```bash
npm install
npm run dev                   # Vite dev server (default :5173)
npm run build
npm run lint                  # eslint
npm run preview
```

### Move contract (from `move-contract/teaching_platform/`)
```bash
sui move build
sui move test                 # runs tests/teaching_platform_tests.move
sui client publish --gas-budget 100000000     # redeploy (updates Published.toml)
```
After republishing, update `VITE_SUI_PACKAGE_ID` and `VITE_SUI_PLATFORM_OBJECT_ID` in `frontend/.env` and `SUI_PACKAGE_ID` in `backend/.env`.

## Architecture

### On-chain vs off-chain split
- **On-chain (source of truth):** SUI escrow, enrollment list, exam deadline timestamp, answer hash, submissions, scoring, reward distribution. Lives in the single `Course` shared object plus a global `Platform` shared object that tracks `teachers` / `students` vec_sets (strict one-role-per-wallet).
- **Off-chain (Postgres cache):** user profile metadata, course metadata (name/description), full exam question text + options, mirrored enrollments/submissions/results for fast reads. Hydrated by reading chain events — the contract emits `PlatformCreated`, `TeacherRegistered`, `StudentRegistered`, `CourseCreated`, `StudentEnrolled`, `ExamCreated`, `AnswersSubmitted`, `ExamScored`, `RewardsDistributed`.

Questions are NEVER on-chain — only `keccak256(correct_answers)` is committed when the exam is created, so the teacher can't change answers after seeing submissions (`reveal_and_score` verifies the hash).

### Role enforcement — two layers
1. **Contract (`course.move`):** `register_as_teacher` / `register_as_student` insert into a `vec_set` and assert the sender isn't already in the other set. Role-gated entrypoints (e.g. `create_course`, `enroll_and_pay`) call `is_teacher` / `is_student` and abort with `EWrongRoleTeacher` / `EWrongRoleStudent`.
2. **Backend middleware (`backend/middleware/roleGuard.js`):** reads `x-wallet-address` header, looks up `user_profiles.role`, and gates routes via `requireTeacher` / `requireStudent` (see `backend/routes/index.js`). Frontend sets this header in `src/services/api.js` via an axios interceptor that pulls `wallet_address` from `localStorage`.

Both layers must agree — a wallet registered on-chain must also call `POST /api/users/register` so the backend DB knows its role, otherwise API calls will 403.

### Synchronized exam flow
This is the single trickiest flow. `Course.exam_deadline` is set when the teacher calls `start_exam` on-chain (status → `EXAM_ACTIVE`), and ALL students use that same deadline for their countdown. The backend WebSocket (`backend/utils/websocket.js`) pushes an `EXAM_STARTED` event so students don't have to poll. The frontend `services/websocket.js` subscribes per course. When the deadline passes, unsubmitted students get auto-submitted (their answers vector includes `null`/sentinel entries = 0 points per question).

### Reward math (FLOOR, not CEIL)
`rewarded_count = floor(total_students * 0.20)`, minimum 1 if anyone enrolled. Rank 1 gets 100% of one tuition, rank 2 gets 50%, rank 3 gets 25% (each rank halves the previous). Teacher receives everything not distributed. Tie-breaking: higher score wins, then faster `time_taken_ms`. See §5 of `FINAL_REQUIREMENTS.md` for worked examples and `course.move` for the on-chain implementation.

## Environment Setup Notes

- Postgres runs on host port **5433** (docker-compose maps `5433:5432`). `.env` `DB_PORT` must match.
- Frontend expects `VITE_API_URL` (default `http://localhost:3001/api`), `VITE_SUI_PACKAGE_ID`, `VITE_SUI_PLATFORM_OBJECT_ID`.
- Backend expects DB_* vars plus `SUI_RPC_URL` and `SUI_PACKAGE_ID` for chain interactions via `@mysten/sui`.
- CORS origin defaults to `http://localhost:5173` (Vite default).

## Files to Look at First

- `FINAL_REQUIREMENTS.md` — spec, rewards math, edge cases, demo scenarios.
- `sequenceDiagram.md` — end-to-end flow diagram.
- `move-contract/teaching_platform/sources/course.move` — all contract logic in one file.
- `backend/routes/index.js` — full API surface at a glance.
- `frontend/src/App.jsx` + `contexts/RoleContext.jsx` — routing and wallet/role state.
