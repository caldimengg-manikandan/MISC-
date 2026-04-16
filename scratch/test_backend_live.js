const fetch = require('node-fetch');

async function testCalc() {
  const payload = {
    stairs: [
      {
        id: 'test-stair',
        stairWidth: '5 ft',
        rise: '7 in',
        run: '11 in',
        totalHeight: '48 in',
        numRisers: 7,
        stringerSize: 'MC 12 x 10.6',
        finish: 'Primer',
        mountingType: 'Anchored'
      }
    ],
    config: {
      mounting_anchored_rate: 6.00,
      steel_price_per_lb: 0.75,
      anchor_bolt_rate: 0.025
    }
  };

  try {
    const res = await fetch('http://localhost:5000/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log('Result for Stair (Anchored):');
    const stair = data.breakdown.stairs[0];
    console.log('Steel Weight:', stair.systemCalc.totalSteel);
    console.log('POR ROK:', stair.systemCalc.porRokCost);
    console.log('Anchor Bolts:', stair.systemCalc.anchorBoltsCost);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testCalc();
