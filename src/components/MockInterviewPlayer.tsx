import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, CheckCircle, AlertTriangle, MessageSquare, User } from 'lucide-react';
import { Task, Student, InterviewContent, InterviewTurn, InterviewQuestion, InterviewReport } from '../types';
import { aiInterviewService } from '../lib/aiService';
import { apiService } from '../lib/apiService';
import { toast } from 'sonner';

type InterviewPhase = 'intro' | 'running' | 'generating' | 'done';

interface MockInterviewPlayerProps {
  task: Task;
  student: Student;
  onBack: () => void;
}

function AudioWaveform({ mode, stream, onVolumeUpdate }: { mode: 'ai' | 'user' | 'standby', stream: MediaStream | null, onVolumeUpdate?: (rms: number) => void }) {
  const barsCount = 40;
  const [dataArray, setDataArray] = useState<Uint8Array>(new Uint8Array(barsCount));
  const requestRef = useRef<number>();

  useEffect(() => {
    if (mode === 'user' && stream) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);

        const update = () => {
          analyser.getByteFrequencyData(data);
          
          // Calculate RMS for silence backup detection
          analyser.getByteTimeDomainData(timeData);
          let sum = 0;
          for (let i = 0; i < timeData.length; i++) {
            const val = (timeData[i] - 128) / 128;
            sum += val * val;
          }
          const rms = Math.sqrt(sum / timeData.length);
          if (onVolumeUpdate) {
            onVolumeUpdate(rms);
          }

          const sliced = new Uint8Array(barsCount);
          for (let i = 0; i < barsCount; i++) {
             sliced[i] = data[i]; 
          }
          setDataArray(sliced);
          requestRef.current = requestAnimationFrame(update);
        };
        
        requestRef.current = requestAnimationFrame(update);

        return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          source.disconnect();
          analyser.disconnect();
          if (audioCtx.state !== 'closed') audioCtx.close();
        };
      } catch (err) {
        console.error("Audio API error:", err);
      }
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setDataArray(new Uint8Array(barsCount));
    }
  }, [mode, stream, onVolumeUpdate]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: barsCount }).map((_, i) => {
        if (mode === 'ai') {
          return (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{ background: `linear-gradient(to top, #06b6d4, #3b82f6, #8b5cf6)` }}
              animate={{ height: [6, (8 + (i * 7 + 13) % 48), 6] }}
              transition={{
                duration: 0.4 + (i % 5) * 0.08, repeat: Infinity, repeatType: 'reverse', delay: i * 0.025, ease: 'easeInOut'
              }}
            />
          );
        } else if (mode === 'user') {
          const val = dataArray[i] || 0;
          const height = Math.max(4, (val / 255) * 56);
          return (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                height: `${height}px`,
                background: val > 5 ? `linear-gradient(to top, #06b6d4, #3b82f6, #8b5cf6)` : 'rgba(255,255,255,0.1)',
                transition: 'height 0.05s ease'
              }}
            />
          );
        } else {
          return (
            <div key={i} className="w-[3px] h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          );
        }
      })}
    </div>
  );
}

function StarField() {
  const stars = Array.from({ length: 80 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: (i % 3) + 1,
            height: (i % 3) + 1,
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 23 + 11) % 100}%`,
            opacity: 0.15 + (i % 5) * 0.05,
          }}
          animate={{ opacity: [0.1, 0.5, 0.1] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i % 8) * 0.5 }}
        />
      ))}
    </div>
  );
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (score / 10) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <motion.circle
            cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-black text-xl">{score}</span>
        </div>
      </div>
      <span className="text-white/60 text-xs font-bold uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

export default function MockInterviewPlayer({ task, student, onBack }: MockInterviewPlayerProps) {
  const content = task.content as InterviewContent | undefined;
  const questions: InterviewQuestion[] = content?.questions || [];

  const [phase, setPhase] = useState<InterviewPhase>('intro');
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [camError, setCamError] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  // Hardening State variables
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [silenceTimeoutSetting, setSilenceTimeoutSetting] = useState(10); // in seconds
  const [showSettings, setShowSettings] = useState(false);
  const [failedTurnsState, setFailedTurnsState] = useState<InterviewTurn[] | null>(null);
  const [isRetryingResponse, setIsRetryingResponse] = useState(false);
  const [resumePrompt, setResumePrompt] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnsRef = useRef<InterviewTurn[]>([]);
  const transcriptBuildRef = useRef('');
  const interviewEndedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const handleVolumeUpdate = useCallback((rms: number) => {
    const noiseFloor = 0.015;
    if (rms > noiseFloor) {
      lastActiveTimeRef.current = Date.now();
    } else {
      const silenceDuration = Date.now() - lastActiveTimeRef.current;
      if (silenceDuration > silenceTimeoutSetting * 1000) {
        if (isListening && !useTextFallback && transcriptBuildRef.current.trim().length > 0) {
          console.log("RMS silence threshold met, stopping recognition");
          recognitionRef.current?.stop();
        }
      }
    }
  }, [isListening, silenceTimeoutSetting, useTextFallback]);

  useEffect(() => { turnsRef.current = turns; }, [turns]);
  useEffect(() => { interviewEndedRef.current = interviewEnded; }, [interviewEnded]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [turns, currentTranscript]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasSynthesis = !!window.speechSynthesis;
    if (!hasSynthesis) {
      setBrowserSupported(false);
    }
    if (!SR) {
      setUseTextFallback(true);
    }
  }, []);

  // Session recovery check
  useEffect(() => {
    const saved = localStorage.getItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.turns && parsed.turns.length > 0) {
          setResumePrompt(true);
        }
      } catch (e) {}
    }
  }, [student.id, task.id]);

  // Persist session progress
  useEffect(() => {
    if (phase === 'running' && turns.length > 0) {
      localStorage.setItem(
        `sar_mock_interview_progress_${student.id}_${task.id}`,
        JSON.stringify({ turns, elapsedSeconds })
      );
    }
  }, [turns, elapsedSeconds, phase, student.id, task.id]);

  useEffect(() => {
    if (phase === 'running') {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    if (phase === 'running' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    const startCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch { setCamError(true); }
    };
    startCam();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.92;
      utt.pitch = 1;
      utt.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US');
      if (preferred) utt.voice = preferred;
      utt.onstart = () => setIsAiSpeaking(true);
      utt.onend = () => { setIsAiSpeaking(false); resolve(); };
      utt.onerror = () => { setIsAiSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utt);
    });
  }, []);

  const endInterview = useCallback(async (finalTurns?: InterviewTurn[]) => {
    const turnData = finalTurns || turnsRef.current;
    setInterviewEnded(true);
    interviewEndedRef.current = true;
    setPhase('generating');
    window.speechSynthesis.cancel();
    recognitionRef.current?.stop();

    try {
      const rpt = await aiInterviewService.generateInterviewReport(
        turnData, questions, student.name, student.id, task.id
      );
      setReport(rpt);

      const submission: any = {
        id: `interview-${Date.now()}`,
        taskId: task.id,
        studentId: student.id,
        studentName: student.name,
        batchId: student.batch,
        type: 'MockInterview',
        submittedAt: new Date().toISOString(),
        status: 'Auto-Evaluated',
        score: Math.round(rpt.overallScore),
        totalMarks: 10,
        teacherId: task.teacherId,
        interviewReport: rpt
      };
      await apiService.saveSubmission(submission);

      await apiService.sendMessage({
        senderId: student.id,
        senderName: student.name,
        senderRole: 'student',
        recipientArray: [task.teacherId],
        recipientType: 'Individual',
        text: `📋 Mock Interview Report Ready — ${student.name} completed "${task.title}". Overall: ${rpt.overallScore}/10. Fluency: ${rpt.fluency}/10, Confidence: ${rpt.confidence}/10, Clarity: ${rpt.clarity}/10. ${rpt.summary}`,
        timestamp: new Date().toISOString(),
        priority: 'Normal',
        category: 'Assignment',
        readBy: []
      });

      setPhase('done');
    } catch (err) {
      console.error('Report error:', err);
      toast.error('Failed to generate report');
      setPhase('done');
    }
  }, [questions, student, task]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (interviewEndedRef.current) return;
    setIsListening(false);
    
    if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (!answer) {
      startListening();
      return;
    }

    const studentTurn: InterviewTurn = { role: 'student', text: answer, timestamp: new Date().toISOString() };
    const updated = [...turnsRef.current, studentTurn];
    setTurns(updated);
    setCurrentTranscript('');
    setTextAnswer('');

    try {
      const aiText = await aiInterviewService.getAIResponse(updated, questions);
      const aiTurn: InterviewTurn = { role: 'ai', text: aiText, timestamp: new Date().toISOString() };
      const newTurns = [...updated, aiTurn];
      setTurns(newTurns);

      const isEnd = aiText.toLowerCase().includes('that concludes') || aiText.toLowerCase().includes('performance report');
      
      if (useTextFallback) {
        speak(aiText); // Non-blocking in text mode
        if (isEnd) {
          localStorage.removeItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
          endInterview(newTurns);
        } else {
          startListening();
        }
      } else {
        // safety timeout of 12 seconds in voice mode to prevent infinite hang
        await Promise.race([
          speak(aiText),
          new Promise(resolve => setTimeout(resolve, 12000))
        ]);
        if (isEnd) {
          localStorage.removeItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
          endInterview(newTurns);
        } else {
          startListening();
        }
      }
    } catch {
      toast.error('AI Response failed. Please retry.');
      setFailedTurnsState(updated);
    }
  }, [questions, speak, endInterview, student.id, task.id, useTextFallback]);

  const retryAIResponse = async () => {
    if (!failedTurnsState) return;
    setIsRetryingResponse(true);
    try {
      const aiText = await aiInterviewService.getAIResponse(failedTurnsState, questions);
      const aiTurn: InterviewTurn = { role: 'ai', text: aiText, timestamp: new Date().toISOString() };
      const newTurns = [...failedTurnsState, aiTurn];
      setTurns(newTurns);
      setFailedTurnsState(null);
      
      const isEnd = aiText.toLowerCase().includes('that concludes') || aiText.toLowerCase().includes('performance report');
      
      if (useTextFallback) {
        speak(aiText);
        if (isEnd) {
          localStorage.removeItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
          endInterview(newTurns);
        } else {
          startListening();
        }
      } else {
        await Promise.race([
          speak(aiText),
          new Promise(resolve => setTimeout(resolve, 12000))
        ]);
        if (isEnd) {
          localStorage.removeItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
          endInterview(newTurns);
        } else {
          startListening();
        }
      }
    } catch {
      toast.error('Connection issue. Retrying...');
    } finally {
      setIsRetryingResponse(false);
    }
  };

  const startListening = useCallback(() => {
    if (interviewEndedRef.current) return;
    setFailedTurnsState(null);

    // Save progress to LocalStorage
    localStorage.setItem(
      `sar_mock_interview_progress_${student.id}_${task.id}`,
      JSON.stringify({ turns: turnsRef.current, elapsedSeconds })
    );

    if (useTextFallback) {
      setIsListening(true);
      setCurrentTranscript('');
      setTextAnswer('');
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = setTimeout(() => {
        toast.warning("Answer timeout reached. Please type and submit your response.");
      }, 180000);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const isBrave = !!(navigator as any).brave;
    if (!SR || isBrave) {
      setUseTextFallback(true);
      setIsListening(true);
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;
    transcriptBuildRef.current = '';
    lastActiveTimeRef.current = Date.now();

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) transcriptBuildRef.current += final + ' ';
      setCurrentTranscript(transcriptBuildRef.current + interim);
      lastActiveTimeRef.current = Date.now();

      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (transcriptBuildRef.current.trim().length > 0) {
          recognition.stop();
        }
      }, silenceTimeoutSetting * 1000);
    };

    recognition.onend = () => {
      if (interviewEndedRef.current) return;
      const answer = transcriptBuildRef.current.trim();
      submitAnswer(answer);
    };

    recognition.onerror = (e: any) => {
      console.warn("Speech Recognition error:", e);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'network' || e.error === 'audio-capture') {
        setUseTextFallback(true);
      }
      setIsListening(false);
    };

    setIsListening(true);
    try {
      recognition.start();
      
      // Hard timeout (3 minutes)
      if (questionTimeoutRef.current) clearTimeout(questionTimeoutRef.current);
      questionTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          toast.warning("Answer timeout reached (3 minutes). Submitting response.");
          recognitionRef.current.stop();
        }
      }, 180000);
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      setUseTextFallback(true);
    }
  }, [questions, useTextFallback, silenceTimeoutSetting, student.id, task.id, elapsedSeconds, submitAnswer]);

  const startInterview = useCallback(async () => {
    // Resume AudioContext for Safari/iOS
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
    } catch (e) {
      console.warn("AudioContext resume failed:", e);
    }

    setPhase('running');
    const first = questions[0]?.question;
    const intro = `Hello ${student.name}! Welcome to your SAR AI mock interview. I'll be asking you ${questions.length} questions. Please speak clearly.${first ? ` Let's begin! ${first}` : ''}`;
    const introTurn: InterviewTurn = { role: 'ai', text: intro, timestamp: new Date().toISOString() };
    setTurns([introTurn]);
    
    if (useTextFallback) {
      speak(intro);
      if (!interviewEndedRef.current) startListening();
    } else {
      await Promise.race([
        speak(intro),
        new Promise(resolve => setTimeout(resolve, 12000))
      ]);
      if (!interviewEndedRef.current) startListening();
    }
  }, [student.name, questions, speak, startListening, useTextFallback]);

  const clearSessionAndStart = () => {
    localStorage.removeItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
    setResumePrompt(false);
    startInterview();
  };

  const resumeSession = () => {
    const saved = localStorage.getItem(`sar_mock_interview_progress_${student.id}_${task.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTurns(parsed.turns);
        setElapsedSeconds(parsed.elapsedSeconds || 0);
        setPhase('running');
        setResumePrompt(false);
        setTimeout(() => {
          startListening();
        }, 500);
      } catch (e) {}
    }
  };

  const toggleCamera = () => {
    streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOn(v => !v);
  };
  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  // Browser not supported
  if (!browserSupported) {
    return (
      <div className="fixed inset-0 bg-[#0a0f1e] flex items-center justify-center z-50 p-8">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-6" />
          <h2 className="text-white text-2xl font-bold mb-3">Browser Not Supported</h2>
          <p className="text-white/60 mb-6">The AI Mock Interview requires Web Speech API support. Please use <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.</p>
          <button onClick={onBack} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  // Intro screen
  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 bg-[#0a0f1e] flex items-center justify-center z-50 p-8">
        <StarField />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 text-center max-w-2xl w-full">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" /></svg>
          </motion.div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight"><span className="text-cyan-400">SAR</span> AI</h1>
          <p className="text-white/50 text-lg mb-2">Mock Interview Platform</p>
          <h2 className="text-white text-xl font-bold mb-2">{task.title}</h2>
          <p className="text-white/40 mb-8">{questions.length} questions • Estimated 5–15 minutes</p>
          {camError && (
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-2xl p-4 mb-6 text-amber-300 text-sm">
              ⚠️ Camera access denied. You can still proceed using voice only.
            </div>
          )}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-8 text-left space-y-3">
            {['Ensure you are in a quiet environment', 'Speak clearly and at a moderate pace', 'A performance report will be sent to your teacher', 'Use Google Chrome or Edge for best experience'].map((tip, i) => (
              <div key={i} className="flex items-center gap-3 text-white/70 text-sm">
                <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />{tip}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={onBack} className="px-8 py-4 rounded-2xl border border-white/20 text-white/60 font-bold hover:bg-white/5 transition-colors">Go Back</button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={startInterview}
              className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-lg shadow-2xl shadow-blue-500/30">
              Start Interview →
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Generating
  if (phase === 'generating') {
    return (
      <div className="fixed inset-0 bg-[#0a0f1e] flex items-center justify-center z-50">
        <StarField />
        <div className="relative z-10 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-cyan-500 border-t-transparent" />
          <h2 className="text-white text-3xl font-black mb-3">Generating Your Report</h2>
          <p className="text-white/50 text-lg">SAR AI is analyzing your performance...</p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {['Analyzing fluency', 'Scoring responses', 'Writing recommendations'].map((s, i) => (
              <motion.div key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.5 }}
                className="bg-white/10 text-white/60 text-xs px-4 py-2 rounded-full">{s}</motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Done — Report
  if (phase === 'done' && report) {
    return (
      <div className="fixed inset-0 bg-[#0a0f1e] overflow-y-auto z-50">
        <StarField />
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">Interview Complete!</h1>
              <p className="text-white/50 text-lg">{task.title}</p>
              <p className="text-white/30 text-sm mt-1">{student.name} • {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center mb-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-purple-500 leading-none">
                {report.overallScore}
              </motion.div>
              <p className="text-white/40 text-xl font-bold mt-2">Overall Score / 10</p>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-10 bg-white/5 rounded-3xl p-8 border border-white/10">
              <ScoreRing score={report.fluency} label="Fluency" color="#06b6d4" />
              <ScoreRing score={report.confidence} label="Confidence" color="#8b5cf6" />
              <ScoreRing score={report.vocabulary} label="Vocabulary" color="#f59e0b" />
              <ScoreRing score={report.clarity} label="Clarity" color="#10b981" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
              <h3 className="text-cyan-400 font-black text-lg mb-3">✦ AI Summary</h3>
              <p className="text-white/80 leading-relaxed">{report.summary}</p>
            </div>
            <div className="mb-6">
              <h3 className="text-white font-black text-xl mb-4">Question-by-Question Analysis</h3>
              <div className="space-y-4">
                {report.questionAnalysis.map((qa, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-cyan-300 font-bold text-sm flex-1 pr-4">Q{i + 1}: {qa.question}</p>
                      <div className={`text-lg font-black px-4 py-1 rounded-full ${qa.score >= 7 ? 'bg-emerald-500/20 text-emerald-400' : qa.score >= 5 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {qa.score}/10
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 mb-3">
                      <p className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Student Answer</p>
                      <p className="text-white/70 text-sm italic">"{qa.studentAnswer || 'No answer recorded'}"</p>
                    </div>
                    <p className="text-white/60 text-sm">{qa.feedback}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-3xl p-8 mb-8">
              <h3 className="text-purple-300 font-black text-lg mb-4">Recommendations</h3>
              <div className="space-y-3">
                {report.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 text-white/70 text-sm">
                    <span className="text-purple-400 font-black shrink-0">{i + 1}.</span>{rec}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-center">
              <p className="text-white/50 text-sm">📤 Your detailed report has been sent to <span className="text-cyan-400 font-bold">{task.teacherName}</span>.</p>
            </div>
            <button onClick={onBack} className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow">
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }


  if (resumePrompt) {
    return (
      <div className="fixed inset-0 bg-[#0a0f1e] flex items-center justify-center z-50 p-8">
        <StarField />
        <div className="relative z-10 text-center max-w-md w-full bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl">
          <svg className="w-16 h-16 text-cyan-400 mx-auto mb-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h2 className="text-white text-2xl font-bold mb-3">Resume Interview?</h2>
          <p className="text-white/60 mb-8 text-sm">We found an active, incomplete interview session for this activity. Would you like to resume where you left off?</p>
          <div className="flex gap-4 justify-center">
            <button onClick={clearSessionAndStart} className="px-6 py-3 rounded-2xl border border-white/20 text-white/60 font-bold hover:bg-white/5 transition-colors text-xs">Start Over</button>
            <button onClick={resumeSession} className="px-8 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-xs transition-colors shadow-lg shadow-cyan-500/25">Resume Session</button>
          </div>
        </div>
      </div>
    );
  }

  // Main interview UI
  return (
    <div className="fixed inset-0 bg-[#0a0f1e] flex flex-col z-50 select-none overflow-y-auto md:overflow-hidden">
      <StarField />
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#0a0f1e]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-bold text-sm">{formatTime(elapsedSeconds)}</span>
        </div>
        <div className="text-center flex items-center gap-2">
          {useTextFallback && (
            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">Text Mode</span>
          )}
          <span className="text-white/30 text-xs font-bold uppercase tracking-widest">
            {isAiSpeaking ? 'SAR AI Speaking...' : isListening ? 'Listening...' : 'Processing...'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          <button
            onClick={() => endInterview()}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded-full transition-colors text-sm shadow-lg shadow-rose-600/20"
          >
            End Interview
          </button>
        </div>
      </div>

      {/* Settings Dialog Overlay */}
      {showSettings && (
        <div className="absolute top-20 right-8 z-50 w-72 bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
          <h3 className="font-bold text-sm mb-4 border-b border-white/10 pb-2">Silence Detection Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider block mb-2">Silence Timeout ({silenceTimeoutSetting}s)</label>
              <input
                type="range" min="5" max="25" step="5"
                value={silenceTimeoutSetting}
                onChange={e => setSilenceTimeoutSetting(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-[9px] text-white/40 block mt-1">Adjust silence timing threshold.</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
              <span>Text Input Mode</span>
              <input
                type="checkbox"
                checked={useTextFallback}
                onChange={e => setUseTextFallback(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-white/20 accent-cyan-400 cursor-pointer"
              />
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs transition-colors mt-2"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-6 px-6 py-4 min-h-0">
        {/* Left: conversation */}
        <div className="flex-1 flex flex-col min-h-0 bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-xl">
          <motion.h1 className="text-3xl font-black text-center mb-4 tracking-tight"
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity }}>
            <span className="text-white">SAR </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>
          </motion.h1>

          {/* Current Question Caption Block (a11y visible captions) */}
          {turns.length > 0 && (
            <div className="bg-gradient-to-r from-indigo-950/80 to-slate-900/80 border border-cyan-500/10 rounded-3xl p-4 mb-4 relative overflow-hidden shrink-0 shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-2xl" />
              <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Current Spoken Question</p>
              <h3 className="text-white font-medium text-xs leading-relaxed">
                {turns.filter(t => t.role === 'ai').slice(-1)[0]?.text || "Initializing..."}
              </h3>
            </div>
          )}

          <div ref={scrollRef} aria-live="polite" className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2">
            <AnimatePresence initial={false}>
              {turns.map((turn, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`flex items-start gap-3 ${turn.role === 'student' ? 'flex-row-reverse' : ''}`}>
                  {turn.role === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shrink-0 border border-cyan-400/25">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <p className={`text-[10px] font-bold mb-1 ${turn.role === 'ai' ? 'text-cyan-400' : 'text-white/50'}`}>
                      {turn.role === 'ai' ? '✦ SAR AI' : 'You'}
                    </p>
                    <div className={`rounded-2xl px-5 py-3 max-w-xs md:max-w-sm text-xs leading-relaxed ${
                      turn.role === 'ai' ? 'bg-white/5 border border-white/10 text-white' : 'bg-blue-600/80 text-white'
                    }`}>{turn.text}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isListening && currentTranscript && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white" /></div>
                <div>
                  <p className="text-[10px] font-bold text-white/50 mb-1">You (speaking...)</p>
                  <div className="bg-blue-600/40 border border-blue-400/30 rounded-2xl px-5 py-3 max-w-xs md:max-w-sm text-xs text-white/80 italic">{currentTranscript}</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Failed Turns Retry Box */}
          {failedTurnsState && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mt-3 text-center shrink-0">
              <p className="text-rose-400 text-xs font-bold mb-2">Failed to get response from AI. Check connection and retry.</p>
              <button
                onClick={retryAIResponse}
                disabled={isRetryingResponse}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition-colors"
              >
                {isRetryingResponse ? 'Retrying...' : 'Retry Sending Answer'}
              </button>
            </div>
          )}

          {/* Listening State Action Banner */}
          {isListening && !useTextFallback && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 shrink-0">
              <span className="text-[10px] text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Speech capturing active
              </span>
              <button
                onClick={() => {
                  if (transcriptBuildRef.current.trim().length > 0) {
                    recognitionRef.current?.stop();
                  } else {
                    toast.error("Nothing transcribed yet. Speak or switch to Text Mode in settings.");
                  }
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-6 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/25"
              >
                Submit Answer Now
              </button>
            </div>
          )}

          {/* Text input fallback box */}
          {useTextFallback && isListening && (
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-5 mt-4 space-y-3 shrink-0">
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">Type your response below</p>
              <textarea
                className="w-full h-24 p-4 bg-slate-950 border border-white/10 rounded-2xl text-white text-xs outline-none resize-none focus:border-cyan-500 transition-colors"
                placeholder="Type your answer here..."
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
              />
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-cyan-400 font-bold">Text Fallback Mode</span>
                <button
                  onClick={() => {
                    if (textAnswer.trim().length > 0) {
                      submitAnswer(textAnswer.trim());
                    } else {
                      toast.error("Please enter a response before submitting.");
                    }
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black px-6 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Submit Response
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: webcam */}
        <div className="w-full md:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
          <div className="flex-1 rounded-[2.5rem] overflow-hidden border border-white/10 bg-black relative min-h-[220px]">
            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`} />
            {(!isVideoOn || camError) && (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 absolute inset-0">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-white/40" />
                </div>
              </div>
            )}
            <div className="absolute top-3 left-3">
              <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold backdrop-blur-md border ${
                isListening ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30' :
                isAiSpeaking ? 'bg-blue-500/30 text-blue-300 border-blue-400/30' :
                'bg-white/10 text-white/50 border-white/10'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-400 animate-pulse' : isAiSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-white/30'}`} />
                {isListening ? 'Mic Active' : isAiSpeaking ? 'AI Speaking' : 'Standby'}
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-sm font-bold">{student.name}</p>
            <p className="text-white/30 text-xs">{student.rollNo}</p>
          </div>
        </div>
      </div>

      {/* Bottom: waveform + controls */}
      <div className="relative z-10 px-8 pb-6 bg-[#0a0f1e]/80 border-t border-white/5">
        <AudioWaveform mode={isAiSpeaking ? 'ai' : isListening ? 'user' : 'standby'} stream={streamRef.current} onVolumeUpdate={handleVolumeUpdate} />
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-600/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          <button onClick={toggleCamera} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${!isVideoOn ? 'bg-rose-600/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </button>
          <button className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white/60 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
