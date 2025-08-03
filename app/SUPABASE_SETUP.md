# Supabase Setup Guide

## Issue
The application is currently experiencing "Role fetch timeout" errors and stuck loading states because Supabase environment variables are not properly configured.

## Solution
You need to create a `.env.local` file in the `app` directory with your Supabase credentials.

### Steps:

1. **Create a Supabase Project** (if you haven't already):
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up/login and create a new project
   - Wait for the project to be created

2. **Get Your Credentials**:
   - In your Supabase dashboard, go to Settings → API
   - Copy the "Project URL" and "anon public" key

3. **Create Environment File**:
   Create a file named `.env.local` in the `app` directory with the following content:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

   Replace `your_project_url_here` and `your_anon_key_here` with your actual Supabase credentials.

4. **Restart the Development Server**:
   ```bash
   cd app
   npm run dev
   ```

### Example `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzQ5NjAwMCwiZXhwIjoxOTUzMDcyMDAwfQ.example
```

### Database Schema
Make sure your Supabase database has the following tables:

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  last_visit DATE,
  condition_type TEXT,
  doctor_id UUID REFERENCES users(id),
  call_status TEXT DEFAULT 'not called yet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Calls Table
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  call_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_status TEXT DEFAULT 'to be called',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Symptom Reports Table
```sql
CREATE TABLE symptom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  escalate BOOLEAN DEFAULT FALSE,
  symptoms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Troubleshooting

1. **Check Console for Errors**: Open browser DevTools and check the Console tab for specific error messages.

2. **Verify Environment Variables**: Make sure your `.env.local` file is in the correct location (`app/.env.local`) and has the correct format.

3. **Test Connection**: Use the "Test Supabase Connection" button on the dashboard to verify connectivity.

4. **Check Network**: Ensure your internet connection is stable and you can access Supabase.

5. **Database Permissions**: Make sure your Supabase RLS (Row Level Security) policies allow the necessary operations.

### Common Issues

- **"Role fetch timeout"**: Usually indicates network issues or missing environment variables
- **"Table does not exist"**: Database schema not set up correctly
- **"Authentication failed"**: Check your Supabase credentials
- **"Network error"**: Check your internet connection and firewall settings

After setting up the environment variables and database schema, the application should load properly and show the dashboard instead of being stuck in loading states. 