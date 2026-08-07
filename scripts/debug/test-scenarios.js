const http = require('http');

// ANSI color codes for better readability
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

/**
 * Make a test request to the API
 */
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

        console.log(`\n${colors.cyan}${colors.bright}Running: ${testName}${colors.reset}`);
        console.log(`${colors.blue}Task: ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}${colors.reset}`);

        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                const latency = Date.now() - startTime;
                try {
                    const parsed = JSON.parse(responseData);
                    const status = res.statusCode === 200 ?
                        `${colors.green}✓ PASS${colors.reset}` :
                        `${colors.red}✗ FAIL${colors.reset}`;

                    console.log(`${status} (${res.statusCode}) - ${latency}ms`);
                    console.log(`${colors.yellow}Response:${colors.reset}`, JSON.stringify(parsed, null, 2));

                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        statusCode: res.statusCode,
                        latency,
                        data: parsed,
                    });
                } catch (error) {
                    console.log(`${colors.red}✗ PARSE ERROR${colors.reset}`);
                    console.log(`Raw response: ${responseData}`);
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

/**
 * Run all test scenarios
 */
async function runTests() {
    console.log(`${colors.bright}${colors.cyan}==================================${colors.reset}`);
    console.log(`${colors.bright}  Agent Orchestrator API Tests${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}==================================${colors.reset}`);

    const tests = [
        {
            name: 'Valid Request - Simple Task',
            task: 'What is the capital of France?',
            expectSuccess: true,
        },
        {
            name: 'Valid Request - Complex Task',
            task: 'Explain the theory of relativity in simple terms and provide 3 key takeaways.',
            expectSuccess: true,
        },
        {
            name: 'Empty Task',
            task: '',
            expectSuccess: false,
        },
        {
            name: 'Very Short Task',
            task: 'Hi',
            expectSuccess: true,
        },
        {
            name: 'Long Task',
            task: 'A'.repeat(1000) + ' What does this mean?',
            expectSuccess: true,
        },
        {
            name: 'Very Long Task (Should Fail)',
            task: 'A'.repeat(60000),
            expectSuccess: false,
        },
    ];

    const results = [];

    for (const test of tests) {
        try {
            const result = await makeRequest(test.task, test.name);
            const passed = test.expectSuccess ? result.success : !result.success;
            results.push({ ...test, passed, result });

            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`${colors.red}Test failed with error:${colors.reset}`, error);
            results.push({ ...test, passed: false, error });
        }
    }

    // Summary
    console.log(`\n${colors.bright}${colors.cyan}==================================${colors.reset}`);
    console.log(`${colors.bright}  Test Summary${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}==================================${colors.reset}`);

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Total: ${results.length}`);

    if (failed > 0) {
        console.log(`\n${colors.red}Failed tests:${colors.reset}`);
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}`);
        });
    }
}

// Run tests if server is available
console.log(`${colors.yellow}Checking if server is running on http://localhost:3000...${colors.reset}`);
const testReq = http.request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' }, (res) => {
    console.log(`${colors.green}Server is running!${colors.reset}\n`);
    runTests().catch(console.error);
});
testReq.on('error', (e) => {
    console.error(`${colors.red}Server is not running. Please start with: npm run dev${colors.reset}`);
    process.exit(1);
});
testReq.end();
