const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log('--- Raw .env.local content ---');
        content.split('\n').forEach((line, idx) => {
            if (line.includes('GEMINI')) {
                const [key, value] = line.split('=');
                console.log(`Line ${idx + 1}: ${key}=${value ? value.substring(0, 10) + '...' + value.substring(value.length - 5) : '(empty)'}`);
                console.log(`  Full length: ${value ? value.trim().length : 0} characters`);
                console.log(`  Starts with: ${value ? value.substring(0, 15) : '(none)'}`);
            }
        });
    } else {
        console.log('.env.local does NOT exist.');
    }
} catch (error) {
    console.error('Error:', error);
}
