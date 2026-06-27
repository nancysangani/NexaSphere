// Placeholder OpenBadges generator for #1787.
// TODO: make it OpenBadges standard-compliant (BadgeClass + Assertion).

export function buildBadgeClass({ name = 'Workshop Badge', imageUrl = '' } = {}) {
  return {
    id: '',
    type: 'Assertion',
    name,
    image: imageUrl,
  };
}

export function buildBadgeAssertion({ badgeId, recipient = {}, verificationUrl = '' } = {}) {
  return {
    badge: badgeId,
    recipient,
    verification: verificationUrl,
  };
}
