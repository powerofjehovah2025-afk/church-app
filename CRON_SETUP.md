# Cron Job Setup Guide

## Overview
This project uses Vercel Cron Jobs to automatically run scheduled tasks. Two cron jobs are configured:

1. **Rota Reminders** - Sends reminders for upcoming service duties (14 days and 2 days before)
2. **Follow-up Reminders** - Checks for overdue follow-ups and sends notifications

## Configuration

### vercel.json
The cron jobs are configured in `vercel.json`:
- Both jobs run daily at 9:00 AM UTC
- Schedule format: `"0 9 * * *"` (minute hour day month weekday)

### Environment Variables Required

You need to set the `CRON_SECRET` environment variable in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `CRON_SECRET`
   - **Value**: Generate a secure random string (e.g., use `openssl rand -hex 32`)
   - **Environment**: Production, Preview, Development (or just Production)

### Schedule Format

The schedule uses cron syntax:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, where 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Current Schedule**: `0 9 * * *` = Every day at 9:00 AM UTC

### Changing the Schedule

To change when the cron jobs run, edit `vercel.json`:

**Examples:**
- `"0 9 * * *"` - Daily at 9 AM UTC
- `"0 9 * * 1"` - Every Monday at 9 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 9,17 * * *"` - At 9 AM and 5 PM daily

### Testing Cron Jobs

You can test the cron endpoints manually:

```bash
# Test follow-up reminders
curl -X GET "https://your-domain.vercel.app/api/cron/followup-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test rota reminders
curl -X GET "https://your-domain.vercel.app/api/cron/rota-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Security

Both cron endpoints require the `CRON_SECRET` to be sent in the Authorization header:
```
Authorization: Bearer YOUR_CRON_SECRET
```

This prevents unauthorized access to the endpoints.

### Monitoring

After deployment, you can monitor cron job executions in:
- Vercel Dashboard → **Deployments** → Click on a deployment → **Functions** tab
- Check the logs for successful executions or errors

### Troubleshooting

**Cron job not running?**
1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check that `vercel.json` is committed and deployed
3. Verify the schedule syntax is correct
4. Check Vercel deployment logs for errors

**Getting 401 Unauthorized?**
- Ensure `CRON_SECRET` environment variable matches what Vercel sends
- Check that the Authorization header format is correct

**Cron job running but not working?**
- Check the function logs in Vercel dashboard
- Verify database connections are working
- Ensure all required environment variables are set

