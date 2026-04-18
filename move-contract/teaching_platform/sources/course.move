#[allow(unused_const, unused_field, duplicate_alias)]
module teaching_platform::course {
    use sui::balance::{Self as balance};
    use sui::coin::{Self as coin};
    use sui::event;
    use sui::object;
    use sui::sui::SUI;
    use sui::table::{Self as table};
    use sui::transfer;
    use sui::tx_context;
    use sui::vec_set::{Self as vec_set};
    use sui::hash;
    use sui::clock::{Self as clock, Clock};
    use std::string::{Self as string};

    const ENROLLING: u8 = 0;
    const READY_FOR_EXAM: u8 = 1;
    const EXAM_ACTIVE: u8 = 2;
    const SCORED: u8 = 3;
    const REWARDS_DISTRIBUTED: u8 = 4;

    const MIN_ALLOWED_STUDENTS: u8 = 2;
    const MAX_ALLOWED_STUDENTS: u8 = 5;
    const ANSWER_HASH_LENGTH: u64 = 32;

    const EInsufficientPayment: u64 = 0;
    const EAlreadyEnrolled: u64 = 1;
    const ECourseFull: u64 = 2;
    const ENotTeacher: u64 = 3;
    const ENotEnrolled: u64 = 4;
    const EExamNotActive: u64 = 5;
    const EAlreadySubmitted: u64 = 6;
    const ETimeExpired: u64 = 7;
    const ENotScored: u64 = 8;
    const EAlreadyDistributed: u64 = 9;
    const EAnswerHashMismatch: u64 = 10;
    const EInvalidStatus: u64 = 11;
    const EInvalidStudentLimits: u64 = 12;
    const EInvalidDuration: u64 = 13;
    const EInvalidAnswerHash: u64 = 14;
    const EInvalidTuition: u64 = 15;
    const EInvalidCourseName: u64 = 16;
    const EEnrollmentClosed: u64 = 17;
    const EAlreadyTeacher: u64 = 18;
    const EAlreadyStudent: u64 = 19;
    const ENotRegistered: u64 = 20;
    const EWrongRoleTeacher: u64 = 21;
    const EWrongRoleStudent: u64 = 22;
    const ENoSubmissions: u64 = 23;
    const EEmptyAnswerKey: u64 = 24;

    public struct Platform has key {
        id: object::UID,
        teachers: vec_set::VecSet<address>,
        students: vec_set::VecSet<address>,
    }

    public struct Course has key {
        id: object::UID,
        teacher: address,
        name: string::String,
        tuition: u64,
        max_students: u8,
        min_students: u8,
        status: u8,
        escrow: balance::Balance<SUI>,
        enrolled_count: u64,
        students: table::Table<address, StudentInfo>,
        student_order: vector<address>,
        answer_hash: vector<u8>,
        exam_deadline: u64,
        exam_duration_ms: u64,
        submissions: table::Table<address, Submission>,
        submission_order: vector<address>,
        results: table::Table<address, Result>,
        result_order: vector<address>,
    }

    public struct StudentInfo has store {
        enrolled_at: u64,
        amount_paid: u64,
    }

    public struct Submission has store {
        answers: vector<u8>,
        submitted_at: u64,
        start_time: u64,
    }

    public struct Result has store {
        score: u64,
        percentage: u8,
        time_taken_ms: u64,
        rank: u8,
        reward_amount: u64,
    }

    public struct ResultView has copy, drop {
        student: address,
        score: u64,
        percentage: u8,
        time_taken_ms: u64,
        rank: u8,
        reward_amount: u64,
    }

    public struct PlatformCreated has copy, drop {
        platform_id: address,
    }

    public struct TeacherRegistered has copy, drop {
        teacher: address,
    }

    public struct StudentRegistered has copy, drop {
        student: address,
    }

    public struct CourseCreated has copy, drop {
        course_id: address,
        teacher: address,
        tuition: u64,
        max_students: u8,
        min_students: u8,
    }

    public struct StudentEnrolled has copy, drop {
        course_id: address,
        student: address,
        amount_paid: u64,
        enrolled_count: u64,
        status: u8,
    }

    public struct ExamCreated has copy, drop {
        course_id: address,
        deadline: u64,
        duration_ms: u64,
    }

    public struct AnswersSubmitted has copy, drop {
        course_id: address,
        student: address,
    }

    public struct ExamScored has copy, drop {
        course_id: address,
        total_submissions: u64,
    }

    public struct RewardsDistributed has copy, drop {
        course_id: address,
        winner_count: u64,
        total_pool: u64,
    }

    public fun create_platform(ctx: &mut tx_context::TxContext) {
        let platform = Platform {
            id: object::new(ctx),
            teachers: vec_set::empty(),
            students: vec_set::empty(),
        };
        let platform_id = object::uid_to_address(&platform.id);
        event::emit(PlatformCreated { platform_id });
        transfer::share_object(platform);
    }

    public fun register_as_teacher(
        platform: &mut Platform,
        ctx: &mut tx_context::TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!vec_set::contains(&platform.students, &sender), EAlreadyStudent);
        assert!(!vec_set::contains(&platform.teachers, &sender), EAlreadyTeacher);
        vec_set::insert(&mut platform.teachers, sender);
        event::emit(TeacherRegistered { teacher: sender });
    }

    public fun register_as_student(
        platform: &mut Platform,
        ctx: &mut tx_context::TxContext,
    ) {
        let sender = tx_context::sender(ctx);
        assert!(!vec_set::contains(&platform.teachers, &sender), EAlreadyTeacher);
        assert!(!vec_set::contains(&platform.students, &sender), EAlreadyStudent);
        vec_set::insert(&mut platform.students, sender);
        event::emit(StudentRegistered { student: sender });
    }

    public fun is_teacher(platform: &Platform, addr: address): bool {
        vec_set::contains(&platform.teachers, &addr)
    }

    public fun is_student(platform: &Platform, addr: address): bool {
        vec_set::contains(&platform.students, &addr)
    }

    public fun get_teacher_count(platform: &Platform): u64 {
        vec_set::length(&platform.teachers)
    }

    public fun get_student_count(platform: &Platform): u64 {
        vec_set::length(&platform.students)
    }

    public fun create_course(
        platform: &Platform,
        name: vector<u8>,
        tuition: u64,
        max_students: u8,
        min_students: u8,
        ctx: &mut tx_context::TxContext,
    ) {
        assert!(is_teacher(platform, tx_context::sender(ctx)), EWrongRoleTeacher);
        assert!(vector::length(&name) > 0u64, EInvalidCourseName);
        assert!(tuition > 0u64, EInvalidTuition);
        assert!(
            max_students >= MIN_ALLOWED_STUDENTS && max_students <= MAX_ALLOWED_STUDENTS,
            EInvalidStudentLimits,
        );
        assert!(
            min_students > 0u8 && min_students <= max_students,
            EInvalidStudentLimits,
        );

        let course = Course {
            id: object::new(ctx),
            teacher: tx_context::sender(ctx),
            name: string::utf8(name),
            tuition,
            max_students,
            min_students,
            status: ENROLLING,
            escrow: balance::zero(),
            enrolled_count: 0,
            students: table::new(ctx),
            student_order: vector[],
            answer_hash: vector[],
            exam_deadline: 0,
            exam_duration_ms: 0,
            submissions: table::new(ctx),
            submission_order: vector[],
            results: table::new(ctx),
            result_order: vector[],
        };

        let course_id = object::uid_to_address(&course.id);
        event::emit(CourseCreated {
            course_id,
            teacher: course.teacher,
            tuition,
            max_students,
            min_students,
        });

        transfer::share_object(course);
    }

    public fun enroll_and_pay(
        platform: &Platform,
        course: &mut Course,
        payment: coin::Coin<SUI>,
        clock_obj: &Clock,
        ctx: &mut tx_context::TxContext,
    ) {
        assert!(is_student(platform, tx_context::sender(ctx)), EWrongRoleStudent);
        let student = tx_context::sender(ctx);
        assert!(is_enrollment_open(course), EEnrollmentClosed);
        assert!(!table::contains(&course.students, student), EAlreadyEnrolled);
        assert!(course.enrolled_count < (course.max_students as u64), ECourseFull);

        let payment_amount = coin::value(&payment);
        assert!(payment_amount == course.tuition, EInsufficientPayment);

        balance::join(&mut course.escrow, coin::into_balance(payment));

        let student_info = StudentInfo {
            enrolled_at: clock::timestamp_ms(clock_obj),
            amount_paid: payment_amount,
        };
        table::add(&mut course.students, student, student_info);
        vector::push_back(&mut course.student_order, student);

        course.enrolled_count = course.enrolled_count + 1;
        if (course.enrolled_count >= (course.min_students as u64)) {
            course.status = READY_FOR_EXAM;
        };

        event::emit(StudentEnrolled {
            course_id: object::uid_to_address(&course.id),
            student,
            amount_paid: payment_amount,
            enrolled_count: course.enrolled_count,
            status: course.status,
        });
    }

    public fun create_exam(
        course: &mut Course,
        answer_hash: vector<u8>,
        duration_ms: u64,
        clock_obj: &Clock,
        ctx: &tx_context::TxContext,
    ) {
        assert!(tx_context::sender(ctx) == course.teacher, ENotTeacher);
        assert!(course.status == READY_FOR_EXAM, EInvalidStatus);
        assert!(vector::length(&answer_hash) == ANSWER_HASH_LENGTH, EInvalidAnswerHash);
        assert!(duration_ms > 0u64, EInvalidDuration);

        course.answer_hash = answer_hash;
        course.exam_duration_ms = duration_ms;
        course.exam_deadline = clock::timestamp_ms(clock_obj) + duration_ms;
        course.status = EXAM_ACTIVE;

        event::emit(ExamCreated {
            course_id: object::uid_to_address(&course.id),
            deadline: course.exam_deadline,
            duration_ms,
        });
    }

    fun is_enrollment_open(course: &Course): bool {
        course.status == ENROLLING || course.status == READY_FOR_EXAM
    }

    public fun status_enrolling(): u8 { ENROLLING }
    public fun status_ready_for_exam(): u8 { READY_FOR_EXAM }
    public fun status_exam_active(): u8 { EXAM_ACTIVE }
    public fun status_scored(): u8 { SCORED }
    public fun status_rewards_distributed(): u8 { REWARDS_DISTRIBUTED }

    public fun get_course_status(course: &Course): u8 { course.status }
    public fun get_enrolled_count(course: &Course): u64 { course.enrolled_count }
    public fun get_exam_deadline(course: &Course): u64 { course.exam_deadline }
    public fun get_tuition(course: &Course): u64 { course.tuition }
    public fun get_teacher(course: &Course): address { course.teacher }

    public fun is_student_enrolled(course: &Course, student: address): bool {
        table::contains(&course.students, student)
    }

    public fun has_student_submitted(course: &Course, student: address): bool {
        table::contains(&course.submissions, student)
    }

    public fun get_course_results(course: &Course): vector<ResultView> {
        let mut views = vector::empty<ResultView>();
        let mut i = 0u64;
        let total = vector::length(&course.result_order);

        while (i < total) {
            let student = *vector::borrow(&course.result_order, i);
            let result = table::borrow(&course.results, student);
            vector::push_back(
                &mut views,
                ResultView {
                    student,
                    score: result.score,
                    percentage: result.percentage,
                    time_taken_ms: result.time_taken_ms,
                    rank: result.rank,
                    reward_amount: result.reward_amount,
                },
            );
            i = i + 1;
        };

        views
    }

    public fun result_view_student(rv: &ResultView): address { rv.student }
    public fun result_view_score(rv: &ResultView): u64 { rv.score }
    public fun result_view_percentage(rv: &ResultView): u8 { rv.percentage }
    public fun result_view_time_taken_ms(rv: &ResultView): u64 { rv.time_taken_ms }
    public fun result_view_rank(rv: &ResultView): u8 { rv.rank }
    public fun result_view_reward_amount(rv: &ResultView): u64 { rv.reward_amount }

    public fun submit_answers(
        course: &mut Course,
        answers: vector<u8>,
        clock_obj: &Clock,
        ctx: &mut tx_context::TxContext,
    ) {
        let student = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock_obj);
        assert!(course.status == EXAM_ACTIVE, EExamNotActive);
        assert!(now <= course.exam_deadline, ETimeExpired);
        assert!(table::contains(&course.students, student), ENotEnrolled);
        assert!(!table::contains(&course.submissions, student), EAlreadySubmitted);
        assert!(vector::length(&answers) > 0, ENoSubmissions);

        let start_time = course.exam_deadline - course.exam_duration_ms;
        let submission = Submission {
            answers,
            submitted_at: now,
            start_time,
        };
        table::add(&mut course.submissions, student, submission);
        vector::push_back(&mut course.submission_order, student);

        event::emit(AnswersSubmitted {
            course_id: object::uid_to_address(&course.id),
            student,
        });
    }

    public fun reveal_and_score(
        course: &mut Course,
        answer_key: vector<u8>,
        ctx: &mut tx_context::TxContext,
    ) {
        assert!(tx_context::sender(ctx) == course.teacher, ENotTeacher);
        assert!(course.status == EXAM_ACTIVE, EInvalidStatus);
        assert!(vector::length(&answer_key) > 0, EEmptyAnswerKey);

        let computed_hash = hash::keccak256(&answer_key);
        assert!(computed_hash == course.answer_hash, EAnswerHashMismatch);

        course.status = SCORED;

        let total_questions = vector::length(&answer_key);
        let n = vector::length(&course.submission_order);
        let mut i = 0;

        while (i < n) {
            let student = *vector::borrow(&course.submission_order, i);
            let submission = table::borrow(&course.submissions, student);
            let student_answers = &submission.answers;
            let answer_len = vector::length(student_answers);

            let mut score = 0;
            let mut j = 0;
            while (j < total_questions) {
                if (j < answer_len && *vector::borrow(student_answers, j) == *vector::borrow(&answer_key, j)) {
                    score = score + 1;
                };
                j = j + 1;
            };

            let percentage = if (total_questions > 0) {
                ((score * 100) / (total_questions as u64)) as u8
            } else {
                0u8
            };
            let mut time_taken_ms = submission.submitted_at;
            if (submission.submitted_at > submission.start_time) {
                time_taken_ms = submission.submitted_at - submission.start_time;
            } else {
                time_taken_ms = 0;
            };

            let result = Result {
                score,
                percentage,
                time_taken_ms,
                rank: 0,
                reward_amount: 0,
            };
            table::add(&mut course.results, student, result);
            vector::push_back(&mut course.result_order, student);

            i = i + 1;
        };

        // Sort result_order: score descending, then time_taken ascending (bubble sort)
        i = 0;
        while (i < n) {
            let mut j = 0;
            while (j < n - 1 - i) {
                let student_a = *vector::borrow(&course.result_order, j);
                let student_b = *vector::borrow(&course.result_order, j + 1);
                let result_a = table::borrow(&course.results, student_a);
                let result_b = table::borrow(&course.results, student_b);

                let should_swap = result_a.score < result_b.score
                    || (result_a.score == result_b.score && result_a.time_taken_ms > result_b.time_taken_ms);

                if (should_swap) {
                    vector::swap(&mut course.result_order, j, j + 1);
                };
                j = j + 1;
            };
            i = i + 1;
        };

        // Assign ranks
        i = 0;
        while (i < n) {
            let student = *vector::borrow(&course.result_order, i);
            let result = table::borrow_mut(&mut course.results, student);
            result.rank = (i + 1) as u8;
            i = i + 1;
        };

        event::emit(ExamScored {
            course_id: object::uid_to_address(&course.id),
            total_submissions: n,
        });
    }

    public fun distribute_rewards(
        course: &mut Course,
        ctx: &mut tx_context::TxContext,
    ) {
        assert!(tx_context::sender(ctx) == course.teacher, ENotTeacher);
        assert!(course.status == SCORED, ENotScored);

        course.status = REWARDS_DISTRIBUTED;

        let total_pool = balance::value(&course.escrow);
        let n = vector::length(&course.result_order);

        // Winner count: max(1, floor(n * 20 / 100))
        let mut winner_count = n * 20 / 100;
        if (winner_count == 0) { winner_count = 1; };

        // Reward model: rank i gets FLOOR(tuition / 2^i) as percentage of their own tuition
        // Rank 0 (1st): 100% of tuition
        // Rank 1 (2nd): 50% of tuition
        // Rank 2 (3rd): 25% of tuition
        // Last winner gets their calculated share; teacher gets everything else
        let mut i = 0;
        while (i < winner_count && i < n) {
            let student = *vector::borrow(&course.result_order, i);
            let result = table::borrow_mut(&mut course.results, student);
            let student_info = table::borrow(&course.students, student);
            let tuition = student_info.amount_paid;

            // reward = tuition / 2^i (FLOOR)
            let mut divisor = 1u64;
            let mut p = i;
            while (p > 0) {
                divisor = divisor * 2;
                p = p - 1;
            };
            let reward = tuition / divisor;

            result.reward_amount = reward;

            if (reward > 0) {
                let student_balance = balance::split(&mut course.escrow, reward);
                let student_coin = coin::from_balance(student_balance, ctx);
                transfer::public_transfer(student_coin, student);
            };

            i = i + 1;
        };

        // Transfer remaining to teacher
        let teacher_amount = balance::value(&course.escrow);
        if (teacher_amount > 0) {
            let teacher_balance = balance::split(&mut course.escrow, teacher_amount);
            let teacher_coin = coin::from_balance(teacher_balance, ctx);
            transfer::public_transfer(teacher_coin, course.teacher);
        };

        event::emit(RewardsDistributed {
            course_id: object::uid_to_address(&course.id),
            winner_count,
            total_pool,
        });
    }
}