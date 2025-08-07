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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Calls Table
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  call_time TIMESTAMP WITH TIME ZONE, -- REMOVED DEFAULT NOW() to prevent auto-creation
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

### Fix for Automatic Call Creation Issue

If you're experiencing automatic call creation when adding patients, run these SQL commands in your Supabase SQL Editor:

#### 1. Check for Triggers
```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('patients', 'calls');
```

#### 2. Find the Specific Trigger Function
```sql
-- Get all trigger functions that might be creating calls
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND pg_get_functiondef(p.oid) LIKE '%INSERT INTO calls%';
```

#### 3. Modify the Specific Trigger Function

Based on your database, you have a function called `create_call_for_new_patient` that's causing the issue. Here's how to fix it:

**Current Problematic Function:**
```sql
CREATE OR REPLACE FUNCTION create_call_for_new_patient()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple, focused logic with error handling
  BEGIN
    INSERT INTO calls (id, patient_id, call_status, call_time, created_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      'to be called',
      CURRENT_DATE,  -- This is the problem!
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to create call for patient %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Fixed Function (Set call_time to NULL):**
```sql
CREATE OR REPLACE FUNCTION create_call_for_new_patient()
RETURNS TRIGGER AS $$
BEGIN
  -- Simple, focused logic with error handling
  BEGIN
    INSERT INTO calls (id, patient_id, call_status, call_time, created_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      'to be called',
      NULL,  -- Explicitly set call_time to NULL
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the transaction
      RAISE WARNING 'Failed to create call for patient %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Key Changes:**
- Changed `CURRENT_DATE` to `NULL` in the VALUES clause
- Explicitly set `call_time` to `NULL` instead of removing it
- The trigger will still create call records, but with `call_time` set to `NULL`

#### 4. Alternative: Simple Trigger Modification
If you want to keep the existing trigger but just set call_time to NULL:

```sql
-- Example: If your trigger function looks like this:
-- INSERT INTO calls (patient_id, call_time, call_status, notes)
-- VALUES (NEW.id, NOW(), 'to be called', 'Auto-created call record');

-- Modify it to:
-- INSERT INTO calls (patient_id, call_time, call_status, notes)
-- VALUES (NEW.id, NULL, 'to be called', 'Auto-created call record');
```

#### 5. Complete Example: Modify Common Trigger Patterns

**Pattern 1: If your trigger uses NOW() or CURRENT_TIMESTAMP**
```sql
-- Before (problematic):
INSERT INTO calls (patient_id, call_time, call_status, notes)
VALUES (NEW.id, NOW(), 'to be called', 'Auto-created call record');

-- After (fixed):
INSERT INTO calls (patient_id, call_time, call_status, notes)
VALUES (NEW.id, NULL, 'to be called', 'Auto-created call record');
```

**Pattern 2: If your trigger uses DEFAULT**
```sql
-- Before (problematic):
INSERT INTO calls (patient_id, call_time, call_status, notes)
VALUES (NEW.id, DEFAULT, 'to be called', 'Auto-created call record');

-- After (fixed):
INSERT INTO calls (patient_id, call_time, call_status, notes)
VALUES (NEW.id, NULL, 'to be called', 'Auto-created call record');
```

#### 6. Remove Any Auto-Call Triggers (Alternative)
```sql
-- Remove any triggers that automatically create calls
DROP TRIGGER IF EXISTS auto_create_call ON patients;
DROP TRIGGER IF EXISTS create_call_on_patient_insert ON patients;
-- Add any other trigger names you find
```

#### 7. Update Calls Table Schema
```sql
-- Remove default value from call_time to prevent auto-creation
ALTER TABLE calls ALTER COLUMN call_time DROP DEFAULT;
```

#### 8. Verify No Auto-Creation
```sql
-- Test: Insert a patient and verify no call is created
INSERT INTO patients (full_name, phone_number, condition_type) 
VALUES ('Test Patient', '+1234567890', 'Test Condition');

-- Check that no call was created
SELECT * FROM calls WHERE patient_id = (
  SELECT id FROM patients WHERE full_name = 'Test Patient'
);

-- Clean up test data
DELETE FROM patients WHERE full_name = 'Test Patient';
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