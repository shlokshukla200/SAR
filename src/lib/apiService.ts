import { Student, BatchConfig, AuditLogEntry, Teacher, Task, Submission } from '../types';

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('sar_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  options.headers = headers;

  const res = await fetch(url, options);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP error ${res.status}`);
  }
  return res.json();
};

export const apiService = {
  async login(credentials: { username: string; password: string; isAdminLogin?: boolean }) {
    const res = await apiFetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res;
  },
  
  async generateAIContent(payload: { model?: string, contents: any, config?: any }) {
    const res = await apiFetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res;
  },

  // Batch Config
  async saveBatchConfig(config: BatchConfig) {
    await apiFetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
  },

  async getBatchConfig(batchId: string): Promise<BatchConfig | null> {
    return apiFetch(`/api/batches/${batchId}`);
  },

  async deleteBatch(batchId: string) {
    await apiFetch(`/api/batches/${batchId}`, {
      method: 'DELETE'
    });
  },

  // Students
  async checkStudent(searchId: string): Promise<{ found: boolean, student?: any }> {
    const res = await apiFetch(`/api/check-student?searchId=${encodeURIComponent(searchId)}`);
    return res;
  },

  async activateStudent(payload: { id: string, username: string, password: string }) {
    const res = await apiFetch('/api/activate-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res;
  },

  async saveStudents(students: Student[]) {
    await apiFetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students })
    });
  },

  async getStudentsByTeacher(teacherId: string): Promise<Student[]> {
    const res = await apiFetch(`/api/students?teacherId=${encodeURIComponent(teacherId)}`);
    return res.students || [];
  },

  async getAllStudents(): Promise<Student[]> {
    const res = await apiFetch('/api/students');
    return res.students || [];
  },

  // Audit Logs
  async addAuditLog(log: Omit<AuditLogEntry, 'id'>) {
    await apiFetch('/api/auditLogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await apiFetch('/api/auditLogs');
    return res.logs || [];
  },

  // Teachers API
  async saveTeacher(teacher: Teacher) {
    await apiFetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacher)
    });
  },

  async deleteTeacher(teacherId: string) {
    await apiFetch(`/api/teachers/${teacherId}`, {
      method: 'DELETE'
    });
  },

  async getAllTeachers(): Promise<Teacher[]> {
    const res = await apiFetch('/api/teachers');
    return res.teachers || [];
  },

  // Batches API
  async getAllBatches(): Promise<BatchConfig[]> {
    const res = await apiFetch('/api/batches');
    return res.batches || [];
  },

  // Tasks API
  async saveTask(task: Task) {
    await apiFetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
  },

  async deleteTask(taskId: string) {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });
  },

  async getTasksByBatch(batchId: string): Promise<Task[]> {
    const res = await apiFetch(`/api/tasks?batchId=${encodeURIComponent(batchId)}`);
    const tasks = res.tasks || [];
    return tasks.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // Submissions API
  async saveSubmission(submission: Submission) {
    await apiFetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
  },

  async getSubmissionsByTask(taskId: string): Promise<Submission[]> {
    const res = await apiFetch(`/api/submissions?taskId=${encodeURIComponent(taskId)}`);
    return res.submissions || [];
  },

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    const res = await apiFetch(`/api/submissions?studentId=${encodeURIComponent(studentId)}`);
    return res.submissions || [];
  },

  async getSubmissionsByTeacher(teacherId: string): Promise<Submission[]> {
    const res = await apiFetch(`/api/submissions?teacherId=${encodeURIComponent(teacherId)}`);
    return res.submissions || [];
  },

  async gradeSubmission(submissionId: string, score: number) {
    await apiFetch(`/api/submissions/${submissionId}/grade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score })
    });
  },

  async deleteSubmission(submissionId: string) {
    await apiFetch(`/api/submissions/${submissionId}`, {
      method: 'DELETE'
    });
  },

  // Messaging API
  async sendMessage(messageData: { senderId: string; senderName: string; text: string; recipientArray: string[] }) {
    if (!messageData.recipientArray || messageData.recipientArray.length === 0) {
      console.error('Message Error: recipientArray is empty');
      return;
    }
    const res = await apiFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    return res.id;
  },

  async markMessageAsRead(messageId: string, userId: string) {
    await apiFetch(`/api/messages/${messageId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  async getMessagesForUser(userId: string, role: string, batchId?: string): Promise<import('../types').Message[]> {
    const res = await apiFetch('/api/messages');
    const allMessages = res.messages || [];
    
    return allMessages.filter((msg: any) => {
      if (msg.recipientArray && msg.recipientArray.includes(userId)) return true;
      if (msg.recipientType === 'All Teachers' && role !== 'student') return true;
      if (msg.recipientType === 'All Students' && role === 'student') return true;
      if (msg.recipientType === 'Batch' && batchId && msg.batchId === batchId) return true;
      if (msg.senderId === userId) return true;
      return false;
    }).sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }
};
