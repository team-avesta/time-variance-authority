# Holiday Management Rules

## 📅 Holiday Configuration

### Format Requirements

- Dates must be in `YYYY-MM-DD` format
- Multiple dates are comma-separated
- No spaces between dates in configuration
- Example: `2025-03-14,2025-08-15,2025-10-02`

### Configuration Location

- Stored in Lambda environment variable: `HOLIDAYS`
- Can be updated through AWS Lambda configuration
- Changes take effect immediately after update

## 🎯 Holiday Impact

### Time Tracking

- No time entries required on holidays
- Holiday dates are excluded from:
  - Daily checks
  - Working days calculations
  - Missing hours alerts

### Reporting

- Holidays are skipped in daily reports
- Monthly reports account for holidays in total hour calculations
- Previous working day calculations skip holidays

## 🔄 Holiday Update Process

### Adding New Holidays

1. Format new holiday dates in `YYYY-MM-DD`
2. Append to existing holiday list with comma
3. Update Lambda environment variable
4. No deployment needed - takes effect immediately

### Removing Holidays

1. Remove date from comma-separated list
2. Ensure no trailing/leading commas
3. Update Lambda environment variable
4. Takes effect immediately

## ⚠️ Important Considerations

### Timezone

- All holiday dates are considered in IST (Asia/Kolkata)
- Holiday period is full day (00:00 to 23:59 IST)

### Validation

- Invalid date formats will be ignored
- Duplicate dates are automatically handled
- Weekend holidays should still be included for clarity

## 📝 Current Holiday List (2025)

- March 14, 2025 (Friday)
- August 9, 2025 (Saturday)
- August 15, 2025 (Friday)
- August 16, 2025 (Saturday)
- October 2, 2025 (Thursday)

## 🔄 Maintenance

This document should be updated when:

1. New holidays are added
2. Holiday dates change
3. Holiday handling logic changes
4. Date format requirements change
