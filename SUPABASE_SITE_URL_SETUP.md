# Supabase Site URL Configuration Guide

## How to Set Site URL in Supabase Dashboard

The Site URL is crucial for OAuth redirects to work correctly. Follow these steps:

### Step 1: Access Authentication Settings

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click on **URL Configuration** (or look for "Site URL" in the settings)

### Step 2: Set Site URL

**For Local Development:**
- Set **Site URL** to: `http://localhost:3000`
- This allows OAuth callbacks to work during development

**For Production:**
- Set **Site URL** to: `https://yourdomain.com`
- Replace `yourdomain.com` with your actual production domain

### Step 3: Configure Redirect URLs

In the same **URL Configuration** section, add these **Redirect URLs**:

**For Local Development:**
```
http://localhost:3000/auth/callback
```

**For Production:**
```
https://yourdomain.com/auth/callback
```

### Step 4: Verify Google OAuth Settings

1. Go to **Authentication** → **Providers**
2. Click on **Google**
3. Ensure **Enabled** is toggled ON
4. Verify your **Client ID** and **Client Secret** are set
5. In Google Cloud Console, make sure the authorized redirect URI includes:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```

### Important Notes

- **Site URL** must match the origin of your application
- **Redirect URLs** must include the exact callback path (`/auth/callback`)
- Changes to Site URL may take a few moments to propagate
- Always test OAuth after changing these settings

### Troubleshooting

**If you get "bad_oauth_state" error:**
- Verify Site URL matches your app's origin exactly
- Check that redirect URL is added to the allowed list
- Clear browser cookies and try again

**If you get "Failed to create user profile" error:**
- Check RLS policies on the `profiles` table
- Ensure the "Users can insert own profile" policy is enabled
- Verify the user has permission to create their profile

### Quick Checklist

- [ ] Site URL set to `http://localhost:3000` (dev) or production domain
- [ ] Redirect URL `http://localhost:3000/auth/callback` added (dev)
- [ ] Google OAuth provider enabled
- [ ] Google Client ID and Secret configured
- [ ] Google Cloud Console redirect URI configured
- [ ] RLS policies allow profile creation


