export const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID;
export const PLATFORM_OBJECT_ID = import.meta.env.VITE_SUI_PLATFORM_OBJECT_ID;
export const SUI_MODULE = 'course';
export const SUI_CLOCK_OBJECT_ID = '0x6';

export const COURSE_STATUSES = {
  ENROLLING: 0,
  READY_FOR_EXAM: 1,
  EXAM_ACTIVE: 2,
  SCORED: 3,
  REWARDS_DISTRIBUTED: 4,
};

export const STATUS_LABELS = {
  0: 'Enrolling',
  1: 'Ready',
  2: 'Live Exam',
  3: 'Scored',
  4: 'Rewards Paid',
};

export const STATUS_TONE = {
  0: 'blue',
  1: 'teal',
  2: 'amber',
  3: 'violet',
  4: 'green',
};

export const SUI_TO_MIST = 1_000_000_000;
export const MIST_TO_SUI = (mist) => Number(mist) / SUI_TO_MIST;

export const MIN_STUDENTS = 2;
export const MAX_STUDENTS = 5;
