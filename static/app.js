const yearTabs = document.getElementById('yearTabs');
const recordArea = document.getElementById('recordArea');
const generalArea = document.getElementById('generalArea');

const homeView = document.getElementById('homeView');
const ledgerIndex = document.getElementById('ledgerIndex');
const openUgBtn = document.getElementById('openUg');
const generalView = document.getElementById('generalView');
const batchView = document.getElementById('batchView');
const pgView = document.getElementById('pgView');
const pgArea = document.getElementById('pgArea');
const openPgBtn = document.getElementById('openPg');
const openGeneralBtn = document.getElementById('openGeneral');
const openBatchBtn = document.getElementById('openBatch');

function esc(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// Splits text into sentences and renders each on its own line.
function escSentences(str) {
  if (str === null || str === undefined) return '';
  const text = String(str).trim();
  if (!text) return '';
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"'(])/);
  return sentences.map(s => esc(s)).join('<br>');
}

/* ---------------- View routing ---------------- */

let generalLoaded = false;
let batchStarted = false;
let pgLoaded = false;

function showView(name) {
  homeView.hidden = name !== 'home';
  ledgerIndex.hidden = name !== 'ug';
  generalView.hidden = name !== 'general';
  batchView.hidden = name !== 'batch';
  pgView.hidden = name !== 'pg';
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'general' && !generalLoaded) {
    generalLoaded = true;
    loadGeneral();
  }
  if (name === 'pg' && !pgLoaded) {
    pgLoaded = true;
    loadPg();
  }
  if (name === 'batch' && !batchStarted) {
    batchStarted = true;
    const firstTab = yearTabs.querySelector('.year-tab');
    if (firstTab) selectYear(firstTab.dataset.year, firstTab);
  }
}

openGeneralBtn.addEventListener('click', () => showView('general'));
openBatchBtn.addEventListener('click', () => showView('batch'));
openPgBtn.addEventListener('click', () => showView('pg'));
openUgBtn.addEventListener('click', () => showView('ug'));
document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.back || 'home'));
});

/* ---------------- Part A: General regulations ---------------- */

function renderCell(cell) {
  if (Array.isArray(cell)) {
    if (cell.length > 1) {
      return `<ul class="cell-list">${cell.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    }
    return cell.map(l => esc(l)).join('<br>');
  }
  if (cell && typeof cell === 'object' && cell.lines) {
    return cell.lines.map(line => {
      let escaped = esc(line);
      if (cell.highlight) {
        const escHighlight = esc(cell.highlight);
        escaped = escaped.split(escHighlight).join(`<mark class="ledger-mark">${escHighlight}</mark>`);
      }
      return escaped;
    }).join('<br><br>');
  }
  return esc(cell);
}

function renderGenericTable(columns, rows) {
  let html = `<table class="reg-table"><thead><tr>${columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`;
  rows.forEach(row => {
    html += `<tr>${row.map(cell => `<td>${renderCell(cell)}</td>`).join('')}</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderMasterCreditsClause(t) {
  if (!t) return '<em>Not recorded.</em>';
  return renderGenericTable(t.columns, t.rows);
}

function renderLastAttemptTableClause(t) {
  if (!t) return '<em>Not recorded.</em>';
  let html = '';
  const notes = t.notes || [];
  if (notes.length) {
    if (t.notes_heading) {
      html += `<div style="font-weight:600;color:var(--ink);margin-bottom:0.5rem;">${esc(t.notes_heading)}</div>`;
    }
    html += `<ul class="plain-list" style="margin-bottom:0.9rem;">${notes.map(n => `<li>${escSentences(n)}</li>`).join('')}</ul>`;
  }
  html += renderGenericTable(t.columns, t.rows);
  return html;
}

function renderPostEvenSemTableClause(t) {
  if (!t) return '<em>Not recorded.</em>';
  let html = '';
  if (t.reference) {
    html += `<p style="margin:0 0 0.6rem;font-size:0.86rem;color:var(--ink-soft);">${escSentences(t.reference)}</p>`;
  }
  html += renderGenericTable(t.columns, t.rows);
  return html;
}

function renderPassingMarksClause(t) {
  if (!t) return '<em>Not recorded.</em>';
  let html = renderGenericTable(t.columns, t.rows);
  if (t.gmr) {
    html += `<div style="margin-top:1rem;padding-top:0.9rem;border-top:1px solid var(--line);">
      <div style="font-weight:600;color:var(--ink);margin-bottom:0.4rem;">${esc(t.gmr.label || 'GMR')}</div>
      <p style="margin:0;">${escSentences(t.gmr.rule)}</p>
    </div>`;
  }
  return html;
}

function renderActivityPointsClause(ap) {
  if (!ap) return '<em>Not recorded.</em>';
  const cats = ap.categories || [];
  let html = '';
  if (ap.source_note) {
    html += `<p style="margin:0 0 0.7rem;">${escSentences(ap.source_note)}</p>`;
  }
  if (cats.length) {
    html += `<table class="reg-table"><thead><tr><th>Category</th><th>Applicable From</th><th>Points Required</th></tr></thead><tbody>`;
    cats.forEach(c => {
      html += `<tr><td>${esc(c.category)}</td><td>${esc(c.applicable_from)}</td><td>${esc(c.points)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  const notes = ap.notes || [];
  if (notes.length) {
    html += `<ul class="plain-list" style="margin-top:0.8rem;">${notes.map(n => `<li>${escSentences(n)}</li>`).join('')}</ul>`;
  }
  return html || '<em>Not recorded.</em>';
}

function renderCgpaConversionClause(cc) {
  if (!cc) return '<em>Not recorded.</em>';
  const formulas = cc.formulas || [];
  let html = '';
  if (formulas.length) {
    html += `<table class="reg-table"><thead><tr><th>Applicable To</th><th>Formula</th></tr></thead><tbody>`;
    formulas.forEach(f => {
      html += `<tr><td>${esc(f.applicable_to)}</td><td class="nowrap-cell">${esc(f.formula)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  const groups = cc.class_bands || [];
  groups.forEach(g => {
    html += `<div style="margin-top:1.2rem;">
      <div style="font-weight:600;color:var(--ink);margin-bottom:0.4rem;">Class Declaration</div>
      <div class="kv-row" style="margin-bottom:0.5rem;"><span class="k">Applies to</span><span class="v">${esc(g.applicable_to)}</span></div>
      <table class="reg-table"><thead><tr><th>CGPA</th><th>Percentage</th><th>Class</th></tr></thead><tbody>
      ${(g.bands || []).map(b => `<tr><td>${esc(b.cgpa)}</td><td>${esc(b.percentage)}</td><td>${esc(b.class)}</td></tr>`).join('')}
      </tbody></table>
    </div>`;
  });
  return html || '<em>Not recorded.</em>';
}

function formatQuickRefCell(cell, colIndex) {
  if (Array.isArray(cell)) {
    if (colIndex === 6 && cell.length > 1) {
      return `<ul class="cell-list">${cell.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    }
    return cell.map(l => esc(l)).join('<br>');
  }
  return esc(cell);
}

function renderQuickReferenceClause(t) {
  if (!t) return '<em>Not recorded.</em>';
  let html = '';
  if (t.note) {
    html += `<p style="margin:0 0 0.7rem;font-size:0.86rem;color:var(--ink-soft);">${escSentences(t.note)}</p>`;
  }
  html += `<table class="reg-table quickref-table"><thead><tr>${t.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>`;
  t.rows.forEach(row => {
    html += `<tr>${row.map((cell, idx) => `<td>${formatQuickRefCell(cell, idx)}</td>`).join('')}</tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderGeneral(data) {
  const clauses = [
    { ref: data.master_credits_table && data.master_credits_table.ref, num: data.master_credits_table && data.master_credits_table.label, body: renderMasterCreditsClause(data.master_credits_table) },
    { ref: data.last_attempt_table && data.last_attempt_table.ref, num: data.last_attempt_table && data.last_attempt_table.label, body: renderLastAttemptTableClause(data.last_attempt_table) },
    { ref: data.post_even_sem_table && data.post_even_sem_table.ref, num: data.post_even_sem_table && data.post_even_sem_table.label, body: renderPostEvenSemTableClause(data.post_even_sem_table) },
    { ref: data.passing_marks && data.passing_marks.ref, num: data.passing_marks && data.passing_marks.label, body: renderPassingMarksClause(data.passing_marks) },
    { ref: data.activity_points && data.activity_points.ref, num: data.activity_points && data.activity_points.label, body: renderActivityPointsClause(data.activity_points) },
    { ref: data.cgpa_to_percentage_conversion && data.cgpa_to_percentage_conversion.ref, num: data.cgpa_to_percentage_conversion && data.cgpa_to_percentage_conversion.label, body: renderCgpaConversionClause(data.cgpa_to_percentage_conversion) },
    { ref: data.quick_reference_table && data.quick_reference_table.ref, num: data.quick_reference_table && data.quick_reference_table.label, body: renderQuickReferenceClause(data.quick_reference_table), wide: true },
  ].filter(c => c.num);

  const clausesHtml = clauses.map(c => `
    <div class="clause${c.wide ? ' clause-stacked' : ''}">
      <div class="clause-num">${esc(c.num)}</div>
      <div class="clause-body">${c.body}</div>
    </div>
  `).join('');

  const noteHtml = data.source_note
    ? `<div class="general-note">${escSentences(data.source_note)}</div>`
    : '';

  generalArea.innerHTML = `${noteHtml}<div class="clauses">${clausesHtml}</div>`;
}

async function loadGeneral() {
  try {
    const res = await fetch('/api/general');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      generalArea.innerHTML = `<div class="empty-state">${esc(err.error || 'No general regulation data found.')}</div>`;
      return;
    }
    const data = await res.json();
    renderGeneral(data);
  } catch (e) {
    generalArea.innerHTML = `<div class="empty-state">Could not load general regulations: ${esc(e.message)}</div>`;
  }
}

/* ---------------- Part B: Batch-wise regulations ---------------- */

function renderCreditsClause(data) {
  const tc = data.total_credits || {};
  return `
    <div class="kv-row"><span class="k">Regular B.E.</span><span class="v">${esc(tc.regular)}</span></div>
    <div class="kv-row"><span class="k">Lateral Entry</span><span class="v">${esc(tc.lateral_entry)}</span></div>
  `;
}

function renderLastAttemptClause(data) {
  const la = data.last_attempt || {};
  return `
    <div class="kv-row"><span class="k">Regular</span><span class="v">${esc(la.regular)}</span></div>
    <div class="kv-row"><span class="k">Lateral Entry</span><span class="v">${esc(la.lateral_entry)}</span></div>
  `;
}

function gradeTierClass(points) {
  const p = Number(points);
  if (isNaN(p)) return '';
  if (p >= 9) return 'tier-excellent';
  if (p >= 7) return 'tier-good';
  if (p >= 5) return 'tier-average';
  if (p >= 1) return 'tier-pass';
  return 'tier-fail';
}

function renderGradesClause(data) {
  const g = data.grades || {};
  const scale = g.scale || [];
  const other = g.other_grades || [];

  let html = '';
  if (scale.length) {
    const hasLabel = scale.some(r => r.label);
    html += `<table class="reg-table grade-table"><thead><tr>
      <th>Grade</th>${hasLabel ? '<th>Meaning</th>' : ''}<th>Points</th><th>Score / %</th>
    </tr></thead><tbody>`;
    scale.forEach(row => {
      const tier = gradeTierClass(row.points);
      html += `<tr class="${tier}"><td><span class="grade-pill ${tier}">${esc(row.grade)}</span></td>${hasLabel ? `<td>${esc(row.label || '')}</td>` : ''}<td>${esc(row.points)}</td><td>${esc(row.score)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  if (other.length) {
    html += `<div class="other-grades-list">`;
    other.forEach(o => {
      html += `<div class="g-item"><span class="g-code">${esc(o.code)}</span><span>${escSentences(o.meaning)}</span></div>`;
    });
    html += `</div>`;
  }
  return html || '<em>No grading data recorded.</em>';
}

function renderClassDeclarationClause(data) {
  const cd = data.class_declaration || {};
  const bands = cd.bands || [];
  let html = '';
  if (cd.applicable_to) {
    html += `<div class="kv-row"><span class="k">Applies to</span><span class="v">${esc(cd.applicable_to)}</span></div>`;
  }
  if (bands.length) {
    html += `<table class="reg-table"><thead><tr><th>CGPA</th><th>Percentage</th><th>Class</th></tr></thead><tbody>`;
    bands.forEach(b => {
      html += `<tr><td>${esc(b.cgpa)}</td><td>${esc(b.percentage)}</td><td>${esc(b.class)}</td></tr>`;
    });
    html += `</tbody></table>`;
  }
  if (cd.formula) {
    html += `<div class="kv-row" style="margin-top:0.6rem;"><span class="k">Formula</span><span class="v">${esc(cd.formula)}</span></div>`;
  }
  if (cd.min_cgpa_for_degree !== undefined) {
    html += `<div class="kv-row"><span class="k">Min CGPA (degree)</span><span class="v">&ge; ${esc(cd.min_cgpa_for_degree)}</span></div>`;
  }
  return html || '<em>No class declaration data recorded.</em>';
}

function renderProvisionClause(data) {
  const text = escSentences(data.provision_after_even_sem);
  const link = data.provision_circular_link;
  let linkHtml = '';
  if (link && link.url) {
    const label = esc(link.label || 'View Circular (PDF)');
    linkHtml = `<p style="margin:0.5rem 0 0;"><a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer" class="circular-link">${label}</a></p>`;
  }
  return `<p style="margin:0;">${text || '<em>Not recorded.</em>'}</p>${linkHtml}`;
}

const MIN_CIE_SEE_ORDER = [
  'theory', 'theory_practical', 'practical', 'practical_drawing',
  'practical_drawing_project', 'drawing', 'drawing_project', 'project'
];

function renderMinCieSeeClause(data) {
  const m = data.min_cie_see || {};
  const keys = Object.keys(m).sort((a, b) => {
    const ia = MIN_CIE_SEE_ORDER.indexOf(a);
    const ib = MIN_CIE_SEE_ORDER.indexOf(b);
    const pa = ia === -1 ? MIN_CIE_SEE_ORDER.length : ia;
    const pb = ib === -1 ? MIN_CIE_SEE_ORDER.length : ib;
    return pa - pb;
  });
  if (!keys.length) return '<em>No CIE/SEE data recorded.</em>';

  let html = `<table class="reg-table"><thead><tr><th>Course Type</th><th>CIE</th><th>SEE / SET</th><th>Combined</th></tr></thead><tbody>`;
  keys.forEach(key => {
    const row = m[key];
    const label = row.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    html += `<tr>
      <td>${esc(label)}</td>
      <td>${esc(row.cie || '')}</td>
      <td>${esc(row.see || row.set || row.see_set || '')}</td>
      <td>${esc(row.combined || '')}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderRecord(year, data) {
  const clauses = [
    { ref: '01', num: 'Credits', body: renderCreditsClause(data) },
    { ref: '02', num: 'Last Attempt', body: renderLastAttemptClause(data) },
    { ref: '03', num: 'Grades', body: renderGradesClause(data) },
    { ref: '04', num: 'Class Declaration', body: renderClassDeclarationClause(data) },
    { ref: '05', num: 'Post-Even-Sem Provision', body: renderProvisionClause(data) },
    { ref: '06', num: 'Min CIE / SEE', body: renderMinCieSeeClause(data) },
  ];

  const clausesHtml = clauses.map(c => `
    <div class="clause">
      <div class="clause-num">${c.num}</div>
      <div class="clause-body">${c.body}</div>
    </div>
  `).join('');

  const notesArr = Array.isArray(data.notes) ? data.notes.filter(Boolean) : (data.notes ? [data.notes] : []);
  const notesHtml = notesArr.length
    ? `<div class="notes-block">
        <div class="notes-title">Additional Notes</div>
        <ul class="notes-list">
          ${notesArr.map(n => `<li>${escSentences(n)}</li>`).join('')}
        </ul>
      </div>`
    : '';

  recordArea.innerHTML = `
    <div class="record">
      <div class="record-head">
        <h2>Admission Year ${esc(data.admission_year || year)}</h2>
        <span class="scheme-tag">${esc(data.scheme || '')}</span>
      </div>
      <div class="clauses">
        ${clausesHtml}
      </div>
      ${notesHtml}
    </div>
  `;
}

async function selectYear(year, btn) {
  document.querySelectorAll('.year-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  recordArea.innerHTML = `<div class="empty-state">Loading record for ${esc(year)}&hellip;</div>`;

  try {
    const res = await fetch(`/api/regulations/${encodeURIComponent(year)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      recordArea.innerHTML = `<div class="empty-state">${esc(err.error || 'No record found for this admission year.')}</div>`;
      return;
    }
    const data = await res.json();
    renderRecord(year, data);
  } catch (e) {
    recordArea.innerHTML = `<div class="empty-state">Could not load data: ${esc(e.message)}</div>`;
  }
}

yearTabs.addEventListener('click', (e) => {
  const btn = e.target.closest('.year-tab');
  if (!btn) return;
  selectYear(btn.dataset.year, btn);
});

/* ---------------- PG: General regulations (M.Tech / MCA) ---------------- */

function renderPgTableWithNote(t) {
  if (!t) return '<em>Not recorded.</em>';
  let html = '';
  if (t.note) {
    html += `<p style="margin:0 0 0.6rem;font-size:0.86rem;color:var(--ink-soft);">${escSentences(t.note)}</p>`;
  }
  html += renderGenericTable(t.columns, t.rows);
  return html;
}

function renderPgClassDeclaration(cd) {
  if (!cd) return '<em>Not recorded.</em>';
  let html = renderGenericTable(cd.columns, cd.rows);
  if (cd.formula) {
    html += `<div class="kv-row" style="margin-top:0.6rem;"><span class="k">Formula</span><span class="v">${esc(cd.formula)}</span></div>`;
  }
  if (cd.min_cgpa_for_degree) {
    html += `<div class="kv-row"><span class="k">Min CGPA (degree)</span><span class="v">${esc(cd.min_cgpa_for_degree)}</span></div>`;
  }
  return html;
}

function renderPg(data) {
  const clauses = [
    { num: data.total_credits && data.total_credits.label, body: renderPgTableWithNote(data.total_credits) },
    { num: data.last_attempt && data.last_attempt.label, body: renderPgTableWithNote(data.last_attempt) },
    { num: data.passing_minimum && data.passing_minimum.label, body: renderPassingMarksClause(data.passing_minimum) },
    { num: data.grades && data.grades.label, body: renderGradesClause({ grades: data.grades }) },
    { num: data.class_declaration && data.class_declaration.label, body: renderPgClassDeclaration(data.class_declaration) },
  ].filter(c => c.num);

  const clausesHtml = clauses.map(c => `
    <div class="clause">
      <div class="clause-num">${esc(c.num)}</div>
      <div class="clause-body">${c.body}</div>
    </div>
  `).join('');

  const noteHtml = data.source_note
    ? `<div class="general-note">${escSentences(data.source_note)}</div>`
    : '';

  pgArea.innerHTML = `${noteHtml}<div class="clauses">${clausesHtml}</div>`;
}

async function loadPg() {
  try {
    const res = await fetch('/api/pg/general');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      pgArea.innerHTML = `<div class="empty-state">${esc(err.error || 'No PG regulation data found.')}</div>`;
      return;
    }
    renderPg(await res.json());
  } catch (e) {
    pgArea.innerHTML = `<div class="empty-state">Could not load PG regulations: ${esc(e.message)}</div>`;
  }
}
