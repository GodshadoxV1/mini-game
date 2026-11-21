(() => {
  const ns = 'http://www.w3.org/2000/svg';
  function install(board, review) {
    const frame = board.parentElement;
    const overlay = document.createElementNS(ns, 'svg');
    overlay.setAttribute('viewBox', '0 0 8 8');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.add('board-marks');
    frame.append(overlay);
    const tools = document.createElement('div');
    tools.className = 'annotation-tools';
    tools.innerHTML = '<button type="button" aria-pressed="false">✎ Annoter</button><button type="button" disabled>Effacer</button><small>Clic droit pour marquer une case. Glissez pour tracer une flèche.</small>';
    frame.after(tools);
    const [mode, erase] = tools.querySelectorAll('button');
    const marks = new Map();
    let drawing = null, game = null, position = '', enabled = false;

    function point(square) {
      let x = 'abcdefgh'.indexOf(square[0]), y = 8 - Number(square[1]);
      return !review && chessFlipped ? [7-x,7-y] : [x,y];
    }
    function squareAt(e) {
      const rect = board.getBoundingClientRect();
      let x = Math.floor((e.clientX-rect.left)*8/rect.width);
      let y = Math.floor((e.clientY-rect.top)*8/rect.height);
      if (x<0 || y<0 || x>7 || y>7) return null;
      if (!review && chessFlipped) { x=7-x; y=7-y; }
      return 'abcdefgh'[x]+(8-y);
    }
    function paint(from,to) {
      const [x,y] = point(from), [u,v] = point(to);
      const element = document.createElementNS(ns,from===to?'rect':'path');
      if (from===to) {
        for (const [k,value] of Object.entries({x,y,width:1,height:1})) element.setAttribute(k,value);
        element.classList.add('marked-cell');
      } else {
        const length=Math.hypot(u-x,v-y);
        element.setAttribute('d',`M0 -.085 H${length-.38} V-.24 L${length} 0 L${length-.38} .24 V.085 H0 Z`);
        element.setAttribute('transform',`translate(${x+.5} ${y+.5}) rotate(${Math.atan2(v-y,u-x)*180/Math.PI})`);
        element.classList.add('marked-arrow');
      }
      overlay.append(element);
    }
    function render() {
      overlay.replaceChildren();
      for (const [from,to] of marks.values()) paint(from,to);
      if (drawing?.to) paint(drawing.from,drawing.to);
      erase.disabled=!marks.size;
    }
    function setMode(active) {
      enabled=active;
      mode.setAttribute('aria-pressed',String(enabled));
      frame.classList.toggle('annotating',enabled);
      tools.querySelector('small').textContent=enabled?'Touchez une case pour la marquer ou glissez entre deux cases.':'Clic droit pour marquer une case. Glissez pour tracer une flèche.';
    }
    mode.onclick=()=>setMode(!enabled);
    erase.onclick=()=>{marks.clear();render();};
    function cancel() { drawing=null; render(); }
    function handle(e) { e.preventDefault(); e.stopImmediatePropagation(); }
    frame.addEventListener('contextmenu',e=>e.preventDefault());
    frame.addEventListener('pointerdown',e=>{
      if (drawing || (!enabled && e.button!==2) || (enabled && ![0,2].includes(e.button))) return;
      const from=squareAt(e);if(!from)return;
      handle(e);drawing={id:e.pointerId,from,to:from};frame.setPointerCapture(e.pointerId);render();
    },true);
    frame.addEventListener('pointermove',e=>{
      if(drawing?.id!==e.pointerId)return;
      handle(e);drawing.to=squareAt(e);render();
    },true);
    frame.addEventListener('pointerup',e=>{
      if(drawing?.id!==e.pointerId)return;
      handle(e);const from=drawing.from,to=squareAt(e);
      if(to){const key=from+to;if(marks.has(key))marks.delete(key);else marks.set(key,[from,to]);}
      cancel();
    },true);
    frame.addEventListener('lostpointercapture',e=>{if(drawing?.id===e.pointerId)cancel();});
    frame.addEventListener('pointercancel',e=>{if(drawing?.id===e.pointerId)cancel();});
    frame.addEventListener('click',e=>{if(enabled)handle(e);},true);
    new MutationObserver(()=>{
      const now=review?board.dataset.position:chessGame?.fen();
      if(game!==chessGame || position!==now){
        if(game!==chessGame)setMode(false);
        game=chessGame;position=now;marks.clear();drawing=null;
      }
      render();
    }).observe(board,{childList:true});
  }
  install(document.getElementById('chess-board'),false);
  install(document.getElementById('chess-review-board'),true);
})();