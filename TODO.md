# TODO - Compliance & Accessibility Audit Tools (#1801)

## Step 0: Confirm scope

- [x] Identified existing compliance/GDPR doc+request system (not audit tools)
- [x] Agreed to implement new audit-tools subsystem (no changes to existing doc/GDPR request flow)

## Step 1: Add data model + persistence

- [x] Add DB schema for:
  - Audit runs
  - Issues (severity, evidence, recommended fixes)
  - Remediation assignments + statuses + deadlines
  - Trends metrics
  - Auditor export records (run snapshots)

## Step 2: Implement audit engines

- [x] WCAG 2.1 AA automated scanning (axe-core via Playwright)
- [x] GDPR compliance checklist engine
- [x] PCI compliance checker (guidance + SSL/TLS + security placeholders)

## Step 3: Report generation

- [ ] Replace placeholder PDF implementation with real PDF output (or rename endpoint to text if PDF not added)

## Step 4: Auditor export

- [ ] Add auditor export endpoints to provide a complete audit snapshot (JSON) and a downloadable artifact (CSV where applicable)

## Step 5: API endpoints

- [x] Admin endpoints to:
  - trigger scans / get scan status
  - list issues
  - assign remediations
  - update remediation status + deadlines
  - download run PDF report
  - view trends
- [ ] Add endpoints to:
  - export full audit snapshot for auditors (run-level)
  - fetch audit run status asynchronously if scan becomes queued

## Step 6: Weekly automated scans + alerts

- [ ] Scheduler job to run weekly scans
- [ ] Store trend deltas (new vs resolved issues) per run_type
- [ ] Alert admins on new Critical/Serious issues

## Step 7: Re-audit after fixes

- [ ] Implement “re-audit after remediation” workflow (auto trigger when remediation marked done)

## Step 8: Testing

- [ ] Full audit cycle tests:
  - run scan
  - validate issues/evidence shape
  - validate report generation endpoint returns correct Content-Type
  - validate assignment updates
  - validate export payload completeness
- [ ] Weekly scan scheduler smoke test
