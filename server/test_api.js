const http = require('http');

const data = JSON.stringify({
  rails: [
    {
      id: "rail_1",
      type: "2-Line Steel Pipe Guardrail 1 1/2\" Sch. 40 Pipe Rails and Post",
      length: 10,
      spacing: 4
    }
  ],
  platforms: [
    {
      id: "plat_1",
      type: "Metal pan stair platform 10'-0\" wide",
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
      stairType: "Metal pan stair platform 10'-0\" wide",
      stringerType: "Std.3'-8\" to  4'-0\" wide < 14'-0\" Stingers/MC 12 X 10.6"
    }
  ],
  debug: true
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/calculate/full?debug=true',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    try {
      const parsed = JSON.parse(body);
      console.log('RESULT:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('BODY:', body);
    }
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
});

req.write(data);
req.end();
