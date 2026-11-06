(function () {
    'use strict';
    var NAV = [['Início', 'index.html'], ['Sobre', 'sobre.html'], ['Projetos', 'projetos.html'], ['Atividades', 'atividades.html'], ['Equipamentos', 'equipamentos.html'], ['Notícias', 'noticias.html'], ['Contato', 'contato.html']];
    // Conteúdo de exemplo: [título, descrição, etiqueta/categoria, ícone]
    var DATA = {
        projects: [
            ['Placeholder 1', 'Descrição do Placeholder 1.', 'Placeholder 1', '🖨️'],
            ['Placeholder 2', 'Descrição do Placeholder 2.', 'Placeholder 1', '♻️'],
            ['Placeholder 3', 'Descrição do Placeholder 3.', 'Placeholder 1', '🧩'],
            ['Placeholder 4', 'Descrição do Placeholder 4.', 'Placeholder 2', '📐'],
            ['Placeholder 5', 'Descrição do Placeholder 5.', 'Placeholder 1', '🐞'],
            ['Placeholder 6', 'Descrição do Placeholder 6.', 'Placeholder 3', '🤖']
        ],
        activities: [
            ['Placeholder 1', 'Descrição do Placeholder 1.', 'Placeholder 1', '📐'],
            ['Placeholder 2', 'Descrição do Placeholder 2.', 'Placeholder 2', '🖨️'],
            ['Placeholder 3', 'Descrição do Placeholder 3.', 'Placeholder 1', '🤖'],
            ['Placeholder 4', 'Descrição do Placeholder 4.', 'Placeholder 2', '🔥'],
            ['Placeholder 5', 'Descrição do Placeholder 5.', 'Placeholder 1', '🛠️'],
            ['Placeholder 6', 'Descrição do Placeholder 6.', 'Placeholder 3', '⭐']
        ],
        equipment: [
            ['Placeholder 1', 'Descrição do Placeholder 1.', 'Placeholder 1', '🖨️'],
            ['Placeholder 2', 'Descrição do Placeholder 2.', 'Placeholder 2', '🔦'],
            ['Placeholder 3', 'Descrição do Placeholder 3.', 'Placeholder 3', '🔌'],
            ['Placeholder 4', 'Descrição do Placeholder 4.', 'Placeholder 3', '🔋'],
            ['Placeholder 5', 'Descrição do Placeholder 5.', 'Placeholder 4', '💻'],
            ['Placeholder 6', 'Descrição do Placeholder 6.', 'Placeholder 2', '🔧']
        ],
        news: [
            ['Placeholder 1', 'Descrição do Placeholder 1.', '12/06/2025', '📰'],
            ['Placeholder 2', 'Descrição do Placeholder 2.', '05/06/2025', '🏆'],
            ['Placeholder 3', 'Descrição do Placeholder 3.', '28/05/2025', '📅']
        ]
    };
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
    var page = location.pathname.split('/').pop() || 'index.html';
    var root = document.documentElement;

    // Preferências de aparência
    var colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    var themeMode = 'system';
    try {
        var storedMode = localStorage.getItem('theme-mode');
        themeMode = ['system', 'light', 'dark', 'contrast'].indexOf(storedMode) !== -1 ? storedMode : (localStorage.getItem('hc') === '1' ? 'contrast' : localStorage.getItem('dark') === '1' ? 'dark' : 'system');
    } catch (e) { }
    function applyTheme() {
        var dark = themeMode === 'dark' || (themeMode === 'system' && colorScheme.matches);
        if (dark) root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
        if (themeMode === 'contrast') root.setAttribute('data-contrast', 'hc');
        else root.removeAttribute('data-contrast');
    }
    function setThemeMode(mode) {
        themeMode = mode;
        applyTheme();
        try { localStorage.setItem('theme-mode', mode); } catch (e) { }
    }
    applyTheme();
    var onColorSchemeChange = function () { if (themeMode === 'system') applyTheme(); };
    if (colorScheme.addEventListener) colorScheme.addEventListener('change', onColorSchemeChange);
    else colorScheme.addListener(onColorSchemeChange);

    // Cabeçalho e rodapé
    var logo = '<img class="brand-logo" src="assets/logo.png" alt="Pixel-3D">';
    var h = document.getElementById('site-header');
    if (h) {
        h.className = 'site-header';
        h.innerHTML = '<div class="container bar"><a class="brand" href="index.html" aria-label="Pixel-3D, página inicial">' + logo + '</a>' +
            '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav">Menu</button>' +
            '<nav id="nav" aria-label="Principal"><ul>' + NAV.map(function (n) { return '<li><a href="' + n[1] + '"' + (n[1] === page ? ' aria-current="page"' : '') + '>' + n[0] + '</a></li>'; }).join('') + '</ul></nav>' +
            '<div class="appearance"><button class="icon-btn appearance-toggle" type="button" id="appearance-toggle" aria-label="Preferências de aparência" aria-haspopup="true" aria-expanded="false" aria-controls="appearance-menu">◐ <span class="sr">Aparência</span></button>' +
            '<div class="appearance-menu" id="appearance-menu" role="radiogroup" aria-label="Tema do site" hidden>' +
            '<button type="button" role="radio" data-mode="system">◉ <span>Seguir sistema</span></button>' +
            '<button type="button" role="radio" data-mode="light">☀ <span>Tema claro</span></button>' +
            '<button type="button" role="radio" data-mode="dark">☾ <span>Tema escuro</span></button>' +
            '<button type="button" role="radio" data-mode="contrast">◐ <span>Alto contraste</span></button></div></div></div>';
        var nav = h.querySelector('nav'), mb = h.querySelector('.menu-btn');
        mb.addEventListener('click', function () { var o = nav.classList.toggle('open'); mb.setAttribute('aria-expanded', o); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); mb.focus(); } });
        var appearanceToggle = h.querySelector('#appearance-toggle');
        var appearanceMenu = h.querySelector('#appearance-menu');
        var modeButtons = appearanceMenu.querySelectorAll('[data-mode]');
        function updateAppearanceMenu() {
            modeButtons.forEach(function (button) { button.setAttribute('aria-checked', button.dataset.mode === themeMode); });
        }
        function closeAppearanceMenu(returnFocus) {
            appearanceMenu.hidden = true;
            appearanceToggle.setAttribute('aria-expanded', 'false');
            if (returnFocus) appearanceToggle.focus();
        }
        appearanceToggle.addEventListener('click', function () {
            var open = appearanceMenu.hidden;
            appearanceMenu.hidden = !open;
            appearanceToggle.setAttribute('aria-expanded', open);
            if (open) appearanceMenu.querySelector('[aria-checked="true"]').focus();
        });
        modeButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                setThemeMode(button.dataset.mode);
                updateAppearanceMenu();
                closeAppearanceMenu(true);
            });
        });
        document.addEventListener('click', function (e) {
            if (!appearanceMenu.hidden && !h.querySelector('.appearance').contains(e.target)) closeAppearanceMenu(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !appearanceMenu.hidden) closeAppearanceMenu(true);
        });
        updateAppearanceMenu();
    }
    var f = document.getElementById('site-footer');
    if (f) {
        f.className = 'site-footer';
        f.innerHTML = '<div class="container foot"><strong class="footer-brand">' + logo + '</strong>' +
            '<ul class="soc"><li><a href="https://www.instagram.com/pixel.mch/" target="_blank" rel="noopener noreferrer" aria-label="Instagram do Pixel-3D (abre em nova aba)">IG</a></li></ul>' +
            '<small>Inovação • Educação • Tecnologia<br>© ' + new Date().getFullYear() + ' Pixel-3D — IFSULDEMINAS Campus Machado</small></div>';
    }

    // Grades de cards com filtro
    document.querySelectorAll('[data-grid]').forEach(function (box) {
        var items = DATA[box.dataset.grid] || [], limit = +box.dataset.limit || items.length;
        var cats = ['Todos'].concat(items.map(function (i) { return i[2]; }).filter(function (c, k, a) { return a.indexOf(c) === k; }));
        var chips = box.dataset.filter ? '<div class="chips" role="group" aria-label="Filtrar por categoria">' + cats.map(function (c, k) { return '<button type="button" class="chip" aria-pressed="' + (k === 0) + '">' + esc(c) + '</button>'; }).join('') + '</div>' : '';
        box.innerHTML = chips + '<div class="grid"></div><p class="sr" role="status"></p>';
        var grid = box.querySelector('.grid'), st = box.querySelector('[role=status]');
        function draw(cat) {
            var list = items.filter(function (i) { return cat === 'Todos' || i[2] === cat; }).slice(0, limit);
            grid.innerHTML = list.map(function (i) { return '<article class="card"><div class="ph" aria-hidden="true">' + i[3] + '</div><div class="card-b"><h3>' + esc(i[0]) + '</h3><p>' + esc(i[1]) + '</p><span class="tag">' + esc(i[2]) + '</span></div></article>'; }).join('');
            st.textContent = list.length + ' resultado(s)';
        }
        box.querySelectorAll('.chip').forEach(function (b) { b.addEventListener('click', function () { box.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); draw(b.textContent); }); });
        draw('Todos');
    });

    // Formulário de contato (abre o e-mail do usuário; não há servidor)
    var form = document.getElementById('contact-form');
    if (form) form.addEventListener('submit', function (e) {
        e.preventDefault();
        var d = new FormData(form);
        location.href = 'mailto:herbert.faria@ifsuldeminas.edu.br?subject=' + encodeURIComponent('[Pixel-3D] ' + d.get('assunto')) +
            '&body=' + encodeURIComponent(d.get('mensagem') + '\n\n' + d.get('nome') + ' <' + d.get('email') + '>');
    });
})();
