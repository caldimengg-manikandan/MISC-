require('dotenv').config({ path: './server/.env' });
const { runAgent } = require('./server/src/ai/agent/agent');

async function test() {
  try {
    const res = await runAgent("How is scrap factor calculated?", { userId: 1, companyId: 1, role: 'admin' });
    console.log("SUCCESS:", res);
  } catch (err) {
    console.error("FAIL:", err);
  }
}

test();
