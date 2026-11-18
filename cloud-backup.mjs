const backupButton = document.getElementById('cloud-backup');
const collection = 'piGamesBackups';
const maxPayloadBytes = 180_000;
const numericFields = [
  'games', 'best', 'totalPi', 'compGames', 'compBest', 'lastPlayed', 'perfectGames',
  'chessGames', 'chessWins', 'chessLosses', 'chessDraws', 'chessUpdatedAt',
  'chessEloBot', 'chessBestEloBot', 'chessRatedBotGames', 'chessGlickoRDBot', 'chessLastRatedBot',
  'chessEloHuman', 'chessBestEloHuman', 'chessHumanGames', 'chessGlickoRDHuman',
  'chessLastRatedHuman', 'chessHumanWins', 'chessHumanLosses', 'chessHumanDraws',
  'bannerIndex'
];
const connections = new Map();

async function connect(profileId) {
  const response = await fetch('./firebase-config.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('firebase-config');
  const config = await response.json();
  if (!config.projectId || !config.appId || !config.apiKey) throw new Error('firebase-config');
  const [appSdk, authSdk, storeSdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js')
  ]);
  const name = 'pi-games-backup-' + profileId;
  const app = appSdk.getApps().find(app => app.name === name) || appSdk.initializeApp(config, name);
  const auth = authSdk.getAuth(app);
  await auth.authStateReady();
  return { auth, authSdk, store: storeSdk.getFirestore(app), storeSdk };
}

function progressFields(data) {
  const progress = {};
  for (const field of numericFields) {
    if (Number.isFinite(data[field]) && data[field] >= 0) progress[field] = data[field];
  }
  if (THEMES.some(theme => theme.id === data.theme)) progress.theme = data.theme;
  if (PROFILE_EMOJIS.includes(data.avatarEmoji)) progress.avatarEmoji = data.avatarEmoji;
  if (Number.isInteger(progress.bannerIndex) && PROFILE_BANNERS[progress.bannerIndex]) {
    progress.banner = PROFILE_BANNERS[progress.bannerIndex];
  } else {
    delete progress.bannerIndex;
  }
  if (CHESS_PIECE_THEMES.some(theme => theme.id === data.chessPieceTheme)) {
    progress.chessPieceTheme = data.chessPieceTheme;
  }
  if (['green', 'wood', 'blue', 'purple'].includes(data.chessBoardTheme)) {
    progress.chessBoardTheme = data.chessBoardTheme;
  }
  progress.piDay = data.piDay === true;
  progress.weekChampion = data.weekChampion === true;
  progress.badges = Array.isArray(data.badges)
    ? [...new Set(data.badges.filter(badge => typeof badge === 'string' && /^[a-z0-9_]{1,50}$/.test(badge) && badge !== 'admin_star'))].slice(0, 100)
    : [];
  progress.chessPuzzlesSolved = Array.isArray(data.chessPuzzlesSolved)
    ? [...new Set(data.chessPuzzlesSolved.filter(n => Number.isInteger(n) && n >= 0 && n < CHESS_PUZZLES.length))]
    : [];
  if (typeof data.chessLastResult === 'string') progress.chessLastResult = data.chessLastResult.slice(0, 160);
  for (const field of ['chessHistoryBot', 'chessHistoryHuman']) {
    if (!Array.isArray(data[field])) continue;
    progress[field] = data[field].slice(-40)
      .filter(entry => entry && ['win', 'loss', 'draw'].includes(entry.result) && Number.isFinite(entry.ts) && Number.isFinite(entry.delta) && Number.isFinite(entry.rating))
      .map(entry => ({
        ts: entry.ts, delta: entry.delta, rating: entry.rating, result: entry.result,
        opponent: typeof entry.opponent === 'string' ? entry.opponent.slice(0, 80) : ''
      }));
  }
  return progress;
}

function errorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Adresse ou mot de passe incorrect.';
    case 'auth/email-already-in-use': return 'Ce compte existe déjà. Choisissez Connexion.';
    case 'auth/weak-password': return 'Choisissez un mot de passe plus long.';
    case 'auth/operation-not-allowed': return 'La connexion par e-mail doit être activée dans Firebase.';
    case 'backup-changed': return 'La sauvegarde a changé sur un autre appareil. Réessayez.';
    case 'permission-denied': return 'La sauvegarde est refusée par les règles Firebase.';
    default: return 'Connexion ou sauvegarde indisponible. Réessayez.';
  }
}

function showBackup({ auth, authSdk, store, storeSdk }, profileId, message = '') {
  if (pUserId !== profileId) return;
  const user = auth.currentUser;
  const actions = [];
  const run = action => async () => {
    const status = document.getElementById('cloud-status');
    const buttons = [...document.querySelectorAll('#modal-btns button')];
    buttons.forEach(button => { button.disabled = true; });
    try {
      await action();
    } catch (error) {
      status.textContent = errorMessage(error);
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  };
  const again = result => showBackup({ auth, authSdk, store, storeSdk }, profileId, result);
  let body = '<div class="mfield">';
  if (!user) {
    body += `<p class="mp">Connectez-vous à votre compte de sauvegarde pour retrouver votre progression sur un autre appareil.</p>
       <label for="cloud-email">Adresse e-mail</label><input id="cloud-email" type="email" autocomplete="email">
       <label for="cloud-password">Mot de passe</label><input id="cloud-password" type="password" autocomplete="current-password">`;
    const credentials = method => run(async () => {
      const email = document.getElementById('cloud-email');
      const password = document.getElementById('cloud-password');
      if (!email.value || !email.reportValidity() || !password.value) {
        document.getElementById('cloud-status').textContent = 'Renseignez votre e-mail et votre mot de passe.';
        return;
      }
      const pending = method(auth, email.value.trim(), password.value);
      password.value = '';
      await pending;
      again('');
    });
    actions.push(
      { label: 'Connexion', cls: 'bp', fn: credentials(authSdk.signInWithEmailAndPassword) },
      { label: 'Créer un compte', cls: 'bg', fn: credentials(authSdk.createUserWithEmailAndPassword) },
      { label: 'Mot de passe oublié', cls: 'bg', fn: run(async () => {
        const email = document.getElementById('cloud-email');
        if (!email.value || !email.reportValidity()) {
          document.getElementById('cloud-status').textContent = 'Renseignez votre e-mail.';
          return;
        }
        await authSdk.sendPasswordResetEmail(auth, email.value.trim());
        document.getElementById('cloud-status').textContent = 'Si ce compte existe, un lien de réinitialisation a été envoyé.';
      }) }
    );
  } else {
    body += `<p class="mp">Compte de sauvegarde : <b>${esc(user.email || '')}</b></p>
      <p class="mp">Sauvegardez la progression de ce profil ou restaurez votre dernière copie Firebase.</p>`;
    const remote = storeSdk.doc(store, collection, user.uid);
    const local = db.doc('users/' + profileId);
    actions.push(
      { label: 'Sauvegarder', cls: 'bp', fn: run(async () => {
        const saved = await storeSdk.getDocFromServer(remote);
        const profile = await local.get();
        if (!profile.exists || pUserId !== profileId) return;
        if (saved.exists() && !window.confirm('Remplacer la dernière sauvegarde par la progression de cet appareil ?')) return;
        const payload = JSON.stringify(progressFields(profile.data()));
        if (new TextEncoder().encode(payload).length > maxPayloadBytes) {
          again('Cette sauvegarde dépasse la taille autorisée.');
          return;
        }
        await storeSdk.runTransaction(store, async transaction => {
          const latest = await transaction.get(remote);
          if (latest.data()?.updatedAt?.toMillis() !== saved.data()?.updatedAt?.toMillis()) {
            throw Object.assign(new Error(), { code: 'backup-changed' });
          }
          transaction.set(remote, { version: 1, payload, updatedAt: storeSdk.serverTimestamp() });
        });
        again('Progression sauvegardée.');
      }) },
      { label: 'Restaurer', cls: 'bg', fn: run(async () => {
        const saved = await storeSdk.getDocFromServer(remote);
        if (!saved.exists()) {
          again('Aucune sauvegarde trouvée pour ce compte.');
          return;
        }
        const { version, payload } = saved.data();
        if (version !== 1 || typeof payload !== 'string' || new TextEncoder().encode(payload).length > maxPayloadBytes) {
          again('Cette sauvegarde est incompatible.');
          return;
        }
        const data = JSON.parse(payload);
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          again('Cette sauvegarde est incompatible.');
          return;
        }
        const profile = await local.get();
        if (!profile.exists || pUserId !== profileId) return;
        if (!window.confirm('Appliquer la progression sauvegardée à ce profil sur cet appareil ?')) return;
        const patch = progressFields(data);
        if (profile.data().badges?.includes('admin_star')) patch.badges.push('admin_star');
        await local.update(patch);
        if (pUserId !== profileId) return;
        Object.assign(pData, patch);
        localStorage.removeItem(chessPuzzleStorageKey());
        applyTheme(pData.theme || 'midnight');
        chessLoadUserPreferences();
        openGlobalAccount();
        again('Progression restaurée.');
      }) },
      { label: 'Déconnecter le cloud', cls: 'bg', fn: run(async () => {
        await authSdk.signOut(auth);
        again('Compte de sauvegarde déconnecté.');
      }) }
    );
  }
  body += '<p id="cloud-status" class="mp" role="status" aria-live="polite"></p></div>';
  openModal('Sauvegarde cloud', body, [...actions, { label: 'Fermer', cls: 'bg', fn: closeModal }]);
  document.getElementById('cloud-status').textContent = message;
}

backupButton.hidden = false;
backupButton.addEventListener('click', async () => {
  const profileId = pUserId;
  if (!profileId) return;
  backupButton.disabled = true;
  try {
    if (!connections.has(profileId)) connections.set(profileId, connect(profileId));
    showBackup(await connections.get(profileId), profileId);
  } catch (error) {
    connections.delete(profileId);
    toast(error.message === 'firebase-config' ? 'La sauvegarde Firebase est en attente de configuration.' : errorMessage(error), 'err');
  } finally {
    backupButton.disabled = false;
  }
});
