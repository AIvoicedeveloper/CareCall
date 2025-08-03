# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Role fetch timeout" Errors

**Symptoms:**
- Console shows "Role fetch timeout (10000ms)" errors
- Dashboard sections stuck in "Loading..." state
- User role not displaying correctly

**Causes:**
- Missing or incorrect Supabase environment variables
- Network connectivity issues
- Supabase service unavailable
- Database schema not properly set up

**Solutions:**

#### A. Check Environment Variables
1. Verify `.env.local` file exists in the `app` directory
2. Ensure variables are correctly named:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
3. Restart the development server after making changes

#### B. Test Supabase Connection
1. Use the "Test Supabase Connection" button on the dashboard
2. Check browser console for specific error messages
3. Verify your Supabase project is active and accessible

#### C. Check Network Connectivity
1. Ensure stable internet connection
2. Check if Supabase is accessible from your network
3. Try accessing your Supabase dashboard directly

### 2. Dashboard Loading States

**Symptoms:**
- All dashboard sections showing "Loading..."
- No data displayed even after successful authentication
- Timeout errors in console

**Solutions:**

#### A. Increase Timeout Settings
The application has been updated with more lenient timeout settings:
- Role fetch: 15 seconds (increased from 10)
- Dashboard loading: 12 seconds (increased from 8)
- Supabase operations: Progressive timeouts (8s, 12s, 15s)

#### B. Check Database Tables
1. Use the "Test Database Tables" button on the dashboard
2. Ensure all required tables exist:
   - `users` table with `role` column
   - `patients` table
   - `calls` table
   - `symptom_reports` table

#### C. Verify RLS Policies
Make sure your Supabase Row Level Security policies allow the necessary operations:

```sql
-- Example RLS policy for users table
CREATE POLICY "Users can view their own data" ON users
FOR SELECT USING (auth.uid() = id);

-- Example RLS policy for patients table
CREATE POLICY "Authenticated users can view patients" ON patients
FOR SELECT USING (auth.role() = 'authenticated');
```

### 3. Authentication Issues

**Symptoms:**
- Login not working
- User session not persisting
- "Authentication failed" errors

**Solutions:**

#### A. Check Supabase Auth Settings
1. Verify email confirmation is not required (for testing)
2. Check if your email domain is allowed
3. Ensure auth is enabled in your Supabase project

#### B. Clear Browser Data
1. Clear browser cache and cookies
2. Try in an incognito/private window
3. Check if the issue persists

### 4. Tab Switch Recovery Issues

**Symptoms:**
- Application becomes unresponsive after switching tabs
- Loading states persist after returning to the tab
- Console shows recovery attempt messages

**Solutions:**

#### A. Manual Recovery
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Wait for the application to reload completely
3. Check if the issue persists

#### B. Check Browser Settings
1. Ensure JavaScript is enabled
2. Check if any browser extensions are interfering
3. Try a different browser

### 5. Database Schema Issues

**Symptoms:**
- "Table does not exist" errors
- Missing data in dashboard sections
- Incorrect data relationships

**Solutions:**

#### A. Run Database Setup
Execute the SQL commands from `SUPABASE_SETUP.md` in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'doctor', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table
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

-- Create calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  call_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_status TEXT DEFAULT 'to be called',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create symptom_reports table
CREATE TABLE symptom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  escalate BOOLEAN DEFAULT FALSE,
  symptoms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### B. Insert Sample Data
Add some test data to verify the setup:

```sql
-- Insert a test user
INSERT INTO users (email, name, role) 
VALUES ('admin@example.com', 'Admin User', 'admin');

-- Insert test patients
INSERT INTO patients (full_name, phone_number, condition_type) 
VALUES 
  ('John Doe', '+1234567890', 'Hypertension'),
  ('Jane Smith', '+0987654321', 'Diabetes');
```

### 6. Performance Issues

**Symptoms:**
- Slow loading times
- Frequent timeouts
- Unresponsive interface

**Solutions:**

#### A. Check Network Performance
1. Test your internet connection speed
2. Try from a different network
3. Check if Supabase is experiencing issues

#### B. Optimize Queries
The application has been updated with:
- Better caching mechanisms
- More efficient retry logic
- Progressive timeout handling

#### C. Monitor Resource Usage
1. Check browser memory usage
2. Close unnecessary browser tabs
3. Restart the development server if needed

## Quick Setup Commands

```bash
# Navigate to app directory
cd app

# Run setup script
npm run setup

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

## Getting Help

1. **Check the Console**: Open browser DevTools and look for specific error messages
2. **Review Logs**: Check the browser console for detailed error information
3. **Test Connection**: Use the dashboard's connection test buttons
4. **Verify Setup**: Follow the `SUPABASE_SETUP.md` guide step by step

## Emergency Recovery

If the application is completely unresponsive:

1. **Hard Refresh**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear Cache**: Clear browser cache and cookies
3. **Restart Server**: Stop and restart the development server
4. **Check Environment**: Verify `.env.local` file exists and has correct values
5. **Test Supabase**: Ensure your Supabase project is active and accessible 