const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log('--- .env.local content (masked) ---');
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                const masked = value.trim().substring(0, 5) + '...';
                console.log(`${key}=${masked}`);
            } else {
                console.log(line);
            }
        });
        console.log('-----------------------------------');
    } else {
        console.log('.env.local does NOT exist.');
    }
} catch (error) {
    console.error('Error reading .env.local:', error);
}
