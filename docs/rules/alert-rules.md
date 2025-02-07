# Alert Rules

## 🚨 Alert Types

### 1. Missing Hours Alert

**Trigger Conditions:**

- Total daily hours < 8 hours
- Only on working days
- Excludes holidays and weekends

**Alert Format:**

- User name and email
- Total hours logged
- Missing hours amount
- Date of missing entries

### 2. Suspicious Duration Alert

**Trigger Conditions:**

- Single time entry > 10 hours
- Multiple entries in same time period
- Overlapping time entries

**Alert Format:**

- Entry details (start/end time)
- Duration of suspicious entry
- Project and task information
- User name and email

### 3. Gap Alert

**Trigger Conditions:**

- Gap between entries > 4 hours
- Only during working hours
- Excludes lunch time gaps

**Alert Format:**

- Gap start and end time
- Gap duration
- Surrounding entry details
- User name and email

## 📊 Alert Grouping

### Daily Report Grouping

- Grouped by user
- Sorted by team
- All alert types included
- Summary at top of report

### Monthly Report Grouping

- Grouped by team
- Summary of alert patterns
- Trend analysis
- Team-wise statistics

## 🔔 Notification Channels

### Slack Notifications

- Sent to configured Slack channel
- Uses formatted blocks for readability
- Includes direct links to Clockify
- Mentions relevant team leads

## 🎯 Alert Priority

### High Priority

- Missing entire day's entries
- Multiple overlapping entries
- Gaps > 8 hours

### Medium Priority

- Single missing hour alerts
- Gaps between 4-8 hours
- Long duration entries

### Low Priority

- Minor overlaps
- Suspicious patterns
- Non-standard hour distributions

## 🔄 Alert Lifecycle

### Generation

1. Alert condition detected
2. Alert data collected
3. Priority assigned
4. Notification formatted

### Delivery

1. Grouped with other alerts
2. Formatted for channel
3. Sent to Slack
4. Delivery confirmed

### Resolution

- No explicit resolution required
- Resolved by correcting time entries
- New entries automatically validated

## ⚙️ Configuration

### Thresholds

- Minimum daily hours: 8
- Maximum single entry: 10 hours
- Maximum gap: 4 hours
- Overlap tolerance: 0 minutes

### Timing

- Daily check: 4:30 AM IST
- Monthly check: 11:30 AM IST (Mondays)
- Immediate alerts: None (batch processing only)

## 🔄 Maintenance

This document should be updated when:

1. Alert thresholds change
2. New alert types are added
3. Alert format changes
4. Notification channels are modified
