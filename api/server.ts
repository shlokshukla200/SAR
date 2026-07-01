import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PostgreSQL client
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined in your environment.");
}

const { Pool } = pg;
const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 1
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

function mapStudent(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username || null,
    isActivated: !!row.is_activated,
    isRegistered: !!row.is_registered,
    name: row.name,
    rollNo: row.roll_no,
    batch: row.batch,
    branch: row.branch,
    photo: row.photo || null,
    collegeId: row.college_id || null,
    section: row.section || null,
    year: row.year || null,
    preAnalysis: {
      communication: row.pre_analysis?.communication || 0,
      technical: row.pre_analysis?.technical || 0,
      logic: row.pre_analysis?.logic || 0,
      confidence: row.pre_analysis?.confidence || 0
    },
    postAnalysis: {
      communication: row.post_analysis?.communication || 0,
      technical: row.post_analysis?.technical || 0,
      logic: row.post_analysis?.logic || 0,
      confidence: row.post_analysis?.confidence || 0
    },
    workshopScores: Array.isArray(row.workshop_scores) ? row.workshop_scores : [],
    teacherId: row.teacher_id || null,
    personalDetails: {
      phone: row.personal_details?.phone || '',
      erpId: row.personal_details?.erpId || '',
      emailSkit: row.personal_details?.emailSkit || '',
      emailOther: row.personal_details?.emailOther || '',
      fatherName: row.personal_details?.fatherName || '',
      fatherContact: row.personal_details?.fatherContact || '',
      motherName: row.personal_details?.motherName || '',
      motherContact: row.personal_details?.motherContact || '',
      address: row.personal_details?.address || '',
      dob: row.personal_details?.dob || '',
      gender: row.personal_details?.gender || 'Male'
    },
    academicDetails: {
      tenthPercentage: row.academic_details?.tenthPercentage || 0,
      twelfthPercentage: row.academic_details?.twelfthPercentage || 0,
      semesterGrades: row.academic_details?.semesterGrades || {
        "I Sem": 0,
        "II Sem": 0,
        "III Sem": 0,
        "IV Sem": 0
      },
      currentCGPA: row.academic_details?.currentCGPA || 0,
      backlogs: row.academic_details?.backlogs || 0,
      skills: Array.isArray(row.academic_details?.skills) ? row.academic_details.skills : []
    },
    allotedActivities: Array.isArray(row.alloted_activities) ? row.alloted_activities : [],
    upcomingSessions: Array.isArray(row.upcoming_sessions) ? row.upcoming_sessions : []
  };
}

function mapTeacher(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    employeeId: row.employee_id,
    username: row.username,
    name: row.name,
    role: row.role,
    department: row.department,
    contactNo: row.contact_no,
    emailId: row.email_id,
    photo: row.photo,
    batch: row.batch,
    assignedBatches: row.assigned_batches,
    performanceDetails: row.performance_details,
    password: row.password
  };
}

function mapBatch(row: any) {
  if (!row) return null;
  return {
    batchId: row.batch_id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    isSetupComplete: row.is_setup_complete,
    studentCount: row.student_count,
    updatedAt: row.updated_at,
    status: row.status,
    description: row.description
  };
}

function mapTask(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    batchId: row.batch_id,
    dueDate: row.due_date,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    content: row.content,
    randomize: row.randomize,
    timeLimit: row.time_limit,
    gradingMode: row.grading_mode
  };
}

function mapSubmission(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    taskId: row.task_id,
    studentId: row.student_id,
    studentName: row.student_name,
    batchId: row.batch_id,
    type: row.type,
    submittedAt: row.submitted_at,
    status: row.status,
    score: row.score,
    totalMarks: row.total_marks,
    answers: row.answers,
    attachmentUrl: row.attachment_url,
    teacherId: row.teacher_id,
    submissionReason: row.submission_reason,
    interviewReport: row.interview_report || null
  };
}

function mapMessage(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    recipientArray: row.recipient_array,
    recipientType: row.recipient_type,
    batchId: row.batch_id,
    text: row.text,
    timestamp: row.timestamp,
    priority: row.priority,
    category: row.category,
    readBy: row.read_by
  };
}

// Database schema initialization
async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is missing.");
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("WARNING: ADMIN_PASSWORD environment variable is missing! The admin account might be locked out. Please configure it in Vercel.");
  }
  console.log("Checking and initializing database migrations...");
  try {
    const client = await pool.connect();
    try {
      // 1. Create migration tracker table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS database_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Define migrations
      const migrations = [
        {
          name: "001_initial_schema",
          run: async () => {
            // Create teachers table
            await client.query(`
              CREATE TABLE IF NOT EXISTS teachers (
                id TEXT PRIMARY KEY,
                employee_id TEXT,
                username VARCHAR(100) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name VARCHAR(150) NOT NULL,
                role VARCHAR(50) DEFAULT 'Teacher',
                department TEXT,
                contact_no TEXT,
                email_id TEXT,
                photo TEXT,
                batch TEXT,
                assigned_batches JSONB DEFAULT '[]'::jsonb,
                performance_details JSONB DEFAULT '{}'::jsonb,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create students table
            await client.query(`
              CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                username VARCHAR(100) UNIQUE,
                password TEXT,
                is_activated BOOLEAN DEFAULT FALSE,
                is_registered BOOLEAN DEFAULT FALSE,
                name VARCHAR(150) NOT NULL,
                roll_no VARCHAR(100) UNIQUE NOT NULL,
                batch VARCHAR(100) NOT NULL,
                branch VARCHAR(100) NOT NULL,
                photo TEXT,
                college_id TEXT,
                section TEXT,
                year TEXT,
                pre_analysis JSONB DEFAULT '{}'::jsonb,
                post_analysis JSONB DEFAULT '{}'::jsonb,
                workshop_scores JSONB DEFAULT '[]'::jsonb,
                teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
                personal_details JSONB DEFAULT '{}'::jsonb,
                academic_details JSONB DEFAULT '{}'::jsonb,
                alloted_activities JSONB DEFAULT '[]'::jsonb,
                upcoming_sessions JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create batches table
            await client.query(`
              CREATE TABLE IF NOT EXISTS batches (
                batch_id TEXT PRIMARY KEY,
                teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
                teacher_name TEXT,
                is_setup_complete BOOLEAN DEFAULT FALSE,
                student_count INTEGER DEFAULT 0,
                updated_at TEXT,
                status TEXT,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create tasks table
            await client.query(`
              CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
                teacher_name TEXT,
                batch_id TEXT,
                due_date TEXT,
                description TEXT,
                status TEXT DEFAULT 'Active',
                created_at TEXT,
                content JSONB DEFAULT '{}'::jsonb,
                randomize BOOLEAN DEFAULT FALSE,
                time_limit INTEGER,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create submissions table
            await client.query(`
              CREATE TABLE IF NOT EXISTS submissions (
                id TEXT PRIMARY KEY,
                task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
                student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
                student_name TEXT,
                batch_id TEXT,
                type TEXT,
                submitted_at TEXT,
                status TEXT,
                score REAL,
                total_marks INTEGER,
                answers JSONB DEFAULT '[]'::jsonb,
                attachment_url TEXT,
                teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create audit logs
            await client.query(`
              CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                action TEXT,
                performed_by TEXT,
                timestamp TEXT,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create messages table
            await client.query(`
              CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT,
                sender_name TEXT,
                sender_role TEXT,
                recipient_array JSONB DEFAULT '[]'::jsonb,
                recipient_type TEXT,
                batch_id TEXT,
                text TEXT,
                timestamp TEXT,
                priority TEXT,
                category TEXT,
                read_by JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT TRUE
              );
            `);
            // Create indexes
            await client.query("CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);");
            await client.query("CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);");
            await client.query("CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);");
            await client.query("CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch);");
            await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_batch_id ON tasks(batch_id);");
            await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);");
            await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);");
          }
        },
        {
          name: "002_add_grading_mode_and_interview_columns",
          run: async () => {
            await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS grading_mode TEXT DEFAULT 'Auto-Evaluated';`);
            await client.query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_reason TEXT DEFAULT 'Normal Submission';`);
            await client.query(`ALTER TABLE submissions ADD COLUMN IF NOT EXISTS interview_report JSONB DEFAULT NULL;`);
          }
        },
        {
          name: "003_add_ai_usage_logs",
          run: async () => {
            await client.query(`
              CREATE TABLE IF NOT EXISTS ai_usage_logs (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                endpoint TEXT,
                prompt_tokens INTEGER,
                completion_tokens INTEGER,
                total_tokens INTEGER,
                cost_estimate REAL,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
              );
            `);
          }
        }
      ];

      // 3. Execute migrations in sequence
      for (const migration of migrations) {
        const check = await client.query("SELECT 1 FROM database_migrations WHERE name = $1", [migration.name]);
        if (check.rows.length === 0) {
          console.log(`Running migration: ${migration.name}`);
          await client.query("BEGIN;");
          try {
            await migration.run();
            await client.query("INSERT INTO database_migrations (name) VALUES ($1)", [migration.name]);
            await client.query("COMMIT;");
            console.log(`Migration completed: ${migration.name}`);
          } catch (err) {
            await client.query("ROLLBACK;");
            console.error(`Migration failed: ${migration.name}`, err);
            throw err;
          }
        }
      }

      // Seed the default system administrator if it does not exist
      const adminPassword = process.env.ADMIN_PASSWORD || 'password@admin';
      await client.query(`
        INSERT INTO teachers (id, employee_id, username, password, name, role, department, contact_no, email_id, batch, assigned_batches, performance_details)
        VALUES ('admin', 'ADM-001', 'admin', $1, 'Admin', 'Admin', '', '', '', 'All', '[]'::jsonb, '{}'::jsonb)
        ON CONFLICT (username) DO NOTHING;
      `, [adminPassword]);

      console.log("Database initialized successfully!");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("FATAL: Failed to initialize database:", error);
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const dbReady = initializeDatabase().catch(err => console.error('DB init failed:', err));

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (error: any) {
    console.error("Database initialization failed:", error);
    res.status(500).json({ error: "Database initialization failed: " + error.message });
  }
});

app.use(express.json({ limit: '50mb' }));

  // Secure Login endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password, isAdminLogin, role } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      let user: any = null;
      let matchedRole: string = '';

      if (isAdminLogin || role === 'admin' || role === 'staff' || role === 'college') {
        const result = await pool.query("SELECT * FROM teachers WHERE username = $1 AND is_active = TRUE", [username]);
        if (result.rows.length > 0 && result.rows[0].password === password) {
          const row = result.rows[0];
          matchedRole = row.role.toLowerCase();
          if (matchedRole === 'teacher') matchedRole = 'staff';
          user = mapTeacher(row);
        } else {
          return res.status(401).json({ error: "Invalid credentials for College/Teacher portal" });
        }
      } else if (role === 'student') {
        const studentResult = await pool.query(
          "SELECT * FROM students WHERE (username = $1 OR roll_no = $1) AND is_activated = TRUE AND is_registered = TRUE AND is_active = TRUE", 
          [username]
        );
        if (studentResult.rows.length > 0 && studentResult.rows[0].password === password) {
          matchedRole = 'student';
          user = mapStudent(studentResult.rows[0]);
        } else {
          return res.status(401).json({ error: "Invalid credentials for Student portal" });
        }
      } else {
        // Fallback behavior if role is not passed (though our UI now passes it)
        const teacherResult = await pool.query("SELECT * FROM teachers WHERE username = $1 AND is_active = TRUE", [username]);
        if (teacherResult.rows.length > 0 && teacherResult.rows[0].password === password) {
          const row = teacherResult.rows[0];
          matchedRole = row.role.toLowerCase();
          if (matchedRole === 'teacher') matchedRole = 'staff';
          user = mapTeacher(row);
        } else {
          const studentResult = await pool.query(
            "SELECT * FROM students WHERE (username = $1 OR roll_no = $1) AND is_activated = TRUE AND is_registered = TRUE AND is_active = TRUE", 
            [username]
          );
          if (studentResult.rows.length > 0 && studentResult.rows[0].password === password) {
            matchedRole = 'student';
            user = mapStudent(studentResult.rows[0]);
          }
        }
      }

      if (user) {
        const token = Buffer.from(JSON.stringify({ id: user.id, role: matchedRole, exp: Date.now() + 86400000 })).toString('base64');
        return res.json({ success: true, role: matchedRole, user, token });
      }

      return res.status(401).json({ error: 'Invalid credentials' });
    } catch (error: any) {
      console.error("Login API Error:", error);
      res.status(500).json({ error: "Internal server error during login" });
    }
  });

  // Health check / database status check
  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1;");
      res.json({
        status: "ok",
        databaseConnected: true,
        databaseType: "PostgreSQL"
      });
    } catch (error: any) {
      const dbUrl = process.env.DATABASE_URL || "";
      let parsedHost = "";
      try {
        if (dbUrl) {
          const match = dbUrl.match(/@([^:\/]+)/);
          parsedHost = match ? match[1] : "not_found";
        }
      } catch (e) {}
      res.status(500).json({
        error: error.message,
        details: "Check database connection parameters",
        parsedHost
      });
    }
  });
  // Student activation endpoints (public)
  app.get("/api/check-student", async (req, res) => {
    try {
      const { searchId } = req.query;
      if (!searchId || typeof searchId !== 'string') return res.json({ found: false });
      const queryId = searchId.trim().toLowerCase();
      
      const result = await pool.query(
        "SELECT id, name, college_id, roll_no, is_activated, batch FROM students WHERE LOWER(college_id) = $1 OR LOWER(roll_no) = $1",
        [queryId]
      );
      
      if (result.rows.length === 0) {
        return res.json({ found: false });
      }
      
      const row = result.rows[0];
      res.json({ 
        found: true, 
        student: {
          id: row.id,
          name: row.name,
          collegeId: row.college_id,
          rollNo: row.roll_no,
          isActivated: row.is_activated,
          batch: row.batch
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/activate-student", async (req, res) => {
    try {
      const { id, username, password } = req.body;
      if (!id || !username || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await pool.query(
        "UPDATE students SET username = $1, password = $2, is_activated = TRUE, is_registered = TRUE WHERE id = $3 RETURNING *",
        [username, password, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Student not found" });
      }

      const user = mapStudent(result.rows[0]);
      const token = Buffer.from(JSON.stringify({ 
        id: user.id, 
        role: 'student', 
        exp: Date.now() + 86400000 
      })).toString('base64');

      res.json({ success: true, token, user });
    } catch (e: any) {
      console.error("Activation error:", e);
      res.status(500).json({ error: e.message });
    }
  });
  // Simple JWT-like Session Middleware
  const verifyToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      if (decoded.exp && decoded.exp < Date.now()) {
        return res.status(401).json({ error: "Token expired" });
      }
      req.user = decoded;
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid token format" });
    }
  };

  app.use(verifyToken);

  // Prompt injection sanitizer
  function sanitizeTranscript(text: string): string {
    if (typeof text !== 'string') return text;
    const jailbreakPhrases = [
      /ignore previous instructions/gi,
      /ignore all previous instructions/gi,
      /system override/gi,
      /you are now a/gi,
      /developer mode/gi,
      /ignore prompt/gi,
      /new instructions/gi
    ];
    let sanitized = text;
    for (const regex of jailbreakPhrases) {
      sanitized = sanitized.replace(regex, "[Redacted Command]");
    }
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000) + "... [Truncated]";
    }
    return sanitized;
  }

  // Request Queue for Gemini Concurrency
  class RequestQueue {
    private activeCount = 0;
    private maxConcurrency = 5;
    private queue: (() => void)[] = [];

    async run<T>(fn: () => Promise<T>): Promise<T> {
      if (this.activeCount >= this.maxConcurrency) {
        await new Promise<void>(resolve => this.queue.push(resolve));
      }
      this.activeCount++;
      try {
        return await fn();
      } finally {
        this.activeCount--;
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          if (next) next();
        }
      }
    }
  }
  const aiQueue = new RequestQueue();

  // Gemini Cache
  const promptCache = new Map<string, { text: string; expiresAt: number }>();

  // In-Memory Rate Limiting
  const rateLimits = new Map<string, { count: number; resetAt: number }>();
  function aiRateLimitMiddleware(req: any, res: any, next: any) {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const limitWindowMs = 60 * 1000;
    const maxRequests = 15;

    const limit = rateLimits.get(userId);
    if (!limit || now > limit.resetAt) {
      rateLimits.set(userId, { count: 1, resetAt: now + limitWindowMs });
      return next();
    }

    if (limit.count >= maxRequests) {
      return res.status(429).json({ error: "Too many AI requests. Please wait a minute and try again." });
    }

    limit.count++;
    next();
  }

  // Secure AI Proxy endpoint
  app.post("/api/ai/generate", aiRateLimitMiddleware, async (req: any, res: any) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server." });
      }

      const { model, contents, config } = req.body;

      // Sanitize user inputs to prevent prompt injection
      let sanitizedContents = contents;
      if (Array.isArray(contents)) {
        sanitizedContents = contents.map((msg: any) => {
          if (msg.role === 'user' && Array.isArray(msg.parts)) {
            return {
              ...msg,
              parts: msg.parts.map((p: any) => {
                if (p.text) {
                  return { ...p, text: sanitizeTranscript(p.text) };
                }
                return p;
              })
            };
          }
          return msg;
        });
      }

      // Check Cache for question generation
      const promptString = typeof sanitizedContents === 'string' ? sanitizedContents : JSON.stringify(sanitizedContents);
      const isQuestionGen = promptString.includes("Generate") && promptString.includes("mock interview questions");

      if (isQuestionGen) {
        const cached = promptCache.get(promptString);
        if (cached && cached.expiresAt > Date.now()) {
          console.log("Serving mock interview questions from cache");
          return res.json({ text: cached.text, cached: true });
        }
      }

      // Run through Concurrency Queue
      const responseText = await aiQueue.run(async () => {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: model || "gemini-3-flash-preview",
          contents: sanitizedContents,
          config
        });

        // Log usage metadata (and console)
        const usage = (response as any).usageMetadata || {};
        const promptTokens = usage.promptTokenCount || 0;
        const completionTokens = usage.candidatesTokenCount || 0;
        const totalTokens = usage.totalTokenCount || 0;
        const costEstimate = (promptTokens * 0.075 + completionTokens * 0.3) / 1000000;

        try {
          await pool.query(`
            INSERT INTO ai_usage_logs (user_id, endpoint, prompt_tokens, completion_tokens, total_tokens, cost_estimate)
            VALUES ($1, '/api/ai/generate', $2, $3, $4, $5)
          `, [req.user?.id || 'anonymous', promptTokens, completionTokens, totalTokens, costEstimate]);
        } catch (dbErr) {
          console.error("Failed to log AI usage to DB:", dbErr);
        }

        return response.text;
      });

      // Save to Cache if it was a question generation
      if (isQuestionGen && responseText) {
        promptCache.set(promptString, { text: responseText, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
  });



  // Students endpoint: save (create or update) students
  app.post("/api/students", async (req, res) => {
    const client = await pool.connect();
    try {
      const { students } = req.body;
      if (!Array.isArray(students)) {
        return res.status(400).json({ error: "students field must be an array" });
      }

      await client.query("BEGIN;");
      for (const s of students) {
        await client.query(`
          INSERT INTO students (
            id, username, password, is_activated, is_registered, name, roll_no, batch, branch, 
            photo, college_id, section, year, pre_analysis, post_analysis, workshop_scores, 
            teacher_id, personal_details, academic_details, alloted_activities, upcoming_sessions
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 
            $14::jsonb, $15::jsonb, $16::jsonb, $17, $18::jsonb, $19::jsonb, $20::jsonb, $21::jsonb
          ) ON CONFLICT (id) DO UPDATE SET
            username = COALESCE(EXCLUDED.username, students.username),
            password = COALESCE(EXCLUDED.password, students.password),
            is_activated = EXCLUDED.is_activated,
            is_registered = EXCLUDED.is_registered,
            name = EXCLUDED.name,
            roll_no = EXCLUDED.roll_no,
            batch = EXCLUDED.batch,
            branch = EXCLUDED.branch,
            photo = COALESCE(EXCLUDED.photo, students.photo),
            college_id = COALESCE(EXCLUDED.college_id, students.college_id),
            section = COALESCE(EXCLUDED.section, students.section),
            year = COALESCE(EXCLUDED.year, students.year),
            pre_analysis = EXCLUDED.pre_analysis,
            post_analysis = EXCLUDED.post_analysis,
            workshop_scores = EXCLUDED.workshop_scores,
            teacher_id = COALESCE(EXCLUDED.teacher_id, students.teacher_id),
            personal_details = EXCLUDED.personal_details,
            academic_details = EXCLUDED.academic_details,
            alloted_activities = EXCLUDED.alloted_activities,
            upcoming_sessions = EXCLUDED.upcoming_sessions,
            is_active = TRUE;
        `, [
          s.id, s.username || null, s.password || null, s.isActivated || false, s.isRegistered || false, s.name, s.rollNo, s.batch, s.branch,
          s.photo || null, s.collegeId || null, s.section || null, s.year || null,
          JSON.stringify(s.preAnalysis || {}), JSON.stringify(s.postAnalysis || {}), JSON.stringify(s.workshopScores || []),
          s.teacherId === 'None' ? null : (s.teacherId || null), JSON.stringify(s.personalDetails || {}), JSON.stringify(s.academicDetails || {}),
          JSON.stringify(s.allotedActivities || []), JSON.stringify(s.upcomingSessions || [])
        ]);
      }
      await client.query("COMMIT;");
      res.json({ success: true });
    } catch (error: any) {
      await client.query("ROLLBACK;");
      console.error("Server API Error (students POST):", error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  });

  // Students endpoint: fetch students (all or by teacherId)
  app.get("/api/students", async (req, res) => {
    try {
      const { teacherId } = req.query;
      let queryText = "SELECT * FROM students WHERE is_active = TRUE";
      const params: any[] = [];

      if (teacherId) {
        queryText += " AND teacher_id = $1";
        params.push(teacherId);
      }
      queryText += " ORDER BY roll_no ASC";

      const result = await pool.query(queryText, params);
      const mappedStudents = result.rows.map(mapStudent);
      res.json({ students: mappedStudents });
    } catch (error: any) {
      console.error("Server API Error (students GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batches endpoint: save (create or update) batch configuration
  app.post("/api/batches", async (req, res) => {
    try {
      const config = req.body;
      if (!config.batchId) {
        return res.status(400).json({ error: "batchId is required" });
      }

      await pool.query(`
        INSERT INTO batches (
          batch_id, teacher_id, teacher_name, is_setup_complete, student_count, updated_at, status, description, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
        ON CONFLICT (batch_id) DO UPDATE SET
          teacher_id = EXCLUDED.teacher_id,
          teacher_name = EXCLUDED.teacher_name,
          is_setup_complete = EXCLUDED.is_setup_complete,
          student_count = EXCLUDED.student_count,
          updated_at = EXCLUDED.updated_at,
          status = EXCLUDED.status,
          description = EXCLUDED.description,
          is_active = TRUE;
      `, [
        config.batchId, config.teacherId === 'None' ? null : (config.teacherId || null), config.teacherName || null, config.isSetupComplete || false,
        config.studentCount || 0, new Date().toISOString(), config.status || null, config.description || null
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (batches POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batches endpoint: list all active batches
  app.get("/api/batches", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM batches WHERE is_active = TRUE ORDER BY batch_id ASC");
      const mappedBatches = result.rows.map(mapBatch);
      res.json({ batches: mappedBatches });
    } catch (error: any) {
      console.error("Server API Error (batches GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batches endpoint: fetch specific batch config
  app.get("/api/batches/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      const result = await pool.query("SELECT * FROM batches WHERE batch_id = $1 AND is_active = TRUE LIMIT 1", [batchId]);
      res.json(result.rows.length > 0 ? mapBatch(result.rows[0]) : null);
    } catch (error: any) {
      console.error("Server API Error (batches/:batchId GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Batches endpoint: soft delete a batch
  app.delete("/api/batches/:batchId", async (req, res) => {
    try {
      const { batchId } = req.params;
      await pool.query("UPDATE batches SET is_active = FALSE WHERE batch_id = $1", [batchId]);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (batches DELETE):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Audit Logs endpoint: save log
  app.post("/api/auditLogs", async (req, res) => {
    try {
      const log = req.body;
      const id = Date.now().toString();
      await pool.query(`
        INSERT INTO audit_logs (id, action, performed_by, timestamp, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
      `, [id, log.action, log.performedBy, new Date().toISOString()]);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (auditLogs POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Audit Logs endpoint: get logs
  app.get("/api/auditLogs", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM audit_logs WHERE is_active = TRUE ORDER BY timestamp DESC");
      res.json({ logs: result.rows });
    } catch (error: any) {
      console.error("Server API Error (auditLogs GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tasks endpoint: save (create or update) task
  app.post("/api/tasks", async (req, res) => {
    try {
      const task = req.body;
      if (!task.id) {
        return res.status(400).json({ error: "task id is required" });
      }

      await pool.query(`
        INSERT INTO tasks (
          id, type, title, teacher_id, teacher_name, batch_id, due_date, description, status, created_at, content, randomize, time_limit, grading_mode, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, TRUE)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          teacher_id = EXCLUDED.teacher_id,
          teacher_name = EXCLUDED.teacher_name,
          batch_id = EXCLUDED.batch_id,
          due_date = EXCLUDED.due_date,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          content = EXCLUDED.content,
          randomize = EXCLUDED.randomize,
          time_limit = EXCLUDED.time_limit,
          grading_mode = EXCLUDED.grading_mode,
          is_active = TRUE;
      `, [
        task.id, task.type, task.title, task.teacherId === 'None' ? null : (task.teacherId || null), task.teacherName || null, task.batchId,
        task.dueDate || null, task.description || "", task.status || "Active", task.createdAt || new Date().toISOString(),
        JSON.stringify(task.content || {}), task.randomize || false, task.timeLimit || null, task.gradingMode || 'Auto-Evaluated'
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (tasks POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tasks endpoint: get tasks (optionally by batchId)
  app.get("/api/tasks", async (req, res) => {
    try {
      const { batchId } = req.query;
      let queryText = "SELECT * FROM tasks WHERE is_active = TRUE";
      const params: any[] = [];

      if (batchId) {
        queryText += " AND batch_id = $1";
        params.push(batchId);
      }
      queryText += " ORDER BY created_at DESC";

      const result = await pool.query(queryText, params);
      const mappedTasks = result.rows.map(mapTask);
      res.json({ tasks: mappedTasks });
    } catch (error: any) {
      console.error("Server API Error (tasks GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tasks endpoint: soft delete task
  app.delete("/api/tasks/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      await pool.query("UPDATE tasks SET is_active = FALSE WHERE id = $1", [taskId]);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (tasks DELETE):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submissions endpoint: soft delete submission (retest)
  app.delete("/api/submissions/:submissionId", async (req, res) => {
    try {
      const { submissionId } = req.params;
      await pool.query("UPDATE submissions SET is_active = FALSE WHERE id = $1", [submissionId]);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (submissions DELETE):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submissions endpoint: save submission
  app.post("/api/submissions", async (req, res) => {
    try {
      const sub = req.body;
      if (!sub.id) {
        return res.status(400).json({ error: "submission id is required" });
      }

      // Server-side validation of interview_report shape
      if (sub.type === 'MockInterview' && sub.interviewReport) {
        const report = sub.interviewReport;
        if (
          typeof report !== 'object' ||
          typeof report.fluency !== 'number' ||
          typeof report.confidence !== 'number' ||
          typeof report.vocabulary !== 'number' ||
          typeof report.clarity !== 'number' ||
          typeof report.overallScore !== 'number' ||
          typeof report.summary !== 'string' ||
          !Array.isArray(report.questionAnalysis) ||
          !Array.isArray(report.recommendations)
        ) {
          return res.status(400).json({ error: "Invalid interview report format" });
        }
      }

      await pool.query(`
        INSERT INTO submissions (
          id, task_id, student_id, student_name, batch_id, type, submitted_at, status, score, total_marks, answers, attachment_url, teacher_id, submission_reason, interview_report, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, $15::jsonb, TRUE)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          answers = EXCLUDED.answers,
          attachment_url = EXCLUDED.attachment_url,
          submitted_at = EXCLUDED.submitted_at,
          submission_reason = EXCLUDED.submission_reason,
          interview_report = EXCLUDED.interview_report,
          is_active = TRUE;
      `, [
        sub.id, sub.taskId, sub.studentId, sub.studentName, sub.batchId, sub.type,
        sub.submittedAt || new Date().toISOString(), sub.status || "Auto-Evaluated",
        sub.score !== undefined ? sub.score : null, sub.totalMarks || 0,
        JSON.stringify(sub.answers || []), sub.attachmentUrl || null, sub.teacherId === 'None' ? null : (sub.teacherId || null),
        sub.submissionReason || 'Normal Submission',
        sub.interviewReport ? JSON.stringify(sub.interviewReport) : null
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (submissions POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submissions endpoint: get submissions (optionally filtered by taskId, studentId, or teacherId)
  app.get("/api/submissions", async (req, res) => {
    try {
      const { taskId, studentId, teacherId } = req.query;
      const conditions = ["is_active = TRUE"];
      const params: any[] = [];
      let index = 1;

      if (taskId) {
        conditions.push(`task_id = $${index++}`);
        params.push(taskId);
      }
      if (studentId) {
        conditions.push(`student_id = $${index++}`);
        params.push(studentId);
      }
      if (teacherId) {
        conditions.push(`teacher_id = $${index++}`);
        params.push(teacherId);
      }

      const queryText = "SELECT * FROM submissions WHERE " + conditions.join(" AND ") + " ORDER BY submitted_at DESC";

      const result = await pool.query(queryText, params);
      const mappedSubmissions = result.rows.map(mapSubmission);
      res.json({ submissions: mappedSubmissions });
    } catch (error: any) {
      console.error("Server API Error (submissions GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Submissions endpoint: grade submission
  app.post("/api/submissions/:submissionId/grade", async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { score } = req.body;
      await pool.query("UPDATE submissions SET score = $1, status = 'Graded' WHERE id = $2", [score, submissionId]);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (grade POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Messages endpoint: send message
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = req.body;
      const id = "msg_" + Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7);
      
      await pool.query(`
        INSERT INTO messages (
          id, sender_id, sender_name, sender_role, recipient_array, recipient_type, batch_id, text, timestamp, priority, category, read_by, is_active
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12::jsonb, TRUE)
      `, [
        id, messageData.senderId, messageData.senderName, messageData.senderRole || null,
        JSON.stringify(messageData.recipientArray || []), messageData.recipientType || "Individual",
        messageData.batchId || null, messageData.text, new Date().toISOString(),
        messageData.priority || "Normal", messageData.category || "General", JSON.stringify([])
      ]);

      res.json({ success: true, id });
    } catch (error: any) {
      console.error("Server API Error (messages POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Messages endpoint: get all messages
  app.get("/api/messages", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM messages WHERE is_active = TRUE ORDER BY timestamp DESC");
      const mappedMessages = result.rows.map(mapMessage);
      res.json({ messages: mappedMessages });
    } catch (error: any) {
      console.error("Server API Error (messages GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Messages endpoint: mark message as read
  app.post("/api/messages/:messageId/read", async (req, res) => {
    const client = await pool.connect();
    try {
      const { messageId } = req.params;
      const { userId } = req.body;

      await client.query("BEGIN;");
      const result = await client.query("SELECT read_by FROM messages WHERE id = $1 AND is_active = TRUE", [messageId]);
      if (result.rows.length > 0) {
        const readBy = result.rows[0].read_by || [];
        if (!readBy.includes(userId)) {
          readBy.push(userId);
          await client.query("UPDATE messages SET read_by = $1::jsonb WHERE id = $2", [JSON.stringify(readBy), messageId]);
        }
      }
      await client.query("COMMIT;");
      res.json({ success: true });
    } catch (error: any) {
      await client.query("ROLLBACK;");
      console.error("Server API Error (messages/:id/read POST):", error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  });

  // Teachers endpoint: save (create or update) teacher
  app.post("/api/teachers", async (req, res) => {
    try {
      const teacher = req.body;
      if (!teacher.id) {
        return res.status(400).json({ error: "teacher id is required" });
      }

      await pool.query(`
        INSERT INTO teachers (
          id, employee_id, username, password, name, role, department, contact_no, email_id, photo, batch, assigned_batches, performance_details, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, TRUE)
        ON CONFLICT (id) DO UPDATE SET
          employee_id = EXCLUDED.employee_id,
          username = EXCLUDED.username,
          password = COALESCE(EXCLUDED.password, teachers.password),
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          department = EXCLUDED.department,
          contact_no = EXCLUDED.contact_no,
          email_id = EXCLUDED.email_id,
          photo = COALESCE(EXCLUDED.photo, teachers.photo),
          batch = EXCLUDED.batch,
          assigned_batches = EXCLUDED.assigned_batches,
          performance_details = EXCLUDED.performance_details,
          is_active = TRUE;
      `, [
        teacher.id, teacher.employeeId || null, teacher.username, teacher.password || "password", teacher.name,
        teacher.role || "Teacher", teacher.department || "", teacher.contactNo || "", teacher.emailId || "",
        teacher.photo || null, teacher.batch || "", JSON.stringify(teacher.assignedBatches || []),
        JSON.stringify(teacher.performanceDetails || {})
      ]);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (teachers POST):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Teachers endpoint: list all active teachers
  app.get("/api/teachers", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM teachers WHERE is_active = TRUE ORDER BY name ASC");
      const mappedTeachers = result.rows.map(mapTeacher);
      res.json({ teachers: mappedTeachers });
    } catch (error: any) {
      console.error("Server API Error (teachers GET):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Teachers endpoint: soft delete teacher
  app.delete("/api/teachers/:teacherId", async (req, res) => {
    try {
      const { teacherId } = req.params;
      await pool.query("UPDATE teachers SET is_active = FALSE WHERE id = $1", [teacherId]);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Server API Error (teachers DELETE):", error);
      res.status(500).json({ error: error.message });
    }
  });

export default function handler(req: any, res: any) { return app(req, res); }
