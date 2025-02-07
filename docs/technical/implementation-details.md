# Implementation Details

## 🔄 Rate Limiting

### Clockify API

- Requests are queued with 50ms delay between requests
- Batch processing of users (5 users per batch)
- 1-second delay between batches
- Auto-retry on rate limit (429) responses

## 📊 Data Processing

### Time Calculations

- All times are stored in UTC
- All business logic uses IST (Asia/Kolkata)
- Hours are rounded to 2 decimal places
- Time entries are sorted chronologically for analysis

### Pagination

- Time entries are fetched in pages of 50
- Automatic handling of multiple pages
- Continues until no more entries are found

## 👥 User Management

### User Configuration

- Stored in `users.json`
- Each user has:
  - `id`: Clockify user ID
  - `name`: Display name
  - `email`: Email address
  - `checkEnabled`: Whether to include in daily checks
  - `requiredHours`: Daily hours requirement (default: 8)
  - `notifySlack`: Whether to send Slack notifications
  - `team`: Team assignment

### Team Structure

- teamAlpha
- teamBravo
- teamCharlie
- teamDelta
- teamMobileApp
- teamZenuProject
- teamInfra
- teamDataAndAnalytics

## 🔔 Notification System

### Slack Message Formatting

- Uses Slack Block Kit for rich formatting
- Team-specific emojis for visual distinction
- Hierarchical organization (Team → Member → Details)
- Timestamps in IST format

### Alert Types

1. Individual Notifications

   - Direct messages for personal time issues
   - Includes specific entry details
   - Links to Clockify entries

2. Daily Summary

   - Grouped by team
   - Missing entries section
   - Suspicious entries section
   - Generated at 4:30 AM IST

3. Monthly Report
   - Team-wise grouping
   - Total hours comparison
   - Progress tracking
   - Generated at 11:30 AM IST (Mondays)

## ⚙️ Error Handling

### API Errors

- Automatic retry on rate limits
- Error logging with context
- Graceful degradation on partial failures
- Batch isolation (single user failure doesn't affect others)

### Data Validation

- Invalid date format handling
- Missing entry detection
- Duplicate entry checking
- Timezone conversion safety

## 🔄 Process Flow

### Daily Check

1. Get previous working day
2. Fetch enabled users
3. Process in batches
4. Analyze time entries
5. Send notifications

### Monthly Check

1. Calculate month range
2. Fetch all users
3. Process in batches
4. Group by teams
5. Calculate expected hours
6. Send monthly report
