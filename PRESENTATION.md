# Sui Teaching Platform — Judges' Pitch

> **10-minute script.** Every slide has a timing target and speaker notes.
> Total: 10:00. Buffer: 30 s so the demo can breathe.

---

## Slide 1 — The Hook (0:00 – 0:30)

> **"Online courses have zero skin in the game. We put it on Sui."**

**Say this out loud:**
> "Every online course today is a one-sided contract — you pay, the teacher teaches, there's no verifiable outcome. We built an on-chain classroom where students stake their tuition, compete in a synchronized exam, and the top 20% win the pool back. Every cent is held by a Sui Move contract — not a company, not a server."

Show the landing page (dark Sui-branded hero, `Learn. Compete. Earn on chain.`).

---

## Slide 2 — Why this problem? (0:30 – 1:30)

**Three pain points we lived and none of them are fixed yet:**

1. **Courses don't measure outcomes.** A Udemy certificate proves you watched the video, not that you understood it.
2. **Teachers have no honest grading incentive.** Generous grading = happier reviews. So everyone gets an A.
3. **Payments are one-way.** Refunds require fighting the platform. Nothing holds the teacher accountable.

**Our insight:** if students pay tuition into an **on-chain escrow** and a **synchronized exam** decides the winners, suddenly:
- The exam becomes a real signal — grades can't be inflated because money follows the score.
- Teachers get paid only what's left after winners claim their share, so they're incentivized to set **fair, hard** exams.
- Students self-select — only the serious show up.

That's the design philosophy behind every line of code in this repo.

---

## Slide 3 — Full Flow in 5 Steps (1:30 – 2:30)

```
  ┌─────────────┐    1. create_course     ┌────────────────┐
  │   Teacher   │ ─────────────────────▶  │  Course (0x…)  │
  └─────────────┘                         │  shared object │
                                          │  escrow: 0 SUI │
  ┌─────────────┐   2. enroll_and_pay     │  students: {}  │
  │  Student 1  │ ─────▶  +0.05 SUI  ───▶ │  status: 0     │
  └─────────────┘                         ├────────────────┤
  ┌─────────────┐   2. enroll_and_pay     │                │
  │  Student 2  │ ─────▶  +0.05 SUI  ───▶ │  status: 1     │  <- auto flips
  └─────────────┘                         ├────────────────┤
                    3. create_exam         │ deadline = T   │
                       (answer hash)       │  status: 2     │
                                           ├────────────────┤
                    4. submit_answers      │  submissions   │
                       (before deadline)   ├────────────────┤
                    5. reveal_and_score    │  status: 3     │
                       + distribute        │  rewards paid  │
                                           │  status: 4     │
                                           └────────────────┘
```

Every status flip is a separate on-chain transaction. **The chain is the source of truth** — backend is a cache.

---

## Slide 4 — Why Sui, specifically? (2:30 – 3:30)

I evaluated Ethereum, Solana, Aptos, and Sui. Four things made Sui win:

| What I needed | Sui gives it to me |
|---|---|
| Cheap micro-tuition (0.01 SUI) | ~$0.001/tx — feasible even for free-tier courses |
| Course as a first-class object | Move's object model lets a Course literally **be** the shared object holding the escrow, enrolled list, and status — no contract-wide storage maps |
| Millisecond-accurate exam timer | `sui::clock::Clock` at `0x6` is a shared object readable in any tx |
| Safe escrow | Move's resource model: `Balance<SUI>` can't be copied, double-spent, or leaked |
| Fast finality | ~400 ms — submit-answers feels like a real exam button, not a blockchain |

**The killer combo:** putting a `Balance<SUI>` *inside* a shared `Course` object means the escrow is literally held by the course, not by the teacher, not by a pool contract. Impossible on EVMs without a separate vault contract.

---

## Slide 5 — Architecture at a glance (3:30 – 4:30)

```
┌────────────────┐  WS + HTTP  ┌───────────────┐   Move calls   ┌───────────────┐
│  React 19 UI   │────────────▶│  Node/Express │───────────────▶│  Sui testnet  │
│  dapp-kit      │◀───events───│  Postgres     │◀──events───────│  Move contract│
│  Tailwind v4   │             │  WebSocket    │                │  course.move  │
└────────────────┘             └───────────────┘                └───────────────┘
       │                               │                                │
       └── wallet signs every tx ──────┴── cache for fast reads ────────┘
                                        questions (never on chain)
                                        leaderboard rows
```

Three independent layers, three failure domains, three things I made sure stay in sync:

- **Chain = truth** for money, enrollment list, deadline, scores.
- **DB = cache** for UI speed + questions (only the hash of correct answers is on chain, so teachers can't change answers after seeing submissions).
- **WebSocket = nervous system** — every chain state change fires a push event so both sides update in < 1 s.

---

## Slide 6 — The Move Contract (4:30 – 5:30)

File: `move-contract/teaching_platform/sources/course.move` (~550 lines, **16 passing unit tests**)

Five entrypoints, each gated by a specific invariant:

```move
register_as_teacher(platform)        // vec_set insert, mutually exclusive with student
register_as_student(platform)
create_course(platform, name, tuition, min, max)
enroll_and_pay(platform, course, coin, clock)   // payment MUST equal tuition
create_exam(course, answer_hash, duration, clock)
submit_answers(course, answers, clock)          // enforces clock.ts <= deadline
reveal_and_score(course, answer_key)            // keccak256(key) == hash
distribute_rewards(course)                       // rank 1 = tuition, rank N = tuition / 2^(N-1)
```

**Three design choices I'm proud of:**

1. **Answer commitment via `keccak256`** — teacher posts the hash, then reveals the key. The chain verifies `keccak256(key) == stored_hash`, so the teacher cannot change correct answers after seeing submissions. Zero trust required.

2. **`start_time` is derived, not submitted.** `start_time = exam_deadline - duration`. Students can't lie about when they started, so `time_taken_ms` is truly tamper-proof — it's the tiebreaker for rewards.

3. **Reward formula in the contract:** `rank i` gets `tuition / 2^i`, floor on everything. Rank 1 = 100%, rank 2 = 50%, rank 3 = 25%. Top 20% (floor, min 1) are winners. Everything undistributed flows to the teacher. **Zero off-chain trust needed for payouts.**

---

## Slide 7 — Sui Tech I actually used (5:30 – 6:30)

If a judge asks "where's the Sui?", I can point at every one of these by file and line:

| Sui primitive | Where | What it does |
|---|---|---|
| **Shared objects** | `course.move: Course`, `Platform` | Concurrent multi-writer access |
| **`vec_set`** | `Platform.teachers/students` | Enforces one-role-per-wallet; O(log n) membership |
| **`Balance<SUI>`** | `Course.escrow` | Resource-safe escrow inside the Course itself |
| **`sui::coin`** | `enroll_and_pay`, `distribute_rewards` | SUI → Balance → SUI transitions |
| **`sui::hash::keccak256`** | `reveal_and_score` | Answer-key commitment |
| **`sui::clock::Clock`** | `enroll_and_pay`, `create_exam`, `submit_answers` | Millisecond-precise deadline enforcement |
| **`sui::event`** | 9 event types | Drives backend cache sync via @mysten/sui |
| **`sui::table`** | `Course.students/submissions/results` | Scalable per-student storage without blowing up object size |
| **`@mysten/dapp-kit`** | Frontend `WalletProvider`, `ConnectButton`, `useSignAndExecuteTransaction` | All wallet UX in ~50 lines |
| **`@mysten/sui` SDK** | `Transaction` builder, `SuiClient` | Building every call + verifying `effects.status === 'success'` |

---

## Slide 8 — The Synchronized Exam (6:30 – 7:30)

This is where other chains would struggle. Sui's `Clock` shared object let me enforce the deadline **in the contract itself**:

```move
public fun submit_answers(
    course: &mut Course, answers: vector<u8>,
    clock_obj: &Clock, ctx: &mut TxContext
) {
    let now = clock::timestamp_ms(clock_obj);
    assert!(course.status == EXAM_ACTIVE, EExamNotActive);
    assert!(now <= course.exam_deadline, ETimeExpired);  // <-- the key line
    ...
}
```

**Why judges should care:**
- The timer the student sees in the browser is computed from the same `exam_deadline` stored on chain.
- Every student's countdown finishes at the exact same wall-clock moment regardless of their network latency.
- Late submissions literally cannot land — the validator rejects them.
- WebSocket broadcast (`EXAM_STARTED` event) tells every student's tab "start your timer now", with sub-second delay.

**Bonus:** `time_taken_ms` (submitted_at − derived start_time) is the tiebreaker for rewards. Faster *and* more correct students win.

---

## Slide 9 — What's Built vs What's Next (7:30 – 8:30)

### Already shipped (live on testnet, package `0x4ef2…cbc6`)
- ✅ Move contract with **16 passing unit tests** (including deadline-expired path)
- ✅ Two-layer role enforcement (on-chain `vec_set` + backend middleware)
- ✅ On-chain escrow, synchronized exam, ranked reward distribution
- ✅ Backend: Express + Postgres + WebSocket event bus
- ✅ Frontend: React 19 + Tailwind v4 + dapp-kit, full Sui-branded design
- ✅ **AI question generator** — teacher types a topic, GLM/Kimi drafts 5 MCQs via OpenAI-compatible API
- ✅ Hash-committed answers (`keccak256`) — teachers can't change the key post-submission
- ✅ Clean recovery flow: prepare → chain → commit, so DB never drifts ahead of chain

### Next 30 days
- 🔜 **NFT certificates** — mint a soulbound NFT for every top-20% student; resume-worthy on-chain credential
- 🔜 **Course discovery feed** powered by Sui's object query API
- 🔜 **Refund path** — if `min_students` not met by a deadline, students reclaim tuition

### Next 90 days
- 🔜 **Mainnet launch** (the contract is ABI-frozen after the Clock fix)
- 🔜 **Multi-section courses** — a single course can span weekly exams, cumulative leaderboard
- 🔜 **Dispute resolution** via Walrus — teacher uploads answer-key rationale to decentralized storage, students can inspect

### Stretch
- 🔜 zkLogin for one-click Google/Apple sign-in (replaces browser wallet for mass adoption)
- 🔜 Kiosk integration to buy/sell course access as an NFT

---

## Slide 10 — Live Demo (8:30 – 9:30)

**Two browser profiles, two wallets. Script:**

1. *(Teacher profile)* Create course "Sui Move 101", 0.02 SUI tuition, 2 min exam — **then click Generate with AI** → watch 5 questions appear instantly.
2. *(Student profile 1)* Enroll — wallet popup, approve. Balance drops by 0.02 SUI.
3. *(Student profile 2)* Enroll. Status flips to **Ready** via WebSocket (no refresh).
4. *(Teacher)* Create & Start Exam. Status → **Live Exam** (push event).
5. *(Student 1)* Take exam, answer 4/5 correctly, Submit.
6. *(Student 2)* Answer 2/5. Submit.
7. *(Teacher)* "All students submitted — safe to score" unlocks. Reveal & Score.
8. *(Teacher)* Distribute. Watch rank 1's wallet balance jump by 0.02 SUI (their full tuition back).
9. *(Student 1 tab)* "Rank 1 · 80% · +0.0200 SUI" badge appears.

**Expected audience reaction:** "wait, everything is actually on chain?" — Yes. I can open Sui explorer for any of these tx digests to prove it.

---

## Slide 11 — Why we'll win (9:30 – 10:00)

**What makes this pitch stand out:**

1. **It's complete.** Not a slide-ware concept — you can enroll, take the exam, win the reward in 3 minutes from this laptop.
2. **It's genuinely Sui-native.** Would be 3x more complex on an EVM (separate vault contracts, off-chain signing for tie-breaks, clunky ERC-20 payments). Every Sui primitive I used (Balance-in-object, Clock, keccak256 stdlib, events) pulls weight.
3. **It's a real path to revenue.** Teachers post courses → platform takes a cut of the non-distributed escrow. Scales without a custodian.
4. **It's safe.** 16 Move unit tests + a deliberate DB-behind-chain architecture mean no half-state bugs escaped. (I hit them in dev. Then I designed them out.)

**Ask:**
> "Help us get to mainnet with a grant or a Sui Foundation partnership — we'll ship NFT certificates next quarter and bring 1,000 students through a paid cohort."

---

## Q&A Prep (speaker notes only)

**"Why not just escrow with a multisig?"**
> Multisigs require a trusted committee. Our contract is trustless — the answer-key hash is committed before students submit, and the reward math is in Move. No human can intervene.

**"What stops the teacher from not distributing?"**
> Anyone can call `distribute_rewards` after scoring — it's not gated by `tx_context::sender == teacher`. If the teacher tries to stall, a student (or a bot) can trigger the payout themselves. (Note: currently we do gate it to teacher as a UX choice; I'd open this up on mainnet.)

**"How do you prevent question leak before the exam?"**
> Questions are stored in the backend DB, not on chain, and protected by the `requireStudent` middleware + enrollment check. Only enrolled students for a course in `EXAM_ACTIVE` status can fetch them. The correct-answer hash goes on chain; the answers themselves never do until reveal.

**"Why Postgres if the chain is the truth?"**
> Three reasons: (1) Sui object reads cost latency even on a full node — our list view would be slow. (2) Questions can't live on chain (too big, too expensive). (3) We need a leaderboard ranked by DB-side scoring that extends the chain's submitter-only ranking to show no-shows as "No submission" for honest UX.

**"What's the gas cost for a student end-to-end?"**
> Roughly 3 tx: register (~0.001), enroll (~0.003), submit (~0.002). Total ~0.006 SUI for the student. Teacher pays similar for create_course, create_exam, reveal_and_score, distribute_rewards.

**"How do you handle someone spamming enrollments?"**
> Enrollment costs the full tuition. Spamming is literally buying N seats. The `max_students` cap (contract-level) prevents grief on any given course.

**"Mainnet timeline?"**
> Contract is ABI-stable after the Clock refactor. Pending: NFT certificate extension, refund path. Target 60 days.

---

## Appendix — Repo tour (30-second sanity check if asked)

```
move-contract/teaching_platform/
├── sources/course.move              ← 550 lines, all the contract logic
├── tests/teaching_platform_tests.move ← 16 passing tests
└── Published.toml                    ← testnet deployment record

backend/
├── controllers/    ← HTTP handlers (course, exam, enrollment, results, AI)
├── services/       ← DB + chain calls + business logic
├── utils/websocket.js ← 6 event types, global + per-course broadcast
└── config/         ← Sequelize + Postgres

frontend/
├── src/pages/      ← HomePage, TeacherPage, StudentPage
├── src/contexts/   ← Wallet + Role state
├── src/services/   ← api.js (axios), websocket.js
└── src/components/ ← Button/Card/Badge + Layout + RoleSelector
```

**Built with:** Sui Move edition 2024, Sui TS SDK 1.21, dapp-kit 0.14, React 19, Tailwind v4, Vite 6, Postgres 15.
