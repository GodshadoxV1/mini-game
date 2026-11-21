(() => {
  const sections = [
    ['Jouer', '♞', [
      ['Salle de jeu', openChessHub],
      ['Contre un robot', chessOpenBotPicker],
      ['Duel sur cet appareil', chessOpenDuelSetup]
    ]],
    ['Entraînement', '♟', [
      ['Tous les puzzles', () => openPuzzles('all')],
      ['Mats en un coup', () => openPuzzles('mate')],
      ['Échiquier d’analyse', () => startChess('analysis')]
    ]],
    ['Communauté', '♜', [
      ['Classement des joueurs', () => chessOpenRankings('human')],
      ['Classement contre les robots', () => chessOpenRankings('bot')],
      ['Annuaire du club', chessOpenDirectory]
    ]],
    ['Mon espace', 'π', [
      ['Mon profil', chessOpenProfile],
      ['Mes dernières parties', () => reveal('.arena-recent')],
      ['Pièces et couleurs', () => reveal('.chess-menu-appearance')]
    ]]
  ];

  async function openPuzzles(filter) {
    await chessOpenPuzzleHub();
    if (document.body.dataset.sc === 'sc-chess-puzzles') chessFilterPuzzles(filter);
  }

  async function reveal(selector) {
    await openChessHub();
    const section = document.querySelector(selector);
    section.tabIndex = -1;
    section.focus({preventScroll: true});
    section.scrollIntoView({block: 'center'});
  }

  function closeMenus() {
    document.querySelectorAll('.club-menu details[open]').forEach(group => group.open = false);
  }

  function action(label, callback, className) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener('click', () => { closeMenus(); callback(); });
    return button;
  }

  const screens = ['sc-chess', 'sc-chess-bots', 'sc-chess-duel', 'sc-chess-puzzles', 'sc-chess-rankings', 'sc-chess-directory'];
  screens.forEach(id => {
    const screen = document.getElementById(id);
    const nav = screen.querySelector('.arena-rail') || document.createElement('nav');
    nav.className = 'arena-rail club-menu';
    nav.setAttribute('aria-label', 'Navigation Pi Chess');
    nav.replaceChildren(action('π  Pi Chess', openChessHub, 'arena-mark'));
    sections.forEach(([title, icon, items]) => {
      const group = document.createElement('details');
      const summary = document.createElement('summary');
      const symbol = document.createElement('span');
      symbol.setAttribute('aria-hidden', 'true');
      symbol.textContent = icon;
      summary.append(symbol, title);
      const panel = document.createElement('div');
      panel.className = 'club-submenu';
      items.forEach(([label, callback]) => panel.append(action(label, callback)));
      group.append(summary, panel);
      summary.addEventListener('click', () => {
        nav.querySelectorAll('details[open]').forEach(other => { if (other !== group) other.open = false; });
      });
      nav.append(group);
    });
    nav.append(action('← Centre de jeux', chessExitToHome, 'club-exit'));
    screen.prepend(nav);
  });
  document.addEventListener('click', event => { if (!event.target.closest('.club-menu')) closeMenus(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const group = document.querySelector('.sc.on .club-menu details[open]');
    if (group) { group.open = false; group.querySelector('summary').focus(); }
  });
})();