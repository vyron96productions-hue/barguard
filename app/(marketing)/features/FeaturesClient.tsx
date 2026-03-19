export default function FeaturesPage() {
  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>
      <style>{`
        .feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .feat-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .feat-card {
          background: #0f172a; border: 1px solid #1e293b; border-radius: 18px; padding: 28px;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .feat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(245,158,11,0.35);
          box-shadow: 0 16px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(245,158,11,0.1);
        }
        .feat-icon {
          width: 46px; height: 46px; border-radius: 12px;
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2);
          display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
          transition: transform 0.3s ease;
        }
        .feat-card:hover .feat-icon { transform: scale(1.12) rotate(-4deg); }
        .pro-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
          color: #f59e0b; font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
          font-family: monospace; margin-bottom: 14px;
        }
        .ent-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25);
          color: #a78bfa; font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 3px 8px; border-radius: 100px;
          font-family: monospace; margin-bottom: 14px;
        }
        .check-list { list-style: none; display: flex; flex-direction: column; gap: 9px; margin-top: 14px; }
        .check-list li { display: flex; align-items: flex-start; gap: 9px; font-size: 13.5px; color: #64748b; line-height: 1.5; }
        .section-label { font-family: monospace; font-size: 11px; color: #f59e0b; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }
        @media (max-width: 860px) {
          .feat-grid { grid-template-columns: 1fr; }
          .feat-grid-3 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .feat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(245,158,11,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 900, height: 500, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)' }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* HERO */}
        <section style={{ textAlign: 'center', padding: '72px 0 64px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, padding: '5px 14px', marginBottom: 28, fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: '#f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
            <span style={{ width: 6, height: 6, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
            Full Feature List
          </div>
          <h1 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.08, letterSpacing: '-1px', color: '#f8fafc', maxWidth: 700, margin: '0 auto 20px', fontWeight: 800 }}>
            Everything you need to <em style={{ color: '#f59e0b', fontStyle: 'italic' }}>run a tighter bar</em>
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            BarGuard is a complete inventory intelligence platform. Here's every tool at your disposal.
          </p>

          {/* Plan legend */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 36, flexWrap: 'wrap' as const }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
              <span style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
              Included on all plans
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
              <span style={{ width: 8, height: 8, background: '#f59e0b', borderRadius: '50%', display: 'inline-block' }} />
              Pro &amp; Enterprise only
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
              <span style={{ width: 8, height: 8, background: '#a78bfa', borderRadius: '50%', display: 'inline-block' }} />
              Enterprise only
            </div>
          </div>
        </section>

        {/* ── SECTION 1: Dashboard & Analytics ── */}
        <section style={{ marginBottom: 72 }}>
          <div className="section-label">Dashboard &amp; Analytics</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
            See your bar's health at a glance
          </h2>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Live Variance Dashboard</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Your command center. Every critical number front and center so you always know what's happening with your inventory.</p>
              <ul className="check-list">
                {['Health score (0–100) updated on every calculation', 'Critical, warning, and normal item counts at a glance', 'Estimated total dollar loss for any date range', 'Highest-risk item spotlight with estimated loss', 'Reorder alerts panel — items that need restocking', 'AI-generated summary of your shift in plain English'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>

            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Flexible Date &amp; Shift Filtering</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Run calculations on exactly the period you need. Compare opening to closing, last week, or any custom window.</p>
              <ul className="check-list">
                {['Preset ranges: opening shift, closing shift, full shift', 'Custom start/end date & time picker', 'Browser timezone auto-detection', 'Drill down by individual item or category', 'Side-by-side period comparison'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Inventory Management ── */}
        <section style={{ marginBottom: 72 }}>
          <div className="section-label">Inventory Management</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
            Track every bottle, keg, and pack
          </h2>
          <div className="feat-grid-3">
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Item Catalog</h3>
              <ul className="check-list">
                {['Spirits, beer, wine, food, produce & more', 'Set cost per unit for loss calculations', 'Define reorder levels per item', 'Assign items to vendors', 'Pack size logic (six-pack, case, keg)'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>

            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Stock Counts</h3>
              <ul className="check-list">
                {['Manual quantity entry per item', 'Partial bottle estimation', 'AI bottle image analysis (camera scan)', 'Bulk stock import via CSV', 'Pack-level breakdown display'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>

            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Data Import</h3>
              <ul className="check-list">
                {['Upload inventory CSV', 'Upload purchase CSV', 'Upload sales CSV', 'Auto-map item name aliases', 'Resolve unmatched items with one click'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: AI Features ── */}
        <section style={{ marginBottom: 72 }}>
          <div className="section-label">AI-Powered Features</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
            Claude AI built into every workflow
          </h2>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>AI Invoice Scanning</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Photograph any invoice or delivery receipt and let AI do the data entry. Works with any supplier format.</p>
              <ul className="check-list">
                {['Supports JPG, PNG, and PDF invoices', 'Extracts vendor, items, quantities, and unit costs', 'Review draft before confirming — edit anything', 'Auto-maps invoice names to your inventory items', 'View full import history with status tracking', 'No manual typing — ever'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>

            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>AI Shift Summaries</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>After running your numbers, get a plain-English breakdown of what happened, what's risky, and what to do next.</p>
              <ul className="check-list">
                {['Plain-English summary of every variance run', 'Flags the biggest loss drivers automatically', 'Recommends specific next actions', 'AI bottle image analysis — snap a photo to estimate oz remaining', 'Profit insights with margin gap analysis', 'Recipe auto-match wizard for new menu items'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Loss Detection ── */}
        <section style={{ marginBottom: 72 }}>
          <div className="section-label">Loss Detection &amp; Variance Reports</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
            Find exactly where the money is going
          </h2>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Variance Calculation Engine</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>The core of BarGuard. Calculates exactly how much of each item should have been used versus what actually disappeared.</p>
              <ul className="check-list">
                {['Beginning inventory + purchases − ending inventory = actual usage', 'Compares actual usage to expected usage from sales', 'Flags overages and shortages per item', 'Variance shown in units and dollars', 'Critical / warning / normal classification', 'Filter by item type, status, or date range'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>

            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Detailed Loss Reports</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Export a full breakdown of every variance event to share with ownership, management, or your accountant.</p>
              <ul className="check-list">
                {['Beginning inventory, purchases, ending inventory per item', 'Actual vs. expected usage comparison', 'Dollar loss per item and total', 'Variance percentage column', 'Summary KPIs at the top of every report', 'Mobile-friendly card view + desktop table'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: Profit Intelligence ── */}
        <section style={{ marginBottom: 72 }}>
          <div className="section-label">Profit Intelligence</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
            Know which drinks make you the most money
          </h2>
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Margin Analysis</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Calculate the true profit on every drink and food item so you can double down on high-margin sellers.</p>
              <ul className="check-list">
                {['Gross revenue, estimated cost, and profit per item', 'Profit margin % for every menu item', 'Top profit, top revenue, and lowest margin spotlights', 'Sortable leaderboard (profit, margin, revenue, volume)', 'Drink vs. food category split'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>

            <div className="feat-card">
              <div className="feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3z" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Menu &amp; Recipe Tracking</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Define every drink's recipe so BarGuard knows exactly how much inventory should be used per sale.</p>
              <ul className="check-list">
                {['Create drinks and food items with sell prices', 'Define recipes by ingredient and oz/ml', 'Estimated cost per drink from inventory costs', 'Auto-match wizard — AI suggests recipes by name', 'Drink library with 40+ popular cocktails to import', 'Filter by cocktails, shots, beer, wine, and more'].map(f => (
                  <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(34,197,94,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: Pro Features ── */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 20, padding: '40px 36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Pro Plan Features</div>
              <div className="pro-badge" style={{ marginBottom: 0 }}>Pro &amp; Enterprise</div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
              Automate the work. Connect your POS.
            </h2>
            <div className="feat-grid">

              <div className="feat-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                <div className="pro-badge">Pro &amp; Enterprise</div>
                <div className="feat-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>POS Integration</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>Connect your existing point-of-sale system and let sales data flow in automatically. No double-entry.</p>
                <ul className="check-list">
                  {['Square — full OAuth connection', 'Clover — OAuth + catalog import', 'Sync sales for any date range on demand', 'View sync history and connection status', 'Real-time webhooks for Square and Clover', 'More integrations coming soon'].map(f => (
                    <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(245,158,11,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
                <div className="feat-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                  <div className="pro-badge">Pro &amp; Enterprise</div>
                  <div className="feat-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Vendor Management</h3>
                  <ul className="check-list">
                    {['Store supplier name, email, and rep contact', 'Link inventory items to their vendor', 'Vendor-grouped reorder view', 'Used in automated purchase order generation'].map(f => (
                      <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(245,158,11,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="feat-card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                  <div className="pro-badge">Pro &amp; Enterprise</div>
                  <div className="feat-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>Smart Reorder Suggestions</h3>
                  <ul className="check-list">
                    {['AI analyzes stock levels and daily usage velocity', 'Priority tiers: urgent, soon, watch, ok', 'Generates formatted purchase orders by vendor', 'Shows days remaining before stockout', 'One-click copy to send to your rep'].map(f => (
                      <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(245,158,11,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── SECTION 7: Enterprise ── */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 20, padding: '40px 36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div className="section-label" style={{ marginBottom: 0 }}>Enterprise Plan</div>
              <div className="ent-badge" style={{ marginBottom: 0 }}>Enterprise only</div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
              Running multiple locations
            </h2>
            <div className="feat-grid-3">
              {[
                { title: 'Up to 5 Locations', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, items: ['Manage up to 5 bar locations under one account', 'Separate inventory and reports per location', 'Single login for all locations'] },
                { title: 'Priority Support', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.4 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.99-.99a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.6 16z" /></svg>, items: ['Priority email support', 'Faster response times than standard plans', 'Help getting your team set up'] },
                { title: 'Everything in Pro', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>, items: ['All POS integrations included', 'Vendor management & reorder automation', 'Full sales history & data export', 'Profit intelligence & AI insights'] },
              ].map((card) => (
                <div key={card.title} className="feat-card" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
                  <div className="feat-icon" style={{ background: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.2)' }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{card.title}</h3>
                  <ul className="check-list">
                    {card.items.map(f => (
                      <li key={f}><svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="7.5" fill="rgba(139,92,246,0.15)" /><path d="M4 7.5l2.5 2.5 4.5-4.5" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 8: Security ── */}
        <section style={{ marginBottom: 72 }}>
          <div className="section-label">Security &amp; Privacy</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#f1f5f9', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 32 }}>
            Your data stays yours
          </h2>
          <div className="feat-grid-3">
            {[
              { title: 'Complete Data Isolation', desc: 'Every bar account lives in its own silo. No other bar can ever see your inventory, sales, or reports.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> },
              { title: 'Row-Level Security', desc: 'Every database query is enforced at the infrastructure level — your data is locked to your account and cannot be accessed by anyone else.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
              { title: 'No Email Required', desc: 'Sign up with just a username and password, or use Google. We never sell your data or spam your inbox.', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-8 8.5C7.5 20.5 4 18 4 13V6l8-3 8 3v7z" /><path d="M9 12l2 2 4-4" /></svg> },
            ].map((card) => (
              <div key={card.title} className="feat-card">
                <div className="feat-icon">{card.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '40px 0 100px', textAlign: 'center' as const }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 24, padding: '52px 40px', maxWidth: 700, margin: '0 auto', boxShadow: '0 0 60px rgba(245,158,11,0.05)' }}>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: 'clamp(22px, 2.8vw, 34px)', color: '#f8fafc', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16 }}>
              Try every feature free for <em style={{ color: '#f59e0b' }}>14 days</em>
            </h2>
            <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36, lineHeight: 1.65 }}>No credit card required. Full access to all Pro features during your trial.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <a href="/signup" className="btn-primary" data-gtm-event="cta_click" data-gtm-label="features_cta_start_trial" style={{ padding: '14px 30px', fontSize: 15 }}>
                Start Free Trial →
              </a>
              <a href="/pricing" className="btn-secondary" data-gtm-event="cta_click" data-gtm-label="features_cta_pricing" style={{ padding: '14px 30px', fontSize: 15 }}>
                View Pricing
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
