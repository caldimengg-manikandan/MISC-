const axios = require('axios');

const testPayload = {
  debug: true,
  rails: [
    {
      id: "rail_1",
      type: "2-Line Steel Pipe Guardrail 1.5 SCH40",
      length: 10,
      spacing: 4
    }
  ],
  platforms: [
    {
      id: "plat_1",
      type: "Metal Pan Stair Platform",
      length: 5,
      width: 5,
      quantity: 1
    }
  ],
  stairs: [
    {
      id: "stair_1",
      risers: 14,
      run: 11,
      width: 4.33,
      stringerType: "MC12x10.6"
    }
  ]
};

async function runTest() {
  try {
    const response = await axios.post('http://localhost:5000/api/calculation/full?debug=true', testPayload);
    console.log('✅ API Response Received');
    console.log('Costs:', JSON.stringify(response.data.costs, null, 2));
    if (response.data.formulaTrace) {
      console.log('Formula Trace (First Item):', JSON.stringify(response.data.formulaTrace[0], null, 2));
    }
    
    // Check for separate weights
    const railResult = response.data.breakdown.rails[0];
    console.log('Rail Breakdown:', {
      baseWeight: railResult.baseWeight,
      scrapWeight: railResult.scrapWeight,
      totalWeight: railResult.totalWeight
    });

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
  }
}

runTest();
