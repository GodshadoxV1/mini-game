(() => {
  const header = document.getElementById('knight-top');
  const timer = document.getElementById('knight-timer');
  let interval = 0, started = 0, routing = false;

  function updateTimer(finished) {
    const seconds = Math.floor((performance.now() - started) / 1000);
    const duration = Math.floor(seconds / 60) + ' min ' + String(seconds % 60).padStart(2, '0') + ' s';
    timer.textContent = (finished ? 'Résolu en ' : 'Temps écoulé · ') + duration;
  }
  window.knightStopTimer = () => {
    if (interval) updateTimer(true);
    clearInterval(interval);
    interval = 0;
  };
  window.knightSync = id => {
    let active = 'play';
    if (id === 'sc-chess-puzzles' || (id === 'sc-chess-game' && chessMode === 'puzzle')) active = 'puzzles';
    if (id === 'sc-chess-learn' || (id === 'sc-chess' && !document.getElementById('studio-learn').hidden)) active = 'learn';
    if (id === 'sc-chess-watch' || id === 'sc-chess-review') active = 'watch';
    if (id === 'sc-chess-rankings' || id === 'sc-chess-directory') active = 'rank';
    if (id === 'sc-chess-profile') active = 'profile';
    header.querySelectorAll('nav button,#knight-account').forEach(button => {
      if (button.dataset.knight === active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.getElementById('knight-account').textContent = pName || 'Mon profil';
    window.knightStopTimer();
    timer.hidden = true;
  };

  function timed() {
    chessStartPuzzle(Math.floor(Math.random() * CHESS_PUZZLES.length));
    if (document.body.dataset.sc !== 'sc-chess-game') return;
    started = performance.now();
    timer.hidden = false;
    updateTimer(false);
    interval = setInterval(() => updateTimer(false), 250);
  }
  function replay() {
    startChess('analysis');
    if (document.body.dataset.sc !== 'sc-chess-game') return;
    for (const san of ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#']) chessGame.move(san);
    chessFinished = true;
    chessPauseClock();
    chessRender();
    chessOpenReview();
    chessReviewGo(0);
  }
  async function navigate(button) {
    const target = button.dataset.knight;
    const origin = document.body.dataset.sc;
    if (target !== 'home' && !chessAccessAllowed()) return;
    if (origin === 'sc-chess-game' || origin === 'sc-chess-review') {
      if (origin === 'sc-chess-game' && chessRatingEligible && !chessFinished && chessGame?.history().length &&
          !window.confirm('Quitter cette partie classée compte comme un abandon. Quitter la partie ?')) return;
      await openChessHub();
    }
    if (button.hasAttribute('data-lesson')) {
      await openChessHub();
      chessStudio.learn(Number(button.dataset.lesson));
      return;
    }
    switch (target) {
      case 'play': return openChessHub();
      case 'puzzles': await chessOpenPuzzleHub(); return chessFilterPuzzles('all');
      case 'learn': return showSc('sc-chess-learn');
      case 'watch': return showSc('sc-chess-watch');
      case 'rank': return chessOpenRankings('human');
      case 'profile': return chessOpenProfile();
      case 'home': return chessExitToHome();
      case 'timed': return timed();
      case 'themes': return document.getElementById('knight-themes').focus();
      case 'replay': return replay();
      case 'analysis': return startChess('analysis');
    }
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-knight],[data-lesson]');
    if (!button || routing) return;
    routing = true;
    try { await navigate(button); } finally { routing = false; }
  });
})();
