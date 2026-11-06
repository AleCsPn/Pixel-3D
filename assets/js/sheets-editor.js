/*
 * Leitura e edição de uma tabela do site via Google Sheets.
 * Reutilizável: ao trocar o site, ajuste apenas SHEETS_CONFIG e
 * mantenha no HTML uma <table> (thead/tbody) + #sheet-toolbar + #sheet-alert.
 */
const SHEETS_CONFIG = {
    apiKey: 'AIzaSyABxvhFVLtZ86rO-KkG3fZ0m0-rLc_48h8',
    clientId: '389698599250-oba0vebes0hm22l6ljlbh8f1ppq92c08.apps.googleusercontent.com',
    spreadsheetId: '16BqeIGtsO47jb6yABaJyLEiE29qF6kPan6ZHlg6TsKQ',
    sheetName: 'acoes',                      // nome da aba
    tableSelector: '#actions-table table',   // tabela que recebe os dados
    headerRow: false,                        // true se a 1ª linha da planilha for cabeçalho
    columns: ['Ação', 'Descrição'],          // cabeçalhos usados quando headerRow = false
    allowAdd: true,
    allowDelete: true,
};

(function () {
    const C = SHEETS_CONFIG;
    const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
    const table = document.querySelector(C.tableSelector);
    const theadRow = table.querySelector('thead tr');
    const tbody = table.querySelector('tbody');
    const toolbar = document.getElementById('sheet-toolbar');
    const alertBox = document.getElementById('sheet-alert');

    let rows = [], headers = C.columns.slice(), numCols = C.columns.length;
    let editing = false, editingIndex = null, busy = false;
    let tokenClient = null, tokenExpiresAt = 0, pending = null, sheetGid = null;
    const firstDataRow = C.headerRow ? 2 : 1; // nº da linha da planilha do 1º dado

    // ---------- utilidades ----------
    const q = name => "'" + name.replace(/'/g, "''") + "'";
    const colLetter = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const isBlank = r => !r.some(c => c !== '' && c != null);

    function showMsg(text, type) {
        alertBox.innerHTML = '';
        if (!text) return;
        const d = el('div', 'alert alert-' + (type || 'danger'), text);
        alertBox.appendChild(d);
    }
    function errText(err) {
        const e = (err && err.result && err.result.error) || null;
        if (e && e.code === 403) return 'Sem permissão: a conta Google usada precisa ser editora desta planilha.';
        if (e && e.code === 404) return 'Planilha ou aba não encontrada. Confira o ID e o nome da aba.';
        if (e) return e.message;
        if (err && err.details) return err.details;
        return (err && err.message) || String(err);
    }

    // ---------- leitura ----------
    async function load() {
        const res = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: C.spreadsheetId, range: q(C.sheetName),
        });
        const values = res.result.values || [];
        if (C.headerRow && values.length) headers = values[0].map(v => v || '');
        rows = C.headerRow ? values.slice(1) : values;
        numCols = Math.max(headers.length, 1, ...rows.map(r => r.length));
        render();
    }

    // ---------- renderização ----------
    function render() {
        theadRow.innerHTML = '';
        for (let i = 0; i < numCols; i++) theadRow.appendChild(el('th', null, headers[i] || ''));
        if (editing) theadRow.appendChild(el('th', null, 'Ações'));

        tbody.innerHTML = '';
        rows.forEach((row, i) => {
            if (isBlank(row)) return;
            tbody.appendChild(i === editingIndex ? editRow(i, row) : viewRow(i, row));
        });
        if (editing && C.allowAdd) tbody.appendChild(newRow());
    }

    function btn(label, cls, onClick) {
        const b = el('button', 'btn btn-sm ' + cls + ' mr-1', label);
        b.type = 'button';
        b.addEventListener('click', onClick);
        return b;
    }

    function viewRow(i, row) {
        const tr = el('tr');
        for (let c = 0; c < numCols; c++) tr.appendChild(el('td', null, row[c] || ''));
        if (editing) {
            const td = el('td');
            td.appendChild(btn('Editar', 'btn-outline-primary', () => { editingIndex = i; render(); }));
            if (C.allowDelete) td.appendChild(btn('Excluir', 'btn-outline-danger', () => removeRow(i)));
            tr.appendChild(td);
        }
        return tr;
    }

    function inputsRow(row) {
        const tr = el('tr'), inputs = [];
        for (let c = 0; c < numCols; c++) {
            const td = el('td'), input = el('textarea', 'form-control form-control-sm');
            input.rows = 2; input.value = row[c] || ''; input.placeholder = headers[c] || '';
            td.appendChild(input); tr.appendChild(td); inputs.push(input);
        }
        return { tr, get: () => inputs.map(i => i.value) };
    }

    function editRow(i, row) {
        const { tr, get } = inputsRow(row);
        const td = el('td');
        td.appendChild(btn('Salvar', 'btn-success', () => saveRow(i, get())));
        td.appendChild(btn('Cancelar', 'btn-secondary', () => { editingIndex = null; render(); }));
        tr.appendChild(td);
        return tr;
    }

    function newRow() {
        const { tr, get } = inputsRow([]);
        tr.className = 'table-light';
        const td = el('td');
        td.appendChild(btn('Adicionar', 'btn-primary', () => addRow(get())));
        tr.appendChild(td);
        return tr;
    }

    // ---------- escrita ----------
    async function write(fn, okMsg) {
        if (busy) return;
        busy = true;
        try {
            await ensureToken();
            await fn();
            editingIndex = null;
            await load();
            showMsg(okMsg, 'success');
        } catch (e) {
            showMsg(errText(e));
        } finally { busy = false; }
    }

    const saveRow = (i, vals) => write(() => {
        const n = i + firstDataRow;
        return gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: C.spreadsheetId,
            range: `${q(C.sheetName)}!A${n}:${colLetter(numCols)}${n}`,
            valueInputOption: 'RAW',
            resource: { values: [vals] },
        });
    }, 'Linha atualizada.');

    const addRow = vals => {
        if (isBlank(vals)) return showMsg('Preencha ao menos um campo.', 'warning');
        return write(() => gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: C.spreadsheetId,
            range: q(C.sheetName),
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [vals] },
        }), 'Linha adicionada.');
    };

    async function getGid() {
        if (sheetGid !== null) return sheetGid;
        const r = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: C.spreadsheetId, fields: 'sheets.properties(sheetId,title)',
        });
        const s = r.result.sheets.find(s => s.properties.title === C.sheetName);
        if (!s) throw new Error('Aba "' + C.sheetName + '" não encontrada.');
        return (sheetGid = s.properties.sheetId);
    }

    const removeRow = i => {
        if (!confirm('Excluir esta linha da planilha? Essa ação não pode ser desfeita pelo site.')) return;
        return write(async () => {
            const n = i + firstDataRow;
            await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: C.spreadsheetId,
                resource: { requests: [{ deleteDimension: { range: {
                    sheetId: await getGid(), dimension: 'ROWS', startIndex: n - 1, endIndex: n,
                } } }] },
            });
        }, 'Linha excluída.');
    };

    // ---------- autenticação (Google Identity Services) ----------
    function initAuth() {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: C.clientId,
            scope: SCOPE,
            callback: r => pending && pending.ok(r),
            error_callback: e => pending && pending.fail(new Error(e.message || e.type || 'Falha no login')),
        });
    }
    function requestToken(prompt) {
        return new Promise((resolve, reject) => {
            pending = {
                ok: r => {
                    if (r.error) return reject(new Error(r.error_description || r.error));
                    gapi.client.setToken(r);
                    tokenExpiresAt = Date.now() + (r.expires_in || 3600) * 1000;
                    resolve();
                },
                fail: reject,
            };
            tokenClient.requestAccessToken({ prompt });
        });
    }
    async function ensureToken() {
        if (Date.now() > tokenExpiresAt - 60000) await requestToken('');
    }
    async function signIn() {
        try {
            await requestToken('');
            editing = true; showMsg(''); renderToolbar(); render();
        } catch (e) { showMsg('Não foi possível entrar: ' + errText(e)); }
    }
    function signOut() {
        const t = gapi.client.getToken();
        if (t) google.accounts.oauth2.revoke(t.access_token);
        gapi.client.setToken(null);
        tokenExpiresAt = 0; editing = false; editingIndex = null;
        showMsg(''); renderToolbar(); render();
    }

    function renderToolbar() {
        toolbar.innerHTML = '';
        if (!editing) {
            toolbar.appendChild(btn('Editar dados (entrar com Google)', 'btn-outline-primary', signIn));
        } else {
            toolbar.appendChild(el('span', 'badge badge-success mr-2', 'Modo de edição ativo'));
            toolbar.appendChild(btn('Sair da edição', 'btn-outline-secondary', signOut));
        }
    }

    // ---------- inicialização ----------
    gapi.load('client', async () => {
        renderToolbar();
        try {
            await gapi.client.init({
                apiKey: C.apiKey,
                discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            await load();
        } catch (e) { showMsg('Não foi possível carregar a planilha: ' + errText(e)); }
        try { initAuth(); } catch (e) { showMsg('Falha ao iniciar o login do Google: ' + errText(e)); }
    });
})();
