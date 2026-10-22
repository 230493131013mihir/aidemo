# Prompt for Sayali Kulkarni — Copy & Paste This Entire Block

```
You are fixing bugs in the HarvestMitra AI project at c:\Users\MIHIR JADAV\Desktop\aidemo
Repository: https://github.com/230493131013mihir/aidemo.git

Create a new branch: git checkout -b fix/sayali-frontend-speech-bugs

Fix ALL of the following 4 bugs:

BUG 1 — speechService missing Gujarati (gu) locale configuration (SEVERITY: HIGH)
File: frontend/src/services/speechService.js, Lines 8-33
Problem: SUPPORTED_LANGUAGES has 'mr' (Marathi), 'hi' (Hindi), 'en' (English) but is MISSING 'gu' (Gujarati). The file header on line 4 claims it supports Gujarati (gu-IN), and the startRecognition function on line 60 accepts 'gu' as a language option, but it will fail since there's no 'gu' entry in SUPPORTED_LANGUAGES.
Fix: Add Gujarati locale to SUPPORTED_LANGUAGES after the 'en' entry:
gu: {
  code: 'gu',
  name: 'Gujarati',
  nativeName: 'ગુજરાતી',
  speechRecognition: 'gu-IN',
  speechSynthesis: 'gu-IN',
  langTag: 'gu-IN'
}

BUG 2 — DashboardPage doesn't handle 'mandi' role workspace (SEVERITY: MEDIUM)
File: frontend/src/pages/DashboardPage.jsx
Problem: Check if DashboardPage has role-based workspace segregation for 'mandi' role. If a mandi user lands on /dashboard (e.g. via registration redirect bug), they should see mandi-specific content or be redirected to /markets. Verify the role-switch logic handles all 4 roles.
Fix: If mandi role is not handled in the dashboard role switch, add a redirect:
if (user?.role === 'mandi') { navigate('/markets'); return null; }

BUG 3 — Frontend weather display may show incorrect Gujarat state (SEVERITY: MEDIUM)
File: frontend weather display components
Problem: Weather API may return state: 'Gujarat' for Maharashtra farmers due to backend defaults. The frontend should not blindly display API state.
Fix: In the weather display components, add a defensive check — if the user's profile state is 'Maharashtra' but API returns state: 'Gujarat', prefer the user's profile state for display purposes.

BUG 4 — Frontend AuthPage missing Mandi-specific registration fields (SEVERITY: LOW)
File: frontend/src/pages/AuthPage.jsx
Problem: The registration form has farmer-specific fields (farmSizeAcres, mainCrop, etc.) and transporter fields (vehicleType, etc.) but mandi role may not have its own registration fields (mandiName, licenseNumber, etc.). If missing, mandi registration creates profiles with generic defaults only.
Fix: Verify mandi registration fields exist. If missing, add mandi-specific form fields when role === 'mandi':
  - mandiName (text input, label "APMC Mandi Name")
  - licenseNumber (text input, label "APMC License Number")
  - operatingDays (dropdown: "Mon-Sat", "Mon-Fri", "Daily")
These values should be sent in the registration API payload.

After fixing all bugs, commit with message:
fix(frontend): Gujarati speech locale + mandi role handling + weather display

Then create GitHub Issues:
gh issue create --title "BUG: speechService missing Gujarati (gu) locale" --body "File: frontend/src/services/speechService.js:8-33 | Severity: HIGH | SUPPORTED_LANGUAGES is missing gu (Gujarati) entry. Voice input in Gujarati will fail silently." --label "bug"
gh issue create --title "BUG: DashboardPage does not handle mandi role" --body "File: frontend/src/pages/DashboardPage.jsx | Severity: MEDIUM | Mandi users landing on /dashboard see farmer content instead of mandi workspace." --label "bug"
gh issue create --title "BUG: Frontend weather display shows incorrect Gujarat state" --body "File: frontend weather components | Severity: MEDIUM | Weather API may return Gujarat for Maharashtra farmers due to backend defaults." --label "bug"
gh issue create --title "BUG: Missing mandi-specific registration fields" --body "File: frontend/src/pages/AuthPage.jsx | Severity: LOW | Mandi role registration has no specific fields like mandiName and licenseNumber." --label "bug"

Then push and create PR:
git push origin fix/sayali-frontend-speech-bugs
gh pr create --title "fix(frontend): Gujarati speech locale + mandi role handling + weather display" --body "Added Gujarati (gu-IN) to SUPPORTED_LANGUAGES, DashboardPage redirects mandi role to /markets, frontend weather display uses profile state defensively, added mandi-specific registration fields." --base main
```
