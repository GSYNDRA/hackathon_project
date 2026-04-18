# Sui Teaching Platform - Sequence Diagrams

## 🔄 FLOW 1: Wallet Connection & Role Assignment (First-Time User)

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     User    │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Connect wallet│                   │                   │
       │   (Sui Wallet)   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  2. Extract       │                   │
       │                   │     wallet address │                   │
       │                   │     from session   │                   │
       │                   │                   │                   │
       │  3. GET /api/users/:address           │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  4. Query         │                   │
       │                   │     user_profiles │                   │
       │                   │     WHERE wallet   │                   │
       │                   │     = address     │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │   ═══ IF USER EXISTS (RETURNING USER) ═══                │
       │                   │                   │                   │
       │                   │                   │                   │
       │  5a. Return:      │                   │                   │
       │     { role: "teacher" }              │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  6a. Redirect to  │                   │                   │
       │     Teacher       │                   │                   │
       │     Dashboard     │                   │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │   ═══ IF USER NOT FOUND (NEW USER) ═══                  │
       │                   │                   │                   │
       │                   │                   │                   │
       │  5b. Return:      │                   │                   │
       │     { role: null }│                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  6b. Show Role    │                   │                   │
       │     Selector:     │                   │                   │
       │   ┌───────────────────────┐          │                   │
       │   │  Choose Your Role     │          │                   │
       │   │                       │          │                   │
       │   │  [🎓 Teacher]          │          │                   │
       │   │  [📚 Student]          │          │                   │
       │   │                       │          │                   │
       │   │  ⚠️ This choice is    │          │                   │
       │   │  PERMANENT and cannot │          │                   │
       │   │  be changed.          │          │                   │
       │   └───────────────────────┘          │                   │
       │                   │                   │                   │
       │  7b. User clicks  │                   │                   │
       │     "Teacher"    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  8b. POST         │                   │
       │                   │     /api/users/register              │                   │
       │                   │     { wallet_address,                │                   │
       │                   │       username,                      │                   │
       │                   │       role: "teacher" }              │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │  9b. Check:       │                   │
       │                   │                   │     wallet NOT    │                   │
       │                   │                   │     already in    │                   │
       │                   │                   │     user_profiles  │                   │
       │                   │                   │                   │
       │                   │                   │  10b. INSERT into │                   │
       │                   │                   │      user_profiles│                   │
       │                   │                   │      (address,    │                   │
       │                   │                   │       "teacher")   │                   │
       │                   │                   │                   │
       │                   │                   │  11b. Return:     │                   │
       │                   │                   │       user record │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  12b. Store role  │                   │                   │
       │     in localState │                   │                   │
       │     (role=teacher)│                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  13b. Redirect to │                   │                   │
       │     Teacher       │                   │                   │
       │     Dashboard     │                   │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │   ═══ IF STUDENT CHOOSES ═══          │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  7c. User clicks │                   │                   │
       │     "Student"    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  8c. POST         │                   │
       │                   │     /api/users/register              │                   │
       │                   │     { wallet_address,                │                   │
       │                   │       username,                      │                   │
       │                   │       role: "student" }              │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │  9c. Check:       │                   │
       │                   │                   │     wallet NOT    │                   │
       │                   │                   │     already in    │                   │
       │                   │                   │     user_profiles  │                   │
       │                   │                   │                   │
       │                   │                   │  10c. INSERT into │                   │
       │                   │                   │      user_profiles│                   │
       │                   │                   │      (address,    │                   │
       │                   │                   │       "student")  │                   │
       │                   │                   │                   │
       │                   │                   │  11c. Return:     │                   │
       │                   │                   │       user record │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  12c. Store role  │                   │                   │
       │     in localState │                   │                   │
       │     (role=student)│                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  13c. Redirect to │                   │                   │
       │     Student       │                   │                   │
       │     Course List   │                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-3 | Connect wallet, extract address, check existing role | Query user_profiles table | — |
| 5a | If returning user, redirect to role-specific dashboard | Return existing role | — |
| 6b-7b | Show role selector (permanent choice), user picks role | — | — |
| 8b-10b | — | Validate wallet not already registered, insert into user_profiles with chosen role | — |
| 12b-13b | Store role in local state, redirect to Teacher Dashboard | — | — |
| 8c-10c | — | Same validation + insert for student role | — |
| 12c-13c | Store role in local state, redirect to Student Course List | — | — |

**Role Enforcement Rules:**
- One wallet = one role, FOREVER
- `user_profiles` table has `UNIQUE(wallet_address, role)` but logic enforces only ONE row per wallet
- Every subsequent action (create course, enroll, etc.) validates role against `user_profiles` AND on-chain `teacher_role` / student sets
- Teacher wallet → can NEVER call `enroll_and_pay`
- Student wallet → can NEVER call `create_course`, `create_exam`, `start_exam`, `reveal_and_score`

---

## 🔄 FLOW 2: Student Enrollment & Payment

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Connect wallet│                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/users/:address           │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  Query            │
       │                   │                   │  user_profiles    │
       │                   │◀──────────────────│                   │
       │  3. Validate:    │                   │                   │
       │     role=student │                   │                   │
       │     (BLOCK if    │                   │                   │
       │      teacher)    │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  4. GET /api/courses?status=enrolling│                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  5. Query courses│
       │                   │                   │     WHERE status │
       │                   │                   │     = 0           │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  6. Display course│                   │                   │
       │     list with     │                   │                   │
       │     tuition,      │                   │                   │
       │     enrollment    │                   │                   │
       │     count         │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  7. Click on      │                   │                   │
       │     course card   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  8. GET /api/courses/:id             │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  9. Query course │
       │                   │                   │     details +     │
       │                   │                   │     enrollment    │
       │                   │                   │     count         │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  10. Display      │                   │                   │
       │     course page:  │                   │                   │
       │     name, desc,   │                   │                   │
       │     tuition,      │                   │                   │
       │     seats left    │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  11. Click        │                   │                   │
       │     "Enroll & Pay"│                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  12. Check wallet │                   │
       │                   │     balance via   │                   │
       │                   │     Sui RPC       │                   │
       │                   │                   │                   │
       │  13. Show confirm │                   │                   │
       │     dialog:       │                   │                   │
       │     "Pay X SUI?"  │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  14. User confirms│                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  15. Build TX:    │                   │
       │                   │     splitCoins    │                   │
       │                   │     for exact     │                   │
       │                   │     tuition amount│                   │
       │                   │                   │                   │
       │                   │  16. Call         │                   │
       │                   │     enroll_and_pay│                   │
       │                   │     (course_id,   │                   │
       │                   │      Coin<SUI>)  │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  17. Verify:      │
       │                   │                   │     - caller has  │
       │                   │                   │       STUDENT_ROLE│
       │                   │                   │     - not already │
       │                   │                   │       enrolled    │
       │                   │                   │     - course not  │
       │                   │                   │       full        │
       │                   │                   │     - payment >=  │
       │                   │                   │       tuition     │
       │                   │                   │                   │
       │                   │                   │  18. Add SUI to   │
       │                   │                   │     course.escrow │
       │                   │                   │                   │
       │                   │                   │  19. Insert into  │
       │                   │                   │     course.students│
       │                   │                   │     [address] →   │
       │                   │                   │     StudentInfo { │
       │                   │                   │       enrolled_at, │
       │                   │                   │       amount_paid  │
       │                   │                   │     }              │
       │                   │                   │                   │
       │                   │                   │  20. Increment    │
       │                   │                   │     course.        │
       │                   │                   │     enrolled_count│
       │                   │                   │                   │
       │                   │                   │  21. IF enrolled  │
       │                   │                   │     count >=      │
       │                   │                   │     min_students: │
       │                   │                   │     course.status  │
       │                   │                   │     =             │
       │                   │                   │     READY_FOR_EXAM│
       │                   │                   │                   │
       │                   │                   │  22. Emit:        │
       │                   │                   │     Enrollment-   │
       │                   │                   │     Event {       │
       │                   │                   │       course_id,  │
       │                   │                   │       student,    │
       │                   │                   │       amount_paid  │
       │                   │                   │     }              │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │  23. Show success │                   │                   │
       │     "Enrolled!"   │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │  24. Event        │
       │                   │                   │     Listener      │
       │                   │                   │     catches       │
       │                   │                   │     Enrollment-   │
       │                   │                   │     Event          │
       │                   │                   │                   │
       │                   │                   │  25. INSERT into  │
       │                   │                   │     enrollments   │
       │                   │                   │     table         │
       │                   │                   │                   │
       │                   │                   │  26. IF min_      │
       │                   │                   │     students      │
       │                   │                   │     reached:      │
       │                   │                   │     UPDATE courses │
       │                   │                   │     SET status=1  │
       │                   │                   │                   │
       │                   │                   │  27. WebSocket    │
       │                   │                   │     NOTIFY teacher│
       │                   │◀──────────────────│                   │
       │◀──────────────────│ "Min students reached! Create exam now"│
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-3 | Connect wallet, validate role=student (block teachers) | Query user_profiles for role | — |
| 4-6 | Browse available courses | Query courses WHERE status=0 | — |
| 7-10 | View course details, show enrollment button | Query course + enrollment info | — |
| 11-14 | Click enroll, check balance, confirm payment intent | — | — |
| 15-16 | Build transaction with splitCoins for exact tuition, call enroll_and_pay | — | — |
| 17-22 | Wait for TX confirmation | — | Verify student role, not enrolled, not full, correct payment. Lock SUI, add student, check min_students threshold, emit event |
| 23 | Show success to student | — | — |
| 24-27 | — | Catch EnrollmentEvent, insert enrollment, update course status if min reached, notify teacher via WebSocket | — |

---

## 🔄 FLOW 3: Teacher Creates Course

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teacher   │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Connect wallet│                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/users/:address           │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  Query role        │
       │                   │◀──────────────────│                   │
       │  3. Validate:    │                   │                   │
       │     role=teacher  │                   │                   │
       │     (BLOCK if    │                   │                   │
       │      student)    │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  4. Display       │                   │                   │
       │     Teacher       │                   │                   │
       │     Dashboard     │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  5. Click         │                   │                   │
       │     "Create Course"│                  │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  6. Show create   │                   │                   │
       │     course form:  │                   │                   │
       │   ┌─────────────────────────┐         │                   │
       │   │ Course Name: [______]    │         │                   │
       │   │ Description: [______]    │         │                   │
       │   │ Tuition (SUI): [__]      │         │                   │
       │   │ Max Students: [2-5]      │         │                   │
       │   │ Min Students: [2]        │         │                   │
       │   └─────────────────────────┘         │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  7. Fill form &   │                   │                   │
       │     submit        │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  8. Front-end     │                   │
       │                   │     validation:   │                   │
       │                   │     - name not    │                   │
       │                   │       empty       │                   │
       │                   │     - tuition > 0 │                   │
       │                   │     - max 2-5     │                   │
       │                   │     - min >= 2    │                   │
       │                   │     - min <= max  │                   │
       │                   │                   │                   │
       │                   │  9. Build TX:     │                   │
       │                   │     call          │                   │
       │                   │     create_course │                   │
       │                   │     (name_bytes, │                   │
       │                   │      tuition_    │                   │
       │                   │      mist, max,  │                   │
       │                   │      min)         │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  10. Verify:      │
       │                   │                   │      - caller has │
       │                   │                   │        TEACHER_   │
       │                   │                   │        ROLE      │
       │                   │                   │      - tuition > 0│
       │                   │                   │      - max >= min │
       │                   │                   │      - max <= 5   │
       │                   │                   │                   │
       │                   │                   │  11. Create       │
       │                   │                   │      Course obj   │
       │                   │                   │      with fields: │
       │                   │                   │      - teacher =  │
       │                   │                   │        caller     │
       │                   │                   │      - tuition    │
       │                   │                   │      - max/min   │
       │                   │                   │      - status =   │
       │                   │                   │        ENROLLING  │
       │                   │                   │      - escrow =   │
       │                   │                   │        0          │
       │                   │                   │      - enrolled   │
       │                   │                   │        = 0        │
       │                   │                   │                   │
       │                   │                   │  12. Emit:        │
       │                   │                   │      CourseCreated │
       │                   │                   │      Event {      │
       │                   │                   │        course_id, │
       │                   │                   │        teacher,   │
       │                   │                   │        tuition    │
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │                   │  13. Get TX digest│                   │
       │                   │     + course ID   │                   │
       │                   │     from result   │                   │
       │                   │                   │                   │
       │                   │  14. POST         │                   │
       │                   │     /api/courses  │                   │
       │                   │     { on_chain_id, │                   │
       │                   │       name, desc, │                   │
       │                   │       tuition,    │                   │
       │                   │       max, min,   │                   │
       │                   │       teacher_    │                   │
       │                   │       address }   │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │  15. INSERT into  │
       │                   │                   │     courses table │
       │                   │                   │     (on_chain_id, │
       │                   │                   │      name, desc,  │
       │                   │                   │      tuition,     │
       │                   │                   │      status=0,   │
       │                   │                   │      teacher_     │
       │                   │                   │      address)     │
       │                   │                   │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  16. Redirect to  │                   │                   │
       │     course page   │                   │                   │
       │◀──────────────────│                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-3 | Connect wallet, validate role=teacher (block students) | Query user_profiles for role | — |
| 4-7 | Show dashboard, display form, collect course details | — | — |
| 8 | Validate form inputs (name, tuition, max/min) | — | — |
| 9 | Build and sign transaction for create_course | — | — |
| 10-12 | Wait for TX | — | Verify teacher role, validate params, create Course object, emit event |
| 13-15 | Get TX result, call backend to persist metadata | Insert course metadata into PostgreSQL, return success | — |
| 16 | Redirect to course detail page | — | — |

---

## 🔄 FLOW 4: Teacher Creates Exam

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teacher   │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Teacher views │                   │                   │
       │     course detail │                   │                   │
       │     (status =     │                   │                   │
       │      READY_FOR_  │                   │                   │
       │      EXAM)        │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/courses/:id             │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  3. Query course  │
       │                   │                   │     WHERE status=1 │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  4. Display       │                   │                   │
       │     "Min students │                   │                   │
       │      reached!     │                   │                   │
       │      Create Exam" │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  5. Click         │                   │                   │
       │     "Create Exam" │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  6. Show exam     │                   │                   │
       │     creation form:│                   │                   │
       │   ┌──────────────────────────────┐    │                   │
       │   │ Question 1: [___________]     │    │                   │
       │   │   A. [___] B. [___]          │    │                   │
       │   │   C. [___] D. [___]          │    │                   │
       │   │   Correct: ○A ○B ○C ●D       │    │                   │
       │   │                              │    │                   │
       │   │ Question 2-5: same format    │    │                   │
       │   │                              │    │                   │
       │   │ Duration (min): [10]          │    │                   │
       │   └──────────────────────────────┘    │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  7. Fill in 5     │                   │                   │
       │     questions +   │                   │                   │
       │     answers +     │                   │                   │
       │     duration      │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  8. Front-end     │                   │
       │                   │     validation:   │                   │
       │                   │     - exactly 5  │                   │
       │                   │       questions  │                   │
       │                   │     - each has 4 │                   │
       │                   │       options    │                   │
       │                   │     - each has a │                   │
       │                   │       correct   │                   │
       │                   │       answer idx │                   │
       │                   │     - duration   │                   │
       │                   │       1-60 min  │                   │
       │                   │                   │                   │
       │                   │  9. Extract:      │                   │
       │                   │     correct_answers│                  │
       │                   │     = [2, 0, 3, 1, 2]│               │
       │                   │                   │                   │
       │                   │  10. Compute:    │                   │
       │                   │     answer_hash =│                   │
       │                   │     keccak256(   │                   │
       │                   │       [2,0,3,1,2]│                   │
       │                   │     )            │                   │
       │                   │                   │                   │
       │                   │  11. POST        │                   │
       │                   │     /api/courses/:id/exam             │
       │                   │     { questions: [│                   │
       │                   │       {q:"Q1",   │                   │
       │                   │        options:  │                   │
       │                   │        ["A","B", │                   │
       │                   │         "C","D"],│                   │
       │                   │        correct:2 │                   │
       │                   │       }, ...],   │                   │
       │                   │       duration_min│                   │
       │                   │     }            │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │  12. Validate:    │                   │
       │                   │                   │      - course      │                   │
       │                   │                   │        exists     │                   │
       │                   │                   │      - caller is  │                   │
       │                   │                   │        teacher    │                   │
       │                   │                   │      - course     │                   │
       │                   │                   │        status =   │                   │
       │                   │                   │        READY_FOR_ │                   │
       │                   │                   │        EXAM       │                   │
       │                   │                   │                   │                   │
       │                   │                   │  13. INSERT into  │                   │
       │                   │                   │      exam_        │                   │
       │                   │                   │      questions    │                   │
       │                   │                   │      table        │                   │
       │                   │                   │      (5 rows)     │                   │
       │                   │                   │                   │                   │
       │                   │                   │  14. Compute      │                   │
       │                   │                   │      answer_hash = │                   │
       │                   │                   │      keccak256(   │                   │
       │                   │                   │       [2,0,3,1,2])│                   │
       │                   │                   │                   │                   │
       │                   │                   │  15. Return:      │                   │
       │                   │                   │      answer_hash + │                   │
       │                   │                   │      duration_ms  │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │                   │  16. Build TX:    │                   │
       │                   │     call          │                   │
       │                   │     create_exam( │                   │
       │                   │       course_id, │                   │
       │                   │       answer_hash│                   │
       │                   │       duration_ms│                   │
       │                   │     )            │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  17. Verify:      │
       │                   │                   │      - caller is  │
       │                   │                   │        teacher    │
       │                   │                   │      - course     │
       │                   │                   │        status =   │
       │                   │                   │        READY_FOR_ │
       │                   │                   │        EXAM       │
       │                   │                   │      - no existing│                   │
       │                   │                   │        exam        │                   │
       │                   │                   │                   │
       │                   │                   │  18. Store in     │
       │                   │                   │      Course:      │
       │                   │                   │      - answer_hash│
       │                   │                   │      - duration_ms│
       │                   │                   │      - exam_start │
       │                   │                   │        = 0        │
       │                   │                   │                   │
       │                   │                   │  19. Set status = │
       │                   │                   │      EXAM_READY   │
       │                   │                   │      (= 2)        │
       │                   │                   │                   │
       │                   │                   │  20. Emit:        │
       │                   │                   │      ExamCreated  │
       │                   │                   │      Event {       │
       │                   │                   │        course_id, │
       │                   │                   │        duration_ms│
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │                   │                   │  21. Event        │
       │                   │                   │      Listener     │
       │                   │                   │      catches      │
       │                   │                   │      ExamCreated  │
       │                   │                   │                   │
       │                   │                   │  22. UPDATE courses│
       │                   │                   │      SET status=2 │
       │                   │                   │                   │
       │                   │                   │  23. WebSocket    │
       │                   │                   │      NOTIFY all  │
       │                   │                   │      enrolled     │
       │                   │                   │      students:    │
       │                   │                   │      "Exam ready! │
       │                   │                   │       Waiting for│
       │                   │                   │       teacher..." │
       │                   │◀──────────────────│                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  24. Show:        │                   │                   │
       │     "Exam created!│                   │                   │
       │      Click START  │                   │                   │
       │      EXAM when    │                   │                   │
       │      ready"       │                   │                   │
       │◀──────────────────│                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-4 | View course, see "Create Exam" button when status=READY_FOR_EXAM | Query course details | — |
| 5-7 | Display exam creation form (5 questions, options, correct answer, duration), collect input | — | — |
| 8-10 | Validate form, extract correct_answers array, compute keccak256 hash client-side | — | — |
| 11-15 | POST questions to backend for storage | Validate teacher owns course & status=READY_FOR_EXAM, INSERT 5 rows into exam_questions, compute answer_hash server-side, return hash + duration | — |
| 16 | Build TX with answer_hash and duration_ms | — | — |
| 17-20 | Wait for TX confirmation | — | Verify teacher, status=READY_FOR_EXAM, no existing exam. Store hash/duration, set status=EXAM_READY, emit event |
| 21-23 | — | Event listener catches ExamCreated, update DB status=2, notify students via WebSocket | — |
| 24 | Show exam created, display "START EXAM NOW" button | — | — |

---

## 🔄 FLOW 5: Teacher Starts Exam (Synchronized Start)

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teacher   │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Teacher views │                   │                   │
       │     course with   │                   │                   │
       │     status =      │                   │                   │
       │     EXAM_READY    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/courses/:id             │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  3. Verify status │
       │                   │                   │     = 2           │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  4. Display:      │                   │                   │
       │   ┌───────────────────────────┐        │                   │
       │   │ ⚡ EXAM READY              │        │                   │
       │   │                           │        │                   │
       │   │ 5/5 students enrolled     │        │                   │
       │   │ Duration: 10 minutes      │        │                   │
       │   │ Questions: 5              │        │                   │
       │   │                           │        │                   │
       │   │ [🔴 START EXAM NOW]       │        │                   │
       │   │                           │        │                   │
       │   │ ⚠️ All students will      │        │                   │
       │   │ receive the exam at once  │        │                   │
       │   └───────────────────────────┘        │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  5. Click         │                   │                   │
       │     [START EXAM   │                   │                   │
       │           NOW]    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  6. Show confirm: │                   │                   │
       │     "Start exam?  │                   │                   │
       │      All students  │                   │                   │
       │      will be       │                   │                   │
       │      notified."    │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  7. Confirm       │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  8. Build TX:    │                   │
       │                   │     call          │                   │
       │                   │     start_exam(  │                   │
       │                   │       course_id   │                   │
       │                   │     )             │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  9. Verify:        │
       │                   │                   │      - caller is  │
       │                   │                   │        teacher    │
       │                   │                   │      - status =    │
       │                   │                   │        EXAM_READY │
       │                   │                   │        (= 2)      │
       │                   │                   │      - exam not   │
       │                   │                   │        already    │
       │                   │                   │        started    │
       │                   │                   │                   │
       │                   │                   │  10. Record:      │
       │                   │                   │      exam_start_  │
       │                   │                   │      time =       │
       │                   │                   │      tx_context_   │
       │                   │                   │      timestamp()  │
       │                   │                   │                   │
       │                   │                   │  11. Calculate:   │
       │                   │                   │      exam_deadline│
       │                   │                   │      = start_time │
       │                   │                   │        + duration │
       │                   │                   │                   │
       │                   │                   │  12. Set status = │
       │                   │                   │      EXAM_ACTIVE  │
       │                   │                   │      (= 3)        │
       │                   │                   │                   │
       │                   │                   │  13. Emit:        │
       │                   │                   │      ExamStarted   │
       │                   │                   │      Event {       │
       │                   │                   │        course_id, │
       │                   │                   │        start_time,│
       │                   │                   │        deadline   │
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │                   │                   │                   │
       │   ═══ PARALLEL: Notify All Students ═══                │
       │                   │                   │                   │
       │                   │                   │                   │
       │                   │                   │  14. Event        │
       │                   │                   │      Listener      │
       │                   │                   │      catches      │
       │                   │                   │      ExamStarted   │
       │                   │                   │                   │
       │                   │                   │  15. UPDATE       │
       │                   │                   │      courses SET   │
       │                   │                   │      status=3,    │
       │                   │                   │      exam_start_  │
       │                   │                   │      time,        │
       │                   │                   │      exam_deadline│
       │                   │                   │                   │
       │                   │                   │  16. WebSocket    │
       │                   │                   │      BROADCAST to │
       │                   │                   │      ALL enrolled │
       │                   │                   │      students:    │
       │                   │                   │      {            │
       │                   │                   │        type:      │
       │                   │                   │        "exam_     │
       │                   │                   │         started", │
       │                   │                   │        course_id, │
       │                   │                   │        deadline   │
       │                   │                   │      }             │
       │                   │                   │                   │
       │                   │                   │  17. Schedule     │
       │                   │                   │      auto-submit  │
       │                   │                   │      job at       │
       │                   │                   │      deadline +   │
       │                   │                   │      30s grace    │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  18. Show:        │                   │                   │
       │     "Exam started!│                   │                   │
       │      Monitoring   │                   │                   │
       │      submissions" │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │   ═══ STUDENT SIDE (All enrolled students receive) ═══   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  ╔════════════════════════════════════╗                 │
       │  ║  📢 EXAM STARTED!                ║                 │
       │  ║                                   ║                 │
       │  ║  Course: Blockchain Basics        ║                 │
       │  ║  Time remaining: 10:00            ║                 │
       │  ║                                   ║                 │
       │  ║  [Enter Exam Now]                ║                 │
       │  ╚════════════════════════════════════╝                 │
       │◀──────────────────│                   │                   │
       │  (WebSocket push) │                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-4 | View course with status=EXAM_READY, show "START EXAM NOW" button | Query course details | — |
| 5-7 | Teacher clicks start, confirms | — | — |
| 8 | Build TX calling start_exam(course_id) | — | — |
| 9-13 | Wait for TX | — | Verify teacher + status=EXAM_READY. Record exam_start_time from blockchain timestamp. Calculate exam_deadline. Set status=EXAM_ACTIVE. Emit ExamStarted event |
| 14-17 | — | Event listener catches ExamStarted, update DB (status=3, times), broadcast WebSocket to all students, schedule auto-submit job | — |
| 18 | Show monitoring dashboard to teacher | — | — |

---

## 🔄 FLOW 6: Student Takes Exam (Synchronized)

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Student   │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  ═══ PHASE 1: Waiting for Exam ═══    │                   │
       │                   │                   │                   │
       │  1. Student views │                   │                   │
       │     enrolled      │                   │                   │
       │     course page   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/exams/:courseId/status   │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  3. Query course │
       │                   │                   │     status +     │
       │                   │                   │     start_time   │
       │                   │                   │     + deadline   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  4. Display:      │                   │                   │
       │   ┌────────────────────────────┐        │                   │
       │   │ ⏳ Waiting for exam to    │        │                   │
       │   │    start...               │        │                   │
       │   │                           │        │                   │
       │   │ 🔔 You'll be notified     │        │                   │
       │   │    when the teacher       │        │                   │
       │   │    starts the exam        │        │                   │
       │   │                           │        │                   │
       │   │ [Enable Notifications]    │        │                   │
       │   └────────────────────────────┘        │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  ═══ PHASE 2: Exam Started (WebSocket Push) ═══          │
       │                   │                   │                   │
       │                   │                   │                   │
       │  5. WebSocket:   │                   │                   │
       │     { type:       │                   │                   │
       │       "exam_     │                   │                   │
       │        started", │                   │                   │
       │       course_id, │                   │                   │
       │       deadline } │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  6. Show:         │                   │                   │
       │     "EXAM STARTED!│                   │                   │
       │      Enter now!" │                   │                   │
       │     [Enter Exam]  │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  7. Click         │                   │                   │
       │     [Enter Exam] │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  8. GET /api/exams/:courseId/questions│                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  9. Verify:       │
       │                   │                   │      - student is │
       │                   │                   │        enrolled  │
       │                   │                   │      - course     │
       │                   │                   │        status =   │
       │                   │                   │        EXAM_      │
       │                   │                   │        ACTIVE (=3)│
       │                   │                   │                   │
       │                   │                   │  10. Query        │
       │                   │                   │      exam_        │
       │                   │                   │      questions    │
       │                   │                   │      WHERE course │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  11. Display      │                   │                   │
       │     exam UI:       │                   │                   │
       │   ┌──────────────────────────────┐    │                   │
       │   │ ⏱️ Time: 09:58              │    │                   │
       │   │                              │    │                   │
       │   │ Q1: What is 2+2?            │    │                   │
       │   │ ○ A. 3                       │    │                   │
       │   │ ● B. 4  ← Selected          │    │                   │
       │   │ ○ C. 5                       │    │                   │
       │   │ ○ D. 6                       │    │                   │
       │   │                              │    │                   │
       │   │ Q2: ...                      │    │                   │
       │   │ ...                          │    │                   │
       │   │                              │    │                   │
       │   │ Q3: [Unanswered] ⚠️         │    │                   │
       │   │ ...                          │    │                   │
       │   │                              │    │                   │
       │   │ [SUBMIT ANSWERS]            │    │                   │
       │   └──────────────────────────────┘    │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  ═══ PHASE 3: Answering & Auto-save ═══                 │
       │                   │                   │                   │
       │                   │                   │                   │
       │  12. Student      │                   │                   │
       │     selects       │                   │                   │
       │     answer for Q1 │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  13. Auto-save to │                   │
       │                   │      localStorage:│                   │
       │                   │      {            │                   │
       │                   │        course_id, │                   │
       │                   │        answers:   │                   │
       │                   │          [null,    │                   │
       │                   │           null,    │                   │
       │                   │           null,    │                   │
       │                   │           null,    │                   │
       │                   │           null]   │                   │
       │                   │      }            │                   │
       │                   │                   │                   │
       │  14. Student      │                   │                   │
       │     selects Q2   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  15. Update       │                   │
       │                   │      localStorage:│                   │
       │                   │      answers:     │                   │
       │                   │        [2, null,  │                   │
       │                   │         null,     │                   │
       │                   │         null,     │                   │
       │                   │         null]     │                   │
       │                   │                   │                   │
       │  ... Student answers all questions ...│                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  ═══ PHASE 3A: Early Submit ═══       │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  16. Click        │                   │                   │
       │     [SUBMIT       │                   │                   │
       │      ANSWERS]    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  17. Verify:      │                   │
       │                   │      current_time │                   │
       │                   │      < exam_      │                   │
       │                   │      deadline     │                   │
       │                   │                   │                   │
       │                   │  18. Show confirm:│                   │
       │                   │      "Submit now? │                   │
       │                   │       X questions │                   │
       │                   │       unanswered" │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  19. Confirm      │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  20. Read final   │                   │
       │                   │      answers from │                   │
       │                   │      localStorage│                   │
       │                   │      e.g. [0,2,1,3,0]               │
       │                   │                   │                   │
       │                   │  21. Build TX:    │                   │
       │                   │      submit_      │                   │
       │                   │      answers(     │                   │
       │                   │        course_id, │                   │
       │                   │        answers    │                   │
       │                   │      )            │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  22. Verify:       │
       │                   │                   │      - caller is  │
       │                   │                   │        enrolled   │
       │                   │                   │      - status =   │
       │                   │                   │        EXAM_      │
       │                   │                   │        ACTIVE     │
       │                   │                   │      - not already│
       │                   │                   │        submitted │
       │                   │                   │                   │
       │                   │                   │  23. Compute:     │
       │                   │                   │      answers_hash │
       │                   │                   │      = keccak256  │
       │                   │                   │      (answers)    │
       │                   │                   │                   │
       │                   │                   │  24. Record       │
       │                   │                   │      Submission { │
       │                   │                   │        answers_  │
       │                   │                   │        hash,      │
       │                   │                   │        submitted_ │
       │                   │                   │        at = now,  │
       │                   │                   │        is_auto_  │
       │                   │                   │        submit =   │
       │                   │                   │        false     │
       │                   │                   │      }            │
       │                   │                   │                   │
       │                   │                   │  25. Emit:        │
       │                   │                   │      AnswerSub-   │
       │                   │                   │      mitted Event│
       │                   │                   │      {             │
       │                   │                   │        course_id, │
       │                   │                   │        student,   │
       │                   │                   │        submitted_│
       │                   │                   │        at         │
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │  26. Show:        │                   │                   │
       │     "Answers      │                   │                   │
       │      submitted!"  │                   │                   │
       │     Show waiting  │                   │                   │
       │     screen        │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │                   │                   │                   │
       │  ═══ PHASE 3B: Deadline Reached (Auto-Submit) ═══       │
       │                   │                   │                   │
       │                   │                   │                   │
       │  27. Countdown    │                   │                   │
       │     reaches 0:00 │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  28. Read from    │                   │
       │                   │      localStorage│                   │
       │                   │      (current     │                   │
       │                   │      answers,     │                   │
       │                   │      null for any│                   │
       │                   │      unanswered) │                   │
       │                   │                   │                   │
       │                   │  29. Replace null │                   │
       │                   │      with 255    │                   │
       │                   │      (unanswered │                   │
       │                   │      marker)     │                   │
       │                   │      e.g.         │                   │
       │                   │      [0,2,255,3,255]                  │
       │                   │                   │                   │
       │                   │  30. Auto-submit: │                   │
       │                   │      call          │                   │
       │                   │      submit_       │                   │
       │                   │      answers(     │                   │
       │                   │        course_id, │                   │
       │                   │        answers    │                   │
       │                   │      )            │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │  ── OR if frontend fails ──            │                   │
       │                   │                   │                   │
       │                   │                   │  31. Backend      │
       │                   │                   │      auto-submit  │
       │                   │                   │      job runs at  │
       │                   │                   │      deadline +   │
       │                   │                   │      30s grace     │
       │                   │                   │                   │
       │                   │                   │  32. For each     │
       │                   │                   │      unsubmitted  │
       │                   │                   │      student:     │
       │                   │                   │      call auto_   │
       │                   │                   │      submit_for_  │
       │                   │                   │      student(     │
       │                   │                   │        course_id, │
       │                   │                   │        student)   │
       │                   │                   │                   │
       │                   │                   │  33. For auto-    │
       │                   │                   │      submitted:   │
       │                   │                   │      Submission { │
       │                   │                   │        answers_   │
       │                   │                   │        hash =     │
       │                   │                   │        keccak256  │
       │                   │                   │        ([255,255, │
       │                   │                   │         255,255,  │
       │                   │                   │         255]),    │
       │                   │                   │        is_auto_  │
       │                   │                   │        submit =  │
       │                   │                   │        true,       │
       │                   │                   │        submitted_│
       │                   │                   │        at =      │
       │                   │                   │        deadline  │
       │                   │                   │      }            │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │  34. Show:        │                   │                   │
       │     "Time's up!   │                   │                   │
       │      Answers auto- │                   │                   │
       │      submitted"   │                   │                   │
       │◀──────────────────│                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-4 | Display waiting screen for enrolled course | Query course exam status, return status + start_time + deadline | — |
| 5-6 | Receive WebSocket "exam_started" event, show notification | — | — |
| 7-10 | Student enters exam, fetch questions | Verify enrolled + EXAM_ACTIVE, return questions | — |
| 11-15 | Display exam UI with countdown timer (synced to on-chain deadline). Auto-save answers to localStorage on every change | — | — |
| 16-25 | Student clicks Submit, build TX with answers array, submit on-chain | — | Verify enrolled + EXAM_ACTIVE + not already submitted. Compute hash, store submission with timestamp |
| 26 | Show submission confirmation | — | — |
| 27-30 | On deadline: read localStorage, replace null→255 for unanswered, auto-submit TX | — | Same verification, mark is_auto_submit |
| 31-33 | If frontend fails: backend auto-submit job at deadline+30s, submit empty answers (all 255) for each unsubmitted student | — | Verify deadline passed, store auto-submitted answers as all 255s |
| 34 | Show "time's up" message | — | — |

---

## 🔄 FLOW 7: Teacher Reveals Answers & Scores

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Teacher   │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Teacher views │                   │                   │
       │     course page   │                   │                   │
       │     (status =     │                   │                   │
       │      EXAM_ACTIVE  │                   │                   │
       │      or all       │                   │                   │
       │      submitted)   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/courses/:id/submissions  │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  3. Query         │
       │                   │                   │     submissions   │
       │                   │                   │     for course    │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  4. Display:      │                   │                   │
       │   ┌──────────────────────────────┐    │                   │
       │   │ Submissions: 4/5            │    │                   │
       │   │                             │    │                   │
       │   │ Student A: ✅ Submitted     │    │                   │
       │   │ Student B: ✅ Submitted     │    │                   │
       │   │ Student C: ✅ Auto-submitted│    │                   │
       │   │ Student D: ✅ Auto-submitted│    │                   │
       │   │ Student E: ⏳ Waiting...    │    │                   │
       │   │                             │    │                   │
       │   │ ⏱️ Deadline: 14:30 UTC     │    │                   │
       │   │                             │    │                   │
       │   │ [Reveal & Score]           │    │                   │
       │   │ (Enabled after deadline)   │    │                   │
       │   └──────────────────────────────┘    │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  5. Deadline      │                   │                   │
       │     passes (or   │                   │                   │
       │     all submit): │                   │                   │
       │     Click         │                   │                   │
       │     [Reveal &     │                   │                   │
       │      Score]       │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  6. GET /api/courses/:id/exam/answers │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  7. Verify caller │
       │                   │                   │     is teacher,   │
       │                   │                   │     query         │
       │                   │                   │     exam_         │
       │                   │                   │     questions     │
       │                   │                   │     for course    │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  8. Show answer   │                   │                   │
       │     confirmation: │                   │                   │
       │   ┌──────────────────────────────┐    │                   │
       │   │ Confirm correct answers:     │    │                   │
       │   │                              │    │                   │
       │   │ Q1: 2+2=? → B (idx 1)      │    │                   │
       │   │ Q2: Capital? → C (idx 2)   │    │                   │
       │   │ Q3: 3*3=? → D (idx 3)      │    │                   │
       │   │ Q4: 10/2=? → A (idx 0)     │    │                   │
       │   │ Q5: SUI? → B (idx 1)       │    │                   │
       │   │                              │    │                   │
       │   │ Confirm: [2, 0, 3, 0, 1]   │    │                   │
       │   │                              │    │                   │
       │   │ [CONFIRM & SCORE]           │    │                   │
       │   └──────────────────────────────┘    │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  9. Confirm       │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  10. Build TX:    │                   │
       │                   │      reveal_and_  │                   │
       │                   │      score(       │                   │
       │                   │        course,    │                   │
       │                   │        answer_key │                   │
       │                   │        = [2,0,3,0,1]                  │
       │                   │      )            │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  11. Verify:      │
       │                   │                   │      - caller is  │
       │                   │                   │        teacher    │
       │                   │                   │      - status =   │
       │                   │                   │        EXAM_      │
       │                   │                   │        ACTIVE     │
       │                   │                   │        (or SCORED)│
       │                   │                   │      - all students│
       │                   │                   │        submitted  │
       │                   │                   │        OR deadline │
       │                   │                   │        passed     │
       │                   │                   │                   │
       │                   │                   │  12. ANTI-CHEAT:  │
       │                   │                   │      Verify:      │
       │                   │                   │      keccak256(  │
       │                   │                   │        answer_key│
       │                   │                   │      ) == stored │
       │                   │                   │        answer_hash│
       │                   │                   │                   │
       │                   │                   │  13. Score each  │
       │                   │                   │      student:     │
       │                   │                   │                   │
       │                   │                   │      Student A:   │
       │                   │                   │        [0,2,1,3,0]│
       │                   │                   │        vs [2,0,3,0,1]│
       │                   │                   │        Match: 2/5  │
       │                   │                   │        Score: 40%  │
       │                   │                   │                   │
       │                   │                   │      Student B:   │
       │                   │                   │        [2,0,3,0,1]│
       │                   │                   │        vs [2,0,3,0,1]│
       │                   │                   │        Match: 5/5  │
       │                   │                   │        Score: 100% │
       │                   │                   │                   │
       │                   │                   │      Student C:   │
       │                   │                   │        [2,1,255,0,255]│
       │                   │                   │        vs [2,0,3,0,1]│
       │                   │                   │        Match: 2/5  │
       │                   │                   │        (255=0pt)  │
       │                   │                   │        Score: 40%  │
       │                   │                   │                   │
       │                   │                   │  14. Sort by:     │
       │                   │                   │      score DESC,  │
       │                   │                   │      time ASC     │
       │                   │                   │                   │
       │                   │                   │      1. B: 100%   │
       │                   │                   │         2min      │
       │                   │                   │      2. A: 40%    │
       │                   │                   │         3min      │
       │                   │                   │      3. C: 40%    │
       │                   │                   │         5min     │
       │                   │                   │                   │
       │                   │                   │  15. Assign ranks:│
       │                   │                   │      B = rank 1  │
       │                   │                   │      A = rank 2  │
       │                   │                   │      C = rank 3  │
       │                   │                   │                   │
       │                   │                   │  16. Store Result │
       │                   │                   │      for each     │
       │                   │                   │      student:     │
       │                   │                   │      { score,    │
       │                   │                   │        percentage,│
       │                   │                   │        time_taken,│
       │                   │                   │        rank,     │
       │                   │                   │        reward_amt }│
       │                   │                   │                   │
       │                   │                   │  17. Set status = │
       │                   │                   │      SCORED (=4) │
       │                   │                   │                   │
       │                   │                   │  18. Emit:        │
       │                   │                   │      ExamScored   │
       │                   │                   │      Event {      │
       │                   │                   │        course_id, │
       │                   │                   │        results    │
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │                   │                   │  19. Event        │
       │                   │                   │      Listener     │
       │                   │                   │      catches      │
       │                   │                   │      ExamScored   │
       │                   │                   │                   │
       │                   │                   │  20. INSERT into  │
       │                   │                   │      results table│
       │                   │                   │      for each     │
       │                   │                   │      student      │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  21. Show results:│                   │                   │
       │   ┌──────────────────────────────┐    │                   │
       │   │ 🏆 Results                   │    │                   │
       │   │                              │    │                   │
       │   │ #1 Student B: 100% (2min)  │    │                   │
       │   │ #2 Student A: 40%  (3min)  │    │                   │
       │   │ #3 Student C: 40%  (5min)  │    │                   │
       │   │                              │    │                   │
       │   │ [Distribute Rewards]        │    │                   │
       │   └──────────────────────────────┘    │                   │
       │◀──────────────────│                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-4 | View course with submission status for each student | Query submissions for course (teacher only) | — |
| 5-8 | After deadline/all submitted, click "Reveal & Score", show answer confirmation dialog | Query exam_questions for answer key, return to teacher for confirmation | — |
| 9-10 | Teacher confirms, build TX with answer_key array | — | — |
| 11-12 | Wait for TX | — | Verify teacher + status + deadline passed. **Anti-cheat**: verify keccak256(answer_key) == stored answer_hash |
| 13-16 | Wait for TX | — | Score each student (compare answers, 255=null=0pts). Sort by score DESC, time ASC. Assign ranks. Store Result objects |
| 17-18 | — | — | Set status=SCORED, emit ExamScored event |
| 19-20 | — | Event listener catches ExamScored, insert results into PostgreSQL for each student | — |
| 21 | Display results leaderboard with "Distribute Rewards" button | — | — |

---

## 🔄 FLOW 8: Distribute Rewards

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Anyone    │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Navigate to  │                   │                   │
       │     course page  │                   │                   │
       │     (status =    │                   │                   │
       │      SCORED)    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/courses/:id/results     │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  3. Query results │
       │                   │                   │     table for    │
       │                   │                   │     course       │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  4. Display:      │                   │                   │
       │   ┌────────────────────────────────────────┐              │
       │   │ 🏆 Exam Results                       │              │
       │   │                                        │              │
       │   │ Rank 1: 0xABC...  100%  (2min)  🥇    │              │
       │   │ Rank 2: 0xDEF...  80%   (5min)  🥈    │              │
       │   │ Rank 3: 0x123...  60%   (auto)  🥉    │              │
       │   │ Rank 4: 0x456...  0%    (auto)        │              │
       │   │ Rank 5: 0x789...  20%   (auto)        │              │
       │   │                                        │              │
       │   │ 💰 Reward Distribution                 │              │
       │   │ Total Pool: 500 SUI                    │              │
       │   │ Rewarded: 1 student (top 20%)          │              │
       │   │                                        │              │
       │   │ Rank 1: 100 SUI (100% tuition back)   │              │
       │   │                                        │              │
       │   │ Teacher: 400 SUI                       │              │
       │   │                                        │              │
       │   │ [DISTRIBUTE REWARDS]                   │              │
       │   └────────────────────────────────────────┘              │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  5. Click         │                   │                   │
       │     [DISTRIBUTE   │                   │                   │
       │      REWARDS]     │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  6. Build TX:     │                   │
       │                   │     distribute_   │                   │
       │                   │     rewards(      │                   │
       │                   │       course_id   │                   │
       │                   │     )             │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  7. Verify:        │
       │                   │                   │      - status =   │
       │                   │                   │        SCORED (=4)│
       │                   │                   │      - not already│
       │                   │                   │        distributed│
       │                   │                   │                   │
       │                   │                   │  8. Calculate:    │
       │                   │                   │      total_students│
       │                   │                   │        = 5        │
       │                   │                   │      tuition = 100 │
       │                   │                   │        SUI         │
       │                   │                   │                   │
       │                   │                   │      rewarded_    │
       │                   │                   │      count =      │
       │                   │                   │      FLOOR(5*0.20)│
       │                   │                   │      = 1          │
       │                   │                   │                   │
       │                   │                   │  9. Calculate     │
       │                   │                   │     rewards per   │
       │                   │                   │     rank:         │
       │                   │                   │                   │
       │                   │                   │     Rank 1:       │
       │                   │                   │      100% × 100   │
       │                   │                   │      = 100 SUI    │
       │                   │                   │                   │
       │                   │                   │  10. Calculate    │
       │                   │                   │      teacher      │
       │                   │                   │      share:       │
       │                   │                   │      total_pool =  │
       │                   │                   │      5 × 100 =    │
       │                   │                   │      500 SUI      │
       │                   │                   │      teacher =     │
       │                   │                   │      500 - 100 =  │
       │                   │                   │      400 SUI      │
       │                   │                   │                   │
       │                   │                   │  11. Transfer SUI │
       │                   │                   │      from escrow  │
       │                   │                   │      to winners:  │
       │                   │                   │                   │
       │                   │                   │      Rank 1:      │
       │                   │                   │        100 SUI →  │
       │                   │                   │        0xABC...   │
       │                   │                   │                   │
       │                   │                   │  12. Transfer     │
       │                   │                   │      remaining    │
       │                   │                   │      to teacher:  │
       │                   │                   │                   │
       │                   │                   │      400 SUI →    │
       │                   │                   │      teacher      │
       │                   │                   │      address      │
       │                   │                   │                   │
       │                   │                   │  13. Set status = │
       │                   │                   │      REWARDS_     │
       │                   │                   │      DISTRIBUTED  │
       │                   │                   │      (= 5)        │
       │                   │                   │                   │
       │                   │                   │  14. Emit:        │
       │                   │                   │      RewardsDist-  │
       │                   │                   │      ributed Event│
       │                   │                   │      {             │
       │                   │                   │        course_id, │
       │                   │                   │        winners,   │
       │                   │                   │        amounts,   │
       │                   │                   │        teacher_   │
       │                   │                   │        amount     │
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │                   │                   │  15. Event        │
       │                   │                   │      Listener     │
       │                   │                   │      catches      │
       │                   │                   │      RewardsDist-  │
       │                   │                   │      ributed      │
       │                   │                   │                   │
       │                   │                   │  16. UPDATE       │
       │                   │                   │      results SET  │
       │                   │                   │      reward_      │
       │                   │                   │      amount,      │
       │                   │                   │      rewarded_at  │
       │                   │                   │                   │
       │                   │                   │  17. UPDATE       │
       │                   │                   │      courses SET  │
       │                   │                   │      status = 5   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  18. Show final   │                   │                   │
       │     results:     │                   │                   │
       │   ┌──────────────────────────────────┐│                   │
       │   │ ✅ Rewards Distributed!          ││                   │
       │   │                                  ││                   │
       │   │ 🏆 Final Leaderboard            ││                   │
       │   │                                  ││                   │
       │   │ #1 0xABC... 100% → 💰 100 SUI  ││                   │
       │   │ #2 0xDEF... 80%  → 0 SUI        ││                   │
       │   │ #3 0x123... 60%  → 0 SUI        ││                   │
       │   │ #4 0x456... 0%   → 0 SUI        ││                   │
       │   │ #5 0x789... 20%  → 0 SUI        ││                   │
       │   │                                  ││                   │
       │   │ 👨‍🏫 Teacher: 400 SUI              ││                   │
       │   └──────────────────────────────────┘│                   │
       │◀──────────────────│                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-4 | Navigate to course results page, show leaderboard with reward preview | Query results table for course, calculate preview reward distribution | — |
| 5-6 | Click "Distribute Rewards", build and sign TX | — | — |
| 7-14 | Wait for TX | — | Verify status=SCORED and not already distributed. Calculate: rewarded_count=FLOOR(total*0.20), min 1. Calculate rewards per rank (100%, 50%, 25%...). Transfer SUI from escrow to each winner. Transfer remaining to teacher. Set status=REWARDS_DISTRIBUTED. Emit event |
| 15-17 | — | Event listener catches RewardsDistributed, update results table with reward amounts, update course status=5 | — |
| 18 | Show final leaderboard with actual reward amounts received | — | — |

---

## 🔄 FLOW 9: View Results (Public)

```
Sequence Diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Anyone    │────▶│  Front-End  │────▶│   Back-End  │────▶│   Contract  │
│  (Browser)  │◀────│   (React)   │◀────│  (Node.js)  │◀────│    (SUI)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │  1. Navigate to   │                   │                   │
       │     course page   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │  2. GET /api/courses/:id/results     │                   │
       │──────────────────▶│──────────────────▶│                   │
       │                   │                   │  3. Query results │
       │                   │                   │     table for    │
       │                   │                   │     course       │
       │                   │                   │     + enrollment │
       │                   │                   │     info          │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │  4. Display       │                   │                   │
       │     leaderboard:  │                   │                   │
       │                   │                   │                   │
       │   ┌────────────────────────────────┐  │                   │
       │   │ 🏆 Course Results             │  │                   │
       │   │ Course: Blockchain Basics     │  │                   │
       │   │ Status: Rewards Distributed   │  │                   │
       │   │                                │  │                   │
       │   │ Rank | Student    | Score | 💰│  │                   │
       │   │ ─────┼────────────┼───────┼───│  │                   │
       │   │  1   | 0xABC...  | 100% | 100│  │                   │
       │   │  2   | 0xDEF...  |  80% |  0 │  │                   │
       │   │  3   | 0x123...  |  60% |  0 │  │                   │
       │   │  4   | 0x456...  |  20% |  0 │  │                   │
       │   │  5   | 0x789...  |   0% |  0 │  │                   │
       │   │                                │  │                   │
       │   │ Total Pool: 500 SUI           │  │                   │
       │   │ Teacher Earnings: 400 SUI    │  │                   │
       │   └────────────────────────────────┘  │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │  5. (Optional)    │                   │                   │
       │     Click          │                   │                   │
       │     [Verify on     │                   │                   │
       │      Chain]        │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  6. Call          │                   │
       │                   │     get_course_   │                   │
       │                   │     results()     │                   │
       │                   │────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │                   │  7. Return:       │
       │                   │                   │      vector of    │
       │                   │                   │      ResultView {│
       │                   │                   │        student,   │
       │                   │                   │        score,     │
       │                   │                   │        rank,      │
       │                   │                   │        reward     │
       │                   │                   │      }             │
       │                   │◀────────────────────────────────────│
       │                   │                   │                   │
       │                   │  8. Compare DB   │                   │
       │                   │     results with │                   │
       │                   │     on-chain data│                   │
       │                   │                   │                   │
       │  9. Show:         │                   │                   │
       │     "✅ Verified  │                   │                   │
       │      On-chain data│                   │                   │
       │      matches DB"  │                   │                   │
       │◀──────────────────│                   │                   │
```

**What Each Layer Does**

| Step | Front-End | Back-End | Contract |
|------|-----------|----------|----------|
| 1-3 | Navigate to course results, show leaderboard | Query results + enrollments from DB | — |
| 4 | Display formatted leaderboard with scores and rewards | — | — |
| 5-7 | Optional: click "Verify on Chain" to cross-reference | Call get_course_results() on-chain to read stored results | Return vector of ResultView (read-only, no TX) |
| 8-9 | Show verification status (DB matches on-chain or mismatch warning) | Compare DB results with on-chain data | — |

---

## Summary: All 9 Flows

| # | Flow | Trigger | Final Status |
|---|------|---------|-------------|
| 1 | **Wallet Connection & Role Assignment** | User connects wallet | Role stored permanently in DB |
| 2 | **Student Enrollment & Payment** | Student clicks "Enroll & Pay" | ENROLLING → READY_FOR_EXAM (if min reached) |
| 3 | **Teacher Creates Course** | Teacher fills form + signs TX | Course created, status=ENROLLING |
| 4 | **Teacher Creates Exam** | Teacher creates 5 questions + answers | READY_FOR_EXAM → EXAM_READY |
| 5 | **Teacher Starts Exam** | Teacher clicks "START EXAM NOW" | EXAM_READY → EXAM_ACTIVE |
| 6 | **Student Takes Exam** | WebSocket notification + student enters | Students submit or auto-submit |
| 7 | **Teacher Reveals & Scores** | Teacher confirms answer key | EXAM_ACTIVE → SCORED |
| 8 | **Distribute Rewards** | Anyone clicks "Distribute Rewards" | SCORED → REWARDS_DISTRIBUTED |
| 9 | **View Results** | Anyone navigates to results page | Read-only display |