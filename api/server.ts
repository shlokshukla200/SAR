import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize PostgreSQL client
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined in your environment.");
}

const { Pool } = pg;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const pool = new Pool({
  connectionString: connectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false }
});

function mapStudent(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username || null,
    password: row.password || null,
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
    password: row.password,
    name: row.name,
    role: row.role,
    department: row.department,
    contactNo: row.contact_no,
    emailId: row.email_id,
    photo: row.photo,
    batch: row.batch,
    assignedBatches: row.assigned_batches,
    performanceDetails: row.performance_details
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
    submissionReason: row.submission_reason
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
  console.log("Checking and initializing PostgreSQL database schema...");
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

      // 1. Teachers table
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

      // 2. Students table
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

      // 3. Batches table
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

      // 4. Tasks table
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
          grading_mode TEXT DEFAULT 'Auto-Evaluated',
          is_active BOOLEAN DEFAULT TRUE
        );
      `);

      await client.query(`
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS grading_mode TEXT DEFAULT 'Auto-Evaluated';
      `);

      // 5. Submissions table
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
          submission_reason TEXT DEFAULT 'Normal Submission',
          is_active BOOLEAN DEFAULT TRUE
        );
      `);

      await client.query(`
        ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submission_reason TEXT DEFAULT 'Normal Submission';
      `);

      // 6. Audit logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          action TEXT,
          performed_by TEXT,
          timestamp TEXT,
          is_active BOOLEAN DEFAULT TRUE
        );
      `);

      // 7. Messages table
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

      // Create B-Tree indexes for high-performance scale lookups
      await client.query("CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);");
      await client.query("CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);");
      await client.query("CREATE INDEX IF NOT EXISTS idx_teachers_username ON teachers(username);");
      await client.query("CREATE INDEX IF NOT EXISTS idx_students_batch ON students(batch);");
      await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_batch_id ON tasks(batch_id);");
      await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_task_id ON submissions(task_id);");
      await client.query("CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);");

      // Seed the default system administrator if it does not exist
      await client.query(`
        INSERT INTO teachers (id, employee_id, username, password, name, role, department, contact_no, email_id, batch, assigned_batches, performance_details)
        VALUES ('admin', 'ADM-001', 'admin', 'password@admin', 'Admin', 'Admin', '', '', '', 'All', '[]'::jsonb, '{}'::jsonb)
        ON CONFLICT (username) DO NOTHING;
      `);

      await client.query("COMMIT;");
      console.log("Database tables initialized successfully and admin account seeded!");
    } catch (err) {
      await client.query("ROLLBACK;");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("FATAL: Failed to initialize PostgreSQL database schema:", error);
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

let dbInitializationPromise: Promise<void> | null = null;
function ensureDbInitialized() {
  if (!dbInitializationPromise) {
    dbInitializationPromise = initializeDatabase();
  }
  return dbInitializationPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureDbInitialized();
    next();
  } catch (error: any) {
    console.error("Database initialization failed:", error);
    res.status(500).json({ error: "Database initialization failed: " + error.message });
  }
});

app.use(express.json());

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
      res.status(500).json({
        status: "error",
        error: error.message,
        databaseConnected: false
      });
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
          s.teacherId || null, JSON.stringify(s.personalDetails || {}), JSON.stringify(s.academicDetails || {}),
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
        config.batchId, config.teacherId || null, config.teacherName || null, config.isSetupComplete || false,
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
        task.id, task.type, task.title, task.teacherId || null, task.teacherName || null, task.batchId,
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

      await pool.query(`
        INSERT INTO submissions (
          id, task_id, student_id, student_name, batch_id, type, submitted_at, status, score, total_marks, answers, attachment_url, teacher_id, submission_reason, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, TRUE)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          score = EXCLUDED.score,
          answers = EXCLUDED.answers,
          attachment_url = EXCLUDED.attachment_url,
          submitted_at = EXCLUDED.submitted_at,
          submission_reason = EXCLUDED.submission_reason,
          is_active = TRUE;
      `, [
        sub.id, sub.taskId, sub.studentId, sub.studentName, sub.batchId, sub.type,
        sub.submittedAt || new Date().toISOString(), sub.status || "Auto-Evaluated",
        sub.score !== undefined ? sub.score : null, sub.totalMarks || 0,
        JSON.stringify(sub.answers || []), sub.attachmentUrl || null, sub.teacherId || null,
        sub.submissionReason || 'Normal Submission'
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
      let queryText = "SELECT * FROM submissions WHERE is_active = TRUE";
      const params: any[] = [];
      let index = 1;

      if (taskId) {
        queryText += ` AND task_id = $${index++}`;
        params.push(taskId);
      } else if (studentId) {
        queryText += ` AND student_id = $${index++}`;
        params.push(studentId);
      } else if (teacherId) {
        queryText += ` AND teacher_id = $${index++}`;
        params.push(teacherId);
      }

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

export default app;
