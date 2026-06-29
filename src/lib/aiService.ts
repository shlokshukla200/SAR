/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type } from "@google/genai";
import { AssignmentContent, MockTestBlueprint, MockTestContent, Question, QuestionType } from "../types";
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
