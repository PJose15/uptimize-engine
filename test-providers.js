/**
 * Individual provider tests
 * Tests each provider independently to ensure they work correctly
 */

const http = require('http');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

async function makeRequest(task, testName) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const data = JSON.stringify({ task });

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

        console.log(`\n${colors.cyan}${colors.bright}Test: ${testName}${colors.reset}`);
        console.log(`${colors.blue}Task: ${task}${colors.reset}`);

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const latency = Date.now() - startTime;
                try {
                    const parsed = JSON.parse(responseData);
                    const status = parsed.success ?
                        `${colors.green}✓ SUCCESS${colors.reset}` :
                        `${colors.red}✗ FAILED${colors.reset}`;

                    console.log(`${status} - ${latency}ms`);

                    if (parsed.success && parsed.data) {
                        console.log(`${colors.green}Provider: ${parsed.data.provider}${colors.reset}`);
                        console.log(`${colors.green}Model: ${parsed.data.model}${colors.reset}`);
                        console.log(`${colors.green}Tokens: ${parsed.data.tokensUsed || 'N/A'}${colors.reset}`);
                    } else if (parsed.error) {
                        console.log(`${colors.red}Error Type: ${parsed.error.type}${colors.reset}`);
                        console.log(`${colors.red}Details: ${parsed.error.details?.substring(0, 100)}...${colors.reset}`);
                    }

                    resolve({ success: parsed.success, latency, data: parsed });
                } catch (error) {
                    console.log(`${colors.red}✗ PARSE ERROR${colors.reset}`);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`${colors.red}✗ REQUEST ERROR${colors.reset}`, error.message);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.bright}  Provider Tests${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}`);

    const tests = [
        {
            name: 'Simple Question',
            task: 'What is 2+2?',
        },
        {
            name: 'Creative Task',
            task: 'Write a haiku about coding',
        },
        {
            name: 'Complex Reasoning',
            task: 'Explain why the sky is blue in 2 sentences',
        },
    ];

    for (const test of tests) {
        try {
            await makeRequest(test.task, test.name);
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`${colors.red}Test failed:${colors.reset}`, error.message);
        }
    }

    console.log(`\n${colors.bright}${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.bright}  Tests Complete${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}========================================${colors.reset}\n`);
}

// Check server and run tests
console.log(`${colors.yellow}Connecting to http://localhost:3000...${colors.reset}\n`);
const testReq = http.request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' }, (res) => {
    console.log(`${colors.green}Server is running!${colors.reset}\n`);
    runTests().catch(console.error);
});
testReq.on('error', (e) => {
    console.error(`${colors.red}Server is not running. Please start with: npm run dev${colors.reset}`);
    process.exit(1);
});
testReq.end();
