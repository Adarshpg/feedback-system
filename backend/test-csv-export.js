const axios = require('axios');
const fs = require('fs');

// Test script to demonstrate CSV export with student names
async function testCSVExport() {
    try {
        console.log('🧪 Testing CSV Export with Student Names...\n');
        
        // You'll need to replace this with a valid JWT token from a logged-in user
        const token = 'YOUR_JWT_TOKEN_HERE';
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Test 1: Export all feedbacks
        console.log('📊 Testing: Export All Feedbacks');
        console.log('Endpoint: GET /api/feedback/export-csv');
        console.log('Expected: CSV file with student names instead of ObjectIds\n');
        
        try {
            const response = await axios.get('http://localhost:5000/api/feedback/export-csv', { headers });
            console.log('✅ Success! CSV Content Preview:');
            console.log(response.data.substring(0, 500) + '...\n');
            
            // Save to file
            fs.writeFileSync('all-feedbacks-export.csv', response.data);
            console.log('💾 Saved to: all-feedbacks-export.csv\n');
        } catch (error) {
            console.log('❌ Error:', error.response?.data || error.message);
        }

        // Test 2: Export specific semester
        console.log('📊 Testing: Export Semester 1 Feedbacks');
        console.log('Endpoint: GET /api/feedback/export-csv/1');
        console.log('Expected: CSV file with only semester 1 feedbacks\n');
        
        try {
            const response = await axios.get('http://localhost:5000/api/feedback/export-csv/1', { headers });
            console.log('✅ Success! CSV Content Preview:');
            console.log(response.data.substring(0, 500) + '...\n');
            
            // Save to file
            fs.writeFileSync('semester-1-feedbacks-export.csv', response.data);
            console.log('💾 Saved to: semester-1-feedbacks-export.csv\n');
        } catch (error) {
            console.log('❌ Error:', error.response?.data || error.message);
        }

        console.log('🎉 CSV Export Test Complete!');
        console.log('\n📋 CSV Structure:');
        console.log('- Student Name (instead of ObjectId)');
        console.log('- Email');
        console.log('- Roll Number'); 
        console.log('- College Name');
        console.log('- Semester');
        console.log('- Submission Date');
        console.log('- Question 1, Question 2, etc. (dynamic based on feedback)');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Instructions for usage
console.log('🔧 SETUP INSTRUCTIONS:');
console.log('1. Make sure your backend server is running on port 5000');
console.log('2. Replace YOUR_JWT_TOKEN_HERE with a valid JWT token');
console.log('3. Run: node test-csv-export.js');
console.log('4. Check the generated CSV files\n');

// Uncomment the line below to run the test (after adding a valid token)
// testCSVExport();

module.exports = { testCSVExport };
