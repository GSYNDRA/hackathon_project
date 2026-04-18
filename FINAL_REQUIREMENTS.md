# Sui Teaching Platform - Final Requirements Document

## 1. Project Overview
A decentralized teaching platform on Sui blockchain where:
- Teachers create courses and exams
- Students pay tuition to enroll and compete
- **All students take the exam simultaneously** (synchronized start)
- Top 20% of students win rewards (tuition refund)
- Smart contracts handle all money (escrow + automatic distribution)

## 2. User Roles & Assignment (STRICT - One Role Only)

### 2.1 Role Types
| Role | Permissions |
|------|------------|
| **Teacher** | Create courses, create exams, **start exam countdown**, reveal answers, trigger reward distribution |
| **Student** | Browse courses, enroll/pay, **take exam when started by teacher**, view results |

### 2.2 Role Assignment Strategy (First-Action Defines, STRICT)
```
On wallet connection:
  1. Check user_profiles table for existing role
  2. IF found → use existing role
  3. IF not found → show role selector (teacher/student)
  4. Store choice PERMANENTLY (CANNOT change, CANNOT switch)
  5. STRICT: One wallet = One role forever (for this MVP)
```

### 2.3 Role Validation Rules
- Teacher wallet CANNOT enroll as student (even in other courses)
- Student wallet CANNOT create courses
- Contract maintains `TEACHER_ROLE` and `STUDENT_ROLE` sets
- Assertion on every role-restricted function

## 3. Course Lifecycle & Status (UPDATED for Synchronized Exam)

### 3.1 Status Enum
```rust
ENROLLING = 0               // Students can enroll
READY_FOR_EXAM = 1          // Min students reached, teacher can create exam
EXAM_READY = 2              // Exam created, waiting for teacher to start
EXAM_ACTIVE = 3             // Teacher started countdown, exam in progress
SCORED = 4                  // Answers revealed and scored
REWARDS_DISTRIBUTED = 5     // Money distributed, course complete
```

### 3.2 Status Transitions
```
ENROLLING → READY_FOR_EXAM (when enrolled_count >= min_students)
READY_FOR_EXAM → EXAM_READY (teacher creates exam)
EXAM_READY → EXAM_ACTIVE (teacher starts exam countdown)
EXAM_ACTIVE → SCORED (teacher reveals answers after deadline)
SCORED → REWARDS_DISTRIBUTED (anyone calls distribute_rewards)
```

## 4. Synchronized Exam Model (NEW REQUIREMENT)

### 4.1 Teacher Controls Exam Timing
```
OLD: Students start exam anytime during EXAM_ACTIVE period
NEW: Teacher clicks "START EXAM NOW" → all students get same countdown
```

### 4.2 Exam Flow
1. **Teacher Creates Exam** (Status: EXAM_READY)
   - Inputs: 5 questions, correct answers, duration (e.g., 10 minutes)
   - Questions stored off-chain
   - Answer hash stored on-chain
   - Students see "Waiting for teacher to start..."

2. **Teacher Starts Exam** (Status: EXAM_ACTIVE)
   - Teacher clicks "START EXAM NOW"
   - Contract records: `exam_start_time = current_timestamp`
   - Contract calculates: `exam_deadline = exam_start_time + duration_ms`
   - **All students can now access exam simultaneously**
   - Frontend countdown begins for ALL students at same time

3. **Students Take Exam** (During EXAM_ACTIVE)
   - All students see same countdown timer (synced to deadline)
   - Students select answers for each question
   - Auto-save to localStorage for recovery
   - Students can submit early OR wait for auto-submit

4. **Auto-Submit on Deadline**
   - When `current_time >= exam_deadline`
   - **System auto-submits for all students who haven't submitted**
   - Unanswered questions = null/empty = **0 points for that question**
   - Contract marks all remaining students as "auto-submitted"

### 4.3 Answer Scoring Rules
```python
for each question:
    if student_answer == correct_answer:
        score += 1
    elif student_answer is null/empty/not_answered:
        score += 0  # No answer = No score
    else:
        score += 0  # Wrong answer

total_score = (correct_count / total_questions) * 100
```

### 4.4 Example Scenario
```
Course: 5 students, 10-minute exam

T+0:00  Teacher clicks "START EXAM NOW"
        Contract: exam_start_time = 1704067200000
        Contract: exam_deadline = 1704067200000 + 600000ms (10 min)
        Status: EXAM_ACTIVE

T+0:00  All 5 students see countdown: 10:00

T+2:00  Student A submits answers: [0, 2, 1, 3, 0]

T+5:00  Student B submits answers: [0, 2, null, 3, 0]  # Question 3 unanswered

T+8:00  Student C submits answers: [0, 2, 1, 3, null]  # Question 5 unanswered

T+10:00 AUTO-SUBMIT triggers
        Students D & E haven't submitted → auto-submit
        Student D answers: [null, null, null, null, null] → 0/5 = 0%
        Student E answers: [0, 1, 2, null, null] → 1/5 = 20%

Scoring:
- Student A: [0,2,1,3,0] vs correct [0,2,1,3,1] → 4/5 = 80%
- Student B: [0,2,null,3,0] vs correct [0,2,1,3,1] → 3/5 = 60% (Q3 null=0)
- Student C: [0,2,1,3,null] vs correct [0,2,1,3,1] → 4/5 = 80% (Q5 null=0)
- Student D: [null,null,null,null,null] → 0/5 = 0%
- Student E: [0,1,2,null,null] vs correct [0,2,1,3,1] → 1/5 = 20%

Ranking (by score DESC, time ASC):
1. Student A: 80%, 2:00
2. Student C: 80%, 8:00 (slower, lower rank)
3. Student B: 60%, 5:00
4. Student E: 20%, auto
5. Student D: 0%, auto
```

## 5. Reward Distribution Model (FLOOR ROUNDING)

### 5.1 Formula (UPDATED - FLOOR, NOT CEIL)
```python
REWARDED_STUDENTS = FLOOR(total_students * 0.20)  // Always round DOWN
```

### 5.2 Reward Tiers (Linear Decrease)
| Rank | Reward % of Tuition | Example (100 SUI tuition) |
|------|---------------------|---------------------------|
| 1st | 100% | 100 SUI |
| 2nd | 50% | 50 SUI |
| 3rd | 25% | 25 SUI |
| 4th | 12.5% | 12.5 SUI |
| 5th+ | 6.25% | 6.25 SUI |

*Note: Each rank gets half of the previous rank's reward*

### 5.3 Calculation Algorithm (FLOOR)
```python
def calculate_rewards(total_students, tuition_amount):
    # ALWAYS round DOWN
    rewarded_count = math.floor(total_students * 0.20)
    
    # Edge case: if floor results in 0, minimum 1 student rewarded
    if rewarded_count == 0 and total_students > 0:
        rewarded_count = 1
    
    rewards = {}
    for rank in range(1, rewarded_count + 1):
        # 100% for 1st, 50% for 2nd, 25% for 3rd, etc.
        percentage = 100.0 / (2 ** (rank - 1))
        rewards[rank] = tuition_amount * (percentage / 100)
    
    # Teacher gets everything else
    total_rewarded = sum(rewards.values())
    teacher_amount = (total_students * tuition_amount) - total_rewarded
    
    return rewards, teacher_amount
```

### 5.4 Examples (FLOOR)

#### Example A: 5 Students, 100 SUI Tuition
```
Rewarded students: FLOOR(5 * 0.20) = FLOOR(1.0) = 1 student

Rewards:
- Rank 1: 100% × 100 SUI = 100 SUI

Total pool: 5 × 100 SUI = 500 SUI
Distributed: 100 SUI
Teacher gets: 500 - 100 = 400 SUI

Final distribution:
- Student 1st: 100 SUI (break-even)
- Teacher: 400 SUI
- Students 2-5: 0 SUI
```

#### Example B: 7 Students, 100 SUI Tuition
```
Rewarded students: FLOOR(7 * 0.20) = FLOOR(1.4) = 1 student
(NOT 2 - always round DOWN even 1.6)

Rewards:
- Rank 1: 100% × 100 SUI = 100 SUI

Total pool: 7 × 100 SUI = 700 SUI
Distributed: 100 SUI
Teacher gets: 700 - 100 = 600 SUI
```

#### Example C: 10 Students, 100 SUI Tuition
```
Rewarded students: FLOOR(10 * 0.20) = FLOOR(2.0) = 2 students

Rewards:
- Rank 1: 100% × 100 SUI = 100 SUI
- Rank 2: 50% × 100 SUI = 50 SUI

Total pool: 10 × 100 SUI = 1000 SUI
Distributed: 150 SUI
Teacher gets: 1000 - 150 = 850 SUI

Final distribution:
- Student 1st: 100 SUI
- Student 2nd: 50 SUI
- Teacher: 850 SUI
- Students 3-10: 0 SUI
```

#### Example D: 4 Students, 50 SUI Tuition (Edge Case)
```
Rewarded students: FLOOR(4 * 0.20) = FLOOR(0.8) = 0 students
BUT: Minimum 1 student rewarded if anyone enrolled

Rewards:
- Rank 1: 100% × 50 SUI = 50 SUI

Total pool: 4 × 50 SUI = 200 SUI
Distributed: 50 SUI
Teacher gets: 200 - 50 = 150 SUI
```

### 5.5 Edge Cases
| Scenario | Handling |
|----------|----------|
| Only 1 student enrolled | FLOOR(1 × 0.20) = 0 → Minimum 1 rewarded (100% back to student, teacher gets nothing) |
| 2 students enrolled | FLOOR(2 × 0.20) = 0 → Minimum 1 rewarded |
| 5 students enrolled | FLOOR(5 × 0.20) = 1 rewarded |
| 9 students enrolled | FLOOR(9 × 0.20) = FLOOR(1.8) = 1 rewarded |
| 10 students enrolled | FLOOR(10 × 0.20) = 2 rewarded |
| 11 students enrolled | FLOOR(11 × 0.20) = FLOOR(2.2) = 2 rewarded |
| Tie scores | Tie-break by time taken (faster wins higher rank) |
| All tie scores & times | Same rank, rewards split equally |

## 6. Core Flows

### 6.1 Teacher Creates Course
1. Teacher connects wallet (role validated as "teacher")
2. Teacher Dashboard → "Create Course"
3. Inputs: Course Name, Description, Tuition Amount (SUI), Max Students (2-5), Min Students (default 2)
4. Contract: `create_course(name, tuition, max_students, min_students)`
5. Course created with status = ENROLLING

### 6.2 Student Enrolls & Pays
1. Student connects wallet (role validated as "student")
2. Student browses available courses (status = ENROLLING)
3. Selects course, views details
4. Clicks "Enroll & Pay"
5. Contract: `enroll_and_pay(course_id, coin)` - verifies payment amount, role=student
6. SUI locked in escrow
7. When enrolled_count >= min_students, status → READY_FOR_EXAM

### 6.3 Teacher Creates Exam
1. Teacher views course with status = READY_FOR_EXAM
2. Clicks "Create Exam"
3. Inputs: 5 questions (text + 4 options A-D), correct answers [0-3], duration (minutes)
4. Backend stores full questions in PostgreSQL
5. Backend computes: `answer_hash = keccak256(correct_answers)`
6. Contract: `create_exam(course_id, answer_hash, duration_ms)`
7. Status → EXAM_READY
8. Students see: "Exam ready, waiting for teacher to start..."

### 6.4 Teacher Starts Exam (SYNCHRONIZED - NEW)
1. Teacher views course with status = EXAM_READY
2. Sees message: "X students ready. Start exam when ready."
3. Teacher clicks "START EXAM NOW"
4. Contract: `start_exam(course_id)`
   - Records: `exam_start_time = current_timestamp`
   - Calculates: `exam_deadline = exam_start_time + duration_ms`
5. Status → EXAM_ACTIVE
6. Backend WebSocket notifies all enrolled students: "EXAM STARTED!"
7. All students see countdown timer starting simultaneously

### 6.5 Students Take Exam (SYNCHRONIZED)
1. Student receives "EXAM STARTED" notification
2. Clicks "Enter Exam"
3. Contract: `verify_enrolled_and_active(course_id)` - checks enrollment + EXAM_ACTIVE status
4. Frontend fetches questions from backend
5. **Countdown timer displays time remaining until exam_deadline** (same for all students)
6. Student selects answers for each question (auto-save to localStorage)
7. Student can:
   - Submit early (click "Submit Answers")
   - Wait for auto-submit when countdown reaches 0:00

### 6.6 Auto-Submit on Deadline
1. Frontend countdown reaches 0:00
2. For students who haven't submitted:
   - Frontend attempts to submit current answers (even if partial)
   - If frontend fails, backend auto-submit job submits on their behalf
   - Unanswered questions stored as `null` or empty array
3. Contract: `auto_submit(course_id, student_address, answers)`
   - Marks submission as "auto-submitted"
   - Unanswered questions = 0 points
4. When all students submitted OR deadline passed + grace period, teacher sees "Ready to Score"

### 6.7 Reveal & Score
1. Teacher sees all students submitted OR time expired
2. Clicks "Reveal Answers & Score"
3. Frontend fetches correct answers from backend (for teacher confirmation)
4. Teacher confirms, submits answer_key array
5. Contract: `reveal_and_score(course_id, answer_key)`
   - Verifies: caller is teacher
   - Verifies: `keccak256(answer_key) == stored_answer_hash` (anti-cheat)
   - For each student:
     - Compare answers vs answer_key
     - Unanswered (null) = 0 points
     - Calculate score percentage
     - Record time_taken (or auto-submit time)
   - Sort by: score DESC, time_taken ASC (faster wins ties)
   - Assign ranks
6. Status → SCORED

### 6.8 Distribute Rewards
1. Anyone can trigger (teacher, student, or backend)
2. Contract: `distribute_rewards(course_id)`
   - Verifies: status = SCORED
   - Gets: total_escrow_balance
   - Calculates: rewarded_count = FLOOR(total_students × 0.20), minimum 1
   - Calculates: rewards per rank (100%, 50%, 25%, ...)
   - Transfers SUI to each rewarded student
   - Transfers remaining to teacher
3. Status → REWARDS_DISTRIBUTED

### 6.9 View Results
1. Any user navigates to course page
2. Backend: `GET /api/courses/:id/results`
3. Returns: Leaderboard with rank, wallet, score, time, reward amount
4. (Optional) Verify button: calls `get_course_results()` on-chain, compares with DB

## 7. Data Architecture

### 7.1 On-Chain (Sui) - Source of Truth
```rust
// Course Object
struct Course has key {
    id: UID,
    teacher: address,
    tuition: u64,              // in MIST (1 SUI = 10^9 MIST)
    max_students: u8,
    min_students: u8,          // default 2
    status: u8,                // 0-5
    escrow: Balance<SUI>,
    enrolled_count: u64,
    students: Table<address, StudentInfo>,
    
    // Exam
    answer_hash: vector<u8>,   // 32 bytes
    exam_start_time: u64,      // When teacher started exam (NEW)
    exam_deadline: u64,        // exam_start_time + duration
    exam_duration_ms: u64,
    
    // Submissions
    submissions: Table<address, Submission>,
    
    // Results
    results: Table<address, Result>,
    
    // Role tracking (NEW - STRICT)
    teacher_role: address,     // Teacher wallet
}

struct StudentInfo has store {
    enrolled_at: u64,
    amount_paid: u64,
}

struct Submission has store {
    answers_hash: vector<u8>,
    submitted_at: u64,
    is_auto_submit: bool,      // NEW - true if auto-submitted on deadline
}

struct Result has store {
    score: u64,                // raw score (e.g., 4/5)
    percentage: u8,            // 0-100
    time_taken_ms: u64,
    rank: u8,                  // 1, 2, 3...
    reward_amount: u64,        // MIST received
}
```

### 7.2 Off-Chain (PostgreSQL) - Cache & Metadata
```sql
-- Users (STRICT role, cannot switch)
CREATE TABLE user_profiles (
    wallet_address VARCHAR(66) PRIMARY KEY,
    username VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('teacher', 'student')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(wallet_address, role)  -- One role per wallet
);

-- Courses (metadata + chain reference)
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    on_chain_id VARCHAR(66) UNIQUE NOT NULL,
    teacher_address VARCHAR(66) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tuition_amount BIGINT NOT NULL,
    max_students SMALLINT DEFAULT 5,
    min_students SMALLINT DEFAULT 2,
    status SMALLINT DEFAULT 0,
    exam_start_time TIMESTAMP,          -- NEW - when teacher started
    exam_deadline TIMESTAMP,            -- NEW - calculated deadline
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions (off-chain only)
CREATE TABLE exam_questions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    question_number SMALLINT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,  -- ["A. option1", "B. option2", ...]
    correct_answer_idx SMALLINT NOT NULL,  -- 0-3
    UNIQUE(course_id, question_number)
);

-- Enrollments (synced from chain events)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    student_address VARCHAR(66) NOT NULL,
    amount_paid BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    on_chain_tx_digest VARCHAR(88),
    UNIQUE(course_id, student_address)
);

-- Submissions (synced from chain events)
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    student_address VARCHAR(66) NOT NULL,
    answers JSONB NOT NULL,  -- [0, 2, 1, null, 0] - null = unanswered
    answers_hash VARCHAR(66) NOT NULL,
    submitted_at TIMESTAMP,
    is_auto_submit BOOLEAN DEFAULT FALSE,  -- NEW
    UNIQUE(course_id, student_address)
);

-- Results (synced from chain events)
CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    student_address VARCHAR(66) NOT NULL,
    score SMALLINT NOT NULL,
    percentage SMALLINT NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    rank_position SMALLINT NOT NULL,
    reward_amount BIGINT,  -- MIST
    rewarded_at TIMESTAMP,
    UNIQUE(course_id, student_address)
);

-- Auto-submit tracking (NEW)
CREATE TABLE auto_submit_queue (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    student_address VARCHAR(66) NOT NULL,
    deadline TIMESTAMP NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 8. Contract Entrypoints

### 8.1 Teacher Functions
```rust
// Create a new course
public entry fun create_course(
    name: vector<u8>,
    tuition: u64,
    max_students: u8,
    min_students: u8,
    ctx: &mut TxContext
): Course;

// Create exam for a course
public entry fun create_exam(
    course: &mut Course,
    answer_hash: vector<u8>,
    duration_ms: u64,
    ctx: &TxContext
);

// START EXAM - Teacher triggers synchronized start (NEW)
public entry fun start_exam(
    course: &mut Course,
    ctx: &TxContext
);

// Reveal answers and score all submissions
public entry fun reveal_and_score(
    course: &mut Course,
    answer_key: vector<u8>,
    ctx: &TxContext
);
```

### 8.2 Student Functions
```rust
// Enroll in a course and pay tuition (role=student enforced)
public entry fun enroll_and_pay(
    course: &mut Course,
    payment: Coin<SUI>,
    ctx: &mut TxContext
);

// Submit answers (can be called by student OR auto-submit system)
public entry fun submit_answers(
    course: &mut Course,
    answers: vector<u8>,  // [0, 2, 1, 255, 0] where 255 = null/unanswered
    ctx: &mut TxContext
);
```

### 8.3 Anyone Functions
```rust
// Distribute rewards to top students and teacher
public entry fun distribute_rewards(
    course: &mut Course,
    ctx: &mut TxContext
);

// Auto-submit for a student (called by backend job on deadline)
public entry fun auto_submit_for_student(
    course: &mut Course,
    student: address,
    ctx: &mut TxContext
);

// View results (read-only)
public fun get_course_results(
    course: &Course,
    ctx: &TxContext
): vector<ResultView>;
```

## 9. Backend API Endpoints

```
POST   /api/users/register              // Register with role (STRICT)
GET    /api/users/:address              // Get user profile
GET    /api/users/:address/role         // Get role (teacher/student)

POST   /api/courses                     // Create course (metadata only)
GET    /api/courses                     // List all courses
GET    /api/courses?status=enrolling    // List enrolling courses
GET    /api/courses?status=ready         // List ready for exam
GET    /api/courses?status=active        // List active exams
GET    /api/courses/:id                 // Get course details

POST   /api/courses/:id/exam            // Store exam questions
POST   /api/courses/:id/start           // Teacher starts exam (NEW)
GET    /api/exams/:courseId/questions   // Get exam questions (only if EXAM_ACTIVE)
GET    /api/exams/:courseId/status      // Get exam status and countdown

POST   /api/courses/:id/submit          // Student submits answers
POST   /api/courses/:id/auto-submit     // Auto-submit on deadline (NEW)

GET    /api/courses/:id/enrollments     // Get enrollment list
GET    /api/courses/:id/submissions     // Get submissions (teacher only)
GET    /api/courses/:id/results         // Get results leaderboard

POST   /api/webhooks/exam-started       // Notify students exam started (NEW)
POST   /api/webhooks/deadline-reached   // Trigger auto-submit (NEW)
```

## 10. Frontend UI Components (NEW - Synchronized Exam)

### 10.1 Teacher Dashboard - Exam Control
```
┌─────────────────────────────────────┐
│ Course: "Blockchain Basics"         │
│ Status: EXAM_READY                  │
│ Students Ready: 5/5                 │
│                                     │
│ [START EXAM NOW] ← Big red button   │
│                                     │
│ Exam Duration: 10 minutes           │
│ Questions: 5                        │
└─────────────────────────────────────┘
```

### 10.2 Student - Waiting Screen
```
┌─────────────────────────────────────┐
│ Course: "Blockchain Basics"         │
│ Status: Waiting for exam to start   │
│                                     │
│ 🔔 You'll be notified when the      │
│    teacher starts the exam          │
│                                     │
│ [Refresh] [Enable Notifications]    │
└─────────────────────────────────────┘
```

### 10.3 Student - Active Exam Screen
```
┌─────────────────────────────────────┐
│ ⏱️ Time Remaining: 08:42            │
│                                     │
│ Q1: What is 2+2?                    │
│ ○ A. 3                              │
│ ○ B. 4  ← Selected                  │
│ ○ C. 5                              │
│ ○ D. 6                              │
│                                     │
│ Q2: What is the capital of France?  │
│ ○ A. London                         │
│ ○ B. Berlin                         │
│ ○ C. Paris ← Selected               │
│ ○ D. Madrid                         │
│                                     │
│ Q3: [Unanswered] ← null/empty       │
│ ○ A. Option A                       │
│ ○ B. Option B                       │
│ ○ C. Option C                       │
│ ○ D. Option D                       │
│                                     │
│ [SUBMIT ANSWERS]                    │
│                                     │
│ ⚠️ Unanswered: Q3, Q4, Q5          │
│ Auto-submit at 00:00                │
└─────────────────────────────────────┘
```

## 11. Anti-Cheat Mechanisms

### 11.1 Answer Commitment
- Teacher commits to answer_key hash when creating exam
- When revealing, contract verifies hash matches
- Prevents teacher from changing answers after seeing submissions

### 11.2 Time Enforcement
- Exam start time recorded on-chain by teacher (cannot be faked)
- Exam deadline calculated and stored on-chain
- Contract rejects submissions after deadline (except auto-submit)

### 11.3 Synchronized Start
- All students get same start time from blockchain
- No early access possible
- No timezone advantage

### 11.4 Auto-Submit Integrity
- Deadline enforced by blockchain timestamp
- Backend auto-submit job uses blockchain time, not server time
- Students can't "pause" the timer

## 12. Error Handling

| Error Code | Scenario | User Message |
|------------|----------|--------------|
| E_INSUFFICIENT_PAYMENT | Payment < tuition | "Need X SUI, you sent Y" |
| E_ALREADY_ENROLLED | Double enrollment attempt | "Already enrolled in this course" |
| E_COURSE_FULL | Max students reached | "Course is full" |
| E_NOT_TEACHER | Non-teacher calls teacher function | "Only teacher can do this" |
| E_NOT_ENROLLED | Student tries exam without enrollment | "Enroll first" |
| E_EXAM_NOT_STARTED | Student tries exam before teacher starts | "Wait for teacher to start" |
| E_EXAM_ALREADY_STARTED | Teacher tries to start twice | "Exam already started" |
| E_EXAM_ENDED | Submit after deadline | "Exam has ended - auto-submitted" |
| E_ALREADY_SUBMITTED | Double submission | "You already submitted" |
| E_TIME_EXPIRED | Submit after deadline | "Time expired - auto-submitted" |
| E_ANSWER_HASH_MISMATCH | Teacher reveals wrong answers | "Answer verification failed" |
| E_NOT_SCORED | Distribute before scoring | "Score the exam first" |
| E_ALREADY_DISTRIBUTED | Double distribution | "Rewards already distributed" |
| E_WRONG_ROLE | Teacher tries to enroll | "Teachers cannot enroll as students" |

## 13. Updated Build Order (Synchronized Exam)

### Day 1 (12 hours)

| Time | Task | Deliverable |
|------|------|-------------|
| 0-2h | Scaffold frontend (React + wallet), backend (Express + Postgres), Move contract | All 3 repos initialized |
| 2-6h | **Contract** with synchronized exam logic | Deployed with all entrypoints |
| 6-9h | Backend schema + APIs + **WebSocket for exam start notifications** | DB + APIs + real-time sync |
| 9-12h | Teacher UI (dashboard, create course, **create exam, start exam button**) | Teacher can start exam |

### Day 2 (10 hours)

| Time | Task | Deliverable |
|------|------|-------------|
| 0-4h | Student UI (**waiting screen**, **synchronized countdown**, **auto-submit**, exam interface) | Students take synchronized exam |
| 4-7h | Results UI + reward distribution + **auto-submit backend job** | Full scoring and payout |
| 7-10h | Event sync polish + **auto-submit testing** + demo rehearsal | Demo runs smoothly |

### Key Changes from Original Plan
1. ✅ **FLOOR rounding** for 20% calculation (not CEIL)
2. ✅ **STRICT role** - one role per wallet, no switching
3. ✅ **Synchronized exam** - teacher starts countdown, all students see same timer
4. ✅ **Auto-submit** - unanswered questions = null = 0 points
5. ✅ **Tie-breaking** - faster time wins higher rank

## 14. Demo Test Cases

### Test Case 1: Happy Path (5 Students)
1. Teacher creates course (100 SUI tuition, 5 max)
2. 5 Students enroll (500 SUI in escrow)
3. Teacher creates exam (5 questions, 5 minutes)
4. **Teacher clicks "START EXAM NOW"**
5. All 5 students get notification, countdown starts
6. 3 students submit manually, 2 auto-submit on deadline
7. Teacher reveals and scores
8. Rewards distributed:
   - Rank 1: 100 SUI (20% of 5 = 1 student rewarded)
   - Teacher: 400 SUI
   - Others: 0 SUI

### Test Case 2: Auto-Submit with Unanswered Questions
1. 3 students take exam
2. Student A answers all 5 correctly, submits early
3. Student B answers 3 correctly, leaves 2 unanswered, waits
4. Student C leaves all unanswered, waits
5. Deadline reached
6. Auto-submit:
   - B: 3/5 = 60% (2 unanswered = 0 points)
   - C: 0/5 = 0% (all unanswered)
7. Ranking: A (100%), B (60%), C (0%)

### Test Case 3: Insufficient Students for 20%
1. 4 students enroll
2. 20% of 4 = 0.8 → FLOOR = 0
3. BUT minimum 1 student rewarded
4. Rank 1 gets 100% tuition back
5. Teacher gets 300% (remaining 3 students)

### Test Case 4: Role Restriction
1. Teacher wallet tries to enroll in another course
2. Contract rejects: E_WRONG_ROLE
3. Message: "Teachers cannot enroll as students"

---

**FINAL CONFIRMATION REQUIRED:**
1. ✅ Reward decrease: 100% → 50% → 25% → ...
2. ✅ Rounding: FLOOR (always down, minimum 1 student)
3. ✅ Role: STRICT (teacher OR student, never both)
4. ✅ Tie-breaking: Faster time wins
5. ✅ Synchronized exam: Teacher starts countdown
6. ✅ Auto-submit: Unanswered = null = 0 points

**Ready to build?** 🚀
