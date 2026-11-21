/* Each contact belongs to the signed-in Pi Games profile. */
window.piSocial = (() => {
  function contacts(value) {
    const seen = new Set();
    return (Array.isArray(value) ? value : []).filter(contact => {
      if (!contact || typeof contact.id !== 'string' || !/^[\w-]{1,128}$/.test(contact.id) ||
          typeof contact.name !== 'string' || seen.has(contact.id)) return false;
      seen.add(contact.id);
      return true;
    }).map(({id, name}) => ({id, name:name.slice(0, 40)}));
  }

  function button(label, action) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'btn bo';
    node.textContent = label;
    node.onclick = async () => {
      node.disabled = true;
      try { await action(); }
      catch { toast('Action impossible. Réessayez depuis le profil.', 'err'); }
      finally { node.disabled = false; }
    };
    return node;
  }

  async function change(id, name, adding) {
    const owner = pUserId;
    if (!owner || id === owner) return;
    const save = async () => {
      const ref = db.doc('users/' + owner);
      const snap = await ref.get();
      if (!snap.exists || owner !== pUserId) return;
      const next = contacts(snap.data().chessFriends).filter(item => item.id !== id);
      if (adding) next.push({id, name});
      await ref.update({chessFriends:next});
      if (owner === pUserId) pData.chessFriends = next;
    };
    if (navigator.locks) await navigator.locks.request('pi-friends-' + owner, save);
    else await save();
  }

  function challenge(user) {
    if (!chessAccessAllowed() || user.id === pUserId) return;
    if (user.chessSuspended || banActive(user)) { toast('Ce joueur est indisponible pour un duel.', 'err'); return; }
    chessOpenDuelSetup();
    if (document.body.dataset.sc !== 'sc-chess-duel') return;
    chessEl('chess-duel-name').value = user.name;
    chessEl('chess-duel-password').focus();
  }

  function profile(elementId, id, user) {
    const host = document.getElementById(elementId);
    host.replaceChildren();
    if (!pUserId) return;
    if (pUserId === id) { host.append(button('Mes amis', list)); return; }
    const added = contacts(pData?.chessFriends).some(friend => friend.id === id);
    host.append(button(added ? 'Retirer de mes amis' : 'Ajouter à mes amis', async () => {
      await change(id, user.name, !added);
      if ((elementId === 'pi-social-actions' ? viewingProfileId : chessViewProfileId) === id) profile(elementId, id, user);
    }), button('Défier en 1v1', () => challenge({...user,id})));
  }

  async function list() {
    const owner = pUserId;
    if (!owner || !chessAccessAllowed()) return;
    showSc('sc-chess-friends');
    const host = document.getElementById('friends-list');
    host.textContent = 'Chargement des amis…';
    const snap = await db.doc('users/' + owner).get();
    const saved = contacts(snap.data()?.chessFriends).filter(friend => friend.id !== owner);
    const rows = await Promise.all(saved.map(async friend => ({friend,user:await chessFetchUser(friend.id)})));
    if (pUserId !== owner || document.body.dataset.sc !== 'sc-chess-friends') return;
    pData.chessFriends = saved;
    host.replaceChildren();
    for (const {friend,user} of rows.sort((a,b) => (a.user?.name || a.friend.name).localeCompare(b.user?.name || b.friend.name,'fr'))) {
      const row = document.createElement('div'), label = document.createElement('strong');
      row.className = 'friend-row';
      label.textContent = user?.name || friend.name;
      row.append(label);
      if (user) row.append(button('Profil', () => chessViewProfile(friend.id)),button('1v1', () => challenge(user)));
      else {
        const info=document.createElement('small'); info.textContent='Profil absent de cet appareil'; row.append(info);
      }
      row.append(button('Retirer', async () => { await change(friend.id,friend.name,false); await list(); }));
      host.append(row);
    }
    if (!rows.length) host.textContent = 'Votre liste est vide. Ouvrez le profil d’un joueur et choisissez « Ajouter à mes amis ».';
  }

  window.addEventListener('storage', async event => {
    if (event.key !== 'pi_localdb_v1' || !pUserId) return;
    const screen = document.body.dataset.sc, owner = pUserId;
    if (screen === 'sc-chess-friends') { await list(); return; }
    if (!['sc-profile','sc-chess-profile'].includes(screen)) return;
    const id = screen === 'sc-profile' ? viewingProfileId : chessViewProfileId;
    const [me, user] = await Promise.all([chessFetchUser(owner),chessFetchUser(id)]);
    if (!me || !user || pUserId !== owner || document.body.dataset.sc !== screen) return;
    pData.chessFriends = contacts(me.chessFriends);
    profile(screen === 'sc-profile' ? 'pi-social-actions' : 'chess-social-actions',id,user);
  });
  return {contacts,profile,list};
})();
