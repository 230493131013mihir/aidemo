# Prompt for Prashant Warule — Copy & Paste This Entire Block

```
You are fixing bugs in the HarvestMitra AI project at c:\Users\MIHIR JADAV\Desktop\aidemo
Repository: https://github.com/230493131013mihir/aidemo.git

Create a new branch: git checkout -b fix/prashant-weather-scheme-bugs

Fix ALL of the following 5 bugs:

BUG 1 — schemeService.matchSchemes() defaults state to "Gujarat" (SEVERITY: HIGH)
File: backend/services/schemeService.js, Line 570
Problem: matchSchemes() function has state = "Gujarat" as default. Maharashtra farmers won't see Maharashtra-specific schemes by default.
Fix: Change state = "Gujarat" to state = "Maharashtra" on line 570.

BUG 2 — weatherService DEMO_LOCATIONS is Gujarat-heavy (SEVERITY: MEDIUM)
File: backend/services/weatherService.js, Lines 1-9
Problem: DEMO_LOCATIONS has 3 Gujarat cities (Surat, Ahmedabad, Rajkot) but only 3 Maharashtra cities. For a Maharashtra APMC app, add more Maharashtra districts.
Fix: Add at least 3 more Maharashtra districts to DEMO_LOCATIONS:
  - kolhapur: { name: "Kolhapur", state: "Maharashtra", latitude: 16.7050, longitude: 74.2433 }
  - solapur: { name: "Solapur", state: "Maharashtra", latitude: 17.6599, longitude: 75.9064 }
  - ahmednagar: { name: "Ahmednagar", state: "Maharashtra", latitude: 19.0948, longitude: 74.7480 }

BUG 3 — weatherService rain alert defaults to Surat/Gujarat (SEVERITY: MEDIUM)
File: backend/services/weatherService.js, Lines 519-520
Problem: getRainAlerts() JSDoc shows default district='Surat', state='Gujarat'. The actual function fallback should default to Pune/Maharashtra.
Fix: Update the JSDoc to say district='Pune', state='Maharashtra'. Also check if the getWeather() function has a default — if it falls through to DEMO_LOCATIONS lookup without a match, ensure fallback is pune not surat.

BUG 4 — weatherService hardcoded Gujarat state in rain forecast data (SEVERITY: MEDIUM)
File: backend/services/weatherService.js, Lines 177, 192, 207, 222, 237
Problem: Multiple hardcoded state: 'Gujarat' values in demo rain forecast data blocks.
Fix: Change all 5 instances of state: 'Gujarat' to state: 'Maharashtra'.

BUG 5 — Scheme seed data has Gujarat-only schemes without Maharashtra equivalents (SEVERITY: LOW)
File: backend/services/schemeService.js, Lines 101-170
Problem: Contains "Gujarat i-Khedut Micro-Irrigation" and "Gujarat i-Khedut Farm Mechanization" schemes but no Maharashtra-specific equivalents.
Fix: Add at least 1 Maharashtra-specific scheme entry after the Gujarat schemes, e.g. Magel Tyala Shettale (Maharashtra farm pond scheme) with stateApplicability: "Maharashtra".

After fixing all bugs, commit with message:
fix(weather-schemes): Maharashtra-first defaults for weather and scheme matching

Then create GitHub Issues:
gh issue create --title "BUG: schemeService.matchSchemes defaults to Gujarat" --body "File: backend/services/schemeService.js:570 | Severity: HIGH | matchSchemes() defaults state to Gujarat instead of Maharashtra." --label "bug"
gh issue create --title "BUG: weatherService DEMO_LOCATIONS is Gujarat-heavy" --body "File: backend/services/weatherService.js:1-9 | Severity: MEDIUM | Only 3 Maharashtra locations vs 3 Gujarat. Need more Maharashtra coverage." --label "bug"
gh issue create --title "BUG: weatherService rain alert defaults to Surat/Gujarat" --body "File: backend/services/weatherService.js:519-520 | Severity: MEDIUM | getRainAlerts defaults district=Surat, state=Gujarat." --label "bug"
gh issue create --title "BUG: Hardcoded Gujarat state in weather demo data" --body "File: backend/services/weatherService.js:177,192,207,222,237 | Severity: MEDIUM | 5 instances of hardcoded state Gujarat in demo forecast." --label "bug"
gh issue create --title "BUG: No Maharashtra-specific schemes in seed data" --body "File: backend/services/schemeService.js:101-170 | Severity: LOW | Gujarat-only schemes present but no Maharashtra equivalents." --label "bug"

Then push and create PR:
git push origin fix/prashant-weather-scheme-bugs
gh pr create --title "fix(weather-schemes): Maharashtra-first defaults for weather and scheme services" --body "Fixes schemeService matchSchemes default, added Maharashtra districts to DEMO_LOCATIONS, rain alert defaults to Pune, fixed hardcoded Gujarat states, added Maharashtra scheme." --base main
```
