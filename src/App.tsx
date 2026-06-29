/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileEdit, 
  BarChart3, 
  LogOut, 
  Search,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  BrainCircuit,
  UserCircle,
  GraduationCap,
  Building2,
  ArrowLeft,
  Moon,
  Sun,
  User,
  Lock,
  Eye,
  LogIn,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Star,
  BookOpen,
  History,
  EyeOff,
  Upload,
  CheckCircle2,
  Image,
  Video,
  FileText,
  MessageSquare,
  Airplay,
  Save,
  Trash2,
  ShieldCheck,
  ChevronLeft,
  Info,
  Plus,
  Sparkles,
  X,
  Pencil,
  BellRing,
  Check,
  CheckCheck,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataUploadView } from './components/DataUploadView';
import { ActivityDetailModal } from './components/ActivityDetailModal';
import { useTheme } from 'next-themes';
import { 
  MOCK_STUDENTS, 
  ACTIVITIES, 
  TEACHERS,
  getAIFeedback, 
  getAIRecommendations, 
  getBatchSummary,
  Student,
  Scores,
  Teacher,
  AuditLogEntry,
  MOCK_AUDIT_LOGS,
  BatchConfig,
  Task,
  TaskType,
  MockTestBlueprint,
  MockTestContent,
  AssignmentContent,
  Question,
  QuestionType,
  Submission
} from './types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { aiAcademicService } from './lib/aiService';
import { databaseService } from './lib/databaseService';
import InboxView from './components/InboxView';
import { Message } from './types';

type View = 'dashboard' | 'students' | 'marks' | 'reports' | 'student-detail' | 'upload' | 'teacher-profile' | 'student-portal-profile' | 'student-activities' | 'student-sessions' | 'batch-control' | 'faculty-mgmt' | 'skill-config' | 'assign-tasks' | 'inbox';
type LoginStep = 'role' | 'form' | 'activate';

interface ActivityLog {
  id: string;
  studentName: string;
  activityName: string;
  marks: number;
  timestamp: string;
}

import { ThemeProvider } from 'next-themes';

const generateProfessionalPDF = (testContent: MockTestContent) => {
  const doc = new jsPDF();
  const { blueprint, questions, totalMarks } = testContent;

  // Header
  doc.setFontSize(22);
  doc.setTextColor(20, 30, 80);
  doc.text("SWAMI KESHVANAND INSTITUTE OF TECHNOLOGY,", 105, 20, { align: "center" });
  doc.setFontSize(16);
  doc.text("MANAGEMENT & GRAMOTHAN, JAIPUR", 105, 30, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Exam Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Subject: ${blueprint.subject}`, 20, 45);
  doc.text(`Topic: ${blueprint.topic}`, 20, 52);
  doc.text(`Year: ${blueprint.year}`, 20, 59);
  doc.text(`Total Marks: ${totalMarks}`, 190, 45, { align: "right" });
  doc.text(`Difficulty: ${blueprint.difficulty || 'Medium'}`, 190, 52, { align: "right" });

  doc.line(20, 65, 190, 65);

  let yOffset = 75;

  questions.forEach((q, index) => {
    // Check if we need a new page
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const qText = `Q${index + 1}. [${q.marks} Marks] ${q.question}`;
    const lines = doc.splitTextToSize(qText, 170);
    doc.text(lines, 20, yOffset);
    yOffset += (lines.length * 6) + 4;

    if (q.type === 'MCQ' && q.options) {
       doc.setFont("helvetica", "normal");
       doc.setFontSize(10);
       q.options.forEach((opt, oIdx) => {
         const optText = `${String.fromCharCode(97 + oIdx)}) ${opt}`;
         doc.text(optText, 30, yOffset);
         yOffset += 6;
       });
       yOffset += 4;
    } else {
       yOffset += 10; // Space for answer
    }
  });

  // Footer
  const pageCount = (doc as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: "center" });
    doc.text("Generated by SAR Portal - AI Exam System", 190, 290, { align: "right" });
  }

  return doc;
};

export default function App() {
  return (
    // @ts-ignore
    <ThemeProvider attribute="class" defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('sar_isLoggedIn') === 'true';
  });
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginStep, setLoginStep] = useState<LoginStep>('role');
  const [selectedRole, setSelectedRole] = useState<'student' | 'college' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const { theme, setTheme } = useTheme();
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(() => {
    const saved = localStorage.getItem('sar_currentTeacher');
    if (!saved || saved === 'undefined') return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('sar_currentStudent');
    if (!saved || saved === 'undefined') return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'student' | null>(() => {
    return localStorage.getItem('sar_userRole') as any || null;
  });
  const [adminSelectedBatch, setAdminSelectedBatch] = useState<string>(() => {
    return localStorage.getItem('sar_adminBatch') || 'All';
  });
  const [marksTaskIdFilter, setMarksTaskIdFilter] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(() => {
    return (localStorage.getItem('sar_currentView') as View) || 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('sar_currentView', currentView);
  }, [currentView]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [batchesList, setBatchesList] = useState<BatchConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [studentTasks, setStudentTasks] = useState<Task[]>([]);
  const [hasNewTasks, setHasNewTasks] = useState(false);
  const [unreadMessage, setUnreadMessage] = useState<Message | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    if (isLoggedIn && (currentTeacher || currentStudent)) {
      const userId = userRole === 'student' ? currentStudent?.id : currentTeacher?.id;
      if (!userId) return;

      const pollLocalMessages = async () => {
        const msgs = await databaseService.getMessagesForUser(userId, userRole || 'student', currentStudent?.batch);
        // Find most recent unread where user is a recipient
        const unread = msgs.find(msg => {
          if (msg.senderId === userId) return false;
          if (msg.readBy?.includes(userId)) return false;
          return true;
        });
        setUnreadMessage(unread || null);
      };
      pollLocalMessages();
      const interval = setInterval(pollLocalMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, currentTeacher, currentStudent, userRole]);

  useEffect(() => {
    const fetchData = async () => {
      const dbStudents = await databaseService.getAllStudents();
      const dbLogs = await databaseService.getAuditLogs();
      const dbTeachers = await databaseService.getAllTeachers();
      const dbBatches = await databaseService.getAllBatches();
      
      setStudents(dbStudents);
      setAuditLogs(dbLogs);
      
      // Ensure admin exists locally even if other teachers are in DB
      const mergedTeachers = [...dbTeachers];
      if (!mergedTeachers.find(t => t.id === 'admin')) {
        mergedTeachers.unshift(TEACHERS[0]);
      }
      setTeachers(mergedTeachers);
      
      // Auto-recover currentTeacher if null but role is admin
      if (userRole === 'admin' && !currentTeacher) {
        const admin = mergedTeachers.find(t => t.id === 'admin');
        if (admin) {
          setCurrentTeacher(admin);
          localStorage.setItem('sar_currentTeacher', JSON.stringify(admin));
        }
      }
      
      setBatchesList(dbBatches);

      if (dbStudents.length > 0) {
        setIsSetupComplete(true);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('sar_adminBatch', adminSelectedBatch);
  }, [adminSelectedBatch]);

  useEffect(() => {
    const savedLogs = localStorage.getItem('sar_activity_logs');
    if (savedLogs && savedLogs !== 'undefined') {
      try {
        setActivityLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Error parsing saved activity logs:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (activityLogs.length > 0) {
      localStorage.setItem('sar_activity_logs', JSON.stringify(activityLogs));
    }
  }, [activityLogs]);

  useEffect(() => {
    if (userRole === 'student' && currentStudent) {
      const pollLocalTasks = async () => {
        const tasks = await databaseService.getTasksByBatch(currentStudent.batch);
        const activeTasks = tasks.filter(t => t.status === 'Active');
        setStudentTasks(activeTasks);
      };
      pollLocalTasks();
      const interval = setInterval(pollLocalTasks, 3000);
      return () => clearInterval(interval);
    }
  }, [userRole, currentStudent, currentView]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    try {
      const result = await databaseService.login({ username, password, isAdminLogin });

      if (result.success) {
        setIsLoggedIn(true);
        setCurrentView('dashboard');
        setShowLoginGate(false);
        setUserRole(result.role);

        if (result.role === 'admin' || result.role === 'staff') {
          setCurrentTeacher(result.user);
          setAdminSelectedBatch('All');
          if (rememberMe) {
            localStorage.setItem('sar_isLoggedIn', 'true');
            localStorage.setItem('sar_currentTeacher', JSON.stringify(result.user));
            localStorage.setItem('sar_userRole', result.role);
          }
          toast.success(result.role === 'admin' ? `Welcome back, Admin!` : `Welcome back, Prof. ${result.user.name}!`);
        } else if (result.role === 'student') {
          setCurrentStudent(result.user);
          if (rememberMe) {
            localStorage.setItem('sar_isLoggedIn', 'true');
            localStorage.setItem('sar_currentStudent', JSON.stringify(result.user));
            localStorage.setItem('sar_userRole', 'student');
          }
          toast.success(`Welcome back, ${result.user.name}!`);
        }
      }
    } catch (error: any) {
      if (error.message.includes('401')) {
        toast.error('Invalid Credentials');
      } else {
        toast.error('Login failed: ' + error.message);
      }
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentTeacher(null);
    setCurrentStudent(null);
    setUserRole(null);
    setCurrentView('dashboard');
    setLoginStep('role');
    localStorage.removeItem('sar_isLoggedIn');
    localStorage.removeItem('sar_currentTeacher');
    localStorage.removeItem('sar_currentStudent');
    localStorage.removeItem('sar_adminBatch');
    localStorage.removeItem('sar_userRole');
    localStorage.removeItem('sar_currentView');
  };

  const filteredStudents = currentTeacher?.role === 'Admin'
    ? (adminSelectedBatch === 'All' 
        ? students 
        : students.filter(s => {
            const batchMap: Record<string, string[]> = {
              'Batch A': ['2024-A', 'Batch A', 'A'],
              'Batch B': ['2024-B', 'Batch B', 'B'],
              'Batch C': ['2024-C', 'Batch C', 'C']
            };
            const allowedBatches = batchMap[adminSelectedBatch] || [];
            return allowedBatches.includes(s.batch) || s.batch === adminSelectedBatch;
          }))
    : (() => {
        if (!currentTeacher) return [];
        const teacherAssignedBatchIds = batchesList
          .filter(b => b.teacherId === currentTeacher.id)
          .map(b => b.batchId);
        const primaryBatch = currentTeacher.batch;
        const tBatchShort = primaryBatch?.replace('2024-', '');
        
        const myStudents = students.filter(s => 
          teacherAssignedBatchIds.includes(s.batch) || 
          s.teacherId === currentTeacher.id ||
          (primaryBatch && (
            s.batch === primaryBatch || 
            s.batch === tBatchShort || 
            s.batch === `Batch ${tBatchShort}`
          ))
        );

        if (adminSelectedBatch === 'All') return myStudents;
        return myStudents.filter(s => s.batch === adminSelectedBatch);
      })();

  if (!isLoggedIn || showLoginGate) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
        <Toaster position="top-center" />
        
        {loginStep === 'role' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10 max-w-4xl"
          >
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-4">
              <img 
                src="https://skitexam.com/skit_logo.png" 
                alt="SKIT Logo" 
                className="h-20 md:h-24 w-auto drop-shadow-sm cursor-pointer"
                referrerPolicy="no-referrer"
                onClick={() => {
                  if (isLoggedIn) setShowLoginGate(false);
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://picsum.photos/seed/skit/200/200";
                }}
              />
              <div className="text-center">
                <h1 className="text-[36px] font-bold text-slate-900 dark:text-slate-100 leading-[1.2] tracking-tight font-sans">
                  Swami Keshvanand Institute of Technology,
                </h1>
                <h1 className="text-[36px] font-bold text-slate-900 dark:text-slate-100 leading-[1.2] tracking-tight font-sans">
                  Management & Gramothan, (SKIT)
                </h1>
              </div>
            </div>
            <h2 className="text-[24px] font-bold text-[#1A202C] dark:text-slate-100 mb-2 mt-8 font-sans">
              Skill Audit Report Portal
            </h2>
            <p className="text-[#4A5568] dark:text-slate-400 text-[18px] font-normal font-sans">
              Select your role to access the SAR Portal
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {loginStep === 'role' ? (
            <motion.div 
              key="role-selection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 w-fit max-w-4xl mx-auto"
            >
              <FlipCard 
                icon={GraduationCap}
                title="Student"
                description="Monitor your skill growth & access personalized roadmaps."
                features={["• View performance graphs", "• Access remedial activities", "• Track placement readiness"]}
                backTitle="Student Portal"
                backDescription="Access your growth logs and personalized tasks"
                buttonText="Enter Portal"
                onAction={() => {
                  if (isLoggedIn && userRole === 'student') {
                    setShowLoginGate(false);
                  } else {
                    setSelectedRole('student');
                    setLoginStep('form');
                  }
                }}
              />

              <FlipCard 
                icon={Building2}
                title="College"
                description="Data-driven access to analyze student gaps, conduct audits, and manage training interventions."
                features={["• Conduct Pre & Post Analysis", "• Monitor batch improvement", "• Assign remedial activities"]}
                backTitle="College Login"
                backDescription="Continue to admin portal"
                buttonText="Enter Portal"
                onAction={() => {
                  if (isLoggedIn && (userRole === 'staff' || userRole === 'admin')) {
                    setShowLoginGate(false);
                  } else {
                    setSelectedRole('college');
                    setLoginStep('form');
                  }
                }}
              />
            </motion.div>
          ) : loginStep === 'form' ? (
            <motion.div 
              key="login-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-md"
            >
              <Card className="border-none shadow-xl bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] relative">
                <button 
                  onClick={() => {
                    setLoginStep('role');
                    setIsAdminLogin(false);
                    setSelectedRole(null);
                  }}
                  className="absolute left-6 top-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title="Back to role selection"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                <CardHeader className="space-y-2 text-center pb-6">
                  <div className="space-y-1">
                    <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {isAdminLogin ? "Admin Login" : (students.some(s => s.rollNo === username) ? "Student Login" : "Portal Login")}
                    </CardTitle>
                    <CardDescription className="text-base text-slate-500 dark:text-slate-400">Enter your credentials</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4 px-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                          <User className="w-4 h-4 text-slate-400" />
                          <Label htmlFor="username" className="text-lg">Username</Label>
                        </div>
                        <Input 
                          id="username"
                          type="text" 
                          placeholder={isAdminLogin ? "Enter admin username" : (selectedRole === 'student' ? "Enter Roll No" : "Enter staff username")} 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 rounded-xl text-lg px-4"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                          <Lock className="w-4 h-4 text-slate-400" />
                          <Label htmlFor="password" className="text-lg">Password</Label>
                        </div>
                        <div className="relative">
                          <Input 
                            id="password"
                            type={showPassword ? "text" : "password"} 
                            placeholder={isAdminLogin ? "Enter admin password" : (selectedRole === 'student' ? "Enter password" : "Enter staff password")} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-indigo-500 pr-12 rounded-xl text-lg px-4"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                           <div className="flex items-center space-x-3 bg-slate-50 p-2 px-3 rounded-xl border border-slate-100">
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                id="rememberMe" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="peer w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer appearance-none border-2 checked:bg-indigo-600 checked:border-indigo-600 transition-all duration-200"
                              />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                            <Label htmlFor="rememberMe" className="text-sm font-bold text-slate-600 cursor-pointer">
                              Remember Me
                            </Label>
                          </div>
                          <button type="button" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                            Forgot Password?
                          </button>
                        </div>
                      </div>

                      {selectedRole === 'college' && (
                        <div className="flex items-center space-x-3 pt-2">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              id="isAdmin" 
                              checked={isAdminLogin}
                              onChange={(e) => setIsAdminLogin(e.target.checked)}
                              className="peer w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer appearance-none border-2 checked:bg-indigo-600 checked:border-indigo-600 transition-all duration-200"
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                          <Label htmlFor="isAdmin" className="text-lg font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Are You Admin?
                          </Label>
                        </div>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-14 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-2xl shadow-lg shadow-indigo-100 dark:shadow-none transition-all duration-200 flex items-center justify-center gap-3 rounded-xl mt-6">
                      <LogIn className="w-6 h-6" /> Sign In
                    </Button>
                    
                    {selectedRole === 'student' && (
                      <div className="mt-6 text-center border-t border-slate-100 pt-4">
                        <p className="text-sm text-slate-500">First time here?</p>
                        <button 
                          type="button" 
                          onClick={() => setLoginStep('activate')}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline mt-1"
                        >
                          Activate your account
                        </button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="activate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl"
            >
              <StudentActivationView 
                students={students}
                onBack={() => setLoginStep('form')}
                onActivate={async (updatedStudent) => {
                  try {
                    await databaseService.saveStudents([updatedStudent]);
                    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
                    setCurrentStudent(updatedStudent);
                    localStorage.setItem('sar_currentStudent', JSON.stringify(updatedStudent));
                    setUserRole('student');
                    setIsLoggedIn(true);
                    localStorage.setItem('sar_isLoggedIn', 'true');
                    localStorage.setItem('sar_userRole', 'student');
                  } catch (err) {
                    console.error("Error activating student:", err);
                    toast.error("Failed to save activated account to server. Please try again.");
                  }
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-[#718096] dark:text-slate-500 text-[14px] font-normal font-sans"
        >
          Need help? Contact your institution's skill development cell
        </motion.p>

        {/* Theme Toggle */}
        <div className="fixed bottom-8 right-8">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-12 h-12 shadow-lg bg-white dark:bg-slate-900 border-none"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </Button>
        </div>
      </div>
    );
  }

  if (userRole === 'student' && currentStudent && !currentStudent.isRegistered) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <StudentRegistrationView 
          student={currentStudent} 
          onLogout={handleLogout}
          onComplete={async (updated) => {
            try {
              await databaseService.saveStudents([updated]);
              setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
              setCurrentStudent(updated);
              localStorage.setItem('sar_currentStudent', JSON.stringify(updated));
              toast.success("Registration completed successfully! Welcome to the portal.");
            } catch (err) {
              console.error("Error completing student registration:", err);
              toast.error("Failed to save registration details to server.");
            }
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      {!activeTask && (
        <aside 
          className={cn(
            "bg-white border-r border-slate-200 flex flex-col fixed h-full transition-all duration-300 z-50",
            isSidebarCollapsed ? "w-20" : "w-64"
          )}
        >
        <div className={cn(
          "p-6 flex items-center justify-between border-b border-slate-50",
          isSidebarCollapsed ? "flex-col gap-4 px-2" : ""
        )}>
          <div className="flex items-center gap-3 overflow-hidden group cursor-pointer" onClick={() => {
            setShowLoginGate(true);
            setIsLoggedIn(false);
            setLoginStep('role');
            setSelectedRole(null);
            setIsAdminLogin(false);
          }}>
            <div className="p-2 bg-indigo-600 rounded-lg shrink-0 group-hover:bg-indigo-500 transition-colors">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-slate-900 tracking-tight whitespace-nowrap group-hover:text-indigo-600 transition-colors"
              >
                SAR Portal
              </motion.span>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-400 hover:text-indigo-600"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
        
        <nav className={cn(
          "flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden",
          isSidebarCollapsed ? "px-2" : "px-4"
        )}>
          {userRole === 'student' ? (
            <>
              <SidebarItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label={
                  <div className="flex items-center gap-2">
                    My Dashboard
                    {hasNewTasks && <Badge className="bg-rose-500 text-white border-none h-2 w-2 rounded-full p-0 animate-pulse" />}
                  </div>
                } 
                active={currentView === 'dashboard'} 
                onClick={() => {
                  setCurrentView('dashboard');
                  setHasNewTasks(false);
                }} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<BookOpen className="w-5 h-5" />} 
                label="My Activities" 
                active={currentView === 'student-activities'} 
                onClick={() => setCurrentView('student-activities')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Calendar className="w-5 h-5" />} 
                label="Alloted Sessions" 
                active={currentView === 'student-sessions'} 
                onClick={() => setCurrentView('student-sessions')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<UserCircle className="w-5 h-5" />} 
                label="My Profile" 
                active={currentView === 'student-portal-profile'} 
                onClick={() => setCurrentView('student-portal-profile')} 
                collapsed={isSidebarCollapsed}
              />
            </>
          ) : userRole === 'admin' ? (
            <>
              <SidebarItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="Admin Panel" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Building2 className="w-5 h-5" />} 
                label="Batch Control" 
                active={currentView === 'batch-control'} 
                onClick={() => setCurrentView('batch-control')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<ShieldCheck className="w-5 h-5" />} 
                label="Faculty Management" 
                active={currentView === 'faculty-mgmt'} 
                onClick={() => setCurrentView('faculty-mgmt')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<BrainCircuit className="w-5 h-5" />} 
                label="Skill Configurator" 
                active={currentView === 'skill-config'} 
                onClick={() => setCurrentView('skill-config')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Users className="w-5 h-5" />} 
                label="Student List" 
                active={currentView === 'students' || currentView === 'student-detail'} 
                onClick={() => setCurrentView('students')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<BarChart3 className="w-5 h-5" />} 
                label="Reports" 
                active={currentView === 'reports'} 
                onClick={() => setCurrentView('reports')} 
                collapsed={isSidebarCollapsed}
              />
            </>
          ) : (
            <>
              <SidebarItem 
                icon={<LayoutDashboard className="w-5 h-5" />} 
                label="Dashboard" 
                active={currentView === 'dashboard'} 
                onClick={() => setCurrentView('dashboard')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<FileEdit className="w-5 h-5" />} 
                label={
                  <div className="flex items-center gap-2">
                    <span>Assign Tasks</span>
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full animate-glow">BETA</span>
                  </div>
                }
                active={currentView === 'assign-tasks'} 
                onClick={() => setCurrentView('assign-tasks')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<CheckCircle2 className="w-5 h-5" />} 
                label="Marks Entry" 
                active={currentView === 'marks'} 
                onClick={() => setCurrentView('marks')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<Users className="w-5 h-5" />} 
                label="My Students" 
                active={currentView === 'students' || currentView === 'student-detail'} 
                onClick={() => setCurrentView('students')} 
                collapsed={isSidebarCollapsed}
              />
              <SidebarItem 
                icon={<BarChart3 className="w-5 h-5" />} 
                label="Growth Reports" 
                active={currentView === 'reports'} 
                onClick={() => setCurrentView('reports')} 
                collapsed={isSidebarCollapsed}
              />
            </>
          )}
        </nav>
        
        <div className={cn(
          "p-4 border-t border-slate-100 space-y-2",
          isSidebarCollapsed ? "px-2" : "px-4"
        )}>
          <button 
            onClick={() => {
              if (userRole === 'student') setCurrentView('student-portal-profile');
              else setCurrentView('teacher-profile');
            }}
            className={cn(
              "w-full text-left flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group relative",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "px-4 py-3",
              currentView === 'teacher-profile' && "bg-slate-100 dark:bg-slate-800"
            )}
            title={isSidebarCollapsed ? (userRole === 'student' ? currentStudent?.name : currentTeacher?.name) : "Profile Settings"}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
              {userRole === 'student' 
                ? (currentStudent?.name?.charAt(0) || 'S') 
                : (currentTeacher?.name?.charAt(0) || (userRole === 'admin' ? 'A' : 'T'))}
            </div>
            {!isSidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-xs font-bold text-slate-900 truncate">
                  {userRole === 'admin' ? "Admin" : (userRole === 'student' ? currentStudent?.name : currentTeacher?.name)}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-bold">
                  {userRole === 'student' 
                    ? `Roll: ${currentStudent?.rollNo}` 
                    : (userRole === 'admin' ? "System Control" : `Batch: ${currentTeacher?.batch === 'None' ? 'Unassigned' : currentTeacher?.batch}`)
                  }
                </p>
              </motion.div>
            )}
          </button>
          
          <SidebarItem 
            icon={<Mail className="w-5 h-5" />} 
            label={
              <div className="flex items-center gap-2">
                Inbox
                {unreadMessage && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
              </div>
            } 
            active={currentView === 'inbox'} 
            onClick={() => setCurrentView('inbox')} 
            collapsed={isSidebarCollapsed}
          />

          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200",
              isSidebarCollapsed ? "justify-center px-0 py-3" : "px-4 py-3"
            )}
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-8 transition-all duration-300",
        activeTask ? "ml-0" : (isSidebarCollapsed ? "ml-20" : "ml-64")
      )}>
        {/* Global Notification Banner */}
        <AnimatePresence>
          {unreadMessage && currentView !== 'inbox' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div 
                className="bg-indigo-600 text-white p-4 rounded-[2rem] flex items-center justify-between shadow-xl shadow-indigo-100 cursor-pointer group"
                onClick={() => setCurrentView('inbox')}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <BellRing className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest opacity-70">New message from {unreadMessage.senderName}</p>
                    <p className="font-bold line-clamp-1">{unreadMessage.text}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="bg-white/10 hover:bg-white/20 rounded-xl px-4 border-none text-white gap-2">
                  View Inbox <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentView === 'inbox' && (
            <div key="inbox">
              <InboxView 
                currentUser={userRole === 'student' ? currentStudent : currentTeacher} 
                userRole={userRole!} 
                students={students}
                teachers={teachers}
              />
            </div>
          )}
          {currentView === 'dashboard' && (
            <div key="dashboard">
              {userRole === 'student' && currentStudent ? (
                <StudentDashboardView student={currentStudent} tasks={studentTasks} onNavigate={setCurrentView} />
              ) : userRole === 'admin' ? (
                <AdminDashboardView 
                  students={students} 
                  teachers={teachers}
                  batchesList={batchesList}
                  auditLogs={auditLogs}
                  onNavigate={setCurrentView}
                />
              ) : (
                <DashboardView 
                  students={filteredStudents} 
                  teacher={currentTeacher} 
                  batchesList={batchesList}
                  adminSelectedBatch={adminSelectedBatch}
                  setAdminSelectedBatch={setAdminSelectedBatch}
                  activityLogs={activityLogs}
                  setCurrentView={setCurrentView}
                />
              )}
            </div>
          )}
          {currentView === 'batch-control' && (
            <div key="batch-control">
              <BatchControlView 
                students={students} 
                teachers={teachers} 
                batchesList={batchesList}
                setBatchesList={setBatchesList}
                setTeachers={setTeachers}
                currentTeacher={currentTeacher}
                setCurrentTeacher={setCurrentTeacher}
                setAuditLogs={setAuditLogs} 
              />
            </div>
          )}
          {currentView === 'faculty-mgmt' && (
            <div key="faculty-mgmt">
              <FacultyManagementView 
                teachers={teachers} 
                setTeachers={setTeachers} 
                setAuditLogs={setAuditLogs} 
              />
            </div>
          )}
          {currentView === 'skill-config' && (
            <div key="skill-config">
              <SkillConfiguratorView 
                setAuditLogs={setAuditLogs} 
              />
            </div>
          )}
          {currentView === 'student-portal-profile' && currentStudent && (
            <div key="student-portal-profile">
              <StudentPortalProfileView student={currentStudent} />
            </div>
          )}
          {currentView === 'student-activities' && currentStudent && (
            <div key="student-activities">
              <StudentActivitiesView 
                student={currentStudent} 
                activeTask={activeTask}
                setActiveTask={setActiveTask}
              />
            </div>
          )}
          {currentView === 'student-sessions' && currentStudent && (
            <div key="student-sessions">
              <StudentSessionsView student={currentStudent} />
            </div>
          )}
          {currentView === 'students' && (
            <div key="students">
              <StudentListView 
                students={filteredStudents} 
                teacher={currentTeacher}
                batchesList={batchesList}
                adminSelectedBatch={adminSelectedBatch}
                setAdminSelectedBatch={setAdminSelectedBatch}
                onViewDetail={(s) => {
                  setSelectedStudent(s);
                  setCurrentView('student-detail');
                }} 
              />
            </div>
          )}
          {currentView === 'student-detail' && selectedStudent && (
            <div key="detail">
              <StudentDetailView 
                student={selectedStudent} 
                onBack={() => setCurrentView('students')} 
              />
            </div>
          )}
          {currentView === 'marks' && (
            <div key="marks">
              <MarksEntryView 
                students={filteredStudents} 
                teacher={currentTeacher}
                setStudents={setStudents} 
                setActivityLogs={setActivityLogs}
                taskIdFilter={marksTaskIdFilter || undefined}
                onClearFilter={() => setMarksTaskIdFilter(null)}
              />
            </div>
          )}
          {currentView === 'reports' && (
            <div key="reports">
              <ReportsView students={filteredStudents} />
            </div>
          )}
          {currentView === 'upload' && (
            <div key="upload">
              <DataUploadView 
                teachers={teachers}
                onDataExtracted={(newStudents) => {
                  setStudents(prev => {
                    const updated = [...prev];
                    newStudents.forEach(ns => {
                      const index = updated.findIndex(s => s.rollNo === ns.rollNo);
                      if (index !== -1) {
                        updated[index] = { ...updated[index], ...ns };
                      } else {
                        updated.push(ns);
                      }
                    });
                    return updated;
                  });
                  if (currentTeacher?.role === 'Admin') {
                    setAdminSelectedBatch('All');
                  }
                  setIsSetupComplete(true);
                  setCurrentView('students');
                }}
              />
            </div>
          )}
          {currentView === 'teacher-profile' && (
            <div key="teacher-profile">
              {currentTeacher ? (
                <TeacherProfileView 
                  teacher={currentTeacher} 
                  onUpdate={(updated) => {
                    setCurrentTeacher(updated);
                    setTeachers(prev => prev.map(t => t.id === updated.id ? updated : t));
                    localStorage.setItem('sar_currentTeacher', JSON.stringify(updated));
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center animate-pulse">
                    <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">Loading profile information...</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {currentView === 'assign-tasks' && (
            <div key="assign-tasks">
              <AssignTasksView 
                teacher={currentTeacher} 
                students={students} 
                setCurrentView={setCurrentView} 
                setMarksTaskIdFilter={setMarksTaskIdFilter}
              />
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function FlipCard({ 
  icon: Icon, 
  title, 
  description, 
  features, 
  backTitle, 
  backDescription, 
  buttonText, 
  onAction, 
  isComingSoon,
  disableFlip
}: { 
  icon: any, 
  title: string, 
  description: string, 
  features: string[], 
  backTitle: string, 
  backDescription: string, 
  buttonText: string, 
  onAction: () => void,
  isComingSoon?: boolean,
  disableFlip?: boolean
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-[350px] h-[390px] [perspective:1000px]"
      onMouseEnter={() => !disableFlip && setIsFlipped(true)}
      onMouseLeave={() => !disableFlip && setIsFlipped(false)}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-300 [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Front */}
        <Card className="absolute inset-0 [backface-visibility:hidden] border-none shadow-xl bg-white dark:bg-[#1e293b] overflow-hidden flex flex-col items-center justify-center text-center p-4 rounded-3xl">
          <div className="mx-auto w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-3">
            <Icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-[22px] font-semibold text-[#2D3748] dark:text-slate-100 mb-1 font-sans">{title}</CardTitle>
          <CardContent className="text-center pb-0 flex flex-col items-center">
            <p className="text-[#718096] dark:text-slate-400 mb-4 px-4 text-[16px] font-normal leading-relaxed font-sans">
              {description}
            </p>
            <ul className="text-[15px] text-[#A0AEC0] dark:text-slate-500 space-y-1 mb-4 font-normal font-sans">
              {features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            {disableFlip && (
              <Button 
                className="px-6 py-2 rounded-full font-bold text-[16px] bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-md transition-all duration-300 w-fit border-none"
                onClick={onAction}
              >
                {buttonText}
              </Button>
            )}
            {!disableFlip && isComingSoon && (
              <div className="py-1 px-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-bold text-[14px]">
                Coming Soon
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back */}
        {!disableFlip && (
          <Card className="absolute inset-0 [backface-visibility:hidden] border-none shadow-xl bg-white dark:bg-[#1e293b] overflow-hidden flex flex-col items-center justify-center text-center p-4 rounded-3xl [transform:rotateY(180deg)]">
            <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-[32px] font-bold text-slate-900 dark:text-slate-100 mb-1">{backTitle}</CardTitle>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-[16px]">{backDescription}</p>
            <Button 
              onClick={onAction}
              className={`px-6 py-2 rounded-full font-bold text-[18px] flex items-center gap-2 transition-all duration-300 ${
                isComingSoon 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              {buttonText} <ChevronRight className="w-5 h-5" />
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}

function TeacherProfileView({ 
  teacher, 
  onUpdate 
}: { 
  teacher: Teacher, 
  onUpdate: (updated: Teacher) => void 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: teacher.name,
    emailId: teacher.emailId || '',
    contactNo: teacher.contactNo || '',
    department: teacher.department || '',
    photo: teacher.photo || ''
  });

  const handleSave = async () => {
    try {
      const updatedTeacher = { ...teacher, ...editedData };
      await databaseService.saveTeacher(updatedTeacher);
      onUpdate(updatedTeacher);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            {teacher.role === 'Admin' ? 'Administrator Settings' : 'Faculty Profile'}
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            {isEditing ? "Modify profile credentials" : (teacher.role === 'Admin' ? "System root control and profile management" : "Personal details and performance analytics")}
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200" 
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                className="rounded-xl" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-indigo-600 rounded-xl" 
                onClick={handleSave}
              >
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <div className="h-24 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
              {isEditing && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-md">EDIT MODE</Badge>
                </div>
              )}
            </div>
            <CardContent className="relative pt-12 text-center">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-2xl overflow-hidden relative group border border-slate-100">
                  {(isEditing ? editedData.photo : teacher.photo) ? (
                    <img 
                      src={isEditing ? editedData.photo : teacher.photo} 
                      alt={teacher.name} 
                      className="w-full h-full object-cover rounded-full transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center text-indigo-700 font-black text-3xl shadow-inner">
                      {(isEditing ? editedData.name : teacher.name)?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <div className="space-y-4 px-4 pb-2">
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] uppercase font-black text-slate-400">Identity Photo URL</Label>
                    <Input 
                      value={editedData.photo} 
                      onChange={e => setEditedData({...editedData, photo: e.target.value})} 
                      placeholder="https://image-url.com"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] uppercase font-black text-slate-400">Display Name</Label>
                    <Input 
                      value={editedData.name} 
                      onChange={e => setEditedData({...editedData, name: e.target.value})} 
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>
              ) : (
                <div className="pb-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {teacher.role === 'Admin' ? 'Admin' : teacher.name}
                  </h3>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1 opacity-70">
                    {teacher.role === 'Admin' ? 'Root Access' : 'Placement Faculty'}
                  </p>
                </div>
              )}
              
              <div className="mt-3 text-xs font-bold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-full inline-block">
                EID: {teacher.employeeId}
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 py-4 flex justify-around">
              <div className="text-center">
                <p className="text-xs text-slate-500">Assigned Batch</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {teacher.role === 'Admin' ? 'Global Access' : (teacher.batch === 'None' ? 'Unassigned' : teacher.batch)}
                </p>
              </div>
              {teacher.performanceDetails && teacher.role !== 'Admin' && (
                <div className="text-center">
                  <p className="text-xs text-slate-500">Rating</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{teacher.performanceDetails.rating}/5</p>
                </div>
              )}
            </CardFooter>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold">Account Info</CardTitle>
              {isEditing && <Badge variant="outline" className="text-[8px] text-indigo-600">Editable</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-slate-400 mt-1" />
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                  {isEditing ? (
                    <Input 
                      value={editedData.emailId} 
                      onChange={e => setEditedData({...editedData, emailId: e.target.value})} 
                      placeholder="Enter admin email"
                      className="h-8 text-xs mt-1"
                    />
                  ) : (
                    <span className="block text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {teacher.emailId || (teacher.role === 'Admin' ? '' : 'N/A')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-slate-400 mt-1" />
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Contact No.</span>
                  {isEditing ? (
                    <Input 
                      value={editedData.contactNo} 
                      onChange={e => setEditedData({...editedData, contactNo: e.target.value})} 
                      placeholder="Enter contact number"
                      className="h-8 text-xs mt-1"
                    />
                  ) : (
                    <span className="block text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {teacher.contactNo || (teacher.role === 'Admin' ? '' : 'N/A')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-slate-400 mt-1" />
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deptt.</span>
                  {isEditing ? (
                    <Input 
                      value={editedData.department} 
                      onChange={e => setEditedData({...editedData, department: e.target.value})} 
                      placeholder="Enter department"
                      className="h-8 text-xs mt-1"
                    />
                  ) : (
                    <span className="block text-sm text-slate-600 dark:text-slate-300 font-medium">
                      {teacher.department || (teacher.role === 'Admin' ? '' : 'N/A')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-slate-400 mt-1" />
                <div className="flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Username</span>
                  <span className="block text-sm text-slate-400 font-mono italic">{teacher.username}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {teacher.role === 'Admin' ? (
             <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden">
                <CardContent className="p-8 space-y-4">
                  <div className="p-3 bg-white/20 rounded-xl w-fit">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Administrative Dashboard Active</h2>
                    <p className="text-indigo-100 mt-1">You have full system access to all batches, students, and faculty management.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <p className="text-sm text-indigo-200">System Status</p>
                      <p className="text-xl font-bold">Online</p>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <p className="text-sm text-indigo-200">Access Level</p>
                      <p className="text-xl font-bold">Root</p>
                    </div>
                  </div>
                </CardContent>
             </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Students Helped</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-bold text-slate-900">{teacher.performanceDetails?.studentsHelped || 0}</h3>
                      <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +12%
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Feedback Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-bold text-slate-900">{teacher.performanceDetails?.feedbackScore || 0}%</h3>
                      <div className="flex mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Teacher impact and engagement statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Workshops Conducted</span>
                        <span className="font-bold text-slate-900">{teacher.performanceDetails?.workshopsConducted || 0}/30</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600" 
                          style={{ width: `${((teacher.performanceDetails?.workshopsConducted || 0) / 30) * 100}%` }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Student Satisfaction</span>
                        <span className="font-bold text-slate-900">{teacher.performanceDetails?.feedbackScore || 0}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500" 
                          style={{ width: `${teacher.performanceDetails?.feedbackScore || 0}%` }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Curriculum Completion</span>
                        <span className="font-bold text-slate-900">85%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500" 
                          style={{ width: '85%' }} 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-0 pt-6">
               <div className="flex items-center gap-2 text-slate-900 font-bold">
                 <History className="w-5 h-5 text-indigo-600" />
                 Recent Activity Logs
               </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex gap-3 border-l-2 border-slate-100 pl-4 py-1">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">Profile Accessed</p>
                    <p className="text-xs text-slate-500">Security audit: Profile details viewed via Dashboard.</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date().toLocaleString()}</p>
                  </div>
                </div>
                {isEditing && (
                   <div className="flex gap-3 border-l-2 border-indigo-400 pl-4 py-1">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-indigo-600 animate-pulse">Session Active: Editing Modes</p>
                      <p className="text-xs text-slate-500">You are currently making changes to profile identity.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Star className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Best Teacher of the Month</p>
                  <p className="text-xs text-slate-500">Awarded for exceptional student engagement in Batch {teacher.batch}.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <History className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">100% Attendance Streak</p>
                  <p className="text-xs text-slate-500">Maintained perfect attendance for the last 5 workshops.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: React.ReactNode, active: boolean, onClick: () => void, collapsed?: boolean }) {
  return (
    <button 
      onClick={onClick}
      title={collapsed && typeof label === 'string' ? label : ''}
      className={cn(
        "flex items-center gap-3 w-full rounded-xl transition-all duration-200 relative group",
        active 
          ? 'bg-indigo-50 text-indigo-600 font-bold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
        collapsed ? "justify-center px-0 py-3" : "px-4 py-3"
      )}
    >
      <div className={cn("shrink-0", active ? "scale-110" : "group-hover:scale-110 transition-transform duration-200")}>
        {icon}
      </div>
      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-medium truncate"
        >
          {label}
        </motion.span>
      )}
      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill" 
          className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" 
        />
      )}
      {active && collapsed && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-600 rounded-l-full" />
      )}
    </button>
  );
}

function StudentActivationView({ 
  onActivate, 
  onBack,
  students
}: { 
  onActivate: (student: Student) => void, 
  onBack: () => void,
  students: Student[]
}) {
  const [collegeId, setCollegeId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);

  const handleVerify = () => {
    const searchId = collegeId.trim().toLowerCase();
    const student = students.find(s => 
      s.collegeId?.toLowerCase() === searchId || 
      s.rollNo?.toLowerCase() === searchId
    );
    if (!student) {
      toast.error('No student found with this ID');
      return;
    }
    if (student.isActivated) {
      toast.error('Account already activated. Please login directly.');
      onBack();
      return;
    }
    setFoundStudent(student);
    setStep(2);
    toast.success('Identity verified!');
  };

  const handleComplete = () => {
    if (!username || !password) {
      toast.error('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }

    const updatedStudent = {
      ...foundStudent!,
      username,
      password,
      isActivated: true
    };
    onActivate(updatedStudent);
    toast.success('Account activated successfully!');
  };

  return (
    <Card className="w-full border-none shadow-2xl overflow-hidden rounded-[32px] bg-white dark:bg-slate-900 mt-8">
      <div className="bg-indigo-600 p-8 text-white relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-24 h-24" />
        </div>
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 text-indigo-200 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Login
        </button>
        <div className="mt-8">
          <Badge className="bg-indigo-500/50 text-indigo-100 border-none mb-2 hover:bg-indigo-500/50">Security Verification</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Activate Account</h2>
          <p className="text-indigo-100 opacity-80 mt-1">Setup your credentials for the first time</p>
        </div>
      </div>

      <CardContent className="p-8 space-y-6 bg-white dark:bg-slate-900 pt-10">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-sm text-indigo-700 flex items-start gap-2 leading-relaxed">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  Please enter your B2 ID to verify your record in our system.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Enter B2 ID</Label>
                <Input 
                  value={collegeId} 
                  onChange={e => setCollegeId(e.target.value)} 
                  placeholder="e.g. SKITIAN" 
                  className="h-12 rounded-xl border-slate-200 focus:ring-indigo-500"
                />
              </div>
              <Button 
                onClick={handleVerify} 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                Verify Identity
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Identity Verified</p>
                  <p className="text-lg font-bold text-slate-800">{foundStudent?.name}</p>
                  <p className="text-xs text-slate-500">{foundStudent?.branch} • B2 ID: {foundStudent?.rollNo}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">B2 ID (Username)</Label>
                  <Input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Set your B2 ID for login" 
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Create Password</Label>
                  <Input 
                    type="password"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="Create a strong password" 
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">Confirm Password</Label>
                  <Input 
                    type="password"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm your password" 
                    className="h-12 rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <Button 
                onClick={handleComplete} 
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                Finish Activation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
}

function StudentRegistrationView({ student, onComplete, onLogout }: { student: Student, onComplete: (updatedStudent: Student) => void, onLogout: () => void }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Student>({
    ...student,
    personalDetails: {
      phone: student.personalDetails?.phone || '',
      erpId: student.personalDetails?.erpId || '',
      emailSkit: student.personalDetails?.emailSkit || '',
      emailOther: student.personalDetails?.emailOther || '',
      fatherName: student.personalDetails?.fatherName || '',
      fatherContact: student.personalDetails?.fatherContact || '',
      motherName: student.personalDetails?.motherName || '',
      motherContact: student.personalDetails?.motherContact || '',
      address: student.personalDetails?.address || '',
      dob: student.personalDetails?.dob || '',
      gender: student.personalDetails?.gender || 'Male'
    },
    academicDetails: {
      tenthPercentage: student.academicDetails?.tenthPercentage || 0,
      twelfthPercentage: student.academicDetails?.twelfthPercentage || 0,
      semesterGrades: {
        "I Sem": student.academicDetails?.semesterGrades?.["I Sem"] || 0,
        "II Sem": student.academicDetails?.semesterGrades?.["II Sem"] || 0,
        "III Sem": student.academicDetails?.semesterGrades?.["III Sem"] || 0,
        "IV Sem": student.academicDetails?.semesterGrades?.["IV Sem"] || 0
      },
      currentCGPA: student.academicDetails?.currentCGPA || 0,
      backlogs: student.academicDetails?.backlogs || 0,
      skills: student.academicDetails?.skills || []
    }
  });

  const handleChange = (path: string, value: any) => {
    const keys = path.split('.');
    setFormData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleAcademicChange = (sem: string, value: string) => {
    const val = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      academicDetails: {
        ...prev.academicDetails!,
        semesterGrades: {
          ...prev.academicDetails!.semesterGrades,
          [sem]: val
        }
      }
    }));
  };

  const calculateCGPA = (grades: { [key: string]: number }) => {
    const values = Object.values(grades).filter(v => v > 0);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCGPA = calculateCGPA(formData.academicDetails!.semesterGrades);
    const finalData = {
      ...formData,
      isRegistered: true,
      academicDetails: {
        ...formData.academicDetails!,
        currentCGPA: finalCGPA
      }
    };
    onComplete(finalData);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Enter Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Roll No</Label>
                <Input value={formData.rollNo} onChange={e => handleChange('rollNo', e.target.value)} placeholder="Enter Roll No" />
              </div>
              <div className="space-y-2">
                <Label>College ID</Label>
                <Input value={formData.collegeId} onChange={e => handleChange('collegeId', e.target.value)} placeholder="Enter College ID" />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={formData.branch} onValueChange={v => handleChange('branch', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CS">Computer Science</SelectItem>
                    <SelectItem value="CS-AI">CS - AI & ML</SelectItem>
                    <SelectItem value="IT">Information Technology</SelectItem>
                    <SelectItem value="ME">Mechanical Engineering</SelectItem>
                    <SelectItem value="ECE">Electronics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section</Label>
                <Input value={formData.section} onChange={e => handleChange('section', e.target.value)} placeholder="e.g. A" />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={formData.year} onValueChange={v => handleChange('year', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st Year">1st Year</SelectItem>
                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                    <SelectItem value="4th Year">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Batch</Label>
                <Select value={formData.batch} onValueChange={val => handleChange('batch', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Batch A</SelectItem>
                    <SelectItem value="B">Batch B</SelectItem>
                    <SelectItem value="C">Batch C</SelectItem>
                    <SelectItem value="2024-A">2024-A</SelectItem>
                    <SelectItem value="2024-B">2024-B</SelectItem>
                    <SelectItem value="2024-C">2024-C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profile Photo URL</Label>
                <div className="flex gap-2">
                  <Input value={formData.photo} onChange={e => handleChange('photo', e.target.value)} placeholder="Image URL" />
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border overflow-hidden">
                    {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Image className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next Step <ChevronRight className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Contact & Family Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mobile No</Label>
                <Input value={formData.personalDetails?.phone} onChange={e => handleChange('personalDetails.phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="space-y-2">
                <Label>ERP ID</Label>
                <Input value={formData.personalDetails?.erpId} onChange={e => handleChange('personalDetails.erpId', e.target.value)} placeholder="Enter ERP ID" />
              </div>
              <div className="space-y-2">
                <Label>Mail ID (SKIT domain)</Label>
                <Input value={formData.personalDetails?.emailSkit} onChange={e => handleChange('personalDetails.emailSkit', e.target.value)} placeholder="name@skit.ac.in" />
              </div>
              <div className="space-y-2">
                <Label>Mail ID (Other domain)</Label>
                <Input value={formData.personalDetails?.emailOther} onChange={e => handleChange('personalDetails.emailOther', e.target.value)} placeholder="name@gmail.com" />
              </div>
              <div className="space-y-2">
                <Label>Father's Name</Label>
                <Input value={formData.personalDetails?.fatherName} onChange={e => handleChange('personalDetails.fatherName', e.target.value)} placeholder="Father's Name" />
              </div>
              <div className="space-y-2">
                <Label>Father's Contact No</Label>
                <Input value={formData.personalDetails?.fatherContact} onChange={e => handleChange('personalDetails.fatherContact', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Mother's Name</Label>
                <Input value={formData.personalDetails?.motherName} onChange={e => handleChange('personalDetails.motherName', e.target.value)} placeholder="Mother's Name" />
              </div>
              <div className="space-y-2">
                <Label>Mother's Contact No</Label>
                <Input value={formData.personalDetails?.motherContact} onChange={e => handleChange('personalDetails.motherContact', e.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}><ChevronRight className="mr-2 w-4 h-4 rotate-180" /> Back</Button>
              <Button onClick={() => setStep(3)}>Next Step <ChevronRight className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Academic Record</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class X Percentage (%)</Label>
                <Input type="number" value={formData.academicDetails?.tenthPercentage} onChange={e => handleChange('academicDetails.tenthPercentage', parseFloat(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Class XII Percentage (%)</Label>
                <Input type="number" value={formData.academicDetails?.twelfthPercentage} onChange={e => handleChange('academicDetails.twelfthPercentage', parseFloat(e.target.value))} />
              </div>
            </div>
            
            <h4 className="font-bold text-slate-800 mt-4">Semester-wise GPA</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["I Sem", "II Sem", "III Sem", "IV Sem"].map(sem => (
                <div key={sem} className="space-y-2">
                  <Label>{sem}</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.academicDetails?.semesterGrades[sem] || 0} 
                    onChange={e => handleAcademicChange(sem, e.target.value)} 
                  />
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-bold uppercase">Estimated CGPA</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {calculateCGPA(formData.academicDetails!.semesterGrades).toFixed(2)}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}><ChevronRight className="mr-2 w-4 h-4 rotate-180" /> Back</Button>
              <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">Complete Registration <Save className="ml-2 w-4 h-4" /></Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
      >
        <div className="p-8 pb-0">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Student Registration</h2>
              <p className="text-slate-500">Welcome to the portal. Please complete your profile to continue.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout} className="ml-auto text-slate-400 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>

          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: step >= s ? '100%' : '0%' }}
                  className="h-full bg-indigo-600"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 pt-0">
          {renderStep()}
        </div>
      </motion.div>
    </div>
  );
}

function StudentDashboardView({ student, tasks, onNavigate }: { student: Student, tasks: Task[], onNavigate: (view: View) => void }) {
  const post = student.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
  const pre = student.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
  const workshop = student.workshopScores || [];
  const alloted = student.allotedActivities || [];

  const avgPost = (((post.communication || 0) + (post.technical || 0) + (post.logic || 0) + (post.confidence || 0)) / 4) || 0;
  const avgPre = (((pre.communication || 0) + (pre.technical || 0) + (pre.logic || 0) + (pre.confidence || 0)) / 4) || 0;
  const improvement = avgPre > 0 ? ((avgPost - avgPre) / avgPre) * 100 : 0;
  const attendanceRate = workshop.length > 0 
    ? (workshop.filter(ws => ws.attendance === 'Present').length / workshop.length) * 100 
    : 0;

  const radarData = [
    { subject: 'Communication', A: pre.communication || 0, B: post.communication || 0 },
    { subject: 'Technical', A: pre.technical || 0, B: post.technical || 0 },
    { subject: 'Logic', A: pre.logic || 0, B: post.logic || 0 },
    { subject: 'Confidence', A: pre.confidence || 0, B: post.confidence || 0 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome, {student.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">SKIT ID</p>
          <p className="text-lg font-semibold text-slate-900">{student.collegeId || student.rollNo}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard 
          title="Overall Score" 
          value={`${avgPost.toFixed(1)}/10`} 
          icon={<Star className="w-6 h-6 text-indigo-600" />}
          trend="Current Average"
          color="indigo"
        />
        <MetricCard 
          title="Improvement" 
          value={`${improvement.toFixed(1)}%`} 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          trend="Growth"
          color="emerald"
        />
        <MetricCard 
          title="Attendance" 
          value={`${attendanceRate.toFixed(0)}%`} 
          icon={<Users className="w-6 h-6 text-orange-600" />}
          trend="Current Presence"
          color="blue"
        />
        <MetricCard 
          title="Pending Tasks" 
          value={(student.allotedActivities?.filter(a => a.status === 'Pending').length || 0).toString()} 
          icon={<Calendar className="w-6 h-6 text-rose-600" />}
          trend="Action items"
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-indigo-700 text-indigo-100 border-none">AI Insight</Badge>
              </div>
              <CardTitle className="text-2xl">Personalised Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-100 text-lg leading-relaxed">
                {getAIFeedback(avgPost)} We recommend prioritizing {student.allotedActivities?.[0]?.title} to boost your placement readiness.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Skill Growth Analysis</CardTitle>
              <CardDescription>Your pre-analysis vs post-analysis growth</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Baseline" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Current" dataKey="B" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-indigo-600 text-white p-6 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <CardTitle className="text-lg">Messages & Tasks</CardTitle>
                {tasks.length > 0 && <Badge className="ml-auto bg-white text-indigo-600 rounded-full h-5 w-5 flex items-center justify-center p-0">{tasks.length}</Badge>}
              </div>
              <CardDescription className="text-indigo-100/70 text-xs">Assigned by your placement coordinator</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 max-h-[350px] overflow-y-auto">
              <div className="px-2 pb-2">
                <Button 
                  onClick={() => onNavigate('inbox')}
                  className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 rounded-2xl h-11 font-bold gap-2 text-xs"
                >
                  <Mail className="w-4 h-4" /> Contact Admin / Teacher
                </Button>
              </div>
              {tasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-slate-300 text-sm font-medium">No active tasks or messages.</p>
                </div>
              ) : (
                tasks.map(task => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={task.id} 
                    className="p-4 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[10px] font-bold bg-white text-indigo-600 border-indigo-50">{task.type}</Badge>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">New Activity: {task.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">Assigned by Prof. {task.teacherName}. Deadline: {new Date(task.dueDate).toLocaleDateString()}.</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-3 text-indigo-600 h-9 shrink-0 text-xs font-bold hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-indigo-50"
                      onClick={() => {
                        toast.info(task.description);
                      }}
                    >
                      View Details
                    </Button>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Alloted by your teachers</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => onNavigate('student-sessions')}
              >
                View Details
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {student.upcomingSessions && student.upcomingSessions.length > 0 ? student.upcomingSessions.map((session) => (
                <div key={session.id} className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white border border-indigo-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-indigo-400">{session.date.split('-')[1]}</span>
                    <span className="text-lg font-bold text-indigo-600">{session.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{session.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{session.time} • {session.type}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No upcoming sessions alloted.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="w-5 h-5 text-indigo-600" />
                  Alloted Activities
                </CardTitle>
                <CardDescription>Tasks requiring completion</CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => onNavigate('student-activities')}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {student.allotedActivities && student.allotedActivities.length > 0 ? student.allotedActivities.map((act) => (
                <div key={act.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={act.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}>
                      {act.status === 'Completed' ? <Award className="w-5 h-5" /> : <History className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{act.title}</p>
                      <p className="text-[10px] text-slate-500">Deadline: {act.deadline}</p>
                    </div>
                  </div>
                  <Badge variant={act.status === 'Completed' ? 'default' : 'outline'} className={act.status === 'Completed' ? 'bg-emerald-500' : 'text-[10px]'}>
                    {act.status}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No activities alloted yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function TaskPlayer({ task, student, onBack }: { task: Task, student: Student, onBack: () => void }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState(task.timeLimit ? task.timeLimit * 60 : 1800); // 30 min default
  const [submitted, setSubmitted] = useState(false);
  const [grading, setGrading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [securityWarnings, setSecurityWarnings] = useState(0);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [proctorStarted, setProctorStarted] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(5);

  const triggerAutoSubmit = (reason: string) => {
    if (task.type === 'Create New Assignment') {
      handleSubmitAssignment(reason);
    } else {
      handleSubmitMock('time_expired_placeholder', reason);
    }
  };

  useEffect(() => {
    if (isFullscreenActive) {
      setFullscreenCountdown(5);
    }
  }, [isFullscreenActive]);

  useEffect(() => {
    if (!proctorStarted || submitted || isFullscreenActive) return;

    const timer = setInterval(() => {
      setFullscreenCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerAutoSubmit('Exited Fullscreen');
          toast.error("Test auto-submitted due to leaving fullscreen mode for more than 5 seconds.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFullscreenActive, proctorStarted, submitted]);

  useEffect(() => {
    if (!proctorStarted || submitted) return;

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreenActive(active);
      if (!active) {
        setFullscreenWarnings(prev => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error("Test auto-submitted due to multiple fullscreen violations.");
            triggerAutoSubmit('Exited Fullscreen');
          } else {
            toast.warning(`Warning: Exiting fullscreen is not allowed! (Violation ${next}/3)`);
          }
          return next;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings(prev => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error("Test auto-submitted due to multiple tab-switching violations.");
            triggerAutoSubmit('Tab Switched');
          } else {
            toast.warning(`Warning: Tab switching is not allowed! (Violation ${next}/3)`);
          }
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchWarnings(prev => {
        const next = prev + 1;
        if (next >= 3) {
          toast.error("Test auto-submitted due to multiple focus loss violations.");
          triggerAutoSubmit('Tab Switched');
        } else {
          toast.warning(`Warning: Leaving the test window is not allowed! (Violation ${next}/3)`);
        }
        return next;
      });
    };

    const blockEvent = (e: Event) => e.preventDefault();
    
    const blockKeydown = (e: KeyboardEvent) => {
      const isCmd = e.ctrlKey || e.metaKey;
      if (
        (isCmd && e.key === 'c') || 
        (isCmd && e.key === 'v') || 
        (isCmd && e.key === 'x') || 
        (isCmd && e.key === 'f') || 
        (isCmd && e.key === 'p') || 
        (isCmd && e.key === 'a') || 
        (isCmd && e.key === 's') || 
        e.key === 'F12' || 
        e.key === 'PrintScreen' ||
        (isCmd && e.shiftKey && e.key === 'I') || 
        (isCmd && e.shiftKey && e.key === 'J') || 
        (isCmd && e.shiftKey && e.key === 'C')
      ) {
        e.preventDefault();
        toast.error("Security policy blocks this action.");
        setSecurityWarnings(prev => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error("Test auto-submitted due to multiple security violations.");
            triggerAutoSubmit('Tried to Take Screenshot / Copy-Paste');
          }
          return next;
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', blockEvent);
    document.addEventListener('copy', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('dragstart', blockEvent);
    document.addEventListener('keydown', blockKeydown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', blockEvent);
      document.removeEventListener('copy', blockEvent);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('paste', blockEvent);
      document.removeEventListener('dragstart', blockEvent);
      document.removeEventListener('keydown', blockKeydown);
    };
  }, [proctorStarted, submitted]);

  useEffect(() => {
    if (task.type === 'Create New Assignment' && task.content) {
      const questions = [...(task.content as AssignmentContent).questions];
      if (task.randomize) {
        questions.sort(() => Math.random() - 0.5);
      }
      setShuffledQuestions(questions);
      setAnswers(new Array(questions.length).fill(-1));
    }
  }, [task]);

  useEffect(() => {
    if (timeLeft > 0 && !submitted) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !submitted) {
      handleFinalSubmission('Time Expired');
    }
  }, [timeLeft, submitted]);

  const handleFinalSubmission = (reason: string = 'Normal Submission') => {
    if (task.type === 'Create New Assignment') {
      handleSubmitAssignment(reason);
    } else {
      handleSubmitMock('time_expired_placeholder', reason);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadMock = () => {
    if (task.type === 'Conduct Mock Test' && task.content) {
      const doc = generateProfessionalPDF(task.content as MockTestContent);
      doc.save(`${task.title.replace(/\s+/g, '_')}_QuestionPaper.pdf`);
      toast.success('Question paper downloaded successfully');
    }
  };

  const handleSubmitMock = async (attachmentUrl: string = 'time_expired_placeholder', reason: any = 'Normal Submission') => {
    setGrading(true);
    let finalReason = 'Normal Submission';
    if (typeof reason === 'string' && reason !== 'Normal Submission') {
      finalReason = reason;
    } else {
      const details: string[] = [];
      if (fullscreenWarnings > 0) details.push(`${fullscreenWarnings} Fullscreen Warning(s)`);
      if (tabSwitchWarnings > 0) details.push(`${tabSwitchWarnings} Tab Switch Warning(s)`);
      if (securityWarnings > 0) details.push(`${securityWarnings} Security Warning(s)`);
      if (details.length > 0) {
        finalReason = `Normal Submission (${details.join(', ')})`;
      }
    }
    const submissionId = `sub_${task.id}_${student.id}`;
    const submission: Submission = {
      id: submissionId,
      taskId: task.id,
      studentId: student.id,
      studentName: student.name,
      batchId: student.batch,
      type: 'MockTest',
      submittedAt: new Date().toISOString(),
      status: 'Awaiting-Manual-Grading',
      totalMarks: (task.content as MockTestContent).totalMarks,
      teacherId: task.teacherId,
      attachmentUrl: attachmentUrl,
      submissionReason: finalReason
    };

    try {
      await databaseService.saveSubmission(submission);
      setSubmitted(true);
      toast.success('Mock test submitted for manual grading');
    } catch (err) {
      toast.error('Failed to submit mock test');
    } finally {
      setGrading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file only.');
      return;
    }

    setGrading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await handleSubmitMock(base64Data, 'Normal Submission');
      } catch (err) {
        toast.error('Failed to read file');
        setGrading(false);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setGrading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAssignment = async (reason: any = 'Normal Submission') => {
    if (!task.content) return;
    setGrading(true);
    let score = 0;
    
    shuffledQuestions.forEach((q, i) => {
      if (answers[i] === q.correctKey) score++;
    });

    let finalReason = 'Normal Submission';
    if (typeof reason === 'string') {
      finalReason = reason;
    } else {
      const details: string[] = [];
      if (fullscreenWarnings > 0) details.push(`${fullscreenWarnings} Fullscreen Warning(s)`);
      if (tabSwitchWarnings > 0) details.push(`${tabSwitchWarnings} Tab Switch Warning(s)`);
      if (securityWarnings > 0) details.push(`${securityWarnings} Security Warning(s)`);
      if (details.length > 0) {
        finalReason = `Normal Submission (${details.join(', ')})`;
      }
    }
    const isManual = task.gradingMode === 'Manual Grading';
    const submissionId = `sub_${task.id}_${student.id}`;
    const submission: Submission = {
      id: submissionId,
      taskId: task.id,
      studentId: student.id,
      studentName: student.name,
      batchId: student.batch,
      type: 'Assignment',
      submittedAt: new Date().toISOString(),
      status: isManual ? 'Awaiting-Manual-Grading' : 'Auto-Evaluated',
      score: isManual ? undefined : score,
      totalMarks: shuffledQuestions.length,
      answers,
      teacherId: task.teacherId,
      submissionReason: finalReason
    };

    try {
      await databaseService.saveSubmission(submission);
      setSubmitted(true);
      if (isManual) {
        toast.success('Assignment submitted for manual grading');
      } else {
        toast.success(`Assignment completed! Score: ${score}/${shuffledQuestions.length}`);
      }
    } catch (err) {
      toast.error('Failed to submit assignment');
    } finally {
      setGrading(false);
    }
  };

  if (submitted) {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    return (
      <Card className="rounded-[3rem] p-12 text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto" />
        <h2 className="text-3xl font-black text-slate-900">Task Submitted Successfully!</h2>
        <p className="text-slate-500">Your results have been pushed to the Marks Entry system.</p>
        <Button onClick={onBack} className="rounded-full px-8 h-12 bg-indigo-600 text-white">Back to Activities</Button>
      </Card>
    );
  }

  const isProctored = task.type === 'Create New Assignment' || task.type === 'Conduct Mock Test';

  if (isProctored && !proctorStarted) {
    return (
      <Card className="rounded-[3rem] p-12 max-w-2xl mx-auto text-center space-y-8 bg-white/85 backdrop-blur-md border border-slate-100 shadow-xl mt-10">
        <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-indigo-600 animate-pulse" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-900">Proctored Assignment</h2>
          <p className="text-sm text-slate-500 font-medium">
            This activity is monitored. To ensure academic integrity, please review the rules before launching:
          </p>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left space-y-3 text-xs font-semibold text-slate-600">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
            <p><strong>Fullscreen Mode Required</strong>: The test must be taken in fullscreen. Exiting fullscreen will trigger a warning. Exiting 3 times will auto-submit the exam.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
            <p><strong>Strict Focus Monitoring</strong>: Switching tabs or leaving the test window will trigger warnings. 3 focus losses will auto-submit the exam.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
            <p><strong>Copy-Paste & Context Menu Restrictions</strong>: Copying, pasting, right-clicking, text selection, and search keyboard shortcuts are completely disabled.</p>
          </div>
        </div>

        <Button 
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen();
              setProctorStarted(true);
              setIsFullscreenActive(true);
              toast.success("Fullscreen activated. Good luck!");
            } catch (err) {
              toast.error("Failed to enter fullscreen mode. Please check browser permissions.");
            }
          }} 
          className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold text-lg text-white"
        >
          Enter Fullscreen & Start Exam
        </Button>
      </Card>
    );
  }

  if (isProctored && !isFullscreenActive) {
    return (
      <Card className="rounded-[3rem] p-12 max-w-xl mx-auto text-center space-y-6 bg-rose-50/80 backdrop-blur-md border border-rose-100 shadow-xl mt-12">
        <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-2xl font-black text-rose-950">Fullscreen Mode Required!</h2>
        <p className="text-sm text-rose-705 font-medium">
          You have exited fullscreen mode, which violates exam policy. To resume, please click the button below to re-enter fullscreen mode.
        </p>
        <p className="text-sm font-bold text-rose-600 animate-pulse">
          Auto-submitting in <span className="text-lg font-black">{fullscreenCountdown}</span> seconds...
        </p>
        <p className="text-xs font-bold text-rose-500">
          Warning: Exiting fullscreen repeatedly will result in automatic submission. (Violations: {fullscreenWarnings}/3)
        </p>
        <Button 
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen();
              setIsFullscreenActive(true);
            } catch (err) {
              toast.error("Failed to re-enter fullscreen. Please try again.");
            }
          }} 
          className="rounded-full px-8 h-12 bg-rose-600 hover:bg-rose-700 text-white font-bold"
        >
          Re-enter Fullscreen
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 select-none" style={{ userSelect: 'none' }}>
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
          }
          onBack();
        }} className="rounded-full gap-2">
          <ArrowLeft className="w-4 h-4" /> Exit
        </Button>
        <div className="flex items-center gap-4">
           <div className={cn(
             "px-6 py-2 rounded-full font-bold shadow-sm border",
             timeLeft < 300 ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-white text-indigo-600 border-indigo-100"
           )}>
             Time Left: {formatTime(timeLeft)}
           </div>
        </div>
      </div>

      <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden pb-8">
        <div className="bg-indigo-600 p-8 text-white">
          <Badge className="bg-white/20 text-white border-none mb-2 px-3 py-1">{task.type}</Badge>
          <h1 className="text-3xl font-bold">{task.title}</h1>
          <p className="text-indigo-100 mt-2 opacity-80">{task.description}</p>
        </div>

        <CardContent className="p-8">
          {task.type === 'Conduct Mock Test' ? (
            <div className="space-y-8 text-center py-12">
               <div className="mx-auto w-24 h-24 bg-purple-50 rounded-3xl flex items-center justify-center mb-6">
                 <FileText className="w-12 h-12 text-purple-600" />
               </div>
               <h3 className="text-2xl font-bold text-slate-800">Mock Question Paper Ready</h3>
               <p className="text-slate-500 max-w-md mx-auto">Download the professional question paper, solve it on paper, and upload your answer sheet as a PDF.</p>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 accept="application/pdf" 
                 className="hidden" 
                 onChange={handleFileChange} 
               />
               <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                 <Button onClick={handleDownloadMock} size="lg" className="rounded-2xl gap-3 bg-purple-600 hover:bg-purple-700 h-16 px-8 text-lg font-bold">
                   <Upload className="rotate-180 w-6 h-6" /> Download Question Paper
                 </Button>
                 <Button onClick={() => fileInputRef.current?.click()} disabled={grading} variant="outline" size="lg" className="rounded-2xl gap-3 h-16 px-8 text-lg font-bold border-2">
                   <Upload className="w-6 h-6" /> Upload Answer Sheet
                 </Button>
               </div>
            </div>
          ) : task.type === 'Create New Assignment' && task.content ? (
            <div className="space-y-8">
              {shuffledQuestions.map((q, qIndex) => (
                <div key={q.id} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex gap-4">
                    <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black shrink-0">{qIndex + 1}</span>
                    <p className="text-lg font-bold text-slate-800 pt-0.5">{q.question}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                    {q.options.map((opt, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => {
                          const next = [...answers];
                          next[qIndex] = oIndex;
                          setAnswers(next);
                        }}
                        className={cn(
                          "p-4 rounded-2xl text-left border-2 transition-all font-medium text-sm",
                          answers[qIndex] === oIndex 
                            ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200"
                        )}
                      >
                        <span className="inline-block w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black mr-2 text-center leading-6">
                          {String.fromCharCode(65 + oIndex)}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-8 flex justify-center">
                 <Button onClick={handleSubmitAssignment} disabled={grading || answers.includes(-1)} size="lg" className="h-16 px-12 rounded-3xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xl shadow-xl shadow-indigo-100">
                   {grading ? "Submitting..." : "Submit Assignment"}
                 </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Info className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Manual review activity. Please follow teacher instructions.</p>
              <Button onClick={() => setSubmitted(true)} className="mt-6 rounded-full px-8 bg-indigo-600">Mark as Completed</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentActivitiesView({ 
  student,
  activeTask,
  setActiveTask
}: { 
  student: Student;
  activeTask: Task | null;
  setActiveTask: (task: Task | null) => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tList, sList] = await Promise.all([
          databaseService.getTasksByBatch(student.batch),
          databaseService.getSubmissionsByStudent(student.id)
        ]);
        setTasks(tList);
        setSubmissions(sList);
      } catch (err) {
        console.error("Error fetching student activities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student.batch, student.id]);

  if (activeTask) {
    return <TaskPlayer task={activeTask} student={student} onBack={() => setActiveTask(null)} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Activities</h1>
          <p className="text-slate-500 mt-1">Track your participation and teacher allotted tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Active Assignments & Mock Tests</CardTitle>
            <CardDescription>Live tasks assigned to your batch</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-20 flex justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-20 text-slate-400 italic bg-slate-50 rounded-3xl border border-dashed border-slate-200">No active tasks for your batch right now.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tasks.map((task) => {
                  const submission = submissions.find(s => s.taskId === task.id);
                  return (
                    <div key={task.id} className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                           <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{task.type}</Badge>
                           {submission ? (
                             <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">Submitted</Badge>
                           ) : (
                             <Badge variant="outline" className="text-amber-500 border-amber-100 bg-amber-50 text-[10px]">Pending</Badge>
                           )}
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg mb-1">{task.title}</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-[10px] font-bold text-slate-400">
                          DEADLINE: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        {submission ? (
                          <div className="text-xs font-bold text-emerald-600">
                            {submission.status === 'Graded' || submission.status === 'Auto-Evaluated' ? `Score: ${submission.score}/${submission.totalMarks}` : "Submitted"}
                          </div>
                        ) : task.status === 'Closed' ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 uppercase bg-rose-50 px-3 py-1.5 rounded-full">
                            <Lock className="w-3 h-3" /> Submission Window Closed
                          </div>
                        ) : (
                          <Button 
                            onClick={() => setActiveTask(task)}
                            size="sm" 
                            className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-9 px-4 font-bold"
                          >
                            Launch Task
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function StudentSessionsView({ student }: { student: Student }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alloted Sessions</h1>
          <p className="text-slate-500 mt-1">Manage your upcoming teacher-scheduled sessions</p>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>Future events you are required to attend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {student.upcomingSessions && student.upcomingSessions.length > 0 ? student.upcomingSessions.map((session) => (
              <div key={session.id} className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-indigo-100 flex flex-col items-center justify-center shrink-0 shadow-sm">
                    <span className="text-xs uppercase font-bold text-indigo-400">{session.date.split('-')[1]}</span>
                    <span className="text-2xl font-bold text-indigo-600">{session.date.split('-')[2]}</span>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800">{session.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="bg-white border-indigo-100 text-indigo-600">{session.type}</Badge>
                      <span className="text-sm text-slate-500">{session.time}</span>
                    </div>
                  </div>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">Add to Calendar</Button>
              </div>
            )) : (
              <div className="text-center py-12 text-slate-400 italic">No upcoming sessions scheduled yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StudentPortalProfileView({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState<'personal' | 'academic'>('personal');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-indigo-100">
                {student.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
              <p className="text-slate-500">Roll No: {student.rollNo} • College ID: {student.collegeId || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-center overflow-x-auto">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Personal Info
          </button>
          <button 
            onClick={() => setActiveTab('academic')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'academic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Academic Record
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'personal' && (
          <motion.div 
            key="personal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-medium text-slate-900">{student.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Roll No</p>
                    <p className="text-sm font-medium text-slate-900">{student.rollNo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">College ID</p>
                    <p className="text-sm font-medium text-slate-900">{student.collegeId || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ERP ID</p>
                    <p className="text-sm font-medium text-slate-900">{student.personalDetails?.erpId || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Branch</p>
                    <p className="text-sm font-medium text-slate-900">{student.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Section</p>
                    <p className="text-sm font-medium text-slate-900">{student.section || 'A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Year</p>
                    <p className="text-sm font-medium text-slate-900">{student.year || '3rd Year'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Batch</p>
                    <p className="text-sm font-medium text-slate-900">{student.batch}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">mail id (SKIT domain)</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.emailSkit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">mail id (other domain)</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.emailOther}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Mob No</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.phone}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Family Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">F-Name & Contact no.</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.fatherName} • {student.personalDetails?.fatherContact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">M-Name & Contact no.</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.motherName} • {student.personalDetails?.motherContact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.address}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'academic' && (
          <motion.div 
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-indigo-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs font-medium">Current CGPA</p>
                      <h3 className="text-3xl font-bold mt-1">{(student.academicDetails?.currentCGPA || 0).toFixed(2)}</h3>
                    </div>
                    <Award className="w-8 h-8 text-indigo-300 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-medium">X Percentage</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{student.academicDetails?.tenthPercentage || 0}%</h3>
                    </div>
                    <GraduationCap className="w-8 h-8 text-slate-200" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-xs font-medium">XII Percentage</p>
                      <h3 className="text-2xl font-bold text-slate-900 mt-1">{student.academicDetails?.twelfthPercentage || 0}%</h3>
                    </div>
                    <GraduationCap className="w-8 h-8 text-slate-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Semester Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(student.academicDetails?.semesterGrades || {}).sort().map(([sem, grade]) => (
                    <div key={sem} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sem}</p>
                      <p className="text-xl font-bold text-indigo-600 mt-1">{(grade || 0).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Academic History View
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={Object.entries(student.academicDetails?.semesterGrades || {}).sort().map(([k, v]) => ({ name: k, grade: v || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="grade" name="GPA" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AdminDashboardView({ 
  students, 
  teachers, 
  batchesList,
  auditLogs,
  onNavigate 
}: { 
  students: Student[], 
  teachers: Teacher[], 
  batchesList: BatchConfig[],
  auditLogs: AuditLogEntry[],
  onNavigate: (view: View) => void 
}) {
  const [aiAdvice, setAiAdvice] = useState<string>("Analyzing batch performance for managerial insights...");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (students.length > 0) {
      generateAdvice();
    }
  }, [students.length]);

  const generateAdvice = async () => {
    try {
      setIsGenerating(true);
      const model = "gemini-3-flash-preview";
      const totalStudents = students.length;
      const batchNames = [...new Set(students.map(s => s.batch))];
      
      const prompt = `You are a Senior Placement Director at SKIT College. 
      Context: We have ${totalStudents} students across ${batchNames.length} batches: ${batchNames.join(', ')}.
      Student scores are in categories: communication, technical, logic, confidence.
      Task: Provide a concise, high-impact managerial insight and one specific recommendation for the college administration based on this data.
      Format: Return a professional administrative insight and a specific recommendation. Avoid generic conversational prefixes like "Here is your insight". Return direct observations and instructions.`;

      const result = await databaseService.generateAIContent({
        model,
        contents: prompt,
        config: { temperature: 0.7 }
      });

      setAiAdvice(result.text || "Batch performance is consistent. Monitor progress in logical reasoning.");
    } catch (error) {
      console.error("AI Advice Error:", error);
      setAiAdvice("Faculty workload remains balanced. Data suggests increasing focus on technical mock interviews for upcoming placement drive.");
    } finally {
      setIsGenerating(false);
    }
  };

  const avgImprovement = students.length > 0 
    ? students.reduce((acc, s) => {
        const preObj = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
        const postObj = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
        const pre = ((preObj.communication || 0) + (preObj.technical || 0) + (preObj.logic || 0) + (preObj.confidence || 0)) / 4;
        const post = ((postObj.communication || 0) + (postObj.technical || 0) + (postObj.logic || 0) + (postObj.confidence || 0)) / 4;
        return acc + ((post - pre) / (pre || 1)) * 100;
      }, 0) / students.length 
    : 0;

  const readinessScore = students.length > 0 ? Math.min(100, Math.max(0, 50 + avgImprovement)) : 0;
  const assignedTeachers = teachers.filter(t => t.role === 'Teacher' && t.batch && t.batch !== 'None').length;
  const totalBatchesCount = batchesList.length; 

  const getGrowth = (data: Student[]) => {
    if (data.length === 0) return 0;
    const avgPre = data.reduce((acc, s) => {
      const pre = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
      return acc + ((pre.communication || 0) + (pre.technical || 0) + (pre.logic || 0) + (pre.confidence || 0)) / 4;
    }, 0) / data.length;
    const avgPost = data.reduce((acc, s) => {
      const post = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
      return acc + ((post.communication || 0) + (post.technical || 0) + (post.logic || 0) + (post.confidence || 0)) / 4;
    }, 0) / data.length;
    return avgPre > 0 ? ((avgPost - avgPre) / avgPre) * 100 : 0;
  };

  const batches = batchesList.map(b => b.batchId);
  const comparisonData = batches.map(b => ({
    name: b,
    growth: getGrowth(students.filter(s => s.batch === b))
  })).slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Institutional overview and placement intelligence</p>
        </div>
        <Badge className="bg-indigo-600 px-4 py-1.5 text-sm">Role: Admin</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Readiness Gauge */}
        <Card className="lg:col-span-1 border-none shadow-sm flex flex-col items-center justify-center p-8 bg-white">
          <CardHeader className="text-center pb-2">
            <CardTitle>Placement Readiness Gauge</CardTitle>
            <CardDescription>Overall batch readiness score</CardDescription>
          </CardHeader>
          <div className="relative w-48 h-48 flex items-center justify-center mt-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                className="text-slate-100"
              />
              <circle
                cx="96"
                cy="96"
                r="80"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={502.4}
                strokeDashoffset={502.4 - (502.4 * readinessScore) / 100}
                strokeLinecap="round"
                className="text-indigo-600 transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900">{students.length > 0 ? readinessScore.toFixed(0) : 0}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready</span>
            </div>
          </div>
          <p className="text-xs text-center text-slate-500 mt-6 leading-relaxed">
            Based on cumulative post-analysis audits and workshop consistency scores across all active batches.
          </p>
        </Card>

        {/* Assignments & Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <MetricCard 
              title="Counselor Coverage" 
              value={`${assignedTeachers}/${totalBatchesCount}`} 
              icon={<Users className="w-6 h-6 text-indigo-600" />}
              trend="Active assignments"
              color="indigo"
            />
            <MetricCard 
              title="Student Enrollment" 
              value={students.length.toString()} 
              icon={<Upload className="w-6 h-6 text-emerald-600" />}
              trend="Across all batches"
              color="emerald"
            />
          </div>

          <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-900 to-indigo-800 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <BrainCircuit className="w-32 h-32" />
            </div>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-indigo-700 text-indigo-100 border-none">Admin Insight</Badge>
              </div>
              <CardTitle className="text-2xl">Managerial Advice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isGenerating ? (
                  <div className="flex flex-col gap-2">
                    <div className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-white/20 rounded animate-pulse w-1/2" />
                  </div>
                ) : (
                  <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
                    {aiAdvice}
                  </p>
                )}
                <div className="flex gap-4">
                  <Button variant="secondary" className="bg-white text-indigo-900" onClick={() => onNavigate('faculty-mgmt')}>Manage Faculty</Button>
                  <Button variant="outline" className="border-indigo-400 text-white hover:bg-indigo-700 font-bold" onClick={() => onNavigate('skill-config')}>Skill Configurator</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Batch Comparison */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Batch Performance Comparison</CardTitle>
            <CardDescription>Growth trend analysis across major batches</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Growth']}
                />
                <Bar dataKey="growth" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Audit Trails */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Audit Trails
            </CardTitle>
            <CardDescription>Recent administrative actions log</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {auditLogs.slice().reverse().map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                  <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0 group-hover:scale-125 transition-transform" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 font-medium leading-tight">{log.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{log.performedBy}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function BatchControlView({ 
  students, 
  teachers, 
  batchesList,
  setBatchesList,
  setTeachers,
  currentTeacher,
  setCurrentTeacher,
  setAuditLogs 
}: { 
  students: Student[], 
  teachers: Teacher[], 
  batchesList: BatchConfig[],
  setBatchesList: React.Dispatch<React.SetStateAction<BatchConfig[]>>,
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>,
  currentTeacher: Teacher | null,
  setCurrentTeacher: React.Dispatch<React.SetStateAction<Teacher | null>>,
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>
}) {
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [newBatchId, setNewBatchId] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchConfig | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  const handleCreateBatch = async () => {
    if (!newBatchId) {
      toast.error("Batch Identifier is required");
      return;
    }
    
    setIsCreatingBatch(true);
    const newBatch: BatchConfig = {
      batchId: newBatchId,
      description: newBatchDesc,
      teacherId: 'None',
      teacherName: 'Unassigned',
      isSetupComplete: false,
      studentCount: 0,
      updatedAt: new Date().toISOString(),
      status: 'Pending'
    };
    
    try {
      await databaseService.saveBatchConfig(newBatch);
      setBatchesList(prev => [...prev, newBatch]);
      setAuditLogs(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          action: `Admin created new batch: ${newBatchId}.`, 
          performedBy: 'SKIT Admin', 
          timestamp: new Date().toISOString() 
        }
      ]);
      setShowCreateBatch(false);
      setNewBatchId('');
      setNewBatchDesc('');
      toast.success(`Batch ${newBatchId} created successfully`);
    } catch (error: any) {
      console.error("Batch Creation Error:", error);
      toast.error(`Create Error: ${error.message || "Please check your connection."}`);
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handleAssignTeacher = async (batchId: string, teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    // Update batch config
    const updatedBatches = batchesList.map(b => b.batchId === batchId ? { 
      ...b, 
      teacherId, 
      teacherName: teacher.name,
      status: 'Active' as const
    } : b);
    
    // Update teacher info to reflect new batch assignment
    const updatedTeacher = { ...teacher, batch: batchId };
    const updatedTeachers = teachers.map(t => t.id === teacherId ? updatedTeacher : t);
    
    try {
      const targetBatch = updatedBatches.find(b => b.batchId === batchId)!;
      await databaseService.saveBatchConfig(targetBatch);
      await databaseService.saveTeacher(updatedTeacher); // Persist teacher batch change
      
      setBatchesList(updatedBatches);
      setTeachers(updatedTeachers);
      
      // If the current logged in teacher is the one being assigned, update their session
      if (currentTeacher?.id === teacherId) {
        setCurrentTeacher(updatedTeacher);
        localStorage.setItem('sar_currentTeacher', JSON.stringify(updatedTeacher));
      }
      
      setAuditLogs(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          action: `Admin assigned Prof. ${teacher.name} to Batch ${batchId}.`, 
          performedBy: 'SKIT Admin', 
          timestamp: new Date().toISOString() 
        }
      ]);
      toast.success(`Prof. ${teacher.name} assigned to ${batchId}`);
    } catch (err) {
      toast.error("Failed to sync assignment to database");
    }
  };

  const handleRemoveBatch = async (batchId: string) => {
    console.log("Removing batch:", batchId);
    // Simple verification check to avoid accidental deletions without blocking confirm
    const isConfirmed = window.confirm(`Delete Batch ${batchId}?`);
    if (!isConfirmed) return;
    
    try {
      await databaseService.deleteBatch(batchId);
      setBatchesList(prev => prev.filter(b => b.batchId !== batchId));
      setAuditLogs(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          action: `Admin deleted batch: ${batchId}.`, 
          performedBy: 'SKIT Admin', 
          timestamp: new Date().toISOString() 
        }
      ]);
      toast.error(`Batch ${batchId} deleted`);
    } catch (error: any) {
      console.error("Delete Batch Error:", error);
      toast.error(`Failed to delete batch: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Batch Control</h1>
          <p className="text-slate-500">Configure batches, upload data and assign counselors</p>
        </div>
        <Button className="bg-indigo-600" onClick={() => setShowCreateBatch(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create New Batch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batchesList.map(batch => (
          <Card key={batch.batchId} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant={batch.status === 'Active' ? 'default' : 'secondary'} className={batch.status === 'Active' ? 'bg-emerald-500' : ''}>
                  {batch.status}
                </Badge>
                <div className="flex gap-2 items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(batch.updatedAt).toLocaleDateString()}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBatch(batch.batchId);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-xl mt-2">{batch.batchId}</CardTitle>
              <CardDescription>{batch.description || 'Institutional placement batch'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Students</span>
                <span className="font-bold text-slate-900">{students.filter(s => s.batch === batch.batchId).length} Registered</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Counselor</span>
                <span className="font-bold text-indigo-600">{batch.teacherName}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => {
                  setSelectedBatch(batch);
                  setIsUploading(true);
                }}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Student CSV
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full")}>
                    <Users className="w-4 h-4 mr-2" /> Assign Counselor
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {teachers.filter(t => t.role === 'Teacher').map(t => (
                      <DropdownMenuItem key={t.id} onClick={() => handleAssignTeacher(batch.batchId, t.id)}>
                        {t.name} ({t.department})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCreateBatch} onOpenChange={setShowCreateBatch}>
        <DialogContent className="max-w-5xl w-full rounded-[2.5rem]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-3xl font-black text-center">Create New Placement Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Batch Identifier</Label>
              <Input placeholder="e.g. 2024-A" value={newBatchId} onChange={e => setNewBatchId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="e.g. CS/IT Placement Preparation" value={newBatchDesc} onChange={e => setNewBatchDesc(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateBatch(false)}>Cancel</Button>
            <Button className="bg-indigo-600" onClick={handleCreateBatch} disabled={isCreatingBatch}>
              {isCreatingBatch ? "Creating..." : "Create Batch"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploading} onOpenChange={setIsUploading}>
        <DialogContent className="!max-w-7xl w-full p-0 overflow-hidden overflow-y-auto max-h-[95vh] rounded-[2rem]">
          <div className="p-10 w-full min-h-[600px]">
            <div className="mb-8 border-b border-slate-100 pb-6">
              <h2 className="text-3xl font-black text-slate-900 text-center">Enroll Students to {selectedBatch?.batchId}</h2>
              <p className="text-slate-500 text-center mt-2">Upload CSV/Excel file containing student skill audits for AI integration</p>
            </div>
            <DataUploadView 
              teachers={teachers}
              defaultBatch={selectedBatch?.batchId}
              onDataExtracted={async (data) => {
                // The DataUploadView handles saving to firebase itself but lets update local state
                toast.success(`Successfully enrolled ${data.length} students to ${selectedBatch?.batchId}`);
                setIsUploading(false);
                setTimeout(() => window.location.reload(), 1500); // Give user time to see toast
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FacultyManagementView({ 
  teachers, 
  setTeachers, 
  setAuditLogs 
}: { 
  teachers: Teacher[], 
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>,
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    department: '',
    contactNo: '',
    emailId: '',
    photo: '',
    username: '',
    password: ''
  });

  const handleNextStep = () => {
    if (!formData.employeeId || !formData.name || !formData.emailId) {
      toast.error("Please fill all required basic details");
      return;
    }
    setStep(2);
  };

  const handleAddFinal = async () => {
    if (!formData.username || !formData.password) {
      toast.error("Credentials are required");
      return;
    }

    const newT: Teacher = {
      id: `t${Date.now()}`,
      employeeId: formData.employeeId,
      name: formData.name,
      username: formData.username,
      password: formData.password,
      department: formData.department,
      contactNo: formData.contactNo,
      emailId: formData.emailId,
      photo: formData.photo || `https://picsum.photos/seed/${formData.employeeId}/200`,
      batch: 'None',
      role: 'Teacher',
      performanceDetails: {
        rating: 5,
        studentsHelped: 0,
        feedbackScore: 0,
        workshopsConducted: 0
      }
    };

    try {
      await databaseService.saveTeacher(newT);
      setTeachers(prev => [...prev, newT]);
      setAuditLogs(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          action: `Admin registered new faculty: ${formData.name} (${formData.employeeId}).`, 
          performedBy: 'SKIT Admin', 
          timestamp: new Date().toISOString() 
        }
      ]);
      setShowAddModal(false);
      setStep(1);
      setFormData({
        employeeId: '', name: '', department: '', contactNo: '', emailId: '', photo: '', username: '', password: ''
      });
      toast.success('Faculty registered and credentials saved!');
    } catch (error) {
      toast.error("Failed to save faculty to database");
    }
  };

  const handleRemove = async (id: string) => {
    console.log("Removing teacher:", id);
    const t = teachers.find(x => x.id === id);
    const isConfirmed = window.confirm(`Remove Faculty: ${t?.name}?`);
    if (!isConfirmed) return;
    
    try {
      await databaseService.deleteTeacher(id);
      setTeachers(prev => prev.filter(x => x.id !== id));
      setAuditLogs(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          action: `Admin removed faculty member: ${t?.name}.`, 
          performedBy: 'SKIT Admin', 
          timestamp: new Date().toISOString() 
        }
      ]);
      toast.error('Faculty member removed');
    } catch (error: any) {
      console.error("Delete Faculty Error:", error);
      toast.error(`Failed to remove faculty: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Faculty Management</h1>
          <p className="text-slate-500">Register new faculty and manage placement counselors</p>
        </div>
        <Button className="bg-indigo-600" onClick={() => { setStep(1); setShowAddModal(true); }}>
          <ShieldCheck className="w-4 h-4 mr-2" /> Register New Faculty
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.filter(t => t.id !== 'admin').map(t => (
          <Card key={t.id} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
            <div className="aspect-square w-full bg-slate-100 overflow-hidden relative">
              <img src={t.photo} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-4 right-4 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="rounded-full w-10 h-10 shadow-lg border-2 border-white" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(t.id);
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t.department}</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px]">{t.employeeId}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-3 h-3" /> {t.emailId}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3 h-3" /> {t.contactNo}
              </div>
              <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold">
                <span>LOGIN: {t.username}</span>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{t.batch}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="rounded-[2.5rem] max-w-4xl w-full">
          <DialogTitle className="text-3xl font-bold text-center">{step === 1 ? "Faculty Detail Registration" : "Credentials Setup"}</DialogTitle>
          <div className="space-y-4 py-4">
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label>Employee ID</Label>
                  <Input placeholder="EMP-101" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Full Name</Label>
                  <Input placeholder="Dr. Satish Gupta" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Department</Label>
                  <Input placeholder="Computer Science" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-1">
                  <Label>Contact No</Label>
                  <Input placeholder="9876543210" value={formData.contactNo} onChange={e => setFormData({...formData, contactNo: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Mail ID</Label>
                  <Input placeholder="sgupta@skit.ac.in" value={formData.emailId} onChange={e => setFormData({...formData, emailId: e.target.value})} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Photo URL (Optional)</Label>
                  <Input placeholder="https://..." value={formData.photo} onChange={e => setFormData({...formData, photo: e.target.value})} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  Registering <strong>{formData.name}</strong> as Placement Faculty. Please define their portal access credentials.
                </p>
                <div className="space-y-2">
                  <Label>System Username</Label>
                  <Input placeholder="e.g. sgupta" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Secure Password</Label>
                  <Input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            {step === 1 ? (
              <Button className="bg-indigo-600" onClick={handleNextStep}>Next: Login Details <ChevronRight className="ml-2 w-4 h-4" /></Button>
            ) : (
              <Button className="bg-indigo-600" onClick={handleAddFinal}>Finalize Registration</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AssignTasksView({ 
  teacher, 
  students, 
  setCurrentView, 
  setMarksTaskIdFilter 
}: { 
  teacher: Teacher | null, 
  students: Student[], 
  setCurrentView: (view: View) => void,
  setMarksTaskIdFilter: (id: string | null) => void
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState<TaskType | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: '',
    dueDate: '',
    description: ''
  });
  const [existingTasks, setExistingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [randomize, setRandomize] = useState(false);
  const [gradingMode, setGradingMode] = useState<'Auto-Evaluated' | 'Manual Grading'>('Auto-Evaluated');
  
  // Revised Generation Workflow States
  const [genStep, setGenStep] = useState<'type' | 'path' | 'blueprint' | 'review'>('type');
  const [genPath, setGenPath] = useState<'source' | 'ai' | null>(null);
  const [sourceData, setSourceData] = useState({ text: '', fileName: '' });
  
  const [mockBlueprint, setMockBlueprint] = useState<MockTestBlueprint>({
    year: 'III Year',
    subject: '',
    topic: '',
    difficulty: 'Medium',
    structure: [
      { sectionName: 'MCQ', type: 'MCQ', marks: 1, count: 5 },
      { sectionName: 'Short Answer', type: 'Short Answer', marks: 5, count: 2 },
      { sectionName: 'Coding', type: 'Coding', marks: 10, count: 1 }
    ]
  });

  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const taskOptions: { type: TaskType; label: string; icon: any; color: string; isComingSoon?: boolean }[] = [
    { type: 'Conduct Mock Interview', label: 'Mock Interview', icon: Users, color: 'text-green-600 bg-green-50' },
    { type: 'Conduct Online Session', label: 'Online Session', icon: Video, color: 'text-blue-600 bg-blue-50' },
    { type: 'Conduct Mock Test', label: 'Mock Test', icon: FileText, color: 'text-purple-600 bg-purple-50' },
    { type: 'Create New Assignment', label: 'Assignment', icon: BookOpen, color: 'text-orange-600 bg-orange-50' },
    { type: 'Conduct GD', label: 'Coming Soon', icon: MessageSquare, color: 'text-indigo-600 bg-indigo-50', isComingSoon: true },
    { type: 'Take Students Presentation', label: 'Coming Soon', icon: Airplay, color: 'text-rose-600 bg-rose-50', isComingSoon: true },
  ];

  useEffect(() => {
    if (teacher) {
      const fetchTasks = async () => {
        try {
          const tasks = await databaseService.getTasksByBatch(teacher.batch);
          setExistingTasks(tasks);
        } catch (err) {
          console.error("Error fetching tasks:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    }
  }, [teacher]);

  const handleCreateTask = async () => {
    if (!teacher || !selectedType || !newActivity.title || !newActivity.dueDate) {
      toast.error('Please fill all required fields');
      return;
    }

    const taskId = Date.now().toString();
    const taskData: Task = {
      id: taskId,
      type: selectedType,
      title: newActivity.title,
      description: newActivity.description || `Automated ${selectedType} for ${mockBlueprint.subject}`,
      dueDate: newActivity.dueDate,
      teacherId: teacher.id,
      teacherName: teacher.name,
      batchId: teacher.batch,
      status: 'Active',
      randomize: selectedType === 'Create New Assignment' ? randomize : false,
      gradingMode: selectedType === 'Create New Assignment' ? gradingMode : 'Auto-Evaluated',
      createdAt: new Date().toISOString(),
      content: (selectedType === 'Conduct Mock Test' || selectedType === 'Create New Assignment')
        ? (selectedType === 'Conduct Mock Test' 
            ? { blueprint: mockBlueprint, questions: generatedQuestions, totalMarks: generatedQuestions.reduce((a, b) => a + b.marks, 0) }
            : { subject: mockBlueprint.subject, topic: mockBlueprint.topic, questions: generatedQuestions })
        : undefined
    };

    setGenerating(true);
    try {
      await databaseService.saveTask(taskData);
      setExistingTasks([taskData, ...existingTasks]);
      setShowCreateModal(false);
      resetGenState();
      toast.success(`${selectedType} assigned Successful`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign activity to Firestore');
    } finally {
      setGenerating(false);
    }
  };

  const handleStartGeneration = async () => {
    setGenerating(true);
    try {
      const qs = await aiAcademicService.generateQuestions({
        topic: mockBlueprint.topic,
        subject: mockBlueprint.subject,
        year: mockBlueprint.year,
        difficulty: mockBlueprint.difficulty,
        structure: mockBlueprint.structure,
        sourceContent: genPath === 'source' ? sourceData.text : undefined,
        isAssignment: selectedType === 'Create New Assignment'
      });
      setGeneratedQuestions(qs);
      setGenStep('review');
      toast.success("Questions generated! Please review and publish.");
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const resetGenState = () => {
    setSelectedType(null);
    setGenStep('type');
    setGenPath(null);
    setSourceData({ text: '', fileName: '' });
    setGeneratedQuestions([]);
    setRandomize(false);
    setGradingMode('Auto-Evaluated');
    setNewActivity({ title: '', dueDate: '', description: '' });
    setMockBlueprint({
      year: 'III Year',
      subject: '',
      topic: '',
      difficulty: 'Medium',
      structure: [
        { sectionName: 'MCQ', type: 'MCQ', marks: 1, count: 5 },
        { sectionName: 'Short Answer', type: 'Short Answer', marks: 5, count: 2 },
        { sectionName: 'Coding', type: 'Coding', marks: 10, count: 1 }
      ]
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('Deleting ID:', taskId);
    if (!window.confirm("Are you sure you want to delete this activity? This will remove all associated submissions and results for students.")) {
      return;
    }

    // Optimistic Update: Filter out the deleted task instantly from UI
    const previousTasks = [...existingTasks];
    setExistingTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      // Backend API removal
      await databaseService.deleteTask(taskId);
      console.log('Delete Success');
      toast.success("Activity deleted successfully");
    } catch (err: any) {
      console.error("Delete error:", err);
      // Rollback if failed
      setExistingTasks(previousTasks);
      
      if (err.message?.includes('permission-denied')) {
        toast.error("Permission Denied: You may not be the owner of this task. If this is a remixed app, please run 'Firebase Setup' to configure your own database.");
      } else {
        toast.error("Failed to delete activity from database");
      }
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'Closed' ? 'Active' : 'Closed';
    const updatedTask = { ...task, status: newStatus as any };
    
    try {
      await databaseService.saveTask(updatedTask);
      setExistingTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      toast.success(`Activity ${newStatus === 'Closed' ? 'Closed' : 'Re-opened'}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleViewResponses = (taskId: string) => {
    if (setMarksTaskIdFilter) {
      setMarksTaskIdFilter(taskId);
    }
    setDetailTask(null);
    setCurrentView('marks');
    toast.info("Viewing filtered responses in Marks Entry");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Assign Tasks & Interventions</h2>
          <p className="text-slate-500 text-sm">Manage activities and tasks for Batch {teacher?.batch}</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-lg px-6 h-12 font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Create New Activity
        </Button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      ) : existingTasks.length === 0 ? (
        <Card className="rounded-[2.5rem] p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
             <FileEdit className="w-10 h-10 text-slate-300" />
           </div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">No Activities Yet</h3>
           <p className="text-slate-400 max-w-sm mx-auto mb-8">Ready to boost your batch's performance? Assign mock interviews, tests, or GD sessions to begin tracking progress.</p>
           <Button variant="outline" className="rounded-full px-8" onClick={() => setShowCreateModal(true)}>Get Started</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {existingTasks.map(task => {
            const opt = taskOptions.find(o => o.type === task.type);
            const Icon = opt?.icon || FileEdit;
            return (
              <Card 
                key={task.id} 
                className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden"
                onClick={() => setDetailTask(task)}
              >
                {task.status === 'Closed' && (
                  <div className="absolute top-0 right-0 p-4 z-10 opacity-70">
                    <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-500 gap-1 rounded-full px-4 py-1">
                      <Lock className="w-3 h-3" /> ARCHIVED
                    </Badge>
                  </div>
                )}
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-4 rounded-[1.5rem] transition-transform group-hover:scale-110", opt?.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                         onClick={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                         title={task.status === 'Closed' ? "Re-open Activity" : "Close Activity"}
                       >
                         {task.status === 'Closed' ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50"
                         onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                         title="Delete Activity"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight line-clamp-2">{task.title}</CardTitle>
                  <CardDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">{task.type}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-4 space-y-4">
                  <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">{task.description}</p>
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Calendar className="w-4 h-4" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] font-bold text-slate-300">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {detailTask && (
        <ActivityDetailModal 
          task={detailTask} 
          onClose={() => setDetailTask(null)} 
          onViewResponses={handleViewResponses}
          studentsInBatch={students.filter(s => s.batch === detailTask.batchId)}
          onUpdateTask={(updated) => {
            setExistingTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            setDetailTask(updated);
          }}
        />
      )}

      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) resetGenState();
      }}>
        <DialogContent className={cn(
          "rounded-[3rem] py-8 p-12 overflow-hidden max-h-[95vh] overflow-y-auto transition-all duration-500 w-full max-w-[calc(100%-2rem)] scrollbar-hide",
          (genStep === 'type' || genStep === 'path') ? "sm:max-w-4xl" : 
          (genStep === 'blueprint' || genStep === 'details') ? "sm:max-w-5xl" : "sm:max-w-6xl"
        )}>
          <div className="relative">
            {genStep !== 'type' && (
               <button 
                onClick={() => {
                   if (genStep === 'review') setGenStep('blueprint');
                   else if (genStep === 'blueprint') setGenStep('path');
                   else if (genStep === 'path') setGenStep('type');
                   else if (genStep === 'details') setGenStep('type');
                }}
                className="absolute -top-14 -left-8 p-3 hover:bg-slate-100 rounded-full transition-colors group"
               >
                 <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
               </button>
            )}

            <DialogTitle className="text-4xl font-black text-slate-900 text-center mb-2 font-sans tracking-tight">
              {genStep === 'type' ? "Assign New Activity" : 
               genStep === 'path' ? "Generation Methodology" :
               genStep === 'blueprint' ? "Review Blueprint" : 
               genStep === 'details' ? "Activity Details" : "Verify Questions"}
            </DialogTitle>
            <p className="text-center text-slate-500 font-medium mb-8">
              {genStep === 'type' ? "Select the baseline intervention type for your batch" :
               genStep === 'path' ? "Choose how you want Chetas AI to curate the content" :
               genStep === 'blueprint' ? "Adjust question distributions before AI curates the paper" : 
               genStep === 'details' ? "Provide configuration and context for the manual activity" :
               "Ensure quality and accuracy before assigning to batch"}
            </p>

            <div className="py-2">
              {genStep === 'type' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {taskOptions.map(option => (
                    <button
                      key={option.type}
                      disabled={option.isComingSoon}
                      onClick={() => {
                        setSelectedType(option.type);
                        if (option.type === 'Conduct Mock Test') {
                          setGenStep('path');
                          setMockBlueprint(prev => ({
                            ...prev,
                            structure: [
                              { sectionName: 'Section A: MCQ', type: 'MCQ', marks: 1, count: 5 },
                              { sectionName: 'Section B: Short Answer', type: 'Short Answer', marks: 5, count: 2 }
                            ]
                          }));
                        } else if (option.type === 'Create New Assignment') {
                          setGenStep('path');
                          setMockBlueprint(prev => ({
                            ...prev,
                            structure: [
                              { sectionName: 'Objective', type: 'MCQ', marks: 1, count: 10 }
                            ]
                          }));
                        } else {
                          // For other types, we go to a manual detail entry step
                          setGenStep('details');
                          setNewActivity({
                            title: `${option.label} - ${teacher?.batch}`,
                            description: `Scheduled ${option.label} for the batch.`,
                            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                          });
                        }
                      }}
                      className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all group text-center bg-white shadow-sm hover:shadow-md"
                    >
                      <div className={cn("p-5 rounded-2xl transition-transform group-hover:scale-110 shadow-sm", option.color)}>
                        <option.icon className="w-8 h-8" />
                      </div>
                      <span className={cn(
                        "text-sm font-bold tracking-tight",
                        option.isComingSoon ? "text-slate-400 animate-slow-blink" : "text-slate-800"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {genStep === 'path' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                    onClick={() => {
                      setGenPath('source');
                      setGenStep('blueprint');
                    }}
                    className="flex flex-col p-8 rounded-[3rem] border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-left bg-white shadow-sm group"
                  >
                    <div className="p-4 bg-indigo-100 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 transition-colors">
                      <FileText className="w-8 h-8 text-indigo-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Source-Based Generation</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Upload notes, PDF, images or paste existing text. Chetas AI will extract questions strictly from your provided reference material.</p>
                  </button>

                  <button 
                    onClick={() => {
                      setGenPath('ai');
                      setGenStep('blueprint');
                    }}
                    className="flex flex-col p-8 rounded-[3rem] border-2 border-slate-100 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all text-left bg-white shadow-sm group"
                  >
                    <div className="p-4 bg-emerald-100 rounded-2xl w-fit mb-6 group-hover:bg-emerald-600 transition-colors">
                      <BrainCircuit className="w-8 h-8 text-emerald-600 group-hover:text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">AI-Native Generation</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">Provide a topic and difficulty level. Gemini will use its vast knowledge base to generate fresh, industry-relevant questions.</p>
                  </button>
                </div>
              )}

              {genStep === 'details' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Visual Preview Side */}
                    <div className="space-y-6">
                      <div className="aspect-video rounded-[2.5rem] bg-indigo-50 border border-indigo-100 overflow-hidden relative group">
                        <img 
                          src={
                            selectedType === 'Conduct Mock Interview' ? "/AI Interview.png" :
                            selectedType === 'Conduct Online Session' ? "/Online Meet.png" :
                            `https://picsum.photos/seed/${selectedType?.split(' ').pop()?.toLowerCase()}/800/600`
                          }
                          alt="Category Preview"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 via-transparent to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                           <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 mb-2">
                             {selectedType}
                           </Badge>
                           <h4 className="text-xl font-bold text-white tracking-tight">
                             {taskOptions.find(o => o.type === selectedType)?.label}
                           </h4>
                        </div>
                      </div>

                      <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 italic text-slate-500 text-sm leading-relaxed">
                        {selectedType === 'Conduct Mock Interview' && "Chetas AI provides a 24/7 mock interview platform that uses adaptive Gemini-driven logic to simulate realistic technical and HR placement rounds. It evaluates student responses in real-time, delivering instant feedback on domain knowledge and communication to bridge critical skill gaps before actual campus drives."}
                        {selectedType === 'Conduct Online Session' && "Acadmeet is an AI-powered virtual classroom that features a real-time Alertness Monitor to detect and notify teachers when students are inattentive or sleeping. It integrates automated attendance and engagement analytics to bridge the gap between virtual attendance and actual classroom participation."}
                        {selectedType === 'Conduct GD' && "Assess collaborative intelligence and leadership. Monitor how students interact within a structured group dynamic."}
                        {selectedType === 'Take Students Presentation' && "Showcase analytical deep dives. Encourage students to research, synthesize, and present findings to the batch."}
                      </div>
                    </div>

                    {/* Form Side */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Title</Label>
                          <Input 
                            value={newActivity.title}
                            onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                            placeholder="e.g., HR Mock Round-1"
                            className="rounded-2xl h-12 bg-white border-slate-100 focus:ring-indigo-600 focus:border-indigo-600 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date & Time</Label>
                          <Input 
                            type="date"
                            value={newActivity.dueDate}
                            onChange={(e) => setNewActivity({...newActivity, dueDate: e.target.value})}
                            className="rounded-2xl h-12 bg-white border-slate-100 focus:ring-indigo-600 focus:border-indigo-600 font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructions</Label>
                          <Textarea 
                            value={newActivity.description}
                            onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                            placeholder="Provide specific guidelines for the students..."
                            className="rounded-3xl min-h-[120px] bg-white border-slate-100 focus:ring-indigo-600 focus:border-indigo-600"
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleCreateTask}
                        disabled={!newActivity.title || !newActivity.dueDate}
                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 gap-3 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                      >
                        {false ? (
                          <>Coming Soon</>
                        ) : (
                          <>Publish Activity Now <ArrowRight className="w-5 h-5" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {genStep === 'blueprint' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Side */}
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                         <div className="space-y-1">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Info</Label>
                            <div className="grid grid-cols-2 gap-3">
                               <Input placeholder="Subject Name" value={mockBlueprint.subject} onChange={e => setMockBlueprint({...mockBlueprint, subject: e.target.value})} className="rounded-xl h-12" />
                               <Select value={mockBlueprint.year} onValueChange={v => setMockBlueprint({...mockBlueprint, year: v})}>
                                  <SelectTrigger className="rounded-xl h-12"><SelectValue placeholder="Year" /></SelectTrigger>
                                  <SelectContent>
                                    {['I Year', 'II Year', 'III Year', 'IV Year'].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                  </SelectContent>
                               </Select>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Topic</Label>
                            <Input placeholder="e.g. Operating Systems / Cloud Comp." value={mockBlueprint.topic} onChange={e => setMockBlueprint({...mockBlueprint, topic: e.target.value})} className="rounded-xl h-12" />
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Difficulty Level</Label>
                            <div className="flex gap-2">
                               {['Easy', 'Medium', 'Hard'].map(d => (
                                 <button 
                                  key={d}
                                  onClick={() => setMockBlueprint({...mockBlueprint, difficulty: d as any})}
                                  className={cn(
                                    "flex-1 h-10 rounded-xl font-bold text-xs transition-all",
                                    mockBlueprint.difficulty === d ? "bg-indigo-600 text-white shadow-md scale-105" : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                                  )}
                                 >
                                   {d}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      {selectedType === 'Create New Assignment' && (
                        <>
                          <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 space-y-4">
                             <Label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Delivery Strategy</Label>
                             <div className="grid grid-cols-2 gap-4">
                                <button 
                                  onClick={() => setRandomize(false)}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left space-y-1",
                                    !randomize ? "border-orange-500 bg-white shadow-md" : "border-slate-100 bg-slate-50/50 grayscale hover:grayscale-0"
                                  )}
                                >
                                  <Users className="w-5 h-5 text-orange-500" />
                                  <p className="text-sm font-bold text-slate-900">Same Questions</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Fixed pool for all students</p>
                                </button>
                                <button 
                                  onClick={() => setRandomize(true)}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left space-y-1",
                                    randomize ? "border-orange-500 bg-white shadow-md" : "border-slate-100 bg-slate-50/50 grayscale hover:grayscale-0"
                                  )}
                                >
                                  <BrainCircuit className="w-5 h-5 text-orange-500" />
                                  <p className="text-sm font-bold text-slate-900">Unique Selection</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Random from pools</p>
                                </button>
                             </div>
                          </div>

                          <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4 mt-4">
                             <Label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Grading Strategy</Label>
                             <div className="grid grid-cols-2 gap-4">
                                <button 
                                  onClick={() => setGradingMode('Auto-Evaluated')}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left space-y-1",
                                    gradingMode === 'Auto-Evaluated' ? "border-indigo-500 bg-white shadow-md" : "border-slate-100 bg-slate-50/50 grayscale hover:grayscale-0"
                                  )}
                                >
                                  <Sparkles className="w-5 h-5 text-indigo-500" />
                                  <p className="text-sm font-bold text-slate-900">Auto Evaluate</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Instant scoring on submit</p>
                                </button>
                                <button 
                                  onClick={() => setGradingMode('Manual Grading')}
                                  className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left space-y-1",
                                    gradingMode === 'Manual Grading' ? "border-indigo-500 bg-white shadow-md" : "border-slate-100 bg-slate-50/50 grayscale hover:grayscale-0"
                                  )}
                                >
                                  <Pencil className="w-5 h-5 text-indigo-500" />
                                  <p className="text-sm font-bold text-slate-900">Manual Grading</p>
                                  <p className="text-[10px] text-slate-400 font-medium leading-tight">Review answers manually</p>
                                </button>
                             </div>
                          </div>
                        </>
                      )}

                      {genPath === 'source' && (
                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 space-y-4">
                          <Label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Reference Material</Label>
                          
                          <div className="flex items-center gap-4">
                             <div className="flex-1 bg-white border border-indigo-100 rounded-xl p-3 flex items-center gap-3 shadow-sm min-h-[50px]">
                                <Upload className="w-5 h-5 text-indigo-400" />
                                <div className="flex-1">
                                   {sourceData.fileName ? (
                                     <p className="text-sm font-bold text-indigo-700">{sourceData.fileName}</p>
                                   ) : (
                                     <p className="text-xs text-slate-400">Upload PDF, Notes or Images</p>
                                   )}
                                </div>
                                <input 
                                  type="file" 
                                  id="source-file" 
                                  className="hidden" 
                                  onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setSourceData({...sourceData, fileName: file.name});
                                      toast.info(`Attempting to extract data from ${file.name}... (Simulated)`);
                                    }
                                  }}
                                />
                                <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[10px] font-black uppercase text-indigo-600 bg-indigo-50" onClick={() => document.getElementById('source-file')?.click()}>
                                  Browse
                                </Button>
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase">OR</span>
                             <div className="flex-1 text-right">
                               <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Paste Raw Content</p>
                             </div>
                          </div>

                          <textarea 
                            className="w-full min-h-[150px] p-4 rounded-2xl border border-indigo-100 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-600/10 placeholder:text-indigo-300/50"
                            placeholder="Paste text notes, questions, or extract here..."
                            value={sourceData.text}
                            onChange={e => setSourceData({...sourceData, text: e.target.value})}
                          />
                        </div>
                      )}
                    </div>

                    {/* Structure Side */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-8 flex flex-col h-full min-h-[500px]">
                      <div className="flex justify-between items-center border-b border-white/10 pb-6">
                        <div>
                          <h4 className="font-black text-2xl tracking-tight">Paper Structure</h4>
                          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest leading-none">
                            {selectedType === 'Create New Assignment' ? 'Objective MCQ Only' : 'Subjective/Mixed Sections'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Estimated Weight</p>
                          <p className="text-3xl font-black text-emerald-400">{mockBlueprint.structure.reduce((a, b) => a + (b.marks * b.count), 0)} Marks</p>
                        </div>
                      </div>

                      <div className="space-y-4 flex-1 overflow-y-auto pr-2 scrollbar-none">
                         {mockBlueprint.structure.map((s, idx) => (
                           <div key={idx} className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 relative group">
                             <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-indigo-400 shrink-0">
                                 {s.type === 'MCQ' ? 'M' : s.type === 'Coding' ? 'C' : 'S'}
                               </div>
                               <div className="flex-1 min-w-0">
                                  {selectedType === 'Conduct Mock Test' ? (
                                    <Input 
                                      value={s.sectionName}
                                      onChange={e => {
                                        const next = [...mockBlueprint.structure];
                                        next[idx].sectionName = e.target.value;
                                        setMockBlueprint({...mockBlueprint, structure: next});
                                      }}
                                      className="bg-transparent border-none p-0 h-auto text-lg font-black text-white focus-visible:ring-0 placeholder:text-white/20 truncate"
                                      placeholder="Section Name"
                                    />
                                  ) : (
                                    <p className="font-black text-lg text-white">Objective Questions</p>
                                  )}
                                  
                                  {selectedType === 'Conduct Mock Test' && (
                                    <div className="flex gap-4 mt-2">
                                      <Select 
                                        value={s.type} 
                                        onValueChange={(val: QuestionType) => {
                                          const next = [...mockBlueprint.structure];
                                          next[idx].type = val;
                                          setMockBlueprint({...mockBlueprint, structure: next});
                                        }}
                                      >
                                        <SelectTrigger className="bg-white/10 border-none h-8 text-[10px] font-black uppercase rounded-lg w-32 text-indigo-400">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="MCQ">MCQ</SelectItem>
                                          <SelectItem value="Short Answer">Short Answer</SelectItem>
                                          <SelectItem value="Coding">Coding</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                               </div>
                               
                               {selectedType === 'Conduct Mock Test' && mockBlueprint.structure.length > 1 && (
                                 <button 
                                  onClick={() => {
                                    setMockBlueprint({
                                      ...mockBlueprint,
                                      structure: mockBlueprint.structure.filter((_, i) => i !== idx)
                                    });
                                  }}
                                  className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                   <X className="w-4 h-4" />
                                 </button>
                               )}
                             </div>

                             <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Marks/Q</p>
                                  <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => {
                                       const next = [...mockBlueprint.structure];
                                       next[idx].marks = Math.max(1, next[idx].marks - 1);
                                       setMockBlueprint({...mockBlueprint, structure: next});
                                    }}>-</Button>
                                    <input 
                                      type="number" 
                                      value={s.marks}
                                      onChange={e => {
                                        const next = [...mockBlueprint.structure];
                                        next[idx].marks = parseInt(e.target.value) || 0;
                                        setMockBlueprint({...mockBlueprint, structure: next});
                                      }}
                                      className="flex-1 min-w-0 bg-transparent text-center font-black text-indigo-400 outline-none"
                                    />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => {
                                       const next = [...mockBlueprint.structure];
                                       next[idx].marks++;
                                       setMockBlueprint({...mockBlueprint, structure: next});
                                    }}>+</Button>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Count</p>
                                  <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => {
                                       const next = [...mockBlueprint.structure];
                                       next[idx].count = Math.max(0, next[idx].count - 1);
                                       setMockBlueprint({...mockBlueprint, structure: next});
                                    }}>-</Button>
                                    <input 
                                       type="number"
                                       value={s.count}
                                       onChange={e => {
                                          const next = [...mockBlueprint.structure];
                                          next[idx].count = parseInt(e.target.value) || 0;
                                          setMockBlueprint({...mockBlueprint, structure: next});
                                       }}
                                       className="flex-1 min-w-0 bg-transparent text-center font-black text-indigo-400 outline-none" 
                                    />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => {
                                       const next = [...mockBlueprint.structure];
                                       next[idx].count++;
                                       setMockBlueprint({...mockBlueprint, structure: next});
                                    }}>+</Button>
                                  </div>
                                </div>
                             </div>
                           </div>
                         ))}
                      </div>

                      {selectedType === 'Conduct Mock Test' && (
                        <Button 
                          variant="outline" 
                          className="w-full h-12 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 font-black text-[10px] uppercase tracking-widest text-slate-400"
                          onClick={() => {
                            setMockBlueprint({
                              ...mockBlueprint,
                              structure: [
                                ...mockBlueprint.structure,
                                { sectionName: 'New Section', type: 'Short Answer', marks: 5, count: 1 }
                              ]
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Structure Section
                        </Button>
                      )}

                      <div className="pt-2 gap-4 flex flex-col">
                         <div className="flex gap-4">
                            <div className="flex-1 space-y-1">
                               <Label className="text-white text-[10px] opacity-40 font-bold uppercase">Activity Title</Label>
                               <Input 
                                value={newActivity.title} 
                                onChange={e => setNewActivity({...newActivity, title: e.target.value})} 
                                className="bg-white/5 border-white/10 rounded-xl text-white h-12" 
                                placeholder="E.g. Unit 1 Mock"
                               />
                            </div>
                            <div className="w-40 space-y-1">
                               <Label className="text-white text-[10px] opacity-40 font-bold uppercase">Due Date</Label>
                               <Input 
                                type="date" 
                                value={newActivity.dueDate} 
                                onChange={e => setNewActivity({...newActivity, dueDate: e.target.value})} 
                                className="bg-white/5 border-white/10 rounded-xl text-white h-12" 
                               />
                            </div>
                         </div>
                        <Button 
                          onClick={handleStartGeneration}
                          disabled={generating || !mockBlueprint.subject || !mockBlueprint.topic}
                          className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-900/40 font-black text-lg group transition-all disabled:opacity-50"
                        >
                          {generating ? (
                            <div className="flex items-center gap-3">
                               <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                               />
                               Chetas AI is curating content...
                             </div>
                           ) : (
                             <div className="flex items-center gap-2">
                               <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                               Generate Content
                               <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                             </div>
                           )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {genStep === 'review' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                   <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 mb-6">
                      <div>
                        <h4 className="text-2xl font-black text-indigo-900 tracking-tight">Review Generated Content</h4>
                        <p className="text-indigo-600 font-bold text-sm">Review quality, fix typos, and adjust options before students see them.</p>
                      </div>
                      <div className="flex gap-3">
                         <Button 
                          variant="outline" 
                          className="rounded-xl font-bold bg-white border-indigo-200 text-indigo-600"
                          onClick={() => {
                            const newQ: Question = {
                              id: `manual-${Date.now()}`,
                              type: 'MCQ',
                              question: 'New Question text...',
                              marks: 1,
                              options: ['Opt A', 'Opt B', 'Opt C', 'Opt D'],
                              correctKey: 0
                            };
                            setGeneratedQuestions([...generatedQuestions, newQ]);
                          }}
                         >
                           Add Manually
                         </Button>
                         <Button 
                          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold px-8"
                          onClick={handleCreateTask}
                          disabled={generating}
                         >
                           {generating ? "Saving..." : "Confirm & Assign"}
                         </Button>
                      </div>
                   </div>

                   <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                      {generatedQuestions.map((q, qidx) => (
                        <Card key={q.id} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-100 group">
                           <div className="p-6">
                              <div className="flex justify-between items-start gap-4 mb-4">
                                 <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{qidx + 1}</span>
                                    <Badge variant="outline" className="rounded-lg text-[10px] font-black uppercase text-indigo-600 border-indigo-200">{q.type} • {q.marks}M</Badge>
                                 </div>
                                 <div className="flex gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                      onClick={() => setEditingQuestionId(editingQuestionId === q.id ? null : q.id)}
                                    >
                                      {editingQuestionId === q.id ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                      onClick={() => setGeneratedQuestions(generatedQuestions.filter(x => x.id !== q.id))}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </div>

                              {editingQuestionId === q.id ? (
                                <div className="space-y-4">
                                   <div className="space-y-1">
                                      <Label className="text-[10px] font-bold text-slate-400 uppercase">Question Prompt</Label>
                                      <textarea 
                                        className="w-full p-4 rounded-xl border border-indigo-100 font-medium text-sm focus:ring-4 focus:ring-indigo-600/10 min-h-[100px]"
                                        value={q.question}
                                        onChange={e => {
                                          const next = [...generatedQuestions];
                                          next[qidx].question = e.target.value;
                                          setGeneratedQuestions(next);
                                        }}
                                      />
                                   </div>
                                   {q.type === 'MCQ' && q.options && (
                                     <div className="grid grid-cols-2 gap-4">
                                        {q.options.map((opt, oidx) => (
                                          <div key={oidx} className="flex items-center gap-3 group/opt">
                                             <button 
                                              onClick={() => {
                                                const next = [...generatedQuestions];
                                                next[qidx].correctKey = oidx;
                                                setGeneratedQuestions(next);
                                              }}
                                              className={cn(
                                                "w-6 h-6 rounded-full border-2 shrink-0 transition-all",
                                                q.correctKey === oidx ? "border-indigo-600 bg-indigo-600" : "border-slate-200 hover:border-indigo-400"
                                              )}
                                             >
                                               {q.correctKey === oidx && <div className="w-2 h-2 bg-white rounded-full mx-auto" />}
                                             </button>
                                             <Input 
                                              value={opt} 
                                              onChange={e => {
                                                const next = [...generatedQuestions];
                                                if (next[qidx].options) {
                                                  next[qidx].options![oidx] = e.target.value;
                                                  setGeneratedQuestions(next);
                                                }
                                              }}
                                              className="h-9 text-xs rounded-lg"
                                             />
                                          </div>
                                        ))}
                                     </div>
                                   )}
                                   {(q.type === 'Short Answer' || q.type === 'Coding') && (
                                      <div className="space-y-1">
                                         <Label className="text-[10px] font-bold text-slate-400 uppercase">Sample Answer / Reference Code</Label>
                                         <textarea 
                                           className="w-full p-4 rounded-xl border border-indigo-100 font-mono text-xs focus:ring-4 focus:ring-indigo-600/10 min-h-[100px]"
                                           value={q.sampleAnswer}
                                           onChange={e => {
                                             const next = [...generatedQuestions];
                                             next[qidx].sampleAnswer = e.target.value;
                                             setGeneratedQuestions(next);
                                           }}
                                         />
                                      </div>
                                   )}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                   <p className="text-slate-800 font-bold leading-relaxed">{q.question}</p>
                                   {q.type === 'MCQ' && q.options && (
                                      <div className="grid grid-cols-2 gap-3 pl-2">
                                         {q.options.map((opt, oidx) => (
                                           <div key={oidx} className={cn(
                                             "p-3 rounded-xl border flex items-center gap-3 text-xs font-medium",
                                             q.correctKey === oidx ? "bg-indigo-50 border-indigo-100 text-indigo-700" : "bg-slate-50 border-slate-50 text-slate-500"
                                           )}>
                                              <div className={cn("w-2 h-2 rounded-full", q.correctKey === oidx ? "bg-indigo-600" : "bg-slate-300")} />
                                              {opt}
                                           </div>
                                         ))}
                                      </div>
                                   )}
                                   {(q.type === 'Short Answer' || q.type === 'Coding') && q.sampleAnswer && (
                                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-xs text-slate-500">
                                         <p className="font-bold uppercase text-[8px] tracking-widest text-slate-400 mb-2">Model Reference:</p>
                                         {q.sampleAnswer}
                                      </div>
                                   )}
                                </div>
                              )}
                           </div>
                        </Card>
                      ))}
                   </div>
                </motion.div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function SkillConfiguratorView({ 
  setAuditLogs 
}: { 
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>
}) {
  const [skills, setSkills] = useState([
    { id: '1', name: 'Communication', weight: 25, active: true },
    { id: '2', name: 'Technical', weight: 25, active: true },
    { id: '3', name: 'Logic', weight: 25, active: true },
    { id: '4', name: 'Confidence', weight: 25, active: true },
  ]);

  const handleUpdate = (id: string, weight: number) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, weight } : s));
    setAuditLogs(prev => [
      ...prev,
      { 
        id: Date.now().toString(), 
        action: `Admin adjusted weight for "${skills.find(x => x.id === id)?.name}" to ${weight}%.`, 
        performedBy: 'SKIT Admin', 
        timestamp: new Date().toISOString() 
      }
    ]);
    toast.success('Configuration updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Skill Configurator</h1>
          <p className="text-slate-500">Define weightage and modules for skill audit reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Skill Weightage</CardTitle>
            <CardDescription>Configure how SAR scores are calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {skills.map(skill => (
              <div key={skill.id} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">{skill.name}</span>
                  <span className="text-indigo-600 font-bold">{skill.weight}%</span>
                </div>
                <div className="flex gap-4 items-center">
                  <Input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={skill.weight} 
                    onChange={e => handleUpdate(skill.id, parseInt(e.target.value))}
                    className="flex-1"
                  />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm text-slate-500">Total Weightage</span>
              <span className={`text-lg font-black ${skills.reduce((a, b) => a + b.weight, 0) === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {skills.reduce((a, b) => a + b.weight, 0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Module Management</CardTitle>
            <CardDescription>Active training modules in SAR cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Pre-Analysis Phase</p>
                  <p className="text-[10px] text-slate-500">Diagnostics & Entry Mapping</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none">ACTIVE</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <FileEdit className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Workshop Phase</p>
                  <p className="text-[10px] text-slate-500">Continuous Evaluation</p>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-none">ACTIVE</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Post-Analysis Phase</p>
                  <p className="text-[10px] text-slate-500">Impact Audit</p>
                </div>
              </div>
              <Badge variant="outline">DISABLED</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardView({ 
  students, 
  teacher, 
  batchesList,
  adminSelectedBatch, 
  setAdminSelectedBatch,
  activityLogs,
  setCurrentView
}: { 
  students: Student[], 
  teacher: Teacher | null,
  batchesList: BatchConfig[],
  adminSelectedBatch: string,
  setAdminSelectedBatch: (batch: string) => void,
  activityLogs: ActivityLog[],
  setCurrentView: (view: View) => void
}) {
  const totalStudents = students.length;
  const atRisk = students.filter(s => {
    const post = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    const avg = ((post.communication || 0) + (post.technical || 0) + (post.logic || 0) + (post.confidence || 0)) / 4;
    return avg < 5;
  }).length;
  
  const avgPre = students.length > 0 ? students.reduce((acc, s) => {
    const pre = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    return acc + ((pre.communication || 0) + (pre.technical || 0) + (pre.logic || 0) + (pre.confidence || 0)) / 4;
  }, 0) / students.length : 0;
  const avgPost = students.length > 0 ? students.reduce((acc, s) => {
    const post = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    return acc + ((post.communication || 0) + (post.technical || 0) + (post.logic || 0) + (post.confidence || 0)) / 4;
  }, 0) / students.length : 0;
  const improvement = avgPre > 0 ? ((avgPost - avgPre) / avgPre) * 100 : 0;

  const batchSummary = students.length > 0 ? getBatchSummary(students) : "No student data available for this batch.";

  const handleGenerateReport = () => {
    const headers = ['Name', 'Roll No', 'Batch', 'Branch', 'Pre-Analysis Avg', 'Post-Analysis Avg', 'Improvement %'];
    const rows = students.map(s => {
      const preObj = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
      const postObj = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
      const pre = ((preObj.communication || 0) + (preObj.technical || 0) + (preObj.logic || 0) + (preObj.confidence || 0)) / 4;
      const post = ((postObj.communication || 0) + (postObj.technical || 0) + (postObj.logic || 0) + (postObj.confidence || 0)) / 4;
      const imp = pre > 0 ? ((post - pre) / pre) * 100 : 0;
      return [s.name, s.rollNo, s.batch, s.branch, pre.toFixed(2), post.toFixed(2), imp.toFixed(2)];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SAR_Report_${adminSelectedBatch || teacher?.batch}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report generated and download started!');
  };

  const myAssignedBatches = teacher?.role === 'Admin' 
    ? ['All', ...batchesList.map(b => b.batchId)]
    : (() => {
        const assigned = batchesList.filter(b => b.teacherId === teacher?.id).map(b => b.batchId);
        // Include their primary batch if it's not in the formal assignments
        if (teacher?.batch && teacher.batch !== 'None' && !assigned.includes(teacher.batch)) assigned.unshift(teacher.batch);
        return assigned.length > 1 ? ['All', ...assigned] : assigned;
      })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {myAssignedBatches.length > 1 && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{teacher?.role === 'Admin' ? 'Admin Control Panel' : 'My Batches'}</h2>
              <p className="text-[10px] text-slate-500">Filter students by batch</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {myAssignedBatches.map((batch) => (
              <Button
                key={batch}
                variant={adminSelectedBatch === batch ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAdminSelectedBatch(batch)}
                className={adminSelectedBatch === batch ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
              >
                {batch}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Batch Overview</h1>
          <p className="text-slate-500 mt-1">Welcome, Prof. {teacher?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Batch</p>
          <div className="flex flex-col items-end gap-2">
            <p className="text-lg font-semibold text-slate-900">
              {teacher?.role === 'Admin' ? adminSelectedBatch : (teacher?.batch === 'None' ? 'Unassigned' : teacher?.batch)}
            </p>
            {teacher?.role !== 'Admin' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentView('inbox')}
                className="h-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg px-3 gap-2"
              >
                <ShieldCheck className="w-3 h-3" /> Message Admin
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Total Students" 
            value={students.length > 0 ? totalStudents.toString() : "0"} 
            icon={<Users className="w-6 h-6 text-blue-600" />}
            trend={students.length > 0 ? "Assigned to you" : "Pending Setup"}
            color="blue"
          />
          <MetricCard 
            title="Avg. Improvement" 
            value={students.length > 0 ? `${improvement.toFixed(1)}%` : "0%"} 
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            trend={students.length > 0 ? "Batch progress" : "Pending Setup"}
            color="emerald"
          />
          <MetricCard 
            title="At-Risk Students" 
            value={students.length > 0 ? atRisk.toString() : "0"} 
            icon={<AlertCircle className="w-6 h-6 text-rose-600" />}
            trend={students.length > 0 ? "Needs attention" : "No Data"}
            color="rose"
          />
        </div>

        <Card className="border-none shadow-sm bg-indigo-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <BrainCircuit className="w-32 h-32" />
          </div>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-indigo-700 text-indigo-100 border-none">AI Insight</Badge>
            </div>
            <CardTitle className="text-2xl">AI Batch Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-50 text-lg leading-relaxed max-w-2xl">
              {students.length > 0 ? batchSummary : (
                teacher?.role === 'Admin' 
                ? "System ready. Please upload student data to generate insights."
                : "Awaiting student assignment from Admin."
              )}
            </p>
          <Button 
            variant="secondary" 
            className="mt-6 bg-white text-indigo-900 hover:bg-indigo-50"
            onClick={handleGenerateReport}
          >
            Generate Full Report
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Skill Distribution</CardTitle>
            <CardDescription>Pre vs Post Analysis average scores</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                { 
                  subject: 'Communication', 
                  A: students.reduce((acc, s) => acc + (s.preAnalysis?.communication || 0), 0) / students.length || 0, 
                  B: students.reduce((acc, s) => acc + (s.postAnalysis?.communication || 0), 0) / students.length || 0 
                },
                { 
                  subject: 'Technical', 
                  A: students.reduce((acc, s) => acc + (s.preAnalysis?.technical || 0), 0) / students.length || 0, 
                  B: students.reduce((acc, s) => acc + (s.postAnalysis?.technical || 0), 0) / students.length || 0 
                },
                { 
                  subject: 'Logic', 
                  A: students.reduce((acc, s) => acc + (s.preAnalysis?.logic || 0), 0) / students.length || 0, 
                  B: students.reduce((acc, s) => acc + (s.postAnalysis?.logic || 0), 0) / students.length || 0 
                },
                { 
                  subject: 'Confidence', 
                  A: students.reduce((acc, s) => acc + (s.preAnalysis?.confidence || 0), 0) / students.length || 0, 
                  B: students.reduce((acc, s) => acc + (s.postAnalysis?.confidence || 0), 0) / students.length || 0 
                },
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar name="Pre-Analysis" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Post-Analysis" dataKey="B" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Quick Reports
            </CardTitle>
            <CardDescription>Access detailed student and teacher reports</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 group transition-all"
              onClick={() => setCurrentView('students')}
            >
              <Users className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">Student Reports</p>
                <p className="text-[10px] text-slate-500">Personal & Academic</p>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 group transition-all"
              onClick={() => setCurrentView('teacher-profile')}
            >
              <UserCircle className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
              <div className="text-center">
                <p className="text-sm font-bold text-slate-900">Teacher Report</p>
                <p className="text-[10px] text-slate-500">Personal & Performance</p>
              </div>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest marks entries and workshops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {activityLogs.length > 0 ? activityLogs.slice().reverse().map((log, i) => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Marks entered for {log.studentName}</p>
                    <p className="text-xs text-slate-500">{log.activityName} • {log.timestamp}</p>
                  </div>
                  <Badge variant="outline" className="bg-white">{log.marks}/10</Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 italic text-sm">
                  No recent activity recorded.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: 'blue' | 'emerald' | 'rose' | 'indigo' }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' }
  };

  const colors = colorMap[color] || colorMap.indigo;

  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">{value}</h3>
          </div>
          <div className={`p-3 rounded-2xl ${colors.bg}`}>
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs font-medium ${colors.text}`}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getSectionDivision(rollNo: string) {
  const section = rollNo.charAt(0);
  const num = parseInt(rollNo.substring(1));
  const division = num <= 20 ? '1' : '2';
  return `${section}${division}`;
}

function StudentListView({ 
  students, 
  teacher,
  batchesList,
  adminSelectedBatch,
  setAdminSelectedBatch,
  onViewDetail 
}: { 
  students: Student[], 
  teacher: Teacher | null,
  batchesList: BatchConfig[],
  adminSelectedBatch: string,
  setAdminSelectedBatch: (b: string) => void,
  onViewDetail: (s: Student) => void 
}) {
  const [search, setSearch] = useState('');
  
  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  const myAssignedBatches = teacher?.role === 'Admin' 
    ? ['All', ...batchesList.map(b => b.batchId)]
    : (() => {
        const assigned = batchesList.filter(b => b.teacherId === teacher?.id).map(b => b.batchId);
        if (teacher?.batch && !assigned.includes(teacher.batch)) assigned.unshift(teacher.batch);
        return assigned.length > 1 ? ['All', ...assigned] : assigned;
      })();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student List</h1>
          <p className="text-slate-500 mt-1">Manage and view student performance audits</p>
        </div>
        <div className="flex items-center gap-4">
          {myAssignedBatches.length > 1 && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-[400px]">
              {myAssignedBatches.map((batch) => (
                <button
                  key={batch}
                  onClick={() => setAdminSelectedBatch(batch)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap ${
                    adminSelectedBatch === batch 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {batch}
                </button>
              ))}
            </div>
          )}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search name or roll no..." 
              className="pl-10 h-11 bg-white shadow-sm border-slate-200 focus:ring-indigo-500" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="w-[400px] py-4 font-semibold text-slate-700">Student Name</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700">College ID</TableHead>
                <TableHead className="py-4 font-semibold text-slate-700 text-center">Batch</TableHead>
                <TableHead className="text-right py-4 font-semibold text-slate-700 pr-6">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map((student) => {
                return (
                  <TableRow key={student.id} className="group hover:bg-slate-50/80 transition-all duration-200 border-b border-slate-50">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-200">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{student.branch}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-bold font-mono">
                      {student.collegeId || student.rollNo}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                        {student.batch}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-xs font-bold border-indigo-100 text-indigo-600 hover:bg-indigo-50")}>
                            Quick Feedback
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => toast.success(`Feedback sent to ${student.name}: Great progress in communication!`)}>
                              🌟 Great progress!
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(`Feedback sent to ${student.name}: Needs improvement in technical depth.`)}>
                              📚 Needs tech focus
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(`Feedback sent to ${student.name}: Participation in workshops is mandatory.`)}>
                              ⚠️ Mandatory attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.success(`Feedback sent to ${student.name}: Keep up the consistency!`)}>
                              🎯 Keep it up
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/50 font-bold rounded-lg px-2"
                          onClick={() => onViewDetail(student)}
                        >
                          Audit Details <ChevronRight className="ml-1 w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-400 italic">
                    No students found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  );
}

function SubmissionGradingDialog({
  sub,
  task,
  onGrade,
  onDelete,
  trigger
}: {
  sub: Submission;
  task?: Task;
  onGrade: (score: number) => void;
  onDelete?: (submissionId: string) => void;
  trigger: React.ReactNode;
}) {
  const [scoreInput, setScoreInput] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showRetestConfirm, setShowRetestConfirm] = useState(false);
  const [isRetesting, setIsRetesting] = useState(false);

  // Calculate auto score for assignments
  const questions = (task?.content as AssignmentContent)?.questions || [];
  let autoScore = 0;
  if (sub.type === 'Assignment' && sub.answers) {
    questions.forEach((q, idx) => {
      if (sub.answers?.[idx] === q.correctKey) {
        autoScore++;
      }
    });
  }

  useEffect(() => {
    if (sub.status === 'Awaiting-Manual-Grading') {
      setScoreInput(sub.type === 'Assignment' ? autoScore.toString() : '');
      setIsEditing(true);
    } else {
      setScoreInput(sub.score !== undefined ? sub.score.toString() : '');
      setIsEditing(false);
    }
  }, [sub, autoScore]);

  const handleRetest = async () => {
    setIsRetesting(true);
    try {
      await databaseService.deleteSubmission(sub.id);
      toast.success("Retest assigned! Student submission has been reset.");
      if (onDelete) {
        onDelete(sub.id);
      }
    } catch (err) {
      console.error("Failed to delete submission:", err);
      toast.error("Failed to assign retest.");
    } finally {
      setIsRetesting(false);
      setShowRetestConfirm(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full rounded-[2.5rem] max-h-[90vh] overflow-y-auto pr-4 custom-scrollbar bg-white/95 backdrop-blur-md">
        <DialogTitle className="text-2xl font-bold text-center mb-2">
          {sub.status === 'Awaiting-Manual-Grading' ? 'Evaluate Submission' : 'Submission Details'}
        </DialogTitle>
        <DialogDescription className="text-center text-xs font-medium text-slate-500 mb-3">
          Student: <strong className="text-slate-800">{sub.studentName}</strong> ({sub.batchId}) &bull; Task: <strong className="text-slate-800">{task?.title || 'Unknown'}</strong> &bull; Submitted: {new Date(sub.submittedAt).toLocaleString()}
        </DialogDescription>

        <div className="flex justify-center gap-2 mb-6">
          <Badge className={cn(
            "rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1",
            sub.status === 'Auto-Evaluated' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
            sub.status === 'Awaiting-Manual-Grading' ? "bg-amber-50 text-amber-600 border-amber-100" :
            "bg-blue-50 text-blue-600 border-blue-100"
          )}>
            Status: {sub.status === 'Awaiting-Manual-Grading' ? 'Manual Grading Pending' : sub.status}
          </Badge>

          <Badge className={cn(
            "rounded-full text-[10px] font-black uppercase tracking-wider px-3 py-1 flex items-center gap-1",
            !sub.submissionReason || sub.submissionReason === 'Normal Submission'
              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
              : sub.submissionReason === 'Time Expired'
              ? "bg-amber-50 text-amber-600 border-amber-150"
              : "bg-rose-50 text-rose-600 border-rose-150"
          )}>
            {(!sub.submissionReason || sub.submissionReason === 'Normal Submission') ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                Normal Submission
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                {sub.submissionReason}
              </>
            )}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Mock Test PDF Section */}
          {sub.type === 'MockTest' && (
            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
              <h4 className="font-bold text-slate-850 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" /> Exam Answer Sheet
              </h4>
              {sub.attachmentUrl && sub.attachmentUrl !== 'time_expired_placeholder' ? (
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-sm font-medium text-slate-700">Student PDF File:</span>
                  <Button 
                    variant="link" 
                    className="text-indigo-600 font-bold p-0 h-auto gap-2"
                    onClick={() => {
                      if (sub.attachmentUrl?.startsWith('data:')) {
                        const link = document.createElement('a');
                        link.href = sub.attachmentUrl;
                        link.download = `${sub.studentName}_AnswerSheet.pdf`;
                        link.click();
                      } else {
                        window.open(sub.attachmentUrl, '_blank');
                      }
                    }}
                  >
                    <Download className="w-4 h-4" /> Download / View PDF
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 text-rose-700 text-xs font-semibold rounded-2xl border border-rose-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Answer sheet PDF not uploaded (Time Expired or Bypass submission)
                </div>
              )}
            </div>
          )}

          {/* Assignment Questions & Student Answers Section */}
          {sub.type === 'Assignment' && (
            <div className="space-y-4">
              <h4 className="font-black text-slate-850 flex items-center gap-2 border-b pb-2">
                <BookOpen className="w-5 h-5 text-orange-600" /> Student Response Details
              </h4>
              
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-xs font-bold text-indigo-700 flex justify-between">
                <span>AI Evaluated Correct Answers Score:</span>
                <span className="text-sm">{autoScore} / {sub.totalMarks} ({((autoScore / sub.totalMarks) * 100).toFixed(0)}%)</span>
              </div>

              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
                {questions.map((q, qIdx) => {
                  const studentAns = sub.answers?.[qIdx];
                  const isCorrect = studentAns === q.correctKey;
                  return (
                    <div key={q.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-3 text-left">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black text-slate-400">Q{qIdx + 1} ({q.marks} Mark)</span>
                        <Badge className={cn(
                          "rounded-full text-[9px] font-black uppercase",
                          studentAns === -1 || studentAns === undefined ? "bg-slate-100 text-slate-500" :
                          isCorrect ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                        )}>
                          {studentAns === -1 || studentAns === undefined ? 'Unanswered' : isCorrect ? 'Correct' : 'Incorrect'}
                        </Badge>
                      </div>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.question}</p>
                      
                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 pl-4">
                          {q.options.map((opt, oIdx) => {
                            const isStudentChoice = studentAns === oIdx;
                            const isCorrectAns = q.correctKey === oIdx;
                            return (
                              <div key={oIdx} className={cn(
                                "text-xs p-3 rounded-xl border flex items-center gap-2",
                                isCorrectAns ? "bg-emerald-50 border-emerald-250 text-emerald-800 font-bold" :
                                isStudentChoice ? "bg-rose-50 border-rose-200 text-rose-800" :
                                "bg-slate-50/50 border-slate-100 text-slate-400"
                              )}>
                                <div className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  isCorrectAns ? "bg-emerald-500" : isStudentChoice ? "bg-rose-500" : "bg-slate-300"
                                )} />
                                <span className="truncate">{opt}</span>
                                {isStudentChoice && <span className="text-[9px] ml-auto font-black uppercase tracking-tighter opacity-80">(Chosen)</span>}
                                {isCorrectAns && <span className="text-[9px] ml-auto font-black uppercase tracking-tighter opacity-80">(Correct)</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grading Input Section */}
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left">
            <h4 className="font-bold text-slate-800 flex items-center justify-between">
              <span>Marks Awarded</span>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs font-bold text-indigo-600 rounded-lg"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit Grade
                </Button>
              )}
            </h4>

            {isEditing ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  Enter final score obtained by the student (Max: {sub.totalMarks}).
                  {sub.type === 'Assignment' && ` Recommended AI score is ${autoScore}.`}
                </p>
                <div className="flex gap-3">
                  <Input 
                    type="number" 
                    max={sub.totalMarks} 
                    min={0}
                    placeholder="Enter Score" 
                    value={scoreInput}
                    onChange={(e) => setScoreInput(e.target.value)}
                    className="rounded-xl h-12 flex-1 font-bold bg-white"
                  />
                  <Button 
                    className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-8 font-bold text-white shrink-0" 
                    onClick={() => {
                      const val = parseInt(scoreInput);
                      if (!isNaN(val) && val >= 0 && val <= sub.totalMarks) {
                        onGrade(val);
                        setIsEditing(false);
                      } else {
                        toast.error(`Please enter a valid score between 0 and ${sub.totalMarks}`);
                      }
                    }}
                  >
                    Submit Grade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <p className="text-2xl font-black text-slate-900">{sub.score} / {sub.totalMarks}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Final Score</p>
                </div>
                <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 rounded-full font-bold uppercase tracking-widest text-[9px] px-3 py-1">
                  Graded
                </Badge>
              </div>
            )}
          </div>

          {/* Proctoring & Retest Section */}
          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 text-left animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" /> Retention & Retest
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Assigning a retest allows the student to retake this activity. This will invalidate the current submission.
                </p>
              </div>
              {!showRetestConfirm && (
                <Button
                  onClick={() => setShowRetestConfirm(true)}
                  variant="outline"
                  className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold text-xs gap-1.5 h-10 px-4 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Assign Retest
                </Button>
              )}
            </div>

            {showRetestConfirm && (
              <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slideDown">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-rose-800">Confirm Action</h5>
                    <p className="text-xs text-rose-600 mt-0.5">
                      Are you sure you want to reset this activity? Their current score and responses will be permanently removed.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                    onClick={() => setShowRetestConfirm(false)}
                    disabled={isRetesting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs px-4"
                    onClick={handleRetest}
                    disabled={isRetesting}
                  >
                    {isRetesting ? 'Resetting...' : 'Yes, Reset Submission'}
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

function MarksEntryView({ 
  students, 
  teacher,
  setStudents,
  setActivityLogs,
  taskIdFilter,
  onClearFilter
}: { 
  students: Student[], 
  teacher: Teacher | null,
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>,
  setActivityLogs: React.Dispatch<React.SetStateAction<ActivityLog[]>>,
  taskIdFilter?: string,
  onClearFilter?: () => void
}) {
  const [viewMode, setViewMode] = useState<'Workload' | 'Submissions'>(taskIdFilter ? 'Submissions' : 'Workload');
  const [submissionFilter, setSubmissionFilter] = useState<'Assignment' | 'MockTest'>('Assignment');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(taskIdFilter || ACTIVITIES[0].id);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data.tasks || []);
      } catch (err) {
        console.error("Error fetching tasks for grading:", err);
      }
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    if (taskIdFilter) {
      // Find the task to determine the submission filter type
      const findTaskType = async () => {
        try {
          const tasks = await databaseService.getTasksByBatch(teacher.batch);
          const task = tasks.find(t => t.id === taskIdFilter);
          if (task) {
            if (task.type === 'Conduct Mock Test') setSubmissionFilter('MockTest');
            else setSubmissionFilter('Assignment');
          }
        } catch (err) {
          console.error("Error finding task type:", err);
        }
      };
      findTaskType();
      setViewMode('Submissions');
    }
  }, [taskIdFilter]);
  const [entries, setEntries] = useState<Record<string, { marks: string, attendance: 'Present' | 'Absent' }>>(
    students.reduce((acc, s) => ({ ...acc, [s.id]: { marks: '', attendance: 'Present' } }), {})
  );

  useEffect(() => {
    if (viewMode === 'Submissions' && teacher) {
      const fetchSubmissions = async () => {
        setLoading(true);
        try {
          // Filter by teacher creator
          const subs = await databaseService.getSubmissionsByTeacher(teacher.id);
          setSubmissions(subs);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSubmissions();
    }
  }, [viewMode, teacher]);

  const handleManualGrade = async (subId: string, score: number) => {
    try {
      await databaseService.gradeSubmission(subId, score);
      setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, score, status: 'Graded' } : s));
      toast.success('Grade updated successfully');
    } catch (err) {
      toast.error('Failed to update grade');
    }
  };

  const handleSave = () => {
    const activity = ACTIVITIES.find(a => a.id === selectedActivity);
    const newLogs: ActivityLog[] = [];
    
    Object.entries(entries).forEach(([studentId, data]) => {
      const entryData = data as { marks: string, attendance: 'Present' | 'Absent' };
      if (entryData.marks && entryData.attendance === 'Present') {
        const student = students.find(s => s.id === studentId);
        if (student) {
          newLogs.push({
            id: Math.random().toString(36).substr(2, 9),
            studentName: student.name,
            activityName: activity?.name || 'Unknown Activity',
            marks: parseInt(entryData.marks),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }
    });

    if (newLogs.length > 0) {
      setActivityLogs(prev => [...prev, ...newLogs]);
    }
    
    toast.success('Marks saved successfully!');
  };

  const filteredSubmissions = submissions.filter(s => {
    const typeMatch = s.type === submissionFilter;
    const taskMatch = taskIdFilter ? s.taskId === taskIdFilter : true;
    return typeMatch && taskMatch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Marks & Evaluation</h1>
          <p className="text-slate-500 mt-1">Manage manual marks entry and AI powered submissions</p>
          {taskIdFilter && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 gap-2 px-3 py-1 rounded-full">
                 <FileText className="w-3 h-3" /> 
                 Filtering by: Activity {taskIdFilter.substring(0, 8)}...
              </Badge>
              {onClearFilter && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold text-slate-400 hover:text-rose-500 rounded-full flex items-center gap-1"
                  onClick={onClearFilter}
                >
                  <X className="w-3 h-3" /> Clear Filter
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
           <button 
             onClick={() => setViewMode('Workload')}
             className={cn(
               "px-6 py-2 text-xs font-bold rounded-lg transition-all",
               viewMode === 'Workload' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
             )}
           >Activities</button>
           <button 
             onClick={() => setViewMode('Submissions')}
             className={cn(
               "px-6 py-2 text-xs font-bold rounded-lg transition-all",
               viewMode === 'Submissions' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
             )}
           >AI Submissions</button>
        </div>
      </div>

      {viewMode === 'Workload' ? (
        <>
          <div className="flex justify-end gap-3 mb-4">
            <Select value={selectedActivity} onValueChange={setSelectedActivity}>
              <SelectTrigger className="w-64 rounded-xl border-slate-200 shadow-sm">
                <SelectValue placeholder="Select Activity" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITIES.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-6">Save All Changes</Button>
          </div>

          <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem]">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 font-bold text-slate-700">Student Name</TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">Roll Number</TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">Attendance</TableHead>
                  <TableHead className="w-32 py-4 font-bold text-slate-700">Marks (1-10)</TableHead>
                  <TableHead className="py-4 font-bold text-slate-700">AI Feedback Suggestion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-bold text-slate-900">{student.name}</TableCell>
                    <TableCell className="text-slate-500 font-medium">{student.rollNo}</TableCell>
                    <TableCell>
                      <Select 
                        value={entries[student.id].attendance} 
                        onValueChange={(val: 'Present' | 'Absent') => setEntries({
                          ...entries,
                          [student.id]: { ...entries[student.id], attendance: val }
                        })}
                      >
                        <SelectTrigger className="w-32 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Present">Present</SelectItem>
                          <SelectItem value="Absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        placeholder="0"
                        className="rounded-lg h-10"
                        value={entries[student.id].marks}
                        onChange={(e) => setEntries({
                          ...entries,
                          [student.id]: { ...entries[student.id], marks: e.target.value }
                        })}
                        disabled={entries[student.id].attendance === 'Absent'}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 text-xs text-slate-400 italic font-medium">
                          {entries[student.id].marks ? getAIFeedback(parseInt(entries[student.id].marks)) : 'Enter marks to see suggestion...'}
                        </div>
                        {entries[student.id].marks && (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-100 cursor-pointer hover:bg-indigo-100 rounded-full px-3">
                            Apply
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
           <div className="flex justify-start gap-2">
              <Button 
                variant={submissionFilter === 'Assignment' ? 'default' : 'outline'} 
                onClick={() => setSubmissionFilter('Assignment')}
                className="rounded-full px-6"
              >Assignments</Button>
              <Button 
                variant={submissionFilter === 'MockTest' ? 'default' : 'outline'} 
                onClick={() => setSubmissionFilter('MockTest')}
                className="rounded-full px-6"
              >Mock Tests</Button>
           </div>

           <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem]">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                     <TableHead className="py-4 font-bold">Student</TableHead>
                     <TableHead className="py-4 font-bold">Submitted At</TableHead>
                     <TableHead className="py-4 font-bold">Status</TableHead>
                     <TableHead className="py-4 font-bold">Score</TableHead>
                     <TableHead className="py-4 font-bold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400">Loading submissions...</TableCell></TableRow>
                  ) : filteredSubmissions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-400 italic">No submissions found for the selected type.</TableCell></TableRow>
                  ) : filteredSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                       <TableCell>
                          <p className="font-bold text-slate-800">{sub.studentName}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{sub.batchId}</p>
                       </TableCell>
                       <TableCell className="text-xs text-slate-500">
                          {new Date(sub.submittedAt).toLocaleString()}
                       </TableCell>
                       <TableCell>
                          <Badge className={cn(
                            "rounded-full text-[10px]",
                            sub.status === 'Auto-Evaluated' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            sub.status === 'Awaiting-Manual-Grading' ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                             {sub.status === 'Awaiting-Manual-Grading' ? 'Manual Grading Pending' : sub.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="font-black text-slate-900">
                           {sub.status === 'Awaiting-Manual-Grading' ? (
                             '--'
                           ) : (
                             sub.type === 'Assignment' ? (
                               `${((sub.score || 0) / sub.totalMarks * 100).toFixed(0)}%`
                             ) : (
                               `${sub.score}/${sub.totalMarks}`
                             )
                           )}
                        </TableCell>
                        <TableCell className="text-right">
                           <SubmissionGradingDialog 
                             sub={sub}
                             task={tasks.find(t => t.id === sub.taskId)}
                             onGrade={(score) => handleManualGrade(sub.id, score)}
                             onDelete={(subId) => setSubmissions(prev => prev.filter(x => x.id !== subId))}
                             trigger={
                               sub.status === 'Awaiting-Manual-Grading' ? (
                                 <Button size="sm" className="rounded-full bg-amber-500 hover:bg-amber-600 font-bold">Grade Now</Button>
                               ) : (
                                 <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">View Detail</Button>
                               )
                             }
                           />
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           </Card>
        </div>
      )}
    </motion.div>
  );
}

function StudentDetailView({ student, onBack }: { student: Student, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'performance' | 'personal' | 'academic'>('performance');
  
  const preObj = student.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
  const postObj = student.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };

  const radarData = [
    { subject: 'Communication', pre: preObj.communication || 0, post: postObj.communication || 0 },
    { subject: 'Technical', pre: preObj.technical || 0, post: postObj.technical || 0 },
    { subject: 'Logic', pre: preObj.logic || 0, post: postObj.logic || 0 },
    { subject: 'Confidence', pre: preObj.confidence || 0, post: postObj.confidence || 0 },
  ];

  const workshopTrendData = (student.workshopScores || []).map(ws => {
    const activity = ACTIVITIES.find(a => a.id === ws.activityId);
    return {
      name: activity?.name || 'Activity',
      marks: ws.marks || 0,
      date: ws.date || ''
    };
  });

  const recommendations = getAIRecommendations(postObj);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </Button>
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl border-2 border-indigo-100">
                {student.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
              <p className="text-slate-500">Roll No: {student.rollNo} • College ID: {student.collegeId || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-center">
          <button 
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === 'performance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Performance
          </button>
          <button 
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Personal Report
          </button>
          <button 
            onClick={() => setActiveTab('academic')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${activeTab === 'academic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Academic Report
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'performance' && (
          <motion.div 
            key="performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Workshop Performance History</CardTitle>
                  <CardDescription>Detailed marks and attendance for each activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Marks (1-10)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.workshopScores.map((ws, i) => {
                        const activity = ACTIVITIES.find(a => a.id === ws.activityId);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{activity?.name}</TableCell>
                            <TableCell>{ws.date}</TableCell>
                            <TableCell>
                              <Badge variant={ws.attendance === 'Present' ? 'default' : 'destructive'} className="text-[10px]">
                                {ws.attendance}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-bold">{ws.marks}/10</TableCell>
                            <TableCell>
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${ws.marks >= 7 ? 'bg-emerald-500' : ws.marks >= 4 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                  style={{ width: `${ws.marks * 10}%` }} 
                                />
                               </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Workshop Performance Trend</CardTitle>
                  <CardDescription>Progress through various intervention activities</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {workshopTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={workshopTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="marks" name="Marks Obtained" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6, fill: '#4f46e5' }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 italic">
                      No workshop data recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Skill Growth Radar</CardTitle>
                  <CardDescription>Multi-dimensional skill comparison</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                      <Radar name="Pre-Analysis" dataKey="pre" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.5} />
                      <Radar name="Post-Analysis" dataKey="post" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle>Skill Comparison</CardTitle>
                  <CardDescription>Pre vs Post scores side-by-side</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={radarData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="pre" name="Pre-Analysis" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="post" name="Post-Analysis" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <BrainCircuit className="w-32 h-32" />
                </div>
                <CardHeader>
                  <CardTitle>AI Personalized Recommendations</CardTitle>
                  <CardDescription className="text-slate-400">Based on latest performance audit</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.map((rec, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-slate-200">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'personal' && (
          <motion.div 
            key="personal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Branch</p>
                    <p className="text-sm font-medium text-slate-900">{student.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Section</p>
                    <p className="text-sm font-medium text-slate-900">{student.section || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Year</p>
                    <p className="text-sm font-medium text-slate-900">{student.year || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Batch</p>
                    <p className="text-sm font-medium text-slate-900">{student.batch}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Mob no.</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">ERP id</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.erpId || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">mail id (SKIT domain)</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.emailSkit || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">mail id (other domain)</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.emailOther || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Family & Other Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">F-Name & Contact no.</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.fatherName} • {student.personalDetails?.fatherContact}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">M-Name & Contact no.</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.motherName} • {student.personalDetails?.motherContact}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Date of Birth</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.dob || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Gender</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.gender || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-sm font-medium text-slate-900">{student.personalDetails?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'academic' && (
          <motion.div 
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <Card className="border-none shadow-sm bg-indigo-600 text-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-xs font-medium">Current CGPA</p>
                      <h3 className="text-3xl font-bold mt-1">{(student.academicDetails?.currentCGPA || 0).toFixed(2)}</h3>
                    </div>
                    <Award className="w-8 h-8 text-indigo-300 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Semester Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(student.academicDetails?.semesterGrades || {}).map(([sem, grade]) => (
                      <div key={sem} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">{sem}</span>
                        <span className="text-sm font-bold text-indigo-600">{(grade || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Skills & Backlogs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-3">Technical Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {(student.academicDetails?.skills || []).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100">
                          {skill}
                        </Badge>
                      ))}
                      {(!student.academicDetails?.skills || student.academicDetails.skills.length === 0) && (
                        <p className="text-sm text-slate-500">No skills listed</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 mb-1">Active Backlogs</p>
                    <Badge variant={student.academicDetails?.backlogs === 0 ? 'default' : 'destructive'} className="bg-emerald-500">
                      {student.academicDetails?.backlogs || '0'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReportsView({ students }: { students: Student[] }) {
  const data = students.map(s => {
    const preObj = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    const postObj = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    return {
      name: s.name,
      pre: ((preObj.communication || 0) + (preObj.technical || 0) + (preObj.logic || 0) + (preObj.confidence || 0)) / 4,
      post: ((postObj.communication || 0) + (postObj.technical || 0) + (postObj.logic || 0) + (postObj.confidence || 0)) / 4,
    };
  });

  const improvements = students.map(s => {
    const preObj = s.preAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    const postObj = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    const pre = ((preObj.communication || 0) + (preObj.technical || 0) + (preObj.logic || 0) + (preObj.confidence || 0)) / 4;
    const post = ((postObj.communication || 0) + (postObj.technical || 0) + (postObj.logic || 0) + (postObj.confidence || 0)) / 4;
    return pre > 0 ? ((post - pre) / pre) * 100 : 0;
  });

  const highestImp = improvements.length > 0 ? Math.max(...improvements) : 0;
  const lowestImp = improvements.length > 0 ? Math.min(...improvements) : 0;
  const postScores = students.map(s => {
    const postObj = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    return ((postObj.communication || 0) + (postObj.technical || 0) + (postObj.logic || 0) + (postObj.confidence || 0)) / 4;
  });
  const medianPost = postScores.length > 0 ? [...postScores].sort((a, b) => a - b)[Math.floor(postScores.length / 2)] : 0;
  const placementReady = students.filter(s => {
    const postObj = s.postAnalysis || { communication: 0, technical: 0, logic: 0, confidence: 0 };
    const post = ((postObj.communication || 0) + (postObj.technical || 0) + (postObj.logic || 0) + (postObj.confidence || 0)) / 4;
    return post >= 7;
  }).length;
  const placementReadyPercent = students.length > 0 ? (placementReady / students.length) * 100 : 0;

  const recs = (() => {
    if (students.length === 0) return ["No data available yet.", "Upload student records to see actions."];
    if (placementReadyPercent < 40) return [
      "Mandatory 'Communication Basics' workshop for students scoring below 5.",
      "Department-wide Technical Assessment review to identify knowledge gaps.",
      "Bi-weekly parent-counselor meetings for students with < 75% attendance."
    ];
    if (placementReadyPercent < 75) return [
      "Industry-mentor led mock interviews for Batch B & C.",
      "Aptitude 'Crash Course' focusing on Logical Reasoning and Data interpretation.",
      "Personalized Resume-building workshops for students with CGPA > 7.0."
    ];
    return [
      "Tier-1 Company specific GD/PI preparatory sessions.",
      "Peer-mentorship program: High performers to guide baseline students.",
      "Final grooming session by Corporate HR experts for upcoming drives."
    ];
  })();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Placement Reports</h1>
        <p className="text-slate-500 mt-1">Detailed batch performance and improvement metrics</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Improvement Trend</CardTitle>
            <CardDescription>Individual student progress from baseline to current</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pre" name="Pre-Analysis" stroke="#94a3b8" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="post" name="Post-Analysis" stroke="#4f46e5" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Batch Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Highest Improvement</span>
                <span className="font-bold text-emerald-600">+{highestImp.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Lowest Improvement</span>
                <span className="font-bold text-rose-600">+{lowestImp.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Median Post-Score</span>
                <span className="font-bold text-slate-900">{medianPost.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Placement Readiness</span>
                <span className="font-bold text-indigo-600">{placementReadyPercent.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.map((rec, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 leading-relaxed border-l-4 border-indigo-500">
                  {idx + 1}. {rec}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
