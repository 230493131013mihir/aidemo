# Prompt for Mihir Jadav — Copy & Paste This Entire Block

```
You are fixing bugs in the HarvestMitra AI project at c:\Users\MIHIR JADAV\Desktop\aidemo
Repository: https://github.com/230493131013mihir/aidemo.git

Create a new branch: git checkout -b fix/mihir-backend-core-bugs

Fix ALL of the following 5 bugs:

BUG 1 — Registration redirects all roles to /dashboard (SEVERITY: HIGH)
File: frontend/src/pages/AuthPage.jsx, Line 330
Problem: After successful registration, navigate('/dashboard') is hardcoded for ALL roles. Transporter should go to /transport, Mandi to /markets, Admin to /admin.
Fix: Replace the single navigate('/dashboard') on line 330 with role-based routing logic:
  - if role === 'admin' → navigate('/admin')
  - if role === 'transporter' → navigate('/transport')
  - if role === 'mandi' → navigate('/markets')
  - else → navigate('/dashboard')

BUG 2 — Admin Price Form defaults state to "Gujarat" instead of "Maharashtra" (SEVERITY: MEDIUM)
File: frontend/src/pages/AdminPage.jsx, Line 71
Problem: priceForm initializes with state: 'Gujarat' but the entire app is Maharashtra APMC focused.
Fix: Change state: 'Gujarat' to state: 'Maharashtra' on line 71.

BUG 3 — marketPriceService fallback state is "Gujarat" (SEVERITY: MEDIUM)
File: backend/services/marketPriceService.js, Line 226
Problem: state: item.Market?.state || "Gujarat" — fallback should be "Maharashtra" since all APMCs are Maharashtra.
Fix: Change "Gujarat" to "Maharashtra" on line 226.

BUG 4 — farmReportService defaults to Gujarat/Surat/Bardoli (SEVERITY: MEDIUM)
File: backend/services/farmReportService.js, Lines 17-21, 27-28
Problem: Default farmer is 'Ramesh Patel' from 'Bardoli', 'Surat', 'Gujarat' and local mandi is 'Surat APMC Mandi'. All should be Maharashtra defaults.
Fix: Change defaults to:
  - farmerName: 'Ramesh Patil' (Maharashtra naming)
  - village: 'Haveli'
  - district: 'Pune'
  - state: 'Maharashtra'
  - localMandi: 'Pune APMC Mandi (Gultekdi)'

BUG 5 — distanceFromSuratKm field name is Surat-specific (SEVERITY: LOW)
File: backend/services/marketPriceService.js, Line 227
Problem: distanceFromSuratKm references Surat but the app serves Maharashtra.
Fix: Add an alias: distanceKm: Number(item.Market?.distanceFromSuratKm || 0) so frontend can migrate to the generic name.

After fixing all bugs, commit with message:
fix(core): role-based registration redirect + Maharashtra state defaults

Then create GitHub Issues:
gh issue create --title "BUG: Registration redirects all roles to /dashboard" --body "File: frontend/src/pages/AuthPage.jsx:330 | Severity: HIGH | After registration, all roles redirect to /dashboard instead of role-specific page." --label "bug"
gh issue create --title "BUG: Admin Price Form defaults to Gujarat state" --body "File: frontend/src/pages/AdminPage.jsx:71 | Severity: MEDIUM | priceForm state defaults to Gujarat instead of Maharashtra." --label "bug"
gh issue create --title "BUG: marketPriceService fallback state is Gujarat" --body "File: backend/services/marketPriceService.js:226 | Severity: MEDIUM | Fallback state Gujarat should be Maharashtra." --label "bug"
gh issue create --title "BUG: farmReportService defaults to Gujarat farmer profile" --body "File: backend/services/farmReportService.js:17-28 | Severity: MEDIUM | Default farmer uses Gujarat data instead of Maharashtra." --label "bug"
gh issue create --title "BUG: distanceFromSuratKm field is Surat-specific" --body "File: backend/services/marketPriceService.js:227 | Severity: LOW | Field name references Surat but app serves Maharashtra." --label "bug"

Then push and create PR:
git push origin fix/mihir-backend-core-bugs
gh pr create --title "fix(core): Role-based registration redirect + Maharashtra state defaults" --body "Fixes registration role redirect, Admin form Gujarat to Maharashtra, marketPriceService and farmReportService state defaults, distance field alias." --base main
```
