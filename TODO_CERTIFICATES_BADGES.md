# TODO - Event Certification & Digital Badges (#1787)

## Step 1: Prisma data model + migration

- [ ] Extend `prisma/schema.prisma` with Certificate/Verification/Template/OpenBadges models
- [ ] Generate initial Prisma migration(s)
- [ ] Ensure Prisma client compiles

## Step 2: Certificate generation

- [ ] Implement certificate code generator
- [ ] Implement QR payload + QR image generation
- [ ] Implement PDF rendering from template variables
- [ ] Implement digital signature placement
- [ ] Implement S3 upload + DB key persistence

## Step 3: Verification system

- [ ] Public verification endpoint returning attendee/event/date/completion criteria
- [ ] Admin verify/revoke endpoints + audit logging

## Step 4: OpenBadges

- [ ] Implement badge class + assertion JSON generator compliant with OpenBadges standard
- [ ] Provide embeddable badge HTML/snippet
- [ ] Provide share metadata/URLs for LinkedIn + Twitter

## Step 5: Certificate gallery + download

- [ ] User gallery endpoint (filter by event type/date)
- [ ] PDF download endpoint (high-quality)

## Step 6: Frontend minimal wiring

- [ ] Verification page UI
- [ ] Gallery page UI
- [ ] Share button UI

## Step 7: Tests

- [ ] Unit/integration tests for issuance/verification/download/openbadges
- [ ] E2E smoke tests across multiple events
