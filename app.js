(() => {
  'use strict';

  const ICONS = {
    email: '<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',
    summary: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7M9 8h3"/>',
    plan: '<path d="M4 6l2 2 3-3M4 14l2 2 3-3"/><path d="M12 7h8M12 15h8"/>',
    research: '<circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>'
  };
  const icon = (k) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;

  const TASKS = {
    email: {
      label: 'Email writer',
      title: 'Write an email',
      subtitle: 'Describe what you need to say. Get a clear, ready-to-edit draft with subject lines.',
      button: 'Generate email',
      fields: [
        { name: 'purpose', label: 'What should the email say?', type: 'textarea', placeholder: 'e.g. Ask the vendor to move Friday\'s delivery to Monday because our warehouse is closed.' },
        { name: 'recipient', label: 'Who is it for?', type: 'text', placeholder: 'e.g. Sam from Northwind Logistics' },
        { row: [
          { name: 'tone', label: 'Tone', type: 'select', options: ['professional', 'friendly', 'concise', 'formal', 'persuasive', 'empathetic'] },
          { name: 'length', label: 'Length', type: 'select', options: ['short', 'medium', 'long'], value: 'medium' }
        ] }
      ],
      example: { purpose: 'Ask the vendor to move Friday\'s delivery to Monday because our warehouse is closed for stock-take. Offer to cover any rescheduling fee.', recipient: 'Sam from Northwind Logistics', tone: 'friendly', length: 'short' }
    },
    summary: {
      label: 'Meeting summary',
      title: 'Summarise a meeting',
      subtitle: 'Paste a transcript or rough notes. Get decisions, action items with owners, and open questions.',
      button: 'Summarise meeting',
      fields: [
        { name: 'transcript', label: 'Transcript or notes', type: 'textarea', tall: true, placeholder: 'Paste the meeting text here...' }
      ],
      example: { transcript: 'Priya: Launch date is still the 14th, but design sign-off is late.\nTom: I can finish the pricing page by Wednesday if copy arrives Monday.\nPriya: Copy will come from Lena on Monday. We agreed to drop the dark mode feature from v1.\nLena: I\'ll draft the announcement email. Do we know who is handling support training?\nPriya: Not yet, that is an open question. Let\'s decide at Thursday\'s check-in.' }
    },
    plan: {
      label: 'Task planner',
      title: 'Plan your work',
      subtitle: 'Turn a goal into milestones, prioritised tasks with estimates, a weekly schedule and risks.',
      button: 'Create plan',
      fields: [
        { name: 'goal', label: 'What do you want to achieve?', type: 'textarea', placeholder: 'e.g. Launch a customer feedback survey and present results to leadership.' },
        { row: [
          { name: 'deadline', label: 'Deadline', type: 'text', placeholder: 'e.g. 6 weeks' },
          { name: 'hours', label: 'Hours per week', type: 'number', placeholder: '10' }
        ] },
        { name: 'context', label: 'Constraints or context (optional)', type: 'textarea', placeholder: 'Team size, budget, tools, blockers...' }
      ],
      example: { goal: 'Launch a customer feedback survey and present the results to leadership.', deadline: '6 weeks', hours: '8', context: 'Solo project. Survey tool is already licensed. Leadership meets on the last Friday of the month.' }
    },
    research: {
      label: 'Research helper',
      title: 'Research a topic',
      subtitle: 'Get a short answer, key points with confidence levels, and how to verify them.',
      button: 'Research',
      fields: [
        { name: 'question', label: 'What do you want to understand?', type: 'textarea', placeholder: 'e.g. What are the pros and cons of a four-day work week for a 30-person team?' },
        { row: [
          { name: 'depth', label: 'Depth', type: 'select', options: ['quick', 'standard', 'deep'], value: 'standard' },
          { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g. executive team' }
        ] }
      ],
      example: { question: 'What are the pros and cons of a four-day work week for a 30-person team?', depth: 'standard', audience: 'executive team' }
    },
    chat: {
      label: 'Chat',
      title: 'Chat with WorkMate',
      subtitle: 'Ask anything work related. It remembers the conversation until you clear it or close the tab.',
      button: 'Send',
      chat: true,
      fields: [
        { name: 'message', label: 'Message', type: 'textarea', placeholder: 'e.g. Help me prepare for a salary review conversation.' }
      ],
      example: { message: 'Help me prepare talking points for a one-to-one where I need to push back on an unrealistic deadline.' }
    }
  };

  const $ = (s) => document.querySelector(s);
  const tabsEl = $('#tabs'), formEl = $('#form'), outEl = $('#output'), metaEl = $('#outMeta');
  const copyBtn = $('#copyBtn'), saveBtn = $('#saveBtn');
  let current = 'email';
  let lastText = '';
  const chatHistory = []; // kept in memory only

  /* ---------- safe markdown renderer ---------- */
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (s) => esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');

  function markdown(src) {
    const lines = src.replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    const isTableSep = (l) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l || '');
    const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      let m;
      if ((m = line.match(/^#{1,4}\s+(.*)$/))) { out.push(`<h2>${inline(m[1])}</h2>`); i++; continue; }
      if (/^\s*---+\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
      if (line.includes('|') && isTableSep(lines[i + 1])) {
        const head = cells(line); i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes('|') && lines[i].trim()) { rows.push(cells(lines[i])); i++; }
        out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
        continue;
      }
      if (/^\s*>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
        out.push(`<ul>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ul>`); continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
        out.push(`<ol>${items.map((t) => `<li>${inline(t)}</li>`).join('')}</ol>`); continue;
      }
      const para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s|\s*>|\s*---+\s*$)/.test(lines[i]) && !(lines[i].includes('|') && isTableSep(lines[i + 1]))) { para.push(lines[i]); i++; }
      out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    }
    return out.join('\n');
  }

  /* ---------- UI ---------- */
  function renderTabs() {
    tabsEl.innerHTML = '';
    Object.entries(TASKS).forEach(([key, t]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(key === current));
      b.innerHTML = `${icon(key)}<span>${t.label}</span>`;
      b.addEventListener('click', () => select(key));
      tabsEl.appendChild(b);
    });
  }

  function fieldHtml(f) {
    const id = `f_${f.name}`;
    let control;
    if (f.type === 'textarea') control = `<textarea id="${id}" name="${f.name}" class="${f.tall ? 'tall' : ''}" placeholder="${esc(f.placeholder || '')}"></textarea>`;
    else if (f.type === 'select') control = `<select id="${id}" name="${f.name}">${f.options.map((o) => `<option value="${o}" ${o === f.value ? 'selected' : ''}>${o[0].toUpperCase() + o.slice(1)}</option>`).join('')}</select>`;
    else control = `<input id="${id}" name="${f.name}" type="${f.type}" ${f.type === 'number' ? 'min="1" max="80"' : ''} placeholder="${esc(f.placeholder || '')}">`;
    return `<div class="field"><label for="${id}">${f.label}</label>${control}</div>`;
  }

  function select(key) {
    current = key;
    const t = TASKS[key];
    $('#title').textContent = t.title;
    $('#subtitle').textContent = t.subtitle;
    formEl.innerHTML = t.fields.map((f) => (f.row ? `<div class="row">${f.row.map(fieldHtml).join('')}</div>` : fieldHtml(f))).join('') +
      `<p class="error" id="error" role="alert"></p>
       <div class="buttons">
         <button class="primary" type="submit" id="go">${t.button}</button>
         <button class="secondary" type="button" id="example">Try an example</button>
         ${t.chat ? '<button class="secondary" type="button" id="clear">Clear chat</button>' : ''}
       </div>`;
    $('#example').addEventListener('click', () => {
      Object.entries(t.example).forEach(([k, v]) => { const el = formEl.querySelector(`[name="${k}"]`); if (el) el.value = v; });
    });
    if (t.chat) $('#clear').addEventListener('click', () => { chatHistory.length = 0; showEmpty(); });
    renderTabs();
    if (t.chat && chatHistory.length) renderChat(); else showEmpty();
  }

  function showEmpty() {
    outEl.className = 'page empty';
    outEl.innerHTML = '<p>Your result appears here. Fill in the form and choose <strong>' + esc(TASKS[current].button) + '</strong>, or use <strong>Try an example</strong> to see how it works.</p>';
    metaEl.textContent = 'Result';
    lastText = ''; copyBtn.disabled = saveBtn.disabled = true;
  }

  function renderChat() {
    outEl.className = 'page chatpage';
    outEl.innerHTML = `<div class="chat-log">${chatHistory.map((m) => `<div class="bubble ${m.role === 'user' ? 'user' : 'ai'}">${m.role === 'user' ? `<p>${esc(m.content)}</p>` : markdown(m.content)}</div>`).join('')}</div>`;
    const log = outEl.querySelector('.chat-log'); log.scrollTop = log.scrollHeight;
    lastText = chatHistory.map((m) => `${m.role === 'user' ? 'You' : 'WorkMate'}: ${m.content}`).join('\n\n');
    copyBtn.disabled = saveBtn.disabled = !lastText;
  }

  function showResult(text, meta) {
    outEl.className = 'page';
    outEl.innerHTML = markdown(text);
    metaEl.textContent = meta;
    lastText = text; copyBtn.disabled = saveBtn.disabled = false;
  }

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = TASKS[current];
    const input = {};
    new FormData(formEl).forEach((v, k) => { input[k] = String(v); });
    const err = $('#error'), go = $('#go');
    err.textContent = '';
    const body = { task: current, input, redact: $('#redact').checked };
    if (t.chat) {
      if (!input.message.trim()) { err.textContent = 'Type a message first.'; return; }
      body.history = chatHistory.slice();
    }
    go.disabled = true; go.textContent = 'Working...';
    if (!t.chat) { outEl.className = 'page loading'; outEl.textContent = 'Generating'; copyBtn.disabled = saveBtn.disabled = true; }
    try {
      const res = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      const meta = data.demo ? 'Demo result' : `Generated with ${data.provider}`;
      if (t.chat) {
        chatHistory.push({ role: 'user', content: input.message }, { role: 'assistant', content: data.output });
        formEl.querySelector('[name="message"]').value = '';
        renderChat(); metaEl.textContent = meta;
      } else showResult(data.output, meta + (data.redacted ? ' - personal details hidden' : ''));
    } catch (ex) {
      err.textContent = ex.message;
      if (!t.chat) showEmpty();
    } finally {
      go.disabled = false; go.textContent = t.button;
    }
  });

  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(lastText); copyBtn.textContent = 'Copied'; }
    catch { copyBtn.textContent = 'Press Ctrl+C'; }
    setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
  });
  saveBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([lastText], { type: 'text/markdown' }));
    a.download = `workmate-${current}.md`; a.click(); URL.revokeObjectURL(a.href);
  });

  const dlg = $('#ethics');
  $('#ethicsLink').addEventListener('click', (e) => { e.preventDefault(); dlg.showModal ? dlg.showModal() : alert('See docs/RESPONSIBLE_AI.md'); });

  fetch('/api/health').then((r) => r.json()).then((h) => {
    const b = $('#modeBadge');
    b.className = `badge ${h.mode}`;
    b.textContent = h.mode === 'live' ? `Live (${h.provider})` : 'Demo mode';
    b.title = h.mode === 'live' ? 'Connected to an AI provider' : 'No API key set. Responses are templates.';
  }).catch(() => { $('#modeBadge').textContent = 'Offline'; });

  select('email');
})();
