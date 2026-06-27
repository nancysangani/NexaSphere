// Code-first PDF generator placeholder.
// TODO: replace with real renderer (HTML->PDF or canvas->PDF).

export async function renderCertificatePdf({ template, variables } = {}) {
  // Minimal PDF-like placeholder so endpoint returns a non-empty buffer.
  // Maintainer can replace renderer once template system is implemented.
  const lines = [
    '%PDF-1.3',
    '% Event Certification placeholder',
    `% ${JSON.stringify(
      { templateId: template?.id || null, variables: Object.keys(variables || {}) },
      null,
      0
    )}`,
    '1 0 obj<<>>endobj',
    'trailer<<>>',
    '%%EOF',
  ];
  return Buffer.from(lines.join('\n'));
}
