#[test_only]
module teaching_platform::teaching_platform_tests;

use sui::coin;
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
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
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
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
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
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
        assert!(course::get_enrolled_count(&course_obj) == 1);
        assert!(course::get_course_status(&course_obj) == course::status_enrolling());
        assert!(course::is_student_enrolled(&course_obj, STUDENT_ONE));
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
        assert!(course::get_enrolled_count(&course_obj) == 2);
        assert!(course::get_course_status(&course_obj) == course::status_ready_for_exam());
        assert!(course::is_student_enrolled(&course_obj, STUDENT_TWO));
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, TEACHER);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        course::create_exam(
            &mut course_obj,
            b"12345678901234567890123456789012",
            EXAM_DURATION_MS,
            scenario.ctx(),
        );
        assert!(course::get_course_status(&course_obj) == course::status_exam_active());
        assert!(course::get_exam_deadline(&course_obj) > 0);
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
        let payment = coin::mint_for_testing<SUI>(TUITION - 1, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
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
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_TWO);
    {
        let platform = test_scenario::take_shared<Platform>(&scenario);
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        let payment = coin::mint_for_testing<SUI>(TUITION, scenario.ctx());
        course::enroll_and_pay(&platform, &mut course_obj, payment, scenario.ctx());
        test_scenario::return_shared(course_obj);
        test_scenario::return_shared(platform);
    };

    test_scenario::next_tx(&mut scenario, STUDENT_ONE);
    {
        let mut course_obj = test_scenario::take_shared<Course>(&scenario);
        course::create_exam(
            &mut course_obj,
            b"12345678901234567890123456789012",
            EXAM_DURATION_MS,
            scenario.ctx(),
        );
        test_scenario::return_shared(course_obj);
    };

    test_scenario::end(scenario);
}