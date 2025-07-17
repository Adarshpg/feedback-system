# CSV Export with Student Names - User Guide

## Problem Solved
Previously, when exporting feedback data from MongoDB, you would get ObjectIds instead of student names, making it difficult to identify which feedback belongs to which student.

## Solution
New API endpoints that automatically populate student information and export clean CSV files with student names instead of ObjectIds.

## API Endpoints

### 1. Export All Feedbacks
```
GET /api/feedback/export-csv
```
**Description:** Downloads a CSV file containing all feedback submissions across all semesters.

**Headers Required:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:** CSV file download with filename: `feedback-export-YYYY-MM-DD.csv`

### 2. Export Specific Semester
```
GET /api/feedback/export-csv/:semester
```
**Description:** Downloads a CSV file containing feedback submissions for a specific semester (1-8).

**Example:**
```
GET /api/feedback/export-csv/1  # Export semester 1 feedbacks
GET /api/feedback/export-csv/2  # Export semester 2 feedbacks
GET /api/feedback/export-csv/3  # Export semester 3 feedbacks
```

**Response:** CSV file download with filename: `feedback-semester-X-export-YYYY-MM-DD.csv`

## CSV Structure

| Column | Description | Example |
|--------|-------------|---------|
| Student Name | Full name from User model | "John Doe" |
| Email | Student email address | "john@example.com" |
| Roll Number | Student roll number | "CS001" |
| College | College name | "ABC Engineering College" |
| Semester | Feedback semester (1-8) | 1 |
| Submission Date | When feedback was submitted | "07/17/2025" |
| Question 1 | Answer to first question | "The course was excellent..." |
| Question 2 | Answer to second question | "I would recommend..." |
| ... | Additional questions dynamically | ... |

## How to Use

### Method 1: Using Browser
1. Login to your feedback system
2. Open browser developer tools (F12)
3. Go to Application/Storage → Local Storage
4. Copy the JWT token value
5. Open a new tab and visit:
   ```
   http://localhost:5000/api/feedback/export-csv
   ```
6. Add the Authorization header or use a tool like Postman

### Method 2: Using Postman
1. Create a new GET request
2. URL: `http://localhost:5000/api/feedback/export-csv`
3. Headers:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`
4. Send the request
5. Save the response as a CSV file

### Method 3: Using curl
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/feedback/export-csv \
  -o feedback-export.csv
```

### Method 4: Using the Test Script
1. Open `backend/test-csv-export.js`
2. Replace `YOUR_JWT_TOKEN_HERE` with your actual token
3. Uncomment the last line: `testCSVExport();`
4. Run: `node test-csv-export.js`

## Features

✅ **Student Names Instead of ObjectIds** - No more cryptic ObjectIds!
✅ **Complete Student Information** - Name, email, roll number, college
✅ **Dynamic Question Headers** - Adapts to your feedback form structure
✅ **CSV-Safe Formatting** - Handles commas, quotes, and special characters
✅ **Automatic File Download** - Browser automatically downloads the file
✅ **Date Formatting** - Human-readable dates
✅ **Error Handling** - Graceful handling of missing data
✅ **Semester Filtering** - Export specific semesters only

## Sample CSV Output

```csv
Student Name,Email,Roll Number,College,Semester,Submission Date,Question 1,Question 2
"John Doe","john@example.com","CS001","ABC College",1,"07/17/2025","The course was excellent","I learned a lot"
"Jane Smith","jane@example.com","CS002","ABC College",1,"07/16/2025","Good content","More practical examples needed"
```

## Security Note
Currently, the endpoints use basic authentication middleware. For production use, consider adding admin-only access controls.

## Troubleshooting

**Error: "No feedbacks found"**
- Make sure there are feedback submissions in the database
- Check if the semester parameter is valid (1-8)

**Error: "Authorization required"**
- Ensure you're including a valid JWT token in the Authorization header
- Token format should be: `Bearer YOUR_JWT_TOKEN`

**Error: "Server error"**
- Check if the backend server is running
- Verify database connection
- Check server logs for detailed error information

## Need Help?
If you encounter any issues, check the server logs or contact the development team.
