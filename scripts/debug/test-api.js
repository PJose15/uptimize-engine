const http = require('http');

const startTime = Date.now();
const data = JSON.stringify({ task: 'What is the capital of France?' });

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/agents/run',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Making request to /api/agents/run...\n');

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    console.log('\nResponse Body:');

    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        const latency = Date.now() - startTime;
        try {
            const parsed = JSON.parse(responseData);
            console.log(JSON.stringify(parsed, null, 2));
            console.log(`\n✓ Request completed in ${latency}ms`);
        } catch (e) {
            console.log(responseData);
            console.log(`\n✗ Failed to parse JSON response`);
        }
    });
});

req.on('error', (e) => {
    console.error(`✗ Request failed:`, e.message);
});

req.write(data);
req.end();
