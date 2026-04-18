#[test_only]
module teaching_platform::teaching_platform_tests;

use sui::coin;
use sui::clock::{Self as clock, Clock};
use sui::sui::SUI;
use sui::test_scenario;
use teaching_platform::course::{Self as course, Course, Platform};

const TEACHER: address = @0xA;
const STUDENT_ONE: address = @0xB;
const STUDENT_TWO: address = @0xC;

const TUITION: u64 = 100;
const MAX_STUDENTS: u8 = 5;
const MIN_STUDENTS: u8 = 2;
const EXAM_DURATION_MS: u64 = 600000;

// keccak256([0, 1, 2, 3, 0]) used as answer hash for tests
const ANSWER_KEY_HASH: vector<u8> = x"a38140299a1758b790de431c41b099dce10706d26e930530146b2d7cde9c7f4d";

fun share_test_clock(scenario: &mut test_scenario::Scenario, sender: address) {
    test_scenario::next_tx(scenario, sender);
    {
        clock::share_for_testing(clock::create_for_testing(test_scenario::ctx(scenario)));
    };
}

#[test]
fun test_register_as_teacher() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        assert!(course::is_teacher(&platform, TEACHER));
        assert!(!course::is_student(&platform, TEACHER));
        assert!(course::get_teacher_count(&platform) == 1);
        assert!(course::get_student_count(&platform) == 0);
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_register_as_student() {
    let mut scenario = test_scenario::begin(STUDENT_ONE);

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        assert!(course::is_student(&platform, STUDENT_ONE));
        assert!(!course::is_teacher(&platform, STUDENT_ONE));
        assert!(course::get_student_count(&platform) == 1);
        assert!(course::get_teacher_count(&platform) == 0);
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 18, location = teaching_platform::course)]
fun test_teacher_cannot_register_as_student() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 19, location = teaching_platform::course)]
fun test_student_cannot_register_as_teacher() {
    let mut scenario = test_scenario::begin(STUDENT_ONE);

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 18, location = teaching_platform::course)]
fun test_teacher_cannot_register_twice() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 19, location = teaching_platform::course)]
fun test_student_cannot_register_twice() {
    let mut scenario = test_scenario::begin(STUDENT_ONE);

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 21, location = teaching_platform::course)]
fun test_student_cannot_create_course() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Unauthorized Course",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 22, location = teaching_platform::course)]
fun test_teacher_cannot_enroll() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Move 101",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 21, location = teaching_platform::course)]
fun test_unregistered_cannot_create_course() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Unauthorized",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 22, location = teaching_platform::course)]
fun test_unregistered_cannot_enroll() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Move 101",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
}

#[test]
fun foundation_flow_reaches_exam_active() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Move 101",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let course_obj = test_scenario::take_shared<Course>(&scenario);
        assert!(course::get_course_status(&course_obj) == course::status_enrolling());
        assert!(course::get_enrolled_count(&course_obj) == 0);
        assert!(course::get_tuition(&course_obj) == TUITION);
        assert!(course::get_teacher(&course_obj) == TEACHER);
        test_scenario::return_shared(course_obj);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        assert!(course::get_enrolled_count(&course_obj) == 1);
        assert!(course::get_course_status(&course_obj) == course::status_enrolling());
        assert!(course::is_student_enrolled(&course_obj, STUDENT_ONE));
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        assert!(course::get_enrolled_count(&course_obj) == 2);
        assert!(course::get_course_status(&course_obj) == course::status_ready_for_exam());
        assert!(course::is_student_enrolled(&course_obj, STUDENT_TWO));
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        course::create_exam(
            &mut course_obj,
            b"12345678901234567890123456789012",
            EXAM_DURATION_MS,
            &clock_obj,
            scenario.ctx(),
        );
        assert!(course::get_course_status(&course_obj) == course::status_exam_active());
        assert!(course::get_exam_deadline(&course_obj) > 0);
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 0, location = teaching_platform::course)]
fun enroll_rejects_wrong_payment() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Move 101",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION - 1, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::end(scenario);
    abort 42
}

#[test, expected_failure(abort_code = 3, location = teaching_platform::course)]
fun only_teacher_can_create_exam() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(
            &platform,
            b"Move 101",
            TUITION,
            MAX_STUDENTS,
            MIN_STUDENTS,
            scenario.ctx(),
        );
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        course::create_exam(
            &mut course_obj,
            b"12345678901234567890123456789012",
            EXAM_DURATION_MS,
            &clock_obj,
            scenario.ctx(),
        );
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_submit_answers_and_reveal_score() {
    let mut scenario = test_scenario::begin(STUDENT_ONE);
    course::create_platform(scenario.ctx());
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(&platform, b"Move 101", TUITION, MAX_STUDENTS, MIN_STUDENTS, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    // Teacher creates exam with answer key [0, 1, 2, 3, 0]
    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        course::create_exam(&mut course_obj, ANSWER_KEY_HASH, EXAM_DURATION_MS, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Student ONE submits answers: [0, 1, 2, 3, 0] - all correct
    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut clock_obj = test_scenario::take_shared<Clock>(&scenario);
        clock::increment_for_testing(&mut clock_obj, 1000);
        let mut answers = vector::empty();
        vector::push_back(&mut answers, 0);
        vector::push_back(&mut answers, 1);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 3);
        vector::push_back(&mut answers, 0);
        course::submit_answers(&mut course_obj, answers, &clock_obj, scenario.ctx());
        assert!(course::has_student_submitted(&course_obj, STUDENT_ONE));
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Student TWO submits answers: [0, 2, 2, 1, 0] - 3 correct
    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut clock_obj = test_scenario::take_shared<Clock>(&scenario);
        clock::increment_for_testing(&mut clock_obj, 2000);
        let mut answers = vector::empty();
        vector::push_back(&mut answers, 0);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 1);
        vector::push_back(&mut answers, 0);
        course::submit_answers(&mut course_obj, answers, &clock_obj, scenario.ctx());
        assert!(course::has_student_submitted(&course_obj, STUDENT_TWO));
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Teacher reveals and scores
    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut answer_key = vector::empty();
        vector::push_back(&mut answer_key, 0);
        vector::push_back(&mut answer_key, 1);
        vector::push_back(&mut answer_key, 2);
        vector::push_back(&mut answer_key, 3);
        vector::push_back(&mut answer_key, 0);
        course::reveal_and_score(&mut course_obj, answer_key, scenario.ctx());
        assert!(course::get_course_status(&course_obj) == course::status_scored());

        let results = course::get_course_results(&course_obj);
        assert!(vector::length(&results) == 2);
        // Student ONE should be rank 1 (5/5 correct)
        // Student TWO should be rank 2 (3/5 correct)
        let r1 = *vector::borrow(&results, 0);
        let r2 = *vector::borrow(&results, 1);
        assert!(course::result_view_rank(&r1) == 1);
        assert!(course::result_view_score(&r1) == 5);
        assert!(course::result_view_rank(&r2) == 2);

        test_scenario::return_shared(course_obj);
    };

    test_scenario::end(scenario);
}

#[test]
fun test_distribute_rewards() {
    let mut scenario = test_scenario::begin(STUDENT_ONE);
    course::create_platform(scenario.ctx());
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(&platform, b"Move 101", TUITION, MAX_STUDENTS, MIN_STUDENTS, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        course::create_exam(&mut course_obj, ANSWER_KEY_HASH, EXAM_DURATION_MS, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Student ONE submits all correct
    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut clock_obj = test_scenario::take_shared<Clock>(&scenario);
        clock::increment_for_testing(&mut clock_obj, 1000);
        let mut answers = vector::empty();
        vector::push_back(&mut answers, 0);
        vector::push_back(&mut answers, 1);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 3);
        vector::push_back(&mut answers, 0);
        course::submit_answers(&mut course_obj, answers, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Student TWO submits partially correct
    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut clock_obj = test_scenario::take_shared<Clock>(&scenario);
        clock::increment_for_testing(&mut clock_obj, 2000);
        let mut answers = vector::empty();
        vector::push_back(&mut answers, 0);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 1);
        vector::push_back(&mut answers, 0);
        course::submit_answers(&mut course_obj, answers, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Reveal and score
    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut answer_key = vector::empty();
        vector::push_back(&mut answer_key, 0);
        vector::push_back(&mut answer_key, 1);
        vector::push_back(&mut answer_key, 2);
        vector::push_back(&mut answer_key, 3);
        vector::push_back(&mut answer_key, 0);
        course::reveal_and_score(&mut course_obj, answer_key, scenario.ctx());
        test_scenario::return_shared(course_obj);
    };

    // Distribute rewards
    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        course::distribute_rewards(&mut course_obj, scenario.ctx());
        assert!(course::get_course_status(&course_obj) == course::status_rewards_distributed());

        let results = course::get_course_results(&course_obj);
        assert!(vector::length(&results) == 2);

        // Verify winner (rank 1) got 100% of tuition = 100
        // Rank 2 is not a winner (winner_count=1), gets 0
        let r1 = *vector::borrow(&results, 0);
        let r2 = *vector::borrow(&results, 1);
        assert!(course::result_view_rank(&r1) == 1);
        assert!(course::result_view_reward_amount(&r1) == 100); // 100% of tuition
        assert!(course::result_view_rank(&r2) == 2);
        assert!(course::result_view_reward_amount(&r2) == 0); // not in top 20%

        // Verify teacher got remaining escrow = 200 - 100 = 100

        test_scenario::return_shared(course_obj);
    };

    test_scenario::end(scenario);
}

#[test, expected_failure(abort_code = 7, location = teaching_platform::course)]
fun submit_rejects_after_deadline() {
    let mut scenario = test_scenario::begin(TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        course::create_platform(scenario.ctx());
    };
    share_test_clock(&mut scenario, TEACHER);

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_teacher(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        course::create_course(&platform, b"Move 101", TUITION, MAX_STUDENTS, MIN_STUDENTS, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let mut platform = test_scenario::take_shared<Platform>(&scenario);
        course::register_as_student(&mut platform, scenario.ctx());
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let clock_obj = test_scenario::take_shared<Clock>(&scenario);
        course::create_exam(&mut course_obj, ANSWER_KEY_HASH, EXAM_DURATION_MS, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    // Advance past deadline and try to submit — should abort with ETimeExpired (7)
    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let mut clock_obj = test_scenario::take_shared<Clock>(&scenario);
        clock::increment_for_testing(&mut clock_obj, EXAM_DURATION_MS + 1);
        let mut answers = vector::empty();
        vector::push_back(&mut answers, 0);
        vector::push_back(&mut answers, 1);
        vector::push_back(&mut answers, 2);
        vector::push_back(&mut answers, 3);
        vector::push_back(&mut answers, 0);
        course::submit_answers(&mut course_obj, answers, &clock_obj, scenario.ctx());
        test_scenario::return_shared(clock_obj);
        test_scenario::return_shared(course_obj);
    };

    test_scenario::end(scenario);
}
