# Time Tracking Rules

## ⏰ Daily Time Requirements

### Required Hours

- **Minimum Hours**: 8 hours per working day
- **Working Hours**: Standard working hours are tracked in IST (Asia/Kolkata timezone)
- **Grace Period**: None (entries must be logged for the correct day)

### Time Entry Thresholds

- **Maximum Single Entry**: 10 hours (entries exceeding this are flagged)
- **Maximum Gap**: 4 hours (gaps between entries exceeding this are flagged)
- **Minimum Entry Duration**: No minimum (but should be meaningful)

## 🚨 Alert Conditions

### Missing Hours Alert

- Triggered when total daily hours < 8 hours
- Calculated at the end of each working day
- Reported in the next day's morning report

### Suspicious Entry Alert

Triggered for:

- Single entries > 10 hours
- Gaps between entries > 4 hours
- Overlapping time entries
- Multiple entries in same time period

## 📅 Working Day Definition

### Standard Working Days

- Monday through Friday
- Excluding weekends (Saturday and Sunday)
- Excluding configured holidays

### Time Calculation

- Time is calculated in hours with two decimal places
- Entries are considered in IST (Asia/Kolkata) timezone
- Daily totals are calculated from 00:00 to 23:59 IST

## 🔄 Update Process

These rules should be updated when:

1. Time requirements change
2. Alert thresholds are modified
3. Working day definitions change
4. Timezone requirements change

## 📊 Reporting Schedule

### Daily Reports

- Run at 4:30 AM IST (Mon-Fri)
- Checks previous working day's entries
- Sent to configured Slack channel

### Monthly Reports

- Run at 11:30 AM IST (Every Monday)
- Summarizes current month's data
- Groups data by teams
- Includes all users regardless of daily check settings
