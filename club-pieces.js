/* Original two-tone club pieces, drawn on a common 64-unit grid. */
(() => {
  const motifs = {
    p: '<circle cx="32" cy="19" r="8"/><path d="M25 29h14l-3 5q-1 6 6 13H22q7-7 6-13z"/>',
    r: '<path d="M17 11h7v7h5v-7h6v7h5v-7h7v16l-6 5 2 15H21l2-15-6-5z"/><path class="detail" d="M23 27h18"/>',
    n: '<path d="M20 47q1-9 10-17l5-6-12 8-7-3 2-8 9-9 2-7 5 5 4-4 1 7q13 10 7 34z"/><path class="detail" d="m22 22 3-2m11-4q5 3 6 9"/><circle class="eye" cx="30" cy="16" r="1.5"/>',
    b: '<path d="M32 6q14 10 14 19 0 7-10 12l6 10H22l6-10q-10-4-10-12 0-9 14-19z"/><path class="detail" d="m34 14-7 11m-2 11h14"/>',
    q: '<path d="m14 19 10 7 8-15 8 15 10-7-8 23H22z"/><circle cx="13" cy="17" r="3.3"/><circle cx="32" cy="9" r="3.3"/><circle cx="51" cy="17" r="3.3"/><path d="M22 40h20l2 7H20z"/><path class="detail" d="m27 28 2 7m8-7-2 7"/>',
    k: '<path d="M29 5h6v5h5v5h-5v5h-6v-5h-5v-5h5z"/><path d="M32 22c-12-9-21 1-13 12l6 7-4 6h22l-4-6 6-7c8-11-1-21-13-12z"/><path class="detail" d="M32 25v10m-7 5h14"/>'
  };
  const assets = {};
  for (const color of ['w','b']) {
    const white = color === 'w', fill = white?'#fcf8e9':'#414950', ink = white?'#373e43':'#182028', line = white?'#847c6b':'#bec9cf';
    for (const [type,motif] of Object.entries(motifs)) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>.detail{fill:none;stroke:'+line+';stroke-width:2}.eye{fill:'+ink+';stroke:none}</style><g fill="'+fill+'" stroke="'+ink+'" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'+motif+'<path d="M21 47h22l4 4v5H17v-5z"/><path class="detail" d="M21 52h22"/></g></svg>';
      assets[color+type] = 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    }
  }
  CHESS_PIECE_ASSETS['club-relief'] = assets;
  CHESS_PIECE_THEMES.push({id:'club-relief',name:'Club relief'});
})();
