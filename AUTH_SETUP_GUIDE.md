# Authentication Setup Guide

This guide will help you set up password recovery and Google OAuth login for your church management app.

## 🔐 Password Recovery Setup

### Step 1: Configure Email in Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Authentication** → **Email Templates**
3. Ensure **Password Reset** template is enabled
4. Go to **Settings** → **Auth** → **SMTP Settings**
5. Configure your email provider (or use Supabase's default)

### Step 2: Set Redirect URL for Password Reset

1. Go to **Authentication** → **URL Configuration**
2. Add this to **Redirect URLs**:
   ```
   https://your-production-domain.vercel.app/auth/update-password
   http://localhost:3000/auth/update-password
   ```

### Step 3: Test Password Recovery

1. Go to `/auth/login`
2. Click "Forgot your password?"
3. Enter your email
4. Check your email for the reset link
5. Click the link and set a new password

## 🔵 Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   (Replace `your-project-ref` with your Supabase project reference)

### Step 2: Configure in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click on **Google**
3. Toggle **Enabled** to ON
4. Enter your **Client ID** and **Client Secret** from Google Cloud Console
5. Click **Save**

### Step 3: Set Site URL and Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**:
   - Production: `https://your-production-domain.vercel.app`
   - Development: `http://localhost:3000`
3. Add **Redirect URLs**:
   ```
   https://your-production-domain.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### Step 4: Test Google OAuth

1. Go to `/auth/login`
2. Click "Staff Login with Google"
3. You should be redirected to Google sign-in
4. After signing in, you'll be redirected back to your app

## 🐛 Troubleshooting

### Password Recovery Not Working

- **Check email spam folder** - Reset emails sometimes go to spam
- **Verify SMTP settings** - Ensure email is configured in Supabase
- **Check redirect URL** - Must match exactly in Supabase settings
- **Verify email exists** - The email must be registered in your Supabase auth

### Google OAuth Not Working

- **Check Google Cloud Console** - Verify redirect URI matches Supabase callback URL
- **Verify Client ID/Secret** - Ensure they're correctly entered in Supabase
- **Check Site URL** - Must match your app's domain exactly
- **Clear browser cookies** - Sometimes helps with OAuth state errors
- **Check browser console** - Look for error messages

### Common Errors

**"bad_oauth_state"**
- Clear browser cookies
- Verify Site URL matches your app domain
- Check redirect URL is in allowed list

**"Failed to create user profile"**
- Check RLS policies on `profiles` table
- Ensure profile creation policy is enabled
- Verify database migrations have been run

**"No authorization code provided"**
- Check redirect URL configuration
- Verify Google OAuth redirect URI in Google Cloud Console
- Ensure callback route is accessible

## ✅ Quick Checklist

### Password Recovery
- [ ] Email/SMTP configured in Supabase
- [ ] Redirect URL added: `/auth/update-password`
- [ ] Tested password reset flow
- [ ] Email received and link works

### Google OAuth
- [ ] Google OAuth credentials created
- [ ] Client ID and Secret added to Supabase
- [ ] Google OAuth enabled in Supabase
- [ ] Redirect URI configured in Google Cloud Console
- [ ] Site URL set in Supabase
- [ ] Callback URL added to redirect URLs
- [ ] Tested Google login flow

## 📝 Notes

- Password recovery requires email configuration in Supabase
- Google OAuth requires both Supabase and Google Cloud Console configuration
- Always test in both development and production environments
- Keep your Google OAuth credentials secure

