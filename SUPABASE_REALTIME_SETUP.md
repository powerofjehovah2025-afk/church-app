# Supabase Realtime Setup Guide

This guide will help you enable real-time subscriptions for the `newcomers` table.

## Step 1: Enable Realtime for the Table

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the `newcomers` table in the list
4. Toggle the switch to **enable** Realtime for this table

OR run this SQL in the SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE newcomers;
```

## Step 2: Configure Row Level Security (RLS)

Real-time subscriptions require RLS policies that allow authenticated users to SELECT from the table.

### Check if RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'newcomers';
```

### If RLS is enabled, create a SELECT policy:

```sql
-- Allow authenticated users to read all newcomers
CREATE POLICY "Allow authenticated users to read newcomers"
ON newcomers
FOR SELECT
TO authenticated
USING (true);
```

### If RLS is NOT enabled and you want to keep it disabled:

```sql
-- Disable RLS (only if you don't need it)
ALTER TABLE newcomers DISABLE ROW LEVEL SECURITY;
```

## Step 3: Verify the Setup

1. Open your browser console
2. Navigate to `/admin/newcomers`
3. Look for these console messages:
   - `✅ User authenticated: your-email@example.com`
   - `📡 Setting up real-time subscription...`
   - `✅ Successfully subscribed to newcomers real-time changes`

## Step 4: Test Real-time Updates

1. Open the admin dashboard in one browser tab
2. Submit a form from `/welcome` or `/membership` in another tab
3. The new record should appear in the dashboard **immediately** without refreshing

## Troubleshooting

### Issue: Subscription shows "TIMED_OUT" or "CHANNEL_ERROR"

**Solution:**
- Ensure the table is added to the Realtime publication (Step 1)
- Check RLS policies allow SELECT (Step 2)
- Verify you're logged in as an authenticated user

### Issue: No events received

**Solution:**
- Check the browser console for error messages
- Verify Realtime is enabled in Supabase Dashboard
- Ensure the table name matches exactly: `newcomers`

### Issue: "Live" indicator shows "Offline"

**Solution:**
- Check browser console for subscription errors
- Verify authentication is working
- Check network connectivity
- Try refreshing the page

## SQL Commands Summary

Run these in your Supabase SQL Editor:

```sql
-- 1. Add table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE newcomers;

-- 2. Create SELECT policy for authenticated users (if RLS is enabled)
CREATE POLICY "Allow authenticated users to read newcomers"
ON newcomers
FOR SELECT
TO authenticated
USING (true);

-- 3. Verify the setup
SELECT * FROM pg_publication_tables WHERE tablename = 'newcomers';
```

## Need Help?

If you're still experiencing issues:
1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Ensure your environment variables are set correctly
4. Check Supabase status page for service outages


