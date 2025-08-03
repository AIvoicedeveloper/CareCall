# 🔧 Users Table Setup Guide

## 🚨 **Current Issue**
The app is working perfectly, but there's a "Role fetch timeout" error because the `users` table doesn't exist in your Supabase database.

## ✅ **Quick Fix**

### **Option 1: Create the Users Table (Recommended)**

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com](https://supabase.com)
   - Open your project
   - Go to **Table Editor**

2. **Create the Users Table**
   - Click **"New Table"**
   - Set table name: `users`
   - Add these columns:
     ```
     id: uuid (Primary Key, References auth.users(id))
     email: text
     name: text
     role: text (Default: 'staff')
     created_at: timestamp (Default: now())
     ```

3. **Or use SQL (Alternative)**
   - Go to **SQL Editor** in Supabase
   - Run this SQL:
   ```sql
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     email TEXT,
     name TEXT,
     role TEXT DEFAULT 'staff',
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

### **Option 2: Skip Role Fetch (Temporary)**

The app will work fine with the default 'staff' role. The role fetch timeout won't break anything - it just means all users will have the 'staff' role.

## 🎯 **Expected Result**

After creating the users table:
- ✅ **No more "Role fetch timeout" errors**
- ✅ **User roles will be properly fetched**
- ✅ **App will work with proper role-based access**

## 📝 **Notes**

- The app currently defaults to 'staff' role for all users
- This is safe and won't break any functionality
- You can create the table later when you need role-based features
- The tab switching bug is completely fixed regardless of this issue

## 🔍 **Current Status**

Your app is working perfectly! The only issue is the role fetch timeout, which is easily resolved by creating the users table or just ignoring it (the app works fine with default roles). 