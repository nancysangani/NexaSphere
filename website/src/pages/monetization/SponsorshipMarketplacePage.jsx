import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import { getApiBase, buildUrl } from '../../utils/runtimeConfig';

const base = getApiBase();
const api = (path) => buildUrl(base, path);

export default function SponsorshipMarketplacePage({ onBack }) {
  const [tab, setTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [packages, setPackages] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [roi, setRoi] = useState(null);
  const [interestFilter, setInterestFilter] = useState('');
  const [companyForm, setCompanyForm] = useState({
    name: '',
    interests: '',
    budgetMin: 500,
    budgetMax: 5000,
    contactEmail: '',
  });
  const [proposalForm, setProposalForm] = useState({
    companyId: '',
    tier: 'Silver',
    budget: 1000,
    message: '',
    organizerName: '',
  });
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = useCallback(async () => {
    const url = api('/api/content/sponsorship/companies');
    if (url)
      try {
        const d = await apiClient(url);
        setCompanies(d.companies || []);
      } catch {}
  }, []);

  const fetchPackages = useCallback(async () => {
    const url = api('/api/content/sponsorship/packages');
    if (url)
      try {
        const d = await apiClient(url);
        setPackages(d.packages || []);
      } catch {}
  }, []);

  const fetchProposals = useCallback(async () => {
    const url = api('/api/content/sponsorship/proposals');
    if (url)
      try {
        const d = await apiClient(url);
        setProposals(d.proposals || []);
      } catch {}
  }, []);

  const fetchAgreements = useCallback(async () => {
    const url = api('/api/content/sponsorship/agreements');
    if (url)
      try {
        const d = await apiClient(url);
        setAgreements(d.agreements || []);
      } catch {}
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchPackages();
    fetchProposals();
    fetchAgreements();
  }, [fetchCompanies, fetchPackages, fetchProposals, fetchAgreements]);

  const createCompany = async () => {
    if (!companyForm.name.trim()) return;
    const interests = companyForm.interests
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const url = api('/api/content/sponsorship/companies');
    if (url) {
      try {
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify({ ...companyForm, interests }),
          headers: { 'Content-Type': 'application/json' },
        });
        setCompanyForm({
          name: '',
          interests: '',
          budgetMin: 500,
          budgetMax: 5000,
          contactEmail: '',
        });
        fetchCompanies();
      } catch {}
    }
  };

  const createProposal = async () => {
    if (!proposalForm.companyId || !proposalForm.organizerName.trim()) return;
    const pkg = packages.find((p) => p.tier === proposalForm.tier);
    const url = api('/api/content/sponsorship/proposals');
    if (url) {
      try {
        await apiClient(url, {
          method: 'POST',
          body: JSON.stringify({ ...proposalForm, benefits: pkg ? pkg.benefits : [] }),
          headers: { 'Content-Type': 'application/json' },
        });
        setProposalForm({
          companyId: '',
          tier: 'Silver',
          budget: 1000,
          message: '',
          organizerName: '',
        });
        fetchProposals();
      } catch {}
    }
  };

  const acceptProposal = async (proposalId) => {
    const url = api(`/api/content/sponsorship/proposals/${proposalId}/status`);
    if (url) {
      try {
        await apiClient(url, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Accepted' }),
          headers: { 'Content-Type': 'application/json' },
        });
        fetchProposals();
        fetchAgreements();
      } catch {}
    }
  };

  const toggleDeliverable = async (agreementId, item, done) => {
    const url = api(`/api/content/sponsorship/agreements/${agreementId}/deliverables`);
    if (url) {
      try {
        await apiClient(url, {
          method: 'PUT',
          body: JSON.stringify({ item, done: !done }),
          headers: { 'Content-Type': 'application/json' },
        });
        fetchAgreements();
      } catch {}
    }
  };

  const fetchROI = async (companyId) => {
    const url = api(`/api/content/sponsorship/roi/${companyId}`);
    if (url)
      try {
        const d = await apiClient(url);
        setRoi(d);
        setSelectedCompany(companyId);
      } catch {}
  };

  const searchByInterest = async () => {
    const url = api(
      `/api/content/sponsorship/companies?interest=${encodeURIComponent(interestFilter)}`
    );
    if (url)
      try {
        const d = await apiClient(url);
        setCompanies(d.companies || []);
      } catch {}
  };

  return (
    <div
      className="page-container"
      style={{ minHeight: '100vh', paddingTop: 40, paddingBottom: 80 }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--c1)',
              cursor: 'pointer',
              fontSize: '1rem',
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            &larr; Back
          </button>
        )}
        <h1
          style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: 'clamp(1.5rem,4vw,2.5rem)',
            marginBottom: 8,
            background: 'linear-gradient(135deg,#CC1111,#FF4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Sponsorship Marketplace
        </h1>
        <p style={{ color: 'var(--t2)', marginBottom: 32 }}>
          Connect with sponsors — browse companies, propose packages, and manage agreements.
        </p>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {['companies', 'packages', 'proposals', 'agreements', 'roi'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8 20',
                borderRadius: 20,
                fontWeight: 600,
                fontSize: '0.9rem',
                border: tab === t ? '1px solid var(--c1)' : '1px solid rgba(255,255,255,0.1)',
                background: tab === t ? 'rgba(204,17,17,0.1)' : 'var(--surface)',
                color: tab === t ? 'var(--c1)' : 'var(--t2)',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'companies' && (
          <div>
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 12', fontSize: '1rem' }}>
                Register Your Company as a Sponsor
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <input
                  placeholder="Company name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  style={inputStyle}
                />
                <input
                  placeholder="Contact email"
                  value={companyForm.contactEmail}
                  onChange={(e) => setCompanyForm({ ...companyForm, contactEmail: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <input
                placeholder="Interests (comma-separated: tech events, hackathons, workshops)"
                value={companyForm.interests}
                onChange={(e) => setCompanyForm({ ...companyForm, interests: e.target.value })}
                style={{ ...inputStyle, width: '100%', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <input
                  type="number"
                  placeholder="Min budget"
                  value={companyForm.budgetMin}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, budgetMin: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Max budget"
                  value={companyForm.budgetMax}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, budgetMax: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </div>
              <button className="btn-primary" onClick={createCompany}>
                Register Company
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                placeholder="Search by interest (e.g. hackathons)"
                value={interestFilter}
                onChange={(e) => setInterestFilter(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button className="btn-sm" onClick={searchByInterest}>
                Search
              </button>
              <button className="btn-sm" onClick={fetchCompanies}>
                Clear
              </button>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Sponsor Companies</h3>
            {companies.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                      Interests: {c.interests?.join(', ')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                      Budget: ${c.budgetMin} - ${c.budgetMax} | Contact: {c.contactEmail}
                    </div>
                    {c.pastSponsorships?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--t3)' }}>
                        Past sponsorships: {c.pastSponsorships.join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-sm"
                    onClick={() => {
                      setProposalForm({ ...proposalForm, companyId: c.id });
                      setTab('proposals');
                    }}
                  >
                    Propose
                  </button>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <p style={{ color: 'var(--t2)' }}>No companies registered yet.</p>
            )}
          </div>
        )}

        {tab === 'packages' && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Sponsorship Packages</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              {packages.map((pkg) => (
                <div
                  key={pkg.tier}
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 12,
                    padding: 24,
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      marginBottom: 4,
                      color:
                        pkg.tier === 'Platinum'
                          ? '#e5e4e2'
                          : pkg.tier === 'Gold'
                            ? '#FFD700'
                            : pkg.tier === 'Silver'
                              ? '#C0C0C0'
                              : '#CD7F32',
                    }}
                  >
                    {pkg.tier}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, margin: '8 0 12' }}>
                    ${pkg.minBudget}+
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      fontSize: '0.85rem',
                      color: 'var(--t2)',
                    }}
                  >
                    {pkg.benefits.map((b) => (
                      <li
                        key={b}
                        style={{ padding: '4 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'proposals' && (
          <div>
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3 style={{ margin: '0 0 12', fontSize: '1rem' }}>Create Proposal</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <select
                  value={proposalForm.companyId}
                  onChange={(e) => setProposalForm({ ...proposalForm, companyId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={proposalForm.tier}
                  onChange={(e) => setProposalForm({ ...proposalForm, tier: e.target.value })}
                  style={inputStyle}
                >
                  {packages.map((p) => (
                    <option key={p.tier} value={p.tier}>
                      {p.tier}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <input
                  type="number"
                  placeholder="Proposed budget ($)"
                  value={proposalForm.budget}
                  onChange={(e) =>
                    setProposalForm({ ...proposalForm, budget: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
                <input
                  placeholder="Your name (organizer)"
                  value={proposalForm.organizerName}
                  onChange={(e) =>
                    setProposalForm({ ...proposalForm, organizerName: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <textarea
                placeholder="Message to sponsor..."
                value={proposalForm.message}
                onChange={(e) => setProposalForm({ ...proposalForm, message: e.target.value })}
                style={{
                  ...inputStyle,
                  width: '100%',
                  minHeight: 60,
                  marginBottom: 12,
                  resize: 'vertical',
                }}
              />
              <button className="btn-primary" onClick={createProposal}>
                Send Proposal
              </button>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Your Proposals</h3>
            {proposals.map((p) => (
              <div
                key={p.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      To: {companies.find((c) => c.id === p.companyId)?.name || p.companyId}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                      Package: {p.tier} | Budget: ${p.budget} | Status: <strong>{p.status}</strong>
                    </div>
                    {p.message && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--t3)', marginTop: 4 }}>
                        Message: {p.message}
                      </div>
                    )}
                  </div>
                  {p.status === 'Proposed' && (
                    <button className="btn-sm" onClick={() => acceptProposal(p.id)}>
                      Accept
                    </button>
                  )}
                </div>
              </div>
            ))}
            {proposals.length === 0 && (
              <p style={{ color: 'var(--t2)' }}>No proposals yet. Find a company and send one!</p>
            )}
          </div>
        )}

        {tab === 'agreements' && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Active Agreements</h3>
            {agreements.map((a) => (
              <div
                key={a.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      With: {companies.find((c) => c.id === a.companyId)?.name || a.companyId} |
                      Tier: {a.tier}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>
                      Status: <strong>{a.status}</strong>
                    </div>
                  </div>
                </div>
                <h4 style={{ fontSize: '0.9rem', margin: '0 0 8' }}>Deliverables</h4>
                {a.deliverables.map((d) => (
                  <label
                    key={d.item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6 0',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={d.done}
                      onChange={() => toggleDeliverable(a.id, d.item, d.done)}
                      style={{ accentColor: 'var(--c1)' }}
                    />
                    <span
                      style={{
                        textDecoration: d.done ? 'line-through' : 'none',
                        color: d.done ? 'var(--t3)' : 'var(--t1)',
                      }}
                    >
                      {d.item}
                    </span>
                  </label>
                ))}
              </div>
            ))}
            {agreements.length === 0 && (
              <p style={{ color: 'var(--t2)' }}>
                No agreements yet. Accept a proposal to create one.
              </p>
            )}
          </div>
        )}

        {tab === 'roi' && (
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Sponsor ROI Dashboard</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <select
                value={selectedCompany || ''}
                onChange={(e) => fetchROI(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">Select a sponsor company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {roi && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { label: 'Total Budget', value: `$${roi.totalBudget}` },
                  { label: 'Active Agreements', value: roi.agreementCount },
                  { label: 'Completed', value: roi.completedCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'var(--surface)',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid rgba(255,255,255,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c1)' }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--t2)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            {!roi && <p style={{ color: 'var(--t2)' }}>Select a company to view ROI data.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '8 12',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(0,0,0,0.3)',
  color: 'var(--t1)',
  fontSize: '0.85rem',
  outline: 'none',
};
