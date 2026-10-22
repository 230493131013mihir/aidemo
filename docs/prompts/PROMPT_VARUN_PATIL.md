# Prompt for Varun Patil — Copy & Paste This Entire Block

```
You are fixing bugs in the HarvestMitra AI project at c:\Users\MIHIR JADAV\Desktop\aidemo
Repository: https://github.com/230493131013mihir/aidemo.git

Create a new branch: git checkout -b fix/varun-transport-ai-bugs

Fix ALL of the following 4 bugs:

BUG 1 — Missing admin-level transport request listing endpoint (SEVERITY: HIGH)
File: backend/routes/transport.routes.js
Problem: There is no admin-accessible endpoint to list ALL transport requests across all farmers. The admin panel has a Transport tab but no backend API to fetch all transport data. Only farmer-scoped /my-requests and /incoming-requests (transporter) exist.
Fix: Add a new route after the transporter-stats route (around line 1140):
router.get("/admin/all-requests", requireRole("admin"), async (req, res) => {
  try {
    const allRequests = await TransportRequest.findAll({
      include: [{ model: User, as: 'farmer', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json({ success: true, requests: allRequests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

BUG 2 — AI fallbackEngine defaults location to "Gujarat" (SEVERITY: MEDIUM)
File: backend/services/ai/fallbackEngine.js, Line 304
Problem: const location = farmer.location || 'Gujarat' should default to 'Maharashtra'.
Fix: Change 'Gujarat' to 'Maharashtra' on line 304.

BUG 3 — AI fallbackEngine scheme recommendation shows Gujarat i-Khedut only (SEVERITY: MEDIUM)
File: backend/services/ai/fallbackEngine.js, Lines 366-372, 417
Problem: Hardcoded Gujarat i-Khedut Portal references in AI responses. When Maharashtra farmers ask about schemes, the AI recommends Gujarat portal.
Fix: Add Maharashtra-specific portal reference alongside Gujarat:
  - Add "Maharashtra Mahadbt Portal (https://mahadbt.maharashtra.gov.in/)" as primary recommendation
  - Keep Gujarat i-Khedut as secondary for Gujarat farmers
  - On line 417, add: "Maharashtra MahaDBT: Farm subsidies, tractor aid (https://mahadbt.maharashtra.gov.in/)" before or alongside Gujarat entry

BUG 4 — AI contextBuilder defaults location to "Gujarat" (SEVERITY: MEDIUM)
File: backend/services/ai/contextBuilder.js, Line 37
Problem: location: farmer.location || farmer.district || 'Gujarat' should fallback to 'Maharashtra'.
Fix: Change 'Gujarat' to 'Maharashtra' on line 37.

After fixing all bugs, commit with message:
fix(transport-ai): admin transport listing + Maharashtra AI context defaults

Then create GitHub Issues:
gh issue create --title "BUG: Missing admin transport request listing endpoint" --body "File: backend/routes/transport.routes.js | Severity: HIGH | No admin-accessible endpoint to list all transport requests. Admin panel Transport tab has no backend API." --label "bug"
gh issue create --title "BUG: AI fallbackEngine defaults location to Gujarat" --body "File: backend/services/ai/fallbackEngine.js:304 | Severity: MEDIUM | farmer.location fallback is Gujarat instead of Maharashtra." --label "bug"
gh issue create --title "BUG: AI scheme recommendation shows Gujarat i-Khedut only" --body "File: backend/services/ai/fallbackEngine.js:366-372,417 | Severity: MEDIUM | AI recommends Gujarat portal to Maharashtra farmers. Should include Maharashtra MahaDBT." --label "bug"
gh issue create --title "BUG: AI contextBuilder defaults location to Gujarat" --body "File: backend/services/ai/contextBuilder.js:37 | Severity: MEDIUM | location fallback is Gujarat instead of Maharashtra." --label "bug"

Then push and create PR:
git push origin fix/varun-transport-ai-bugs
gh pr create --title "fix(transport-ai): Admin transport listing + Maharashtra AI defaults" --body "Added admin transport request listing endpoint, AI fallbackEngine and contextBuilder default location changed to Maharashtra, added Maharashtra MahaDBT portal to AI scheme recommendations." --base main
```
