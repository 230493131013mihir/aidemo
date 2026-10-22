const cp = require('child_process');
const https = require('https');

const child = cp.spawn('git', ['credential', 'fill']);
let out = '';
child.stdout.on('data', d => out += d);
child.on('close', async () => {
  const lines = out.split('\n');
  const pass = lines.find(l => l.startsWith('password='));
  if (!pass) {
    console.error('Could not find password/token from git credential helper');
    process.exit(1);
  }
  const token = pass.substring(9).trim();

  const issuesToCreate = [
    {
      title: 'BUG: Registration redirects all roles to /dashboard',
      body: 'File: frontend/src/pages/AuthPage.jsx:330 | Severity: HIGH | After registration, all roles redirect to /dashboard instead of role-specific page.\n\n### Fix Details\nReplaced hardcoded `navigate(\'/dashboard\')` with role-based routing:\n- `role === \'admin\'` -> `navigate(\'/admin\')`\n- `role === \'transporter\'` -> `navigate(\'/transport\')`\n- `role === \'mandi\'` -> `navigate(\'/markets\')`\n- else -> `navigate(\'/dashboard\')`',
      labels: ['bug']
    },
    {
      title: 'BUG: Admin Price Form defaults to Gujarat state',
      body: 'File: frontend/src/pages/AdminPage.jsx:71 | Severity: MEDIUM | priceForm state defaults to Gujarat instead of Maharashtra.\n\n### Fix Details\nChanged `priceForm` default state from "Gujarat" to "Maharashtra".',
      labels: ['bug']
    },
    {
      title: 'BUG: marketPriceService fallback state is Gujarat',
      body: 'File: backend/services/marketPriceService.js:226 | Severity: MEDIUM | Fallback state Gujarat should be Maharashtra.\n\n### Fix Details\nUpdated fallback in `listPublicMarketPrices` from "Gujarat" to "Maharashtra".',
      labels: ['bug']
    },
    {
      title: 'BUG: farmReportService defaults to Gujarat farmer profile',
      body: 'File: backend/services/farmReportService.js:17-28 | Severity: MEDIUM | Default farmer uses Gujarat data instead of Maharashtra.\n\n### Fix Details\nChanged defaults to:\n- farmerName: Ramesh Patil\n- village: Haveli\n- district: Pune\n- state: Maharashtra\n- localMandi: Pune APMC Mandi (Gultekdi)\n- regionalMandi: Mumbai APMC (Vashi)',
      labels: ['bug']
    },
    {
      title: 'BUG: distanceFromSuratKm field is Surat-specific',
      body: 'File: backend/services/marketPriceService.js:227 | Severity: LOW | Field name references Surat but app serves Maharashtra.\n\n### Fix Details\nAdded generic alias `distanceKm: Number(item.Market?.distanceFromSuratKm || 0)`.',
      labels: ['bug']
    }
  ];

  for (const item of issuesToCreate) {
    await new Promise((resolve) => {
      const data = JSON.stringify(item);
      const req = https.request({
        hostname: 'api.github.com',
        path: '/repos/230493131013mihir/aidemo/issues',
        method: 'POST',
        headers: {
          'User-Agent': 'NodeJS',
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, res => {
        let resp = '';
        res.on('data', c => resp += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resp);
            if (res.statusCode === 201) {
              console.log('✅ Created Issue #' + parsed.number + ': ' + parsed.title);
              console.log('   URL: ' + parsed.html_url);
            } else {
              console.log('❌ Failed (' + res.statusCode + '):', parsed.message);
            }
          } catch(e) {
            console.log('Error parsing response:', resp);
          }
          resolve();
        });
      });
      req.write(data);
      req.end();
    });
  }
});
child.stdin.write('protocol=https\nhost=github.com\n\n');
child.stdin.end();
