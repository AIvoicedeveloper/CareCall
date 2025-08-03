# 🚀 Quick Setup Guide

## The Issue
Your app is stuck in a loading state because **Supabase is not configured**. The connection test is timing out because the Supabase client is trying to connect with placeholder values.

## ✅ Solution: Configure Supabase

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/login and create a new project
3. Wait for the project to be created (usually 1-2 minutes)

### Step 2: Get Your Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (looks like `https://abcdefghijklmnop.supabase.co`)
3. Copy the **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 3: Create Environment File
Create a file named `.env.local` in the `app` directory with this content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace the values with your actual Supabase credentials.**

### Step 4: Restart the Server
```bash
cd app
npm run dev
```

## 🎯 Expected Result
After setup, you should see:
- ✅ **Supabase configuration found** in console
- ✅ **Connection test successful** 
- ✅ **App loads properly** (no more "Loading..." stuck state)
- ✅ **Login page appears**

## 🔧 Database Setup (Optional)
If you want to use the full app features, create these tables in your Supabase database:

### Users Table
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'staff'
);
```

### Patients Table
```sql
CREATE TABLE patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  phone_number TEXT,
  last_visit TIMESTAMP,
  condition_type TEXT,
  doctor_id UUID REFERENCES users(id),
  call_status TEXT DEFAULT 'pending'
);
```

## 🚨 Troubleshooting
- **Still seeing "Loading..."**: Make sure `.env.local` is in the `app` directory
- **Connection timeout**: Double-check your Supabase URL and key
- **Environment variables not loading**: Restart your development server

## 📞 Need Help?
- Check the console for specific error messages
- Verify your Supabase project is active
- Ensure your credentials are copied correctly 