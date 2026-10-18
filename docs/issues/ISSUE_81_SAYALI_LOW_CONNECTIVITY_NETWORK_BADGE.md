# ISSUE-81: Low-Connectivity Network Status Badge & Offline Cache Fallback
**Assignee:** Sayali Kulkarni (@sayalikulkarni-tech)  
**Role:** Frontend UI/UX Developer & Designer  
**Module:** Network Resilience & Offline Caching  
**Status:** Completed ✅

---

## 📌 Feature Description
Implement an ambient network connectivity indicator that reassures rural farmers that their calculations and scheme document checklists remain functional even on spotty 2G/3G connections.

### Technical Implementation:
- Built `frontend/src/components/common/NetworkStatusBadge.jsx` listening to browser `navigator.onLine`.
- Displayed unobtrusive green "🟢 Online (Live APMC)" or amber "🟠 Offline (Cached APMC Data)" badge.
- Automatic caching of last viewed mandi prices and scheme document checklists in LocalStorage.
- Smooth CSS fade transitions without intrusive popups.
