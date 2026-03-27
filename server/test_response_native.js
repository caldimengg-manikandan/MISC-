const http = require('http');

const payload = JSON.stringify({
  rails: [{
    type: 'WALL_RAIL',
    railType: '1-Line Wall Railing wall bolted - 1 1/4" SCH 40 pipe',
    length: 10
  }],
  platforms: [],
  stairs: []
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/calculate/full',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Response Keys:', Object.keys(parsed));
      console.log('Breakdown Keys:', parsed.breakdown ? Object.keys(parsed.breakdown) : 'MISSING');
      if (parsed.breakdown && parsed.breakdown.rails[0]) {
        console.log('Rail systemCalc:', parsed.breakdown.rails[0].systemCalc);
      }
      process.exit(0);
    } catch (e) {
      console.error('Error parsing response:', e.message);
      console.log('Raw output:', data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  process.exit(1);
});

req.write(payload);
req.end();
