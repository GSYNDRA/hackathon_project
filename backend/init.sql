-- ==========================================
-- Sui Teaching Platform - Database Schema
-- ==========================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS chain_events CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS exam_questions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ==========================================
-- USERS (Off-chain identity)
-- ==========================================
CREATE TABLE user_profiles (
    wallet_address VARCHAR(66) PRIMARY KEY,
    username VARCHAR(100),
    role VARCHAR(20) CHECK (role IN ('teacher', 'student')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- COURSES (Hybrid: metadata off-chain, core on-chain)
-- ==========================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    on_chain_id VARCHAR(66) UNIQUE NOT NULL,
    teacher_address VARCHAR(66) NOT NULL REFERENCES user_profiles(wallet_address),
    
    -- Metadata (off-chain)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    thumbnail_url TEXT,
    
    -- Config (mirrors on-chain)
    tuition_amount BIGINT NOT NULL,
    max_students SMALLINT DEFAULT 5,
    min_students SMALLINT DEFAULT 2,
    status SMALLINT DEFAULT 0,
    
    -- Exam timing (for synchronized exam)
    exam_start_time TIMESTAMP,
    exam_deadline TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- QUESTIONS (Off-chain only)
-- ==========================================
CREATE TABLE exam_questions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    question_number SMALLINT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,  -- ["A. option1", "B. option2", ...]
    correct_answer_idx SMALLINT NOT NULL,  -- 0-3
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, question_number)
);

-- ==========================================
-- ENROLLMENTS (Synced from chain events)
-- ==========================================
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_address VARCHAR(66) NOT NULL REFERENCES user_profiles(wallet_address),
    amount_paid BIGINT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    on_chain_tx_digest VARCHAR(88),
    UNIQUE(course_id, student_address)
);

-- ==========================================
-- SUBMISSIONS (Synced from chain events)
-- ==========================================
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_address VARCHAR(66) NOT NULL,
    answers JSONB NOT NULL,  -- [0, 2, 1, null, 0] where null = unanswered
    answers_hash VARCHAR(66) NOT NULL,
    submitted_at TIMESTAMP,
    time_taken_seconds INTEGER,
    is_auto_submit BOOLEAN DEFAULT FALSE,
    on_chain_tx_digest VARCHAR(88),
    UNIQUE(course_id, student_address)
);

-- ==========================================
-- RESULTS (Synced from chain events)
-- ==========================================
CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    student_address VARCHAR(66) NOT NULL,
    score SMALLINT NOT NULL,
    percentage SMALLINT NOT NULL,
    correct_count SMALLINT NOT NULL,
    total_questions SMALLINT NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    rank_position SMALLINT NOT NULL,
    reward_amount BIGINT,
    scored_at TIMESTAMP,
    rewarded_at TIMESTAMP,
    UNIQUE(course_id, student_address)
);

-- ==========================================
-- CHAIN EVENTS (Raw event log for replay/debug)
-- ==========================================
CREATE TABLE chain_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    course_on_chain_id VARCHAR(66),
    sender_address VARCHAR(66),
    tx_digest VARCHAR(88) NOT NULL,
    event_data JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES for performance
-- ==========================================
CREATE INDEX idx_courses_teacher ON courses(teacher_address);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_address);
CREATE INDEX idx_submissions_course ON submissions(course_id);
CREATE INDEX idx_submissions_student ON submissions(student_address);
CREATE INDEX idx_results_course ON results(course_id);
CREATE INDEX idx_results_course_rank ON results(course_id, rank_position);
CREATE INDEX idx_chain_events_processed ON chain_events(processed);
CREATE INDEX idx_chain_events_course ON chain_events(course_on_chain_id);

-- ==========================================
-- STATUS ENUM VALUES (for reference)
-- ==========================================
-- 0 = ENROLLING (Students can enroll)
-- 1 = READY_FOR_EXAM (Min students reached, teacher can create exam)
-- 2 = EXAM_READY (Exam created, waiting for teacher to start)
-- 3 = EXAM_ACTIVE (Teacher started countdown, exam in progress)
-- 4 = SCORED (Answers revealed and scored)
-- 5 = REWARDS_DISTRIBUTED (Money distributed, course complete)

-- ==========================================
-- SAMPLE DATA (Optional - for demo/testing)
-- ==========================================

-- Demo Teacher
INSERT INTO user_profiles (wallet_address, username, role) VALUES
('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'Demo Teacher', 'teacher')
ON CONFLICT (wallet_address) DO NOTHING;

-- Demo Students
INSERT INTO user_profiles (wallet_address, username, role) VALUES
('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'Student A', 'student'),
('0x1111111111111111111111111111111111111111111111111111111111111111', 'Student B', 'student'),
('0x2222222222222222222222222222222222222222222222222222222222222222', 'Student C', 'student'),
('0x3333333333333333333333333333333333333333333333333333333333333333', 'Student D', 'student'),
('0x4444444444444444444444444444444444444444444444444444444444444444', 'Student E', 'student')
ON CONFLICT (wallet_address) DO NOTHING;
