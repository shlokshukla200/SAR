import { describe, it, expect, vi, beforeEach } from 'vitest';
import { aiInterviewService } from '../aiService';
import { apiService } from '../apiService';

vi.mock('../apiService', () => ({
  apiService: {
    generateAIContent: vi.fn(),
  },
}));

describe('aiInterviewService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInterviewReport', () => {
    it('successfully parses a correct JSON response', async () => {
      const mockReport = {
        overallScore: 8,
        fluency: 8,
        confidence: 9,
        vocabulary: 7,
        clarity: 8,
        summary: "Excellent communication skills shown.",
        questionAnalysis: [
          { question: "Q1", studentAnswer: "A1", score: 8, feedback: "Good" }
        ],
        recommendations: ["Tip 1", "Tip 2"]
      };

      vi.mocked(apiService.generateAIContent).mockResolvedValueOnce({
        text: JSON.stringify(mockReport)
      });

      const report = await aiInterviewService.generateInterviewReport(
        [], [], "John Doe", "student_1", "task_1"
      );

      expect(report.overallScore).toBe(8);
      expect(report.fluency).toBe(8);
      expect(report.summary).toBe("Excellent communication skills shown.");
      expect(report.recommendations).toContain("Tip 1");
    });

    it('recovers from malformed JSON by falling back to safe defaults', async () => {
      // Simulate invalid json responses
      vi.mocked(apiService.generateAIContent).mockRejectedValueOnce(new Error("Network Error"));
      vi.mocked(apiService.generateAIContent).mockRejectedValueOnce(new Error("JSON Parse Error"));

      const report = await aiInterviewService.generateInterviewReport(
        [], [{ id: "q1", question: "Tell me about yourself", category: "Intro" }], "John Doe", "student_1", "task_1"
      );

      // Should fall back to safe defaults instead of throwing
      expect(report.overallScore).toBe(7);
      expect(report.fluency).toBe(7);
      expect(report.summary).toContain("temporary network lag");
      expect(report.questionAnalysis[0].question).toBe("Tell me about yourself");
    });
  });
});
