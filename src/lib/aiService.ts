/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "@google/genai";
import { AssignmentContent, InterviewQuestion, InterviewReport, InterviewTurn, MockTestBlueprint, MockTestContent, Question, QuestionType } from "../types";
import { apiService } from "./apiService";

export const aiAcademicService = {
  async generateQuestions(
    params: {
      topic: string;
      subject: string;
      year?: string;
      difficulty?: string;
      structure: { sectionName?: string; type: QuestionType; marks: number; count: number }[];
      sourceContent?: string;
      isAssignment?: boolean;
    }
  ): Promise<Question[]> {
    const { topic, subject, year, difficulty, structure, sourceContent, isAssignment } = params;
    
    const structureDesc = structure.map(s => `[Section: ${s.sectionName || s.type}] ${s.count} ${s.type} questions (${s.marks} marks each)`).join('\n');
    
    const sourceContext = sourceContent 
      ? `BASED ONLY ON THE FOLLOWING CONTENT:
        ---
        ${sourceContent}
        ---`
      : "use your broad academic knowledge base.";

    const prompt = `Act as an expert academic examiner. Generate a set of high-quality questions for a ${isAssignment ? 'Student Assignment (Objective MCQ focus)' : 'Formal Mock Test (Subjective & Professional emphasis)'}.

    Context:
    Subject: ${subject}
    Topic: ${topic}
    ${year ? `Academic Year: ${year}` : ''}
    ${difficulty ? `Difficulty Level: ${difficulty}` : ''}
    
    Target Structure:
    ${structureDesc}
    
    Data Source: ${sourceContext}
    
    Important Constraints:
    1. For MCQ (Multiple Choice): Provide 4 distinct options and the correctKey (index 0-3).
    2. For Short Answer: Provide a professional sampleAnswer for the teacher's reference (max 150 words).
    3. For Coding: Provide a clear problem statement, constraints, and a complete sampleAnswer containing the reference solution code.
    4. Metadata: Each question MUST include the 'sectionName' provided in the structure description.
    5. Uniqueness: Each question must have a unique 'id' string.
    6. Quality: Questions should be challenging and directly relevant to the topic.`;

    const itemRequired = ["id", "type", "question", "marks", "sectionName"];
    if (structure.some(s => s.type === 'MCQ')) {
      itemRequired.push("options", "correctKey");
    }
    if (structure.some(s => s.type === 'Short Answer' || s.type === 'Coding')) {
      itemRequired.push("sampleAnswer");
    }

    const response = await apiService.generateAIContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["MCQ", "Short Answer", "Coding"] },
                  sectionName: { type: Type.STRING },
                  question: { type: Type.STRING },
                  marks: { type: Type.NUMBER },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  correctKey: { type: Type.NUMBER },
                  sampleAnswer: { type: Type.STRING }
                },
                required: itemRequired
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    try {
      const data = JSON.parse(response.text);
      const qs = Array.isArray(data.questions) ? data.questions : [];
      const validated = qs.map((q: any) => {
        if (q.type === 'MCQ') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 4) {
            const opts = Array.isArray(q.options) ? [...q.options] : [];
            while (opts.length < 4) {
              opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
            }
            q.options = opts.slice(0, 4);
          }
          if (typeof q.correctKey !== 'number' || q.correctKey < 0 || q.correctKey > 3) {
            q.correctKey = 0;
          }
        } else {
          if (!q.sampleAnswer) {
            q.sampleAnswer = "Sample solution not provided by examiner.";
          }
        }
        return q;
      });
      return validated;
    } catch (err) {
      console.error("AI Generation Error:", response.text);
      throw new Error("AI failed to generate a valid test structure. Please try again.");
    }
  },

  async generateAssignment(topic: string, subject: string, count: number = 10, source?: string): Promise<AssignmentContent> {
    const questions = await this.generateQuestions({
      topic,
      subject,
      structure: [{ sectionName: 'Objective', type: 'MCQ', marks: 1, count }],
      isAssignment: true,
      sourceContent: source
    });
    return { subject, topic, questions };
  },

  async generateMockTest(blueprint: MockTestBlueprint, source?: string): Promise<MockTestContent> {
    const questions = await this.generateQuestions({
       topic: blueprint.topic,
       subject: blueprint.subject,
       year: blueprint.year,
       difficulty: blueprint.difficulty,
       structure: blueprint.structure,
       sourceContent: source
    });
    const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
    return { blueprint, questions, totalMarks };
  }
};

export const aiInterviewService = {
  async generateInterviewQuestions(domain: string, category: string, count: number): Promise<InterviewQuestion[]> {
    const prompt = `Generate ${count} mock interview questions for engineering students for a placement drive. Domain: ${domain}. Focus on ${category} type questions. Return a JSON array where each item has: id (unique string), question (the interview question text), category (one of: Introduction, Technical, Behavioral, Situational, Custom).`;

    const res = await apiService.generateAIContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ['id', 'question', 'category']
          }
        }
      }
    });
    return JSON.parse(res.text);
  },

  async getAIResponse(conversationHistory: InterviewTurn[], questions: InterviewQuestion[]): Promise<string> {
    const questionList = questions.map((q, i) => `${i + 1}. ${q.question}`).join('\n');
    const systemInstruction = `You are SAR AI, a professional and friendly mock interviewer for engineering college students preparing for campus placements. Your task is to conduct a structured mock interview.

The interview questions are:
${questionList}

Instructions:
- Ask one question at a time in the exact order given.
- If the student's answer seems incomplete, short, or if they seem to be thinking out loud, politely prompt them to expand or continue (e.g., "Take your time," or "Could you elaborate on that?").
- Only move to the next question when the student has provided a complete answer or indicates they are done with the current question.
- After a complete answer, give ONE brief positive acknowledgment (max 15 words), then immediately ask the next question.
- Do NOT repeat the question number. Just ask the question naturally.
- When all questions are done, say: "That concludes our interview today. Thank you for your time and effort. I will now generate your performance report. Please wait a moment."
- Keep your tone warm, professional, and encouraging at all times.
- NEVER ask questions outside the provided list.`;

    const messages = conversationHistory.map(t => ({
      role: t.role === 'ai' ? 'model' : 'user',
      parts: [{ text: t.text }]
    }));

    const res = await apiService.generateAIContent({
      contents: messages,
      config: { systemInstruction }
    });
    return res.text;
  },

  async generateInterviewReport(
    turns: InterviewTurn[],
    questions: InterviewQuestion[],
    studentName: string,
    studentId: string,
    taskId: string
  ): Promise<InterviewReport> {
    const transcript = turns.map(t => `${t.role === 'ai' ? 'SAR AI' : studentName}: ${t.text}`).join('\n');
    const questionList = questions.map(q => q.question).join('\n');

    const prompt = `You are an expert HR analyst and career coach evaluating a mock interview transcript for an engineering student.

Student Name: ${studentName}
Interview Questions Asked:
${questionList}

Full Transcript:
${transcript}

Analyze the student's performance and return a JSON report with the following structure:
- overallScore: number 1-10
- fluency: number 1-10 (how smoothly they spoke, fillers like umm/uh, flow)
- confidence: number 1-10 (assertiveness, tone, conviction)
- vocabulary: number 1-10 (word choice, professional language)
- clarity: number 1-10 (how well they structured and communicated answers)
- summary: string (3-4 sentence overall narrative summary)
- questionAnalysis: array of { question: string, studentAnswer: string, score: number 1-10, feedback: string }
- recommendations: array of 3-5 specific, actionable improvement tips as strings

Be honest but constructive. Base everything strictly on the transcript content.`;

    const res = await apiService.generateAIContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            fluency: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            vocabulary: { type: Type.NUMBER },
            clarity: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            questionAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  studentAnswer: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  feedback: { type: Type.STRING }
                },
                required: ['question', 'studentAnswer', 'score', 'feedback']
              }
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['overallScore', 'fluency', 'confidence', 'vocabulary', 'clarity', 'summary', 'questionAnalysis', 'recommendations']
        }
      }
    });

    const parsed = JSON.parse(res.text);
    return {
      ...parsed,
      studentId,
      studentName,
      taskId,
      turns,
      completedAt: new Date().toISOString()
    };
  }
};
