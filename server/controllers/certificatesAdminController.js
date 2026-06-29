// Admin controllers for #1787

export async function adminGetCertificateById(req, res) {
  const { id } = req.params;
  return res.json({
    id,
    ok: true,
    certificate: {
      id,
      verified: false,
      revoked: false,
    },
  });
}

export async function adminVerifyCertificate(req, res) {
  const { id } = req.params;
  // TODO: update DB verification status + audit log.
  return res.json({ ok: true, id, verified: true });
}

export async function adminRevokeCertificate(req, res) {
  const { id } = req.params;
  // TODO: update DB verification status + audit log.
  return res.json({ ok: true, id, revoked: true });
}
