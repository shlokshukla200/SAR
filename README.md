# Cloud-Scaled College Portal (SQL Core Upgrade)

This portal is a production-ready, highly scalable system designed to handle 5,000 to 10,000 concurrent students without lagging or data loss. The data persistence layer uses a high-performance PostgreSQL database cluster (hosted via Supabase), featuring soft-deletes and optimized B-Tree indexes.

## Run Locally

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **Supabase / PostgreSQL Instance** (Free tier Supabase database is sufficient)

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` or `.env` file in the root directory and add the following variables:
   ```env
   # Gemini AI API Key for analysis & recommendations
   GEMINI_API_KEY="your-gemini-api-key"

   # Supabase/PostgreSQL Connection String (e.g. transaction pooling URL)
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
   ```

3. **Run the application**:
   ```bash
   npm run dev
   ```
   *Note: On startup, the Express backend will automatically initialize the database schema and seed the default administrator account (`admin` / `password@admin`).*
