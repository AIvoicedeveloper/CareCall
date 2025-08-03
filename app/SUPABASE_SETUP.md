# Supabase Setup Guide

## Issue
The application is currently stuck in a loading state because Supabase environment variables are not configured.

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Schema
Make sure your Supabase database has the following tables:
- `users` table with columns: `id`, `email`, `name`, `role`
- `patients` table with columns: `id`, `full_name`, `phone_number`, `last_visit`, `condition_type`, `doctor_id`, `call_status`

After setting up the environment variables, the application should load properly and show the login page instead of being stuck in a loading state. 