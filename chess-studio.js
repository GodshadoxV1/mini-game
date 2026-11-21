const chessStudio = (() => {
  const el = key => document.getElementById('studio-' + key);
  const lessons = [
    { title:'Les règles · protéger la dame', fen:'7k/8/5KQ1/8/8/8/8/8 w - - 0 1',
      moves:['Qg7#'], notes:['Les blancs jouent. Le roi f6 protège la case g7. Où placer la dame pour mater ?', 'Dame g7 fait mat. Le roi noir ne peut ni capturer la dame protégée, ni sortir du coin.'] },
    { title:'Les ouvertures · la partie italienne',
      moves:['e4','e5','Nf3','Nc6','Bc4','Bc5','O-O'], notes:['Suivez les premiers coups de la partie italienne.', 'Le pion e4 contrôle d5 et ouvre une diagonale au fou.', 'Les noirs occupent eux aussi le centre.', 'Le cavalier f3 attaque le pion e5.', 'Le cavalier c6 défend e5.', 'Le fou blanc vise f7 depuis c4.', 'Le fou noir se développe en c5 et vise f2.', 'Le petit roque met le roi blanc à l’abri et rapproche la tour du centre.'] },
    { title:'Les tactiques · la fourchette', fen:'r3k3/8/8/1N6/8/8/8/6K1 w - - 0 1',
      moves:['Nc7+','Kd7','Nxa8'], notes:['Le roi et la tour noirs sont sur la huitième rangée. Cherchez une double attaque.', 'Le cavalier c7 attaque le roi e8 et la tour a8.', 'Le roi doit quitter l’échec. La tour reste attaquée.', 'Le cavalier prend la tour en a8.'] },
    { title:'Les finales · la promotion', fen:'8/k5P1/5K2/8/8/8/8/8 w - - 0 1',
      moves:['g8=Q'], notes:['Le pion g7 est à une case de la promotion. Le roi adverse est trop loin pour l’arrêter.', 'Sur la huitième rangée, le pion devient une dame. Les blancs disposent désormais d’un avantage matériel décisif.'] }
  ];
  const cadence = [[60,'1 min'],[180,'3 min'],[300,'5 min'],[600,'10 min'],[900,'15 min'],[0,'Libre']];
  let studying=false, ply=0;
  const timeChoice=()=>Number(el('times').querySelector(':checked').value);

  for (const [seconds,label] of cadence) {
    const item=document.createElement('label'),input=document.createElement('input'),caption=document.createElement('span');
    input.type='radio';input.name='studio-cadence';input.value=seconds;input.checked=seconds===300;
    caption.textContent=label;item.append(input,caption);el('times').append(item);
  }
  for(const [i,lesson] of lessons.entries())el('lesson').add(new Option(lesson.title,i));
  function puzzleIndex(){
    const d=new Date();
    return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000)%CHESS_PUZZLES.length;
  }
  function draw(){
    const board=el('board'),clock=timeChoice(),local=el('mode').value==='local';
    const bot=CHESS_BOTS.find(b=>b.id===el('bot').value)||chessActiveBot();
    const lesson=lessons[Number(el('lesson').value)];
    let move=null;
    if(studying){
      if(typeof Chess==='undefined'){
        delete board.dataset.placement;el('note').textContent='Le module d’échecs est indisponible. Rechargez la page pour suivre la leçon.';
        el('step').textContent='';el('prev').disabled=true;el('next').disabled=true;
      }else{
        const game=lesson.fen?new Chess(lesson.fen):new Chess();
        for(const san of lesson.moves.slice(0,ply))move=game.move(san);
        board.dataset.placement=game.fen().split(' ')[0];
        el('note').textContent=lesson.notes[ply];
        el('step').textContent=ply+' / '+lesson.moves.length;
        el('prev').disabled=ply===0;el('next').disabled=ply===lesson.moves.length;
      }
    }else delete board.dataset.placement;
    chessDiagram(board);
    board.setAttribute('aria-label',studying?lesson.title+' · '+el('note').textContent:'Position de départ');
    if(move)for(const sq of [move.from,move.to]){
      const cell=board.children[(8-Number(sq[1]))*8+'abcdefgh'.indexOf(sq[0])];
      cell.classList.add('studio-last');
    }
    const label=clock?Math.floor(clock/60)+':00':'∞';
    el('black').textContent=studying?'Noirs':local?'Adversaire local':bot.name+' · '+chessBotRating(bot)+' Elo';
    el('white').textContent=studying?'Blancs':(pName||'Vous')+' · Blancs';
    el('black-clock').textContent=studying?'':label;el('white-clock').textContent=studying?'':label;
    el('bot-field').hidden=local;el('options').hidden=local;
    el('start').textContent=local?'Configurer le duel':'Jouer contre '+bot.name;
    el('rating').textContent=chessRating(pData,local?'human':'bot');
    el('rating').nextElementSibling.textContent=local?'Elo en duel':'Elo contre les robots';
  }
  function setStudy(on){
    studying=on;el('play').hidden=on;el('learn').hidden=!on;
    el('title').textContent=on?'Votre leçon sur l’échiquier.':'À vous de jouer.';el('intro').textContent=on?'Avancez coup par coup avec les flèches du panneau.':'Choisissez votre adversaire et votre cadence.';el('rating').parentElement.hidden=on;window.knightSync?.(document.body.dataset.sc);el('play-tab').setAttribute('aria-pressed',String(!on));draw();
  }
  function prepareBot(){
    chessSelectBot(el('bot').value);
    document.getElementById('chess-bot-time').value=String(timeChoice());
  }
  el('start').onclick=()=>{
    if(el('mode').value==='local'){
      document.getElementById('chess-duel-time').value=String(timeChoice());chessOpenDuelSetup();
    }else{prepareBot();chessStartVsBot();}
  };
  el('options').onclick=()=>{prepareBot();chessOpenBotPicker();};
  function daily(){if(chessAccessAllowed())chessStartPuzzle(puzzleIndex());}
  el('puzzle').onclick=daily;
  el('mode').onchange=()=>{
    const local=el('mode').value==='local',bullet=el('times').querySelector('[value="60"]');
    if(local&&bullet.checked)el('times').querySelector('[value="300"]').checked=true;
    bullet.parentElement.hidden=local;document.querySelectorAll('[data-mode-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modeChoice===el('mode').value)));draw();
  };
  document.querySelectorAll('[data-mode-choice]').forEach(b=>b.onclick=()=>{el('mode').value=b.dataset.modeChoice;el('mode').onchange();});
  el('bot').onchange=draw;el('times').onchange=draw;
  el('analysis-tab').onclick=()=>startChess('analysis');el('play-tab').onclick=()=>setStudy(false);
  el('lesson').onchange=()=>{ply=0;draw();};
  el('prev').onclick=()=>{if(ply>0){ply--;draw();}};
  el('next').onclick=()=>{if(ply<lessons[Number(el('lesson').value)].moves.length){ply++;draw();}};
  function refresh(){
    el('bot').replaceChildren(...CHESS_BOTS.map(b=>new Option(b.name+' · '+chessBotRating(b)+' Elo',b.id)));
    el('bot').value=chessActiveBot().id;
    const puzzle=CHESS_PUZZLES[puzzleIndex()];
    el('puzzle-title').textContent=puzzle.title.charAt(0).toUpperCase()+puzzle.title.slice(1);
    setStudy(false);
  }
  return {refresh,draw,daily,learn:(index=0)=>{el('lesson').value=String(index);ply=0;setStudy(true);}};
})();