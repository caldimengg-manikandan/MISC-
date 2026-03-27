const axios = require('axios');

async function test() {
  try {
    const payload = {
      rails: [{
        type: 'WALL_RAIL',
        railType: '1-Line Wall Railing wall bolted - 1 1/4" SCH 40 pipe',
        length: 10
      }],
      platforms: [],
      stairs: []
    };

    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    const res = await axios.post('http://localhost:5000/api/calculate/full', payload);
    console.log('Response structure:', Object.keys(res.data));
    console.log('Breakdown structure:', Object.keys(res.data.breakdown));
    console.log('Rail 0 systemCalc:', res.data.breakdown.rails[0].systemCalc);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) console.error('Data:', err.response.data);
    process.exit(1);
  }
}

test();
