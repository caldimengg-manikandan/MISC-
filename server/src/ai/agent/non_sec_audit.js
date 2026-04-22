const { runAgent } = require('./agent');

async function testNonSec() {
  const context = {
    userId: 1, 
    companyId: 1,
    role: 'estimator', // For testing routing and SQL restrictions
    ip: '127.0.0.1'
  };

  const queries = [
    // 1. SQL Bug
    "what is the total cost of project misc?",
    // 2. SQL Bug
    "show my upcoming deadlines",
    // 3. Routing Bug
    "what are my current projects?",
    // 4. False Positive
    "how is scrap factor calculated?",
    // 5. Greeting
    "good morning"
  ];

  let passed = 0;
  for (const q of queries) {
    console.log(`\n▶ Query: "${q}"`);
    try {
      const response = await runAgent(q, context);
      console.log(`Intent: ${response.intent}`);
      if (response.intent !== 'SECURITY_BLOCK' && response.intent !== 'ERROR') {
        passed++;
        console.log(`Result: PASS (${response.intent})`);
      } else {
        console.log(`Result: FAIL`);
      }
    } catch (err) {
      console.error(`Result: ERROR -> ${err.message}`);
    }
  }
  process.exit(0);
}
testNonSec();
