# 🔧 Supabase Connection Troubleshooting Guide

## 🚨 Common Connection Issues & Solutions

### 1. **Connection Test Timeout**
**Symptoms:** `Error: Connection test timeout`

**Solutions:**
- **Check your Supabase project status**: Visit [https://status.supabase.com](https://status.supabase.com)
- **Verify your credentials**: Double-check your `.env.local` file
- **Try a different network**: Switch from WiFi to mobile hotspot or vice versa
- **Clear browser cache**: Hard refresh (Ctrl+F5) or clear browser data
- **Check firewall/antivirus**: Temporarily disable to test

### 2. **CORS Issues**
**Symptoms:** Network errors in console, connection failures

**Solutions:**
- **Check Supabase project settings**: Go to Settings → API → CORS
- **Add your domain**: Add `localhost:3000` to allowed origins
- **Use correct URL format**: Ensure URL starts with `https://`

### 3. **Environment Variables Not Loading**
**Symptoms:** "Missing Supabase environment variables"

**Solutions:**
- **Restart development server**: `npm run dev`
- **Check file location**: `.env.local` must be in the `app` directory
- **Verify file format**: No spaces around `=` in `.env.local`
- **Check file encoding**: Use UTF-8 encoding

### 4. **Network/Firewall Issues**
**Symptoms:** Timeout errors, connection refused

**Solutions:**
- **Try different network**: Switch networks or use mobile hotspot
- **Check corporate firewall**: Contact IT if on corporate network
- **VPN issues**: Disable VPN temporarily
- **DNS issues**: Try using `8.8.8.8` as DNS

### 5. **Supabase Project Issues**
**Symptoms:** 401/403 errors, service unavailable

**Solutions:**
- **Check project status**: Ensure project is active in Supabase dashboard
- **Verify API keys**: Regenerate anon key if needed
- **Check project region**: Some regions may have issues
- **Contact Supabase support**: If project seems corrupted

## 🔍 Diagnostic Steps

### Step 1: Check Console Output
Look for these messages in browser console:
- ✅ `Supabase configuration found`
- ✅ `Connection test successful`
- ❌ `Connection test timeout`
- ❌ `Missing Supabase environment variables`

### Step 2: Test Network Connectivity
```bash
# Test basic internet
curl https://httpbin.org/get

# Test Supabase directly (replace with your URL)
curl https://your-project.supabase.co/rest/v1/
```

### Step 3: Verify Environment Variables
Check your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 4: Test in Different Browser
- Try Chrome, Firefox, Safari
- Use incognito/private mode
- Clear browser cache and cookies

## 🛠️ Advanced Solutions

### 1. **Increase Timeout Values**
If you're on a slow connection, increase timeouts in the code:
```typescript
// In authProvider.tsx, increase timeout from 2000 to 5000
setTimeout(() => reject(new Error('Connection test timeout')), 5000);
```

### 2. **Use Different Connection Test**
The app now tries multiple connection methods. If one fails, it tries others.

### 3. **Check Supabase Project Settings**
- Go to your Supabase dashboard
- Settings → API → Check CORS settings
- Settings → Database → Check if database is active

### 4. **Regenerate API Keys**
- Go to Settings → API
- Click "Regenerate" for the anon key
- Update your `.env.local` file

## 📞 When to Contact Support

**Contact Supabase Support if:**
- All diagnostic tests pass but connection still fails
- You get 500+ errors from Supabase endpoints
- Your project appears corrupted or inaccessible
- You're on a supported network and all troubleshooting fails

**Contact your IT department if:**
- You're on a corporate network with strict firewall rules
- You need to whitelist Supabase domains
- VPN is required and blocking connections

## 🎯 Quick Fix Checklist

- [ ] Restart development server
- [ ] Clear browser cache
- [ ] Check `.env.local` file format
- [ ] Try different network
- [ ] Disable VPN/firewall temporarily
- [ ] Check Supabase project status
- [ ] Verify CORS settings
- [ ] Test in incognito mode
- [ ] Try different browser
- [ ] Check console for specific error messages

## 🔗 Useful Links

- [Supabase Status Page](https://status.supabase.com)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Supabase Support](https://supabase.com/support) 