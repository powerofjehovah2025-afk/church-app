# Vercel Deployment Guide

This guide will help you deploy the Church Management App to Vercel production.

## Prerequisites

1. A Vercel account connected to this GitHub repository
2. Supabase project with all required tables and migrations
3. Required environment variables

## Required Environment Variables

Configure these in your Vercel project settings (Settings → Environment Variables):

### Public Variables (available in browser)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key

### Secret Variables (server-side only)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (required for admin operations)

### Optional Variables
- `NEXT_PUBLIC_DEV_ROLE_SWITCHER` - Set to "true" to enable development role switcher

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)

1. **Push to Main Branch**
   ```bash
   git checkout main
   git merge copilot/update-cursor-in-production
   git push origin main
   ```
   
2. Vercel will automatically detect the push and trigger a deployment

3. Monitor the deployment in your [Vercel Dashboard](https://vercel.com/dashboard)

### Option 2: Manual Deployment via Vercel Dashboard

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your church-app project
3. Click "Deployments" tab
4. Click "Deploy" button
5. Select the branch you want to deploy (usually `main`)

### Option 3: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

## Post-Deployment Checklist

After deployment, verify:

- [ ] Application loads at your production URL
- [ ] Authentication works (login/signup)
- [ ] Admin users can access `/admin/newcomers`
- [ ] Admin users can access `/admin/users` (user management)
- [ ] Team members can access `/dashboard`
- [ ] Database connections work correctly
- [ ] Email notifications are functioning (if configured)

## Environment Variables Setup in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable:
   - Click "Add New"
   - Enter variable name
   - Enter value
   - Select environment(s): Production, Preview, Development
   - Click "Save"

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all dependencies are in package.json
- Ensure Node.js version matches (20.x specified in package.json)

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check Supabase redirect URLs include your Vercel domain
- Ensure site URL is set correctly in Supabase

### Database Connection Issues
- Verify SUPABASE_SERVICE_ROLE_KEY is set correctly
- Check Row Level Security (RLS) policies in Supabase
- Ensure all database migrations have been run

### Admin Features Not Working
- Verify SUPABASE_SERVICE_ROLE_KEY is set in Vercel environment variables
- Check that your user has admin role in the profiles table
- Review API route logs in Vercel Dashboard

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit** `.env.local` or environment variables to git
2. **Service Role Key** should only be in Vercel environment variables (server-side)
3. **Rotate keys** if they are ever exposed
4. **Review Supabase RLS policies** to ensure data security
5. **Monitor Vercel logs** for unauthorized access attempts

## Current Status

✅ **Build Status:** Passing  
✅ **Linting:** No errors  
✅ **Security Scan:** No critical issues  
⚠️ **Dependency Alert:** Next.js has a moderate vulnerability (PPR-related, non-critical for most apps)

## Recent Changes

The following features were added with Cursor and are now ready for production:

- **User Management System:** Admin can now upgrade users to admin role via `/admin/users`
- **Admin API Endpoints:** Secure endpoints for user role management
- **UI Improvements:** Modern, dark-themed user management interface
- **Bug Fixes:** Fixed linting errors and syntax issues

## Support

For issues with deployment, check:
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**Last Updated:** 2026-01-29  
**Deployment Ready:** ✅ Yes
