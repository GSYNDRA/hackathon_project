# Sui Teaching Platform — Bản Thuyết Trình (Tiếng Việt)

> **Script 10 phút.** Mỗi slide có mốc thời gian và speaker notes.
> Tổng: 10:00. Buffer: 30 giây dành cho demo thở.

> **Lưu ý khi đọc tài liệu này:** Phần *in đậm* là những gì bạn nói ra miệng. Phần **Giải thích chi tiết** là để bạn HIỂU — không đọc ra khi pitch, nhưng khi judge hỏi sâu thì móc từ đó ra.

---

## Slide 1 — The Hook (0:00 – 0:30)

> **"Khóa học online hiện nay không có 'skin in the game'. Chúng tôi đưa nó lên Sui."**

**Câu nói ra miệng:**
> "Mọi khóa học online hôm nay đều là một hợp đồng một chiều — bạn trả tiền, giáo viên giảng, và không có cách nào kiểm chứng được kết quả. Chúng tôi đã xây một lớp học on-chain, nơi học sinh stake học phí của mình, cùng làm một bài thi đồng bộ, và **top 20%** thắng cả pool. Mọi đồng xu đều do Sui Move contract giữ — không phải công ty, không phải server."

Show landing page (hero tối màu Sui, dòng `Learn. Compete. Earn on chain.`).

### Giải thích chi tiết cho bạn

- **"Skin in the game"** là thuật ngữ của Nassim Taleb: khi bạn có lợi ích/rủi ro thực sự trong một kết quả, bạn sẽ hành xử khác. Khóa học Udemy không có điều đó — bạn mua xong dù không học cũng chẳng mất thêm gì ngoài tiền đã trả.
- **Tại sao mở đầu bằng câu này?** Judges đã nghe hàng chục pitch về "blockchain + education". Câu hook của bạn phải nói được **cái họ CHƯA nghe**: "tiền chạy theo điểm thi", không phải "certificate NFT".
- **30 giây là rất ngắn** — bạn chỉ kịp 2 câu. Câu 1 nêu vấn đề. Câu 2 nêu giải pháp bằng cơ chế cụ thể ("stake tuition", "synchronized exam", "top 20% win").

---

## Slide 2 — Tại sao vấn đề này đáng giải? (0:30 – 1:30)

**Ba pain point chúng tôi đã sống qua và chưa ai fix:**

1. **Khóa học không đo lường kết quả.** Certificate Udemy chỉ chứng minh bạn đã *xem* video, không chứng minh bạn *hiểu*.
2. **Giáo viên không có động lực chấm nghiêm.** Chấm dễ → review 5 sao → tất cả đều được A.
3. **Thanh toán một chiều.** Muốn refund phải đi đấu với nền tảng. Không có gì ràng buộc trách nhiệm giáo viên.

**Insight của chúng tôi:** nếu học sinh trả học phí vào **on-chain escrow** và một **bài thi đồng bộ** quyết định người thắng, thì đột nhiên:
- Bài thi trở thành tín hiệu thật — điểm không thể bơm vì tiền đi theo điểm.
- Giáo viên chỉ nhận phần còn lại sau khi người thắng rút → họ có động cơ ra đề **công bằng và khó**.
- Học sinh tự lọc — chỉ người nghiêm túc mới đăng ký.

Đó là triết lý thiết kế đằng sau từng dòng code trong repo này.

### Giải thích chi tiết cho bạn

- **Pain point #1 sâu ở đâu?** Các nghiên cứu về MOOC cho thấy chỉ ~5-10% học sinh hoàn thành khóa họ đăng ký. Certificate hiện tại không phân biệt người hoàn thành xuất sắc với người tick đủ video.
- **Pain point #2 (quan trọng nhất khi pitch):** Đây là mâu thuẫn lợi ích cổ điển của platform Web2. Giáo viên được thưởng vì review tốt, không vì học sinh giỏi. Kinh tế học gọi là **moral hazard**.
- **Pain point #3:** Chỉ ra rằng Web2 platform luôn đứng về phía "bên có tiền" (giáo viên/platform), không phải người học.
- **Cách flip logic khi pitch:** Đừng nói "blockchain tốt hơn". Hãy nói "cơ chế kinh tế cũ bị broken, và blockchain là công cụ duy nhất cho phép chúng tôi viết lại cơ chế đó mà không cần một bên trung gian tin cậy".
- **"Tiền đi theo điểm" là câu chốt** — nếu judges chỉ nhớ 1 cụm từ của bạn, hãy để đó là cụm này.

---

## Slide 3 — Toàn bộ Flow trong 5 bước (1:30 – 2:30)

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

Mỗi lần status đổi là một transaction riêng on-chain. **Chain là sự thật duy nhất** — backend chỉ là cache.

### Giải thích chi tiết cho bạn

- **5 bước tương ứng với 5 status** trong `course.move` (lines 16-20):
  - `0 = ENROLLING` — đang nhận học sinh
  - `1 = READY_FOR_EXAM` — đã đủ min_students, sẵn sàng thi
  - `2 = EXAM_ACTIVE` — bài thi đang diễn ra
  - `3 = SCORED` — đã chấm
  - `4 = REWARDS_DISTRIBUTED` — đã phát thưởng
- **Tại sao "auto flips" khi đủ min_students là quan trọng?** Đây là **business logic on-chain**, không phải off-chain cron job. Không ai cần "bấm nút" để course chuyển sang READY — contract tự làm khi `enrolled_count >= min_students` (xem `course.move:285-287`).
- **Câu "Chain is source of truth, backend is cache" sẽ được hỏi lại ở Q&A** — chuẩn bị sẵn lý do tại sao cần cả hai (xem Slide 5).
- **Khi trình bày:** chỉ tay vào từng mũi tên, đừng đọc hết chữ trên sơ đồ. Nói: "5 bước, 5 transaction, 5 lần chain state thay đổi."

---

## Slide 4 — Tại sao chọn Sui, cụ thể? (2:30 – 3:30)

Tôi đã đánh giá Ethereum, Solana, Aptos, và Sui. Bốn lý do khiến Sui thắng:

| Yêu cầu | Sui đáp ứng |
|---|---|
| Học phí micro rẻ (0.01 SUI) | ~$0.001/tx — khả thi kể cả cho khóa miễn phí |
| Course là object hạng nhất | Move object model cho phép Course **chính là** shared object giữ escrow, enrolled list, status — không cần map toàn contract |
| Timer exam chính xác đến mili-giây | `sui::clock::Clock` ở `0x6` là shared object đọc được trong mọi tx |
| Escrow an toàn | Resource model của Move: `Balance<SUI>` không thể copy, double-spend, hay leak |
| Finality nhanh | ~400 ms — nút submit-answers cảm giác như nút thi thật, không phải blockchain |

**Combo killer:** đặt `Balance<SUI>` **bên trong** shared Course object có nghĩa là escrow do chính course giữ, không phải giáo viên, không phải pool contract. **Bất khả thi trên EVM** nếu không có vault contract riêng.

### Giải thích chi tiết cho bạn

- **Tại sao không phải Ethereum?** Gas fee. Transaction 0.01 SUI trên Ethereum mainnet có thể tốn $5-20 gas — tức gas cao hơn học phí 500 lần. Không kinh tế.
- **Tại sao không phải Solana?** Solana không có object model. Bạn phải dùng program-derived addresses (PDA) + accounts. Dễ bug, khó reason về ownership.
- **Tại sao không phải Aptos?** Aptos cũng dùng Move và có ưu điểm tương đương, nhưng ecosystem (wallet, SDK, dev tooling) của Sui ở testnet đã tốt hơn, và Clock primitive của Sui mạnh hơn.
- **Điểm "killer combo" cần emphasize:** trên EVM, nếu muốn tiền "thuộc về" một course, bạn phải có:
  1. Một contract Factory tạo course
  2. Một contract Vault riêng giữ tiền
  3. Một mapping `courseId → vaultAddress`
  4. Mỗi lần đụng vào escrow phải call cross-contract
  Trên Sui: `escrow: Balance<SUI>` là **một field** trong struct Course. Giải quyết xong.
- **Khi judges hỏi "bạn có so sánh thực sự không":** chỉ vào bảng, nói từng dòng tương ứng với feature nào trong code.

---

## Slide 5 — Kiến trúc tổng thể (3:30 – 4:30)

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

Ba layer độc lập, ba failure domain, ba thứ tôi đã chắc chắn giữ đồng bộ:

- **Chain = truth** cho tiền, enrollment list, deadline, điểm số.
- **DB = cache** cho UI nhanh + câu hỏi (chỉ hash của đáp án đúng lên chain → giáo viên không thể sửa đáp án sau khi thấy bài làm).
- **WebSocket = hệ thần kinh** — mọi thay đổi state trên chain bắn event → cả hai bên update trong < 1s.

### Giải thích chi tiết cho bạn

- **Tại sao cần DB ngoài chain?** Ba lý do để trả lời khi judges hỏi:
  1. Reading object từ Sui RPC mất latency (~100-300ms) — list course cần hàng chục read → UI sẽ chậm.
  2. **Câu hỏi thi không thể lưu trên chain.** Mỗi câu có đề + 4 lựa chọn → hàng KB. Lưu on-chain tốn gas khủng + lộ đáp án (chain public).
  3. Leaderboard cần hiển thị cả học sinh không nộp bài ("No submission") — contract chỉ lưu người đã nộp, nên DB extend thêm view.
- **Tại sao WebSocket chứ không phải polling?** Polling RPC → tốn tiền RPC + delay 2-5s. WebSocket event-driven → < 1s và gần như miễn phí.
- **Vấn đề drift giữa chain và DB:** Đây là cái khó nhất. Giải quyết bằng flow "prepare → chain → commit" (xem Slide 9): DB chỉ ghi nhận sau khi chain confirm. Không bao giờ DB đi trước chain.
- **Câu trúc "3 failure domains":** nếu chain chết, frontend không thể submit tx nhưng read vẫn work. Nếu backend chết, user không thể load danh sách câu hỏi nhưng chain state vẫn còn. Nếu frontend chết, user mở wallet app trực tiếp vẫn đọc được course object. → Resilient architecture.

---

## Slide 6 — Move Contract (4:30 – 5:30)

File: `move-contract/teaching_platform/sources/course.move` (~550 dòng, **16 unit test pass**)

Năm entrypoint, mỗi cái được gated bởi một invariant cụ thể:

```move
register_as_teacher(platform)        // vec_set insert, loại trừ student
register_as_student(platform)
create_course(platform, name, tuition, min, max)
enroll_and_pay(platform, course, coin, clock)   // payment PHẢI bằng tuition
create_exam(course, answer_hash, duration, clock)
submit_answers(course, answers, clock)          // enforce clock.ts <= deadline
reveal_and_score(course, answer_key)            // keccak256(key) == hash
distribute_rewards(course)                       // rank 1 = tuition, rank N = tuition / 2^(N-1)
```

**Ba design choice tôi tự hào:**

1. **Answer commitment qua `keccak256`** — giáo viên post hash, sau đó reveal key. Chain verify `keccak256(key) == stored_hash`, nên giáo viên **không thể** đổi đáp án sau khi thấy bài làm. Zero trust cần thiết.

2. **`start_time` được derive, không submit.** `start_time = exam_deadline - duration`. Học sinh không thể nói dối về lúc bắt đầu → `time_taken_ms` thật sự tamper-proof — nó là tiebreaker cho reward.

3. **Công thức thưởng nằm trong contract:** `rank i` nhận `tuition / 2^i`, floor tất cả. Rank 1 = 100%, rank 2 = 50%, rank 3 = 25%. Top 20% (floor, tối thiểu 1) là winners. Phần không phân phát chảy về giáo viên. **Zero off-chain trust cho payout.**

### Giải thích chi tiết cho bạn

- **"16 unit tests pass" là điểm bạn PHẢI emphasize** — nhiều hackathon pitch nói "on-chain" nhưng không có test. Mở `sui move test` trên máy nếu judges nghi ngờ.
- **Design choice #1 (keccak256) đáng nói kỹ:**
  - Bước 1: teacher gen ra đáp án `[2, 1, 3, 0, 2]`, tính hash 32-byte, gửi lên chain (`create_exam`).
  - Bước 2: học sinh nộp bài. Chain chưa biết đáp án.
  - Bước 3: teacher gửi plaintext `[2, 1, 3, 0, 2]` lên chain (`reveal_and_score`). Contract tính lại hash, so với hash cũ. Nếu khớp → OK. Nếu không → abort.
  - **Tại sao teacher không thể gian lận?** Nếu đổi đáp án, hash mới sẽ khác → contract reject. Nếu giữ đáp án cũ nhưng đã lộ với 1 học sinh nào đó → học sinh khác cũng đã commit rồi, không đổi được.
- **Design choice #2 (derive start_time) là tinh tế:**
  - Ý tưởng ngây thơ: "student gửi lên start_time" → student nói dối dễ dàng.
  - Giải pháp: `start_time = exam_deadline - exam_duration_ms`. Cả hai đều là giá trị on-chain. Không ai có thể fake.
  - Code line: `course.move:392` — `let start_time = course.exam_deadline - course.exam_duration_ms;`
- **Design choice #3 (công thức thưởng):**
  - Tại sao lũy thừa 2? Vì tổng của `1/2^0 + 1/2^1 + 1/2^2 + ... = 2` converge, nên tối đa rank 1 có thể nhận là 2x tuition của mình — fair, không lạm phát.
  - Tại sao floor? Tránh rounding errors dẫn đến mất balance lẻ → pool không thể drain về 0.
  - Tại sao top 20%? Tỉ lệ này được chọn vì tạo ra áp lực **vừa đủ** để học sinh nghiêm túc, không quá khắt khe làm nản lòng.

---

## Slide 7 — Sui Tech tôi thực sự đã dùng (5:30 – 6:30)

Nếu judge hỏi "Sui nằm ở đâu?", tôi có thể chỉ vào từng cái bằng file và line:

| Sui primitive | Ở đâu | Làm gì |
|---|---|---|
| **Shared objects** | `course.move: Course`, `Platform` | Concurrent multi-writer access |
| **`vec_set`** | `Platform.teachers/students` | Enforce one-role-per-wallet; O(log n) membership |
| **`Balance<SUI>`** | `Course.escrow` | Escrow resource-safe ngay trong Course |
| **`sui::coin`** | `enroll_and_pay`, `distribute_rewards` | SUI → Balance → SUI transitions |
| **`sui::hash::keccak256`** | `reveal_and_score` | Answer-key commitment |
| **`sui::clock::Clock`** | `enroll_and_pay`, `create_exam`, `submit_answers` | Enforce deadline chính xác đến ms |
| **`sui::event`** | 9 event types | Drive backend cache sync qua @mysten/sui |
| **`sui::table`** | `Course.students/submissions/results` | Scalable per-student storage |
| **`@mysten/dapp-kit`** | Frontend `WalletProvider`, `ConnectButton`, `useSignAndExecuteTransaction` | Toàn bộ wallet UX trong ~50 dòng |
| **`@mysten/sui` SDK** | `Transaction` builder, `SuiClient` | Build mọi call + verify `effects.status === 'success'` |

### Giải thích chi tiết cho bạn

- **Đây là slide bạn dùng để "hạ gục" phản bác kỹ thuật.** Judge nào cũng có thể nghi ngờ "nó có thật sự là Sui-native không, hay chỉ là Ethereum re-paint?". Bảng này trả lời.
- **Shared objects** là feature unique của Sui vs. các chain khác. Object có thể là owned (1 người sở hữu) hoặc shared (ai cũng đụng được). Course phải shared vì nhiều người ghi vào.
- **`vec_set` vs `table`:** cả hai đều là collection, khác biệt là:
  - `vec_set`: size nhỏ, membership check nhanh, lưu inline trong object. Dùng cho danh sách teacher/student của platform (hàng trăm wallet).
  - `table`: size lớn, mỗi entry là dynamic field riêng, object size không tăng. Dùng cho submissions/results của course (có thể scale).
- **`sui::event`** drive toàn bộ backend sync. Bạn có thể show code backend subscribe event để chứng minh.
- **Khi trình bày:** đừng đọc hết bảng. Chọn 3 cái ấn tượng nhất (Balance-in-object, Clock, keccak256) và nói kỹ. Còn lại để bảng tự nói.

---

## Slide 8 — Bài thi đồng bộ (6:30 – 7:30)

Đây là chỗ các chain khác sẽ vật lộn. Shared object `Clock` của Sui cho phép tôi enforce deadline **ngay trong contract**:

```move
public fun submit_answers(
    course: &mut Course, answers: vector<u8>,
    clock_obj: &Clock, ctx: &mut TxContext
) {
    let now = clock::timestamp_ms(clock_obj);
    assert!(course.status == EXAM_ACTIVE, EExamNotActive);
    assert!(now <= course.exam_deadline, ETimeExpired);  // <-- dòng quan trọng
    ...
}
```

**Tại sao judges cần quan tâm:**
- Timer học sinh thấy trên browser được tính từ cùng `exam_deadline` lưu on-chain.
- Countdown của mọi học sinh kết thúc chính xác cùng wall-clock moment bất kể độ trễ mạng.
- Submissions muộn **literally không thể land** — validator reject.
- Broadcast WebSocket (`EXAM_STARTED` event) báo mọi tab học sinh "start timer now", delay < 1 giây.

**Bonus:** `time_taken_ms` (submitted_at − derived start_time) là tiebreaker cho reward. Học sinh nhanh hơn *và* đúng hơn sẽ thắng.

### Giải thích chi tiết cho bạn

- **Đây là slide "wow" của bạn.** Synchronized exam là feature rất khó làm đúng ở Web2 (latency, clock skew giữa các client), và gần như không thể ở các blockchain khác (block time lớn).
- **Câu chuyện latency có thể kể khi pitch:**
  - Web2: "server A nhận bài lúc 9:00:00.100, server B nhận lúc 9:00:00.500 do routing khác nhau. Ai muộn hơn?"
  - Blockchain Ethereum: "block ~12s → bạn có thể submit lúc 9:00:11 và vẫn được validate vì nằm trong block cuối trước deadline."
  - Sui: "tx được finalize trong ~400ms. Clock tick mỗi checkpoint. Deadline enforcement là deterministic."
- **`time_taken_ms` tie-breaker** là chi tiết quan trọng: 2 học sinh cùng điểm, ai nhanh hơn thắng. Điều này **không thể fake** vì cả `submitted_at` và `start_time` đều do chain tính.
- **Chiến thuật demo:** Khi làm demo Slide 10, cố tình mở 2 tab đồng hồ xuất phát → cho judges thấy countdown đồng bộ đến ms.

---

## Slide 9 — Đã xong vs Sắp làm (7:30 – 8:30)

### Đã ship (live trên testnet, package `0x4ef2…cbc6`)
- ✅ Move contract với **16 unit test pass** (gồm path deadline-expired)
- ✅ Two-layer role enforcement (on-chain `vec_set` + backend middleware)
- ✅ On-chain escrow, synchronized exam, ranked reward distribution
- ✅ Backend: Express + Postgres + WebSocket event bus
- ✅ Frontend: React 19 + Tailwind v4 + dapp-kit, full Sui-branded design
- ✅ **AI question generator** — teacher gõ topic, GLM/Kimi draft 5 câu MCQ qua OpenAI-compatible API
- ✅ Hash-committed answers (`keccak256`) — teacher không thể đổi key sau khi thấy submission
- ✅ Recovery flow sạch: prepare → chain → commit, DB không bao giờ đi trước chain

### 30 ngày tới
- 🔜 **NFT certificate** — mint soulbound NFT cho mọi học sinh top-20%; credential on-chain dùng cho resume
- 🔜 **Course discovery feed** dùng Sui object query API
- 🔜 **Refund path** — nếu `min_students` không đạt trước deadline, học sinh rút tuition

### 90 ngày tới
- 🔜 **Mainnet launch** (contract đã ABI-frozen sau Clock fix)
- 🔜 **Multi-section courses** — 1 course chạy nhiều kỳ thi hàng tuần, leaderboard tích lũy
- 🔜 **Dispute resolution** qua Walrus — teacher upload giải thích đáp án lên storage phi tập trung, học sinh có thể inspect

### Stretch
- 🔜 zkLogin cho one-click Google/Apple sign-in (thay wallet cho mass adoption)
- 🔜 Kiosk integration để mua/bán quyền access course dưới dạng NFT

### Giải thích chi tiết cho bạn

- **Tại sao slide này quan trọng:** Judges cần thấy bạn có **vision** xa hơn hackathon. Nhưng họ cũng không muốn nghe "10 thứ sắp làm nhưng chưa có gì xong".
- **Cấu trúc 3 tầng thời gian** (đã xong / 30 ngày / 90 ngày / stretch) truyền tải:
  - "Chúng tôi đã execute"
  - "Chúng tôi biết bước tiếp theo"
  - "Chúng tôi có tham vọng lớn hơn"
- **Items đã xong phải được nói CHẮC:** mỗi cái có thể demo được ngay tại chỗ. Nếu không demo được → đừng liệt kê.
- **"ABI-frozen" nghĩa là gì?** Interface của contract không đổi nữa. Quan trọng vì nếu thay đổi thì mọi frontend integration phải update. Cho judges biết bạn nghiêm túc về mainnet.
- **NFT certificate là stretch goal cực kỳ bán được** — vì nó tạo ra composability với các app khác (job platform, university, v.v.)
- **zkLogin** là feature signature của Sui — nhắc tới cho thấy bạn đã research ecosystem.

---

## Slide 10 — Live Demo (8:30 – 9:30)

**Hai profile browser, hai wallet. Script:**

1. *(Profile giáo viên)* Tạo course "Sui Move 101", học phí 0.02 SUI, thi 2 phút — **sau đó click Generate with AI** → xem 5 câu hỏi xuất hiện ngay.
2. *(Profile học sinh 1)* Enroll — wallet popup, approve. Balance giảm 0.02 SUI.
3. *(Profile học sinh 2)* Enroll. Status flip sang **Ready** qua WebSocket (không refresh).
4. *(Giáo viên)* Create & Start Exam. Status → **Live Exam** (push event).
5. *(Học sinh 1)* Làm thi, đúng 4/5, Submit.
6. *(Học sinh 2)* Đúng 2/5. Submit.
7. *(Giáo viên)* "All students submitted — safe to score" unlock. Reveal & Score.
8. *(Giáo viên)* Distribute. Xem ví rank 1 tăng 0.02 SUI (full tuition).
9. *(Tab học sinh 1)* Badge "Rank 1 · 80% · +0.0200 SUI" hiện ra.

**Phản ứng mong đợi của khán giả:** "khoan, mọi thứ thật sự on-chain?" — Đúng vậy. Tôi có thể mở Sui explorer cho bất kỳ tx digest nào để chứng minh.

### Giải thích chi tiết cho bạn

- **Demo 1 phút là KILL OR DIE.** Nếu wallet treo, WiFi chậm, hay UI bug → pitch tụt mood luôn.
- **Chuẩn bị trước:**
  - Ví testnet đã có sẵn SUI cho cả 2 profile (nạp từ faucet hôm trước).
  - Course name gõ sẵn trong notepad, copy-paste để tránh typo.
  - Mở sẵn Sui explorer ở tab thứ 3 để chứng minh nếu được hỏi.
  - **Plan B:** nếu testnet bị RPC lag, có video 30s quay trước sẵn.
- **Nhấn mạnh 3 khoảnh khắc:**
  1. Khi status flip tự động (không refresh) → "chain event → websocket → UI".
  2. Khi timer của 2 tab đồng bộ → "Clock primitive".
  3. Khi balance rank 1 nhảy → "tiền thật, không demo tiền giả".
- **Script chạy tay thay vì ghi âm:** nếu có sự cố, bạn vẫn ad-lib được. Ghi âm chạy xong là chết cứng.

---

## Slide 11 — Tại sao chúng tôi sẽ thắng (9:30 – 10:00)

**Điều làm pitch này nổi bật:**

1. **Nó đã hoàn chỉnh.** Không phải concept slide-ware — bạn có thể enroll, thi, thắng reward trong 3 phút từ laptop này.
2. **Nó thực sự Sui-native.** Sẽ phức tạp 3x trên EVM (separate vault contract, off-chain signing cho tie-break, ERC-20 payment cồng kềnh). Mọi Sui primitive chúng tôi dùng (Balance-in-object, Clock, keccak256 stdlib, events) đều pull weight.
3. **Nó có đường đi doanh thu thật.** Teacher đăng course → platform lấy cut từ escrow không phân phát. Scale không cần custodian.
4. **Nó an toàn.** 16 Move unit test + kiến trúc DB-behind-chain có chủ ý = không có half-state bug nào thoát. (Tôi đã hit chúng trong dev. Sau đó design chúng biến mất.)

**Đề xuất:**
> "Hỗ trợ chúng tôi lên mainnet bằng grant hoặc Sui Foundation partnership — chúng tôi sẽ ship NFT certificate quý sau và đưa 1,000 học sinh qua paid cohort."

### Giải thích chi tiết cho bạn

- **4 điểm theo thứ tự psychological:**
  1. "Complete" — đập tan nghi ngờ "demo vaporware"
  2. "Sui-native" — đập tan nghi ngờ "sao không xài chain khác"
  3. "Revenue path" — đập tan nghi ngờ "đây chỉ là toy project"
  4. "Safe" — đập tan nghi ngờ "code bug tùm lum"
- **"3x more complex on EVM" phải defensible** — bạn có thể pull lại Slide 4 nếu được hỏi.
- **"Ask" cụ thể** là rất quan trọng — đừng nói "chúng tôi cần support". Nói rõ: grant, partnership, 1000 học sinh. Số cụ thể = credibility.
- **Câu chốt cuối slide 11 nên ngắn, đi thẳng vào ask.** Không lan man.

---

## Q&A Prep (chỉ dành cho speaker notes)

**"Sao không dùng multisig escrow?"**
> Multisig cần một committee tin cậy. Contract của chúng tôi trust-less — hash đáp án được commit trước khi học sinh nộp, và công thức thưởng nằm trong Move. Không người nào có thể can thiệp.

**Giải thích:** Multisig = 2/3 người ký mới release tiền. Vẫn cần tin 2/3 người đó không cấu kết. Contract tự động không cần bất kỳ ai ký.

---

**"Điều gì ngăn giáo viên không distribute?"**
> Bất kỳ ai cũng có thể gọi `distribute_rewards` sau khi scored — không gate bởi `tx_context::sender == teacher`. Nếu teacher cố câu giờ, học sinh (hoặc bot) có thể trigger payout. (Note: hiện tại chúng tôi gate về teacher như UX choice; ở mainnet sẽ mở ra.)

**Giải thích:** Đây là trade-off UX vs. trust-less. Trên testnet gate về teacher để UI đỡ rối. Mainnet sẽ mở để đảm bảo học sinh không bị kẹt.

---

**"Làm sao ngăn lộ câu hỏi trước khi thi?"**
> Câu hỏi lưu trong backend DB, không on-chain, và được bảo vệ bởi middleware `requireStudent` + check enrollment. Chỉ học sinh đã enroll vào course đang ở `EXAM_ACTIVE` mới fetch được. Hash đáp án đúng lên chain; đáp án thật không bao giờ lên chain cho đến khi reveal.

**Giải thích:** Hai lớp bảo vệ: (1) role middleware — bạn phải là student, (2) status check — course phải đang thi. Nếu giáo viên cố xem trước, họ không phải student nên middleware từ chối.

---

**"Tại sao Postgres nếu chain là truth?"**
> Ba lý do: (1) Read object Sui có latency kể cả trên full node — list view sẽ chậm. (2) Câu hỏi không thể live on-chain (quá to, quá đắt). (3) Cần leaderboard rank bởi DB-side scoring mở rộng ranking submitter-only của chain để hiển thị no-show là "No submission" cho UX trung thực.

**Giải thích:** Chain tốt cho truth (khó giả mạo), DB tốt cho speed (read nhanh). Kết hợp để có cả hai.

---

**"Gas cost end-to-end của học sinh là bao nhiêu?"**
> Khoảng 3 tx: register (~0.001), enroll (~0.003), submit (~0.002). Tổng ~0.006 SUI cho học sinh. Teacher cũng tương tự cho create_course, create_exam, reveal_and_score, distribute_rewards.

**Giải thích:** 0.006 SUI ≈ $0.006. Rẻ hơn 1 cốc cafe. Khả thi cho mass adoption.

---

**"Làm sao xử lý spam enrollment?"**
> Enrollment tốn full tuition. Spam = mua N ghế. `max_students` cap (contract-level) ngăn grief trên bất kỳ course nào.

**Giải thích:** Spam tốn tiền thật cho attacker → economic disincentive. max_students = 5 nên cùng lắm attacker chiếm 5 slot đã trả tiền.

---

**"Timeline mainnet?"**
> Contract ABI-stable sau refactor Clock. Pending: NFT certificate extension, refund path. Target 60 ngày.

**Giải thích:** Nói "60 ngày" cụ thể thay vì "sắp tới" cho credibility.

---

## Appendix — Repo tour (30 giây sanity check nếu được hỏi)

```
move-contract/teaching_platform/
├── sources/course.move              ← 550 dòng, toàn bộ contract logic
├── tests/teaching_platform_tests.move ← 16 test pass
└── Published.toml                    ← record deploy testnet

backend/
├── controllers/    ← HTTP handler (course, exam, enrollment, results, AI)
├── services/       ← DB + chain call + business logic
├── utils/websocket.js ← 6 event type, global + per-course broadcast
└── config/         ← Sequelize + Postgres

frontend/
├── src/pages/      ← HomePage, TeacherPage, StudentPage
├── src/contexts/   ← Wallet + Role state
├── src/services/   ← api.js (axios), websocket.js
└── src/components/ ← Button/Card/Badge + Layout + RoleSelector
```

**Built with:** Sui Move edition 2024, Sui TS SDK 1.21, dapp-kit 0.14, React 19, Tailwind v4, Vite 6, Postgres 15.

---

## Lời khuyên cuối cho người pitch

1. **Đừng đọc slide.** Slide để judges nhìn, miệng bạn để nói. Nếu bạn đọc y chang → họ tự đọc nhanh hơn bạn nói.
2. **Giữ tempo 60 giây/slide.** Nếu chậm → cắt bớt. Nếu nhanh → thêm 1 câu chuyện nhỏ.
3. **Emphasize "tiền đi theo điểm"** ít nhất 3 lần — đó là thông điệp chính.
4. **Luôn chuẩn bị để nhảy demo.** Nếu judges ngắt giữa chừng "show me", bạn phải chuyển được.
5. **Kết thúc bằng ask cụ thể** — không lan man cảm ơn.
6. **Giữ pace calm.** Nói nhanh = lo lắng. Tạm ngừng 1 giây sau câu quan trọng để nó "land".
