import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  CheckCircle2, 
  FileText, 
  BookOpen, 
  Video, 
  Users as UsersIcon, 
  MessageSquare, 
  Airplay,
  ChevronRight,
  Download,
  BarChart3,
  AlertCircle,
  Clock,
  Sparkles,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Submission, MockTestContent, AssignmentContent, Student } from '../types';
import { databaseService } from '../lib/databaseService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface ActivityDetailModalProps {
  task: Task;
  onClose: () => void;
  onViewResponses: (taskId: string) => void;
  studentsInBatch: Student[];
  onUpdateTask?: (updated: Task) => void;
}

export function ActivityDetailModal({ task, onClose, onViewResponses, studentsInBatch, onUpdateTask }: ActivityDetailModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await databaseService.getSubmissionsByTask(task.id);
        setSubmissions(data);
      } catch (err) {
        console.error("Error fetching detail submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [task.id]);

  const submissionCount = submissions.length;
  const totalStudents = studentsInBatch.length;
  const submissionRate = totalStudents > 0 ? (submissionCount / totalStudents) * 100 : 0;

  const renderContent = () => {
    if (!task.content && (task.type === 'Conduct Mock Test' || task.type === 'Create New Assignment')) {
      return (
        <div className="bg-amber-50 p-8 rounded-3xl border border-dashed border-amber-200 text-center">
          <AlertCircle className="w-12 h-12 text-amber-300 mx-auto mb-4" />
          <h4 className="font-bold text-amber-800 mb-2">Content Missing</h4>
          <p className="text-sm text-amber-600 max-w-sm mx-auto">
            The AI-generated content for this activity is unavailable. This may happen if the generation process was interrupted.
          </p>
        </div>
      );
    }

    switch (task.type) {
      case 'Conduct Mock Test':
      case 'Create New Assignment':
        const content = task.content as (MockTestContent | AssignmentContent);
        if (!content?.questions) {
          return (
            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-rose-700 text-sm">
              Critical error: Content data is missing or corrupted. Please regenerate.
            </div>
          );
        }
        
        const isMockTest = task.type === 'Conduct Mock Test';
        const blueprint = isMockTest ? (content as MockTestContent).blueprint : null;

        return (
          <div className="space-y-6">
            <div className={cn("p-6 rounded-3xl border", isMockTest ? "bg-purple-50 border-purple-100" : "bg-orange-50 border-orange-100")}>
              <h4 className={cn("font-bold flex items-center gap-2 mb-4", isMockTest ? "text-purple-900" : "text-orange-900")}>
                <BarChart3 className="w-5 h-5" /> {isMockTest ? 'Exam Blueprint' : 'Quiz Configuration'}
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Questions</p>
                  <p className="text-sm font-bold text-indigo-700">{content.questions.length}</p>
                </div>
                {blueprint && (
                   <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Difficulty</p>
                    <p className="text-sm font-bold text-indigo-700 uppercase">{blueprint.difficulty || 'Medium'}</p>
                  </div>
                )}
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Marks</p>
                  <p className="text-sm font-bold text-indigo-700">{content.questions.reduce((a, b) => a + b.marks, 0)}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Topic</p>
                  <p className="text-sm font-bold text-indigo-700 truncate">
                    {blueprint?.topic || (content as AssignmentContent).topic}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800">Curated Questions</h4>
              {content.questions.map((q, idx) => (
                <div key={q.id} className="p-5 rounded-[2rem] border border-slate-100 bg-white shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Question {idx + 1} • {q.type}
                    </Badge>
                    <span className="text-xs font-black text-indigo-600">{q.marks} Marks</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.question}</p>
                  
                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={cn(
                          "text-xs p-3 rounded-xl border flex items-center gap-2",
                          oIdx === q.correctKey ? "bg-emerald-50 border-emerald-100 text-emerald-800 font-bold" : "bg-slate-50/50 border-slate-100 text-slate-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", oIdx === q.correctKey ? "bg-emerald-500" : "bg-slate-300")} />
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {(q.type === 'Short Answer' || q.type === 'Coding') && q.sampleAnswer && (
                    <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-50 mt-2">
                       <p className="text-[9px] font-black uppercase tracking-tighter text-indigo-400 mb-1">Chetas AI Model Answer</p>
                       <p className="text-xs text-indigo-600 font-medium whitespace-pre-wrap">{q.sampleAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'Conduct Mock Interview':
        return (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 italic text-indigo-900 text-sm leading-relaxed">
              Chetas AI provides a 24/7 mock interview platform that uses adaptive Gemini-driven logic to simulate realistic technical and HR placement rounds. It evaluates student responses in real-time, delivering instant feedback on domain knowledge and communication to bridge critical skill gaps before actual campus drives.
            </div>
          </div>
        );
      case 'Conduct Online Session':
        return (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 italic text-blue-900 text-sm leading-relaxed">
              Acadmeet is an AI-powered virtual classroom that features a real-time Alertness Monitor to detect and notify teachers when students are inattentive or sleeping. It integrates automated attendance and engagement analytics to bridge the gap between virtual attendance and actual classroom participation.
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="font-bold text-slate-800 mb-2">Session Guidelines</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              This is a coordinator-led activity. Please ensure students follow the instructions provided in the description: 
              <br />
              <span className="italic mt-2 block">"{task.description}"</span>
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="relative h-48 shrink-0">
          {task.type === 'Conduct Mock Interview' ? (
            <img src="/AI Interview.png" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : task.type === 'Conduct Online Session' ? (
            <img src="/Online Meet.png" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              task.type === 'Conduct Mock Test' ? "from-purple-600 to-indigo-700" :
              task.type === 'Create New Assignment' ? "from-orange-500 to-rose-600" :
              "from-indigo-600 to-blue-700"
            )} />
          )}
          <div className="absolute inset-0 opacity-10 blur-3xl overflow-hidden">
             <div className="w-96 h-96 bg-white rounded-full -top-10 -left-10 absolute" />
          </div>
          
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-8 right-8">
            <Badge className="bg-white/20 text-white border-none mb-2 backdrop-blur-sm">
              {task.type}
            </Badge>
            <h2 className="text-3xl font-black text-white drop-shadow-sm">{task.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-white/80 text-sm font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Created: {new Date(task.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1.5 text-rose-100 font-bold">
                <Clock className="w-4 h-4" />
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Activity Details
                </h3>
                {renderContent()}
              </section>

              <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2 uppercase tracking-wider">Teacher's Instructions</h3>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  "{task.description || 'No additional instructions provided.'}"
                </p>
              </section>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl bg-indigo-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Submission Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-4">
                    <p className="text-4xl font-black text-indigo-600">{submissionCount}<span className="text-slate-300 text-2xl">/{totalStudents}</span></p>
                    <p className="text-xs font-bold text-slate-500 mt-2">STUDENTS SUBMITTED</p>
                  </div>
                  
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${submissionRate}%` }}
                      className="h-full bg-indigo-600"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <span>{submissionRate.toFixed(0)}% Complete</span>
                    <span className={cn(submissionCount >= totalStudents ? "text-emerald-500" : "text-amber-500")}>
                      {totalStudents - submissionCount} Remaining
                    </span>
                  </div>
                </CardContent>
              </Card>

              {task.type === 'Create New Assignment' && (
                <Card className="border-none shadow-sm rounded-3xl bg-slate-50 border border-slate-100 p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" /> Grading Settings
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Configure how student submissions are graded for this assignment.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={task.gradingMode !== 'Manual Grading' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 rounded-xl text-xs font-bold"
                      onClick={async () => {
                        if (task.gradingMode === 'Auto-Evaluated' || !task.gradingMode) return;
                        try {
                          const updated = { ...task, gradingMode: 'Auto-Evaluated' as const };
                          await databaseService.saveTask(updated);
                          if (onUpdateTask) onUpdateTask(updated);
                          toast.success("Grading mode updated to Auto-Evaluated");
                        } catch (err) {
                          toast.error("Failed to update grading mode");
                        }
                      }}
                    >
                      Auto
                    </Button>
                    <Button
                      variant={task.gradingMode === 'Manual Grading' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 rounded-xl text-xs font-bold"
                      onClick={async () => {
                        if (task.gradingMode === 'Manual Grading') return;
                        try {
                          const updated = { ...task, gradingMode: 'Manual Grading' as const };
                          await databaseService.saveTask(updated);
                          if (onUpdateTask) onUpdateTask(updated);
                          toast.success("Grading mode updated to Manual Grading");
                        } catch (err) {
                          toast.error("Failed to update grading mode");
                        }
                      }}
                    >
                      Manual
                    </Button>
                  </div>
                </Card>
              )}

              <div className="pt-4 space-y-3">
                 {task.type === 'Conduct Mock Interview' || task.type === 'Conduct Online Session' ? (
                   <Button 
                     disabled
                     className="w-full h-14 rounded-2xl bg-slate-200 text-slate-500 cursor-not-allowed font-bold"
                   >
                     Coming Soon
                   </Button>
                 ) : (
                   <Button 
                     onClick={() => onViewResponses(task.id)}
                     className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold group"
                   >
                     View All Responses
                     <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </Button>
                 )}
                 
                 <Button 
                   variant="outline" 
                   className="w-full h-14 rounded-2xl font-bold border-2" 
                   onClick={() => {
                     // In a real app, this would export csv of scores
                     toast.info("Exporting results list...");
                   }}
                 >
                   <Download className="mr-2 w-4 h-4" /> Export Results (CSV)
                 </Button>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                   <Users className="w-4 h-4" /> Batch Context
                 </div>
                 <p className="text-[10px] text-amber-700 leading-relaxed">
                   This activity is only visible to students in <strong>{task.batchId}</strong>. Changing the batch assignment will hide it for existing students.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
