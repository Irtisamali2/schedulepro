# GlossGenius Export Feature

## Overview
You can now export your appointments to GlossGenius either **selectively** (choose specific appointments) or **in bulk** (export all appointments with optional date filtering).

## API Endpoints

### 1. Export Selected Appointments
**Endpoint:** `POST /api/client/:clientId/export/glossgenius`

**Request Body:**
```json
{
  "apiKey": "your_glossgenius_api_key",
  "businessId": "your_glossgenius_business_id",
  "appointmentIds": ["apt_123", "apt_456", "apt_789"]
}
```

**Response:**
```json
{
  "success": 3,
  "failed": 0,
  "total": 3,
  "errors": []
}
```

### 2. Export All Appointments
**Endpoint:** `POST /api/client/:clientId/export/glossgenius/all`

**Request Body:**
```json
{
  "apiKey": "your_glossgenius_api_key",
  "businessId": "your_glossgenius_business_id",
  "dateFrom": "2025-01-01",  // Optional
  "dateTo": "2025-12-31"      // Optional
}
```

**Response:**
```json
{
  "success": 45,
  "failed": 2,
  "total": 47,
  "errors": [
    {
      "appointment": "John Doe",
      "error": "Service 'Haircut' not found in GlossGenius"
    }
  ]
}
```

## How It Works

### Selective Export
1. User selects specific appointments from the dashboard
2. Frontend sends appointment IDs to the API
3. Backend fetches appointment details
4. For each appointment:
   - Finds or creates the client in GlossGenius
   - Matches the service name to GlossGenius services
   - Creates the appointment in GlossGenius
5. Returns success/failure statistics

### Bulk Export
1. User chooses to export all appointments
2. Optionally specifies date range
3. Backend fetches all matching appointments
4. Exports them in batch to GlossGenius
5. Returns detailed results with any errors

## Features

### Automatic Client Matching
- The system first searches for existing clients by email in GlossGenius
- If client exists, uses that client ID
- If client doesn't exist, creates a new client automatically

### Service Mapping
- Matches service names between your system and GlossGenius
- Case-insensitive matching
- Returns error if service not found (needs manual creation in GlossGenius first)

### Error Handling
- Continues processing even if some appointments fail
- Returns detailed error messages for failed exports
- Provides success/failure statistics

## Setting Up GlossGenius Integration

### Step 1: Get API Credentials
1. Log into your GlossGenius account
2. Go to **Settings → API Access**
3. Click **Generate API Key**
4. Copy your **API Key** and **Business ID**

### Step 2: Ensure Services Exist
Before exporting, make sure all your services exist in GlossGenius:
1. Go to GlossGenius **Services** section
2. Create any missing services with exact same names
3. Service names must match (case-insensitive)

### Step 3: Test with a Few Appointments
1. Start by exporting 2-3 test appointments
2. Verify they appear correctly in GlossGenius
3. Check client details and appointment times
4. Once confirmed, proceed with bulk export

## UI Implementation Guide

To add this feature to your frontend, you can create:

### 1. Export Button on Dashboard
```typescript
const handleExportToGlossGenius = async (appointmentIds: string[]) => {
  const apiKey = prompt("Enter your GlossGenius API Key:");
  const businessId = prompt("Enter your GlossGenius Business ID:");

  if (!apiKey || !businessId) return;

  try {
    const response = await fetch(`/api/client/${clientId}/export/glossgenius`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, businessId, appointmentIds })
    });

    const result = await response.json();
    alert(`Export Complete!\nSuccess: ${result.success}\nFailed: ${result.failed}`);
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
};
```

### 2. Bulk Export Dialog
```typescript
const handleBulkExport = async () => {
  const apiKey = prompt("Enter your GlossGenius API Key:");
  const businessId = prompt("Enter your GlossGenius Business ID:");
  const dateFrom = prompt("From date (YYYY-MM-DD) - optional:");
  const dateTo = prompt("To date (YYYY-MM-DD) - optional:");

  try {
    const response = await fetch(`/api/client/${clientId}/export/glossgenius/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, businessId, dateFrom, dateTo })
    });

    const result = await response.json();

    if (result.errors.length > 0) {
      console.log('Failed exports:', result.errors);
    }

    alert(`Export Complete!\nSuccess: ${result.success}\nFailed: ${result.failed}\nTotal: ${result.total}`);
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
};
```

### 3. Checkbox Selection
Add checkboxes to your appointment list:
```tsx
const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);

// In your appointments list:
<input
  type="checkbox"
  checked={selectedAppointments.includes(appointment.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedAppointments([...selectedAppointments, appointment.id]);
    } else {
      setSelectedAppointments(selectedAppointments.filter(id => id !== appointment.id));
    }
  }}
/>

// Export button:
<button
  onClick={() => handleExportToGlossGenius(selectedAppointments)}
  disabled={selectedAppointments.length === 0}
>
  Export Selected to GlossGenius ({selectedAppointments.length})
</button>
```

## Important Notes

1. **API Rate Limits**: GlossGenius may have rate limits. For large exports, consider adding delays between requests.

2. **Service Names Must Match**: Ensure service names in your system match GlossGenius exactly.

3. **Staff Mapping**: Currently uses empty staffId. You may need to add staff mapping logic.

4. **Time Zones**: Make sure appointment times are in the correct timezone for GlossGenius.

5. **Duplicate Prevention**: The system doesn't check for duplicate appointments. Exporting twice will create duplicates.

## Troubleshooting

### "Service not found" Error
- Create the service in GlossGenius first with the exact same name
- Service matching is case-insensitive but must be exact otherwise

### "Client creation failed" Error
- Check that client email is valid
- Ensure GlossGenius API key has permission to create clients

### "API authentication failed" Error
- Verify API Key is correct and not expired
- Check Business ID is accurate
- Ensure API key has necessary permissions

## Future Enhancements

Potential improvements for the future:
- Cache GlossGenius services to reduce API calls
- Add staff member mapping/selection
- Implement duplicate detection
- Add batch processing with rate limiting
- Store GlossGenius credentials securely per user
- Add sync status tracking
- Support for updating existing appointments
- Two-way sync (import changes from GlossGenius)
