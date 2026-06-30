/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Scores {
  communication: number;
  technical: number;
  logic: number;
  confidence: number;
}

export interface WorkshopScore {
  activityId: string;
  marks: number;
  attendance: 'Present' | 'Absent';
  date: string;
}

export interface Student {
  id: string;
  username?: string;
  password?: string;
  isActivated?: boolean;
  isRegistered?: boolean;
  name: string;
  rollNo: string;
  batch: string;
  branch: string;
  photo?: string;
  collegeId?: string;
  section?: string;
  year?: string;
  preAnalysis: Scores;
  postAnalysis: Scores;
  workshopScores: WorkshopScore[];
  teacherId?: string;
  personalDetails?: {
    phone: string;
    erpId: string;
    emailSkit: string;
    emailOther: string;
    fatherName: string;
    fatherContact: string;
    motherName: string;
    motherContact: string;
    address: string;
    dob: string;
    gender: string;
  };
  academicDetails?: {
    tenthPercentage: number;
    twelfthPercentage: number;
    semesterGrades: { [key: string]: number };
    currentCGPA: number;
    backlogs: number;
    skills: string[];
  };
  allotedActivities?: {
    id: string;
    title: string;
    status: 'Pending' | 'Completed';
    deadline: string;
  }[];
  upcomingSessions?: {
    id: string;
    title: string;
    date: string;
    time: string;
    type: string;
  }[];
}

export interface Teacher {
  id: string;
  employeeId: string;
  username: string;
  password?: string;
  name: string;
  role: 'Admin' | 'Teacher';
  department: string;
  contactNo: string;
  emailId: string;
  photo?: string;
  batch: string; // Historically assigned or main batch
  assignedBatches?: string[];
  performanceDetails?: {
    rating: number;
    studentsHelped: number;
    feedbackScore: number;
    workshopsConducted: number;
  };
}

export interface BatchConfig {
  batchId: string;
  teacherId: string;
  teacherName: string;
  isSetupComplete: boolean;
  studentCount: number;
  updatedAt: string;
  status?: 'Active' | 'Completed' | 'Pending';
  description?: string;
}

export type TaskType = 
  | 'Conduct Online Session' 
  | 'Conduct Mock Test' 
  | 'Conduct Mock Interview' 
  | 'Create New Assignment' 
  | 'Conduct GD' 
  | 'Take Students Presentation';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  teacherId: string;
  teacherName: string;
  batchId: string;
  dueDate: string;
  description: string;
  status: 'Active' | 'Expired' | 'Closed';
  createdAt: string;
  content?: AssignmentContent | MockTestContent | InterviewContent;
  randomize?: boolean; // For assignments
  timeLimit?: number; // In minutes
  gradingMode?: 'Auto-Evaluated' | 'Manual Grading';
}

export type QuestionType = 'MCQ' | 'Short Answer' | 'Coding';

export interface Question {
  id: string;
  type: QuestionType;
  sectionName?: string;
  question: string;
  marks: number;
  options?: string[]; // Only for MCQ
  correctKey?: number; // Only for MCQ (index of correct option)
  sampleAnswer?: string; // For Short Answer / Coding reference
}

export interface AssignmentContent {
  subject: string;
  topic: string;
  questions: Question[];
}

export interface MockTestBlueprint {
  year: string;
  subject: string;
  topic: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  structure: {
    sectionName: string;
    type: QuestionType;
    marks: number;
    count: number;
  }[];
}

export interface MockTestContent {
  blueprint: MockTestBlueprint;
  questions: Question[];
  totalMarks: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'Introduction' | 'Technical' | 'Behavioral' | 'Situational' | 'Custom';
  followUp?: string;
}

export interface InterviewContent {
  questions: InterviewQuestion[];
  instructions?: string;
  introMessage?: string;
}

export interface InterviewTurn {
  role: 'ai' | 'student';
  text: string;
  timestamp: string;
  questionId?: string;
}

export interface InterviewQuestionAnalysis {
  question: string;
  studentAnswer: string;
  score: number; // out of 10
  feedback: string;
}

export interface InterviewReport {
  studentId: string;
  studentName: string;
  taskId: string;
  turns: InterviewTurn[];
  overallScore: number; // out of 10
  fluency: number; // out of 10
  confidence: number; // out of 10
  vocabulary: number; // out of 10
  clarity: number; // out of 10
  summary: string;
  questionAnalysis: InterviewQuestionAnalysis[];
  recommendations: string[];
  completedAt: string;
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  batchId: string;
  type: 'Assignment' | 'MockTest' | 'MockInterview';
  submittedAt: string;
  status: 'Auto-Evaluated' | 'Awaiting-Manual-Grading' | 'Graded';
  score?: number;
  totalMarks: number;
  answers?: number[]; // For MCQ assignments
  attachmentUrl?: string; // For Mock Test PDF uploads
  teacherId: string;
  submissionReason?: string;
  interviewReport?: InterviewReport; // For mock interviews
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
}

export type RecipientType = 'Individual' | 'All Teachers' | 'All Students' | 'Batch';
export type MessagePriority = 'Normal' | 'High' | 'Critical';
export type MessageCategory = 'General' | 'Assignment' | 'Inquiry' | 'Broadcast';
export type SenderRole = 'admin' | 'staff' | 'student';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: SenderRole;
  recipientArray: string[];
  recipientType?: RecipientType;
  batchId?: string;
  text: string;
  timestamp: any; // Can be serverTimestamp or Date string
  priority?: MessagePriority;
  category?: MessageCategory;
  readBy: string[];
}

export const TEACHERS: Teacher[] = [
  { 
    id: 'admin', 
    employeeId: 'ADM-001',
    username: 'admin', 
    password: 'password@admin', 
    name: 'Admin', 
    batch: 'All', 
    role: 'Admin',
    department: '',
    contactNo: '',
    emailId: ''
  }
];

export const MOCK_STUDENTS: Student[] = [];
export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [];
export const ACTIVITIES = [
  { id: 'ext-1', name: 'Extempore Session', type: 'Extempore' },
  { id: 'mock-1', name: 'AI Mock Interview', type: 'Mock Interview' },
  { id: 'ws-a', name: 'Soft Skills Workshop', type: 'Workshop' },
  { id: 'ws-b', name: 'Technical Basics Workshop', type: 'Workshop' },
  { id: 'ws-c', name: 'Advanced Logic Workshop', type: 'Workshop' },
  { id: 'gd-1', name: 'Group Discussion', type: 'Conduct GD' },
  { id: 'pres-1', name: 'Student Presentation', type: 'Take Students Presentation' },
];

export const getAIFeedback = (marks: number) => {
  if (marks < 4) return "Your baseline scores indicate a need for fundamental drills in logic and soft skills. Consistent participation in basic workshops is highly recommended.";
  if (marks < 7) return "You are showing positive growth in technical areas. Focusing on articulation during extemporaneous sessions will further enhance your placement readiness.";
  return "Consistently high scores reflect strong professional readiness. We recommend taking on peer-mentorship roles or participating in advanced mock drills.";
};

export const getAIRecommendations = (scores: Scores) => {
  const recommendations = [];
  if (scores.communication < 6) recommendations.push("Enroll in 'Public Speaking & Body Language' workshop to improve presentation clarity.");
  if (scores.technical < 6) recommendations.push("Complete the 'DS & Algorithms' intensive module to strengthen your technical foundation.");
  if (scores.logic < 6) recommendations.push("Participate in hourly 'Logical Puzzle Solvers' sessions to enhance analytical speed.");
  if (scores.confidence < 6) recommendations.push("Schedule a 1-on-1 counseling session to work on interview anxiety and self-articulation.");
  return recommendations.length > 0 ? recommendations : ["Maintain current momentum with 'Company-Specific Advanced Mock Drills'."];
};

export const getBatchSummary = (students: Student[]) => {
  if (students.length === 0) return "No student data available to provide insights.";
  const avgPre = students.reduce((acc, s) => {
    const pre = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    return acc + ((pre.communication || 0) + (pre.technical || 0) + (pre.logic || 0) + (pre.confidence || 0)) / 4;
  }, 0) / students.length;
  const avgPost = students.reduce((acc, s) => {
    const post = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    return acc + ((post.communication || 0) + (post.technical || 0) + (post.logic || 0) + (post.confidence || 0)) / 4;
  }, 0) / students.length;
  const improvement = avgPre > 0 ? ((avgPost - avgPre) / avgPre) * 100 : 0;

  if (improvement > 25) {
    return `The batch is showing significant growth (${improvement.toFixed(1)}%) with strong engagement in logical reasoning. Prioritize advanced technical training to capitalize on this upward trend.`;
  } else if (improvement > 10) {
    return `Moderate improvement noted (${improvement.toFixed(1)}%). Core communication skills have stabilized, but technical backlogs in a subset of students requires targeted remedial sessions.`;
  }
  return `Marginal improvement of ${improvement.toFixed(1)}% indicates stagnant engagement. We recommend refreshing induction modules and increasing mock frequency to reignite student interest.`;
};
