const $ = id => document.getElementById(id);
const questions = window.CCS_QUESTIONS;

const packs = ["Computer History","Computer Hardware","Programming","Networking","Cybersecurity","Artificial Intelligence"];
let mode="DAILY QUEST", deck=[], index=0, score=0, correct=0, streak=0, bestStreak=0, timer=25, interval=null, locked=false, selectedPack=null, soundOn=true;
let high=Number(localStorage.getItem("ccsQuestHigh")||0);
let audioContext = null;
function playSfx(kind){
 if(!soundOn) return;
 try{
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if(!AudioCtx) return;
  if(!audioContext) audioContext = new AudioCtx();
  if(audioContext.state === "suspended") audioContext.resume();
  const now = audioContext.currentTime;
  const tones = {
   click: [[520,0.045,"square",0.035]],
   start: [[392,0.08,"triangle",0.06],[587,0.12,"triangle",0.055],[784,0.16,"sine",0.05]],
   correct: [[660,0.08,"sine",0.07],[880,0.14,"sine",0.06]],
   wrong: [[260,0.12,"triangle",0.06],[190,0.18,"triangle",0.05]],
   timeout: [[330,0.13,"sawtooth",0.035],[247,0.2,"sawtooth",0.03]],
   finish: [[523,0.1,"triangle",0.06],[659,0.1,"triangle",0.06],[784,0.1,"triangle",0.06],[1046,0.22,"sine",0.055]]
  };
  (tones[kind] || tones.click).forEach(([freq,duration,wave,volume],i)=>{
   const osc=audioContext.createOscillator();
   const gain=audioContext.createGain();
   osc.type=wave;osc.frequency.setValueAtTime(freq,now+i*0.105);
   gain.gain.setValueAtTime(0.0001,now+i*0.105);
   gain.gain.exponentialRampToValueAtTime(volume,now+i*0.105+0.012);
   gain.gain.exponentialRampToValueAtTime(0.0001,now+i*0.105+duration);
   osc.connect(gain);gain.connect(audioContext.destination);
   osc.start(now+i*0.105);osc.stop(now+i*0.105+duration+0.02);
  });
 }catch(err){/* Audio is optional; gameplay continues if unavailable. */}
}
$("highScore").textContent=high;
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");}
function toast(msg){$("toast").textContent=msg;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1900)}
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function startGame(kind="DAILY QUEST", pack=null){
 playSfx("start");
 mode=kind;selectedPack=pack;deck=shuffle(questions.filter(q=>!pack||q.cat.toLowerCase().includes(pack.toLowerCase()))).slice(0,kind==="DAILY QUEST"?7:Math.min(7,questions.length));
 if(kind==="UNLIMITED MODE")deck=shuffle(questions).slice(0,30);
 index=0;score=0;correct=0;streak=0;bestStreak=0;
 $("modeLabel").textContent=kind;$("currentScore").textContent="0";show("gameScreen");loadQuestion();
}
function loadQuestion(){
 clearInterval(interval);locked=false;timer=25;
 if(index>=deck.length){finish();return}
 const q=deck[index];$("questionCount").textContent=`${index+1} / ${deck.length}`;$("categoryLabel").textContent=q.cat;$("questionText").textContent=q.q;$("timer").textContent=timer;$("feedback").textContent="";$("progressBar").style.width=`${index/deck.length*100}%`;
 const holder=$("answers");holder.innerHTML="";
 q.a.forEach((answer,i)=>{const b=document.createElement("button");b.className="answer-btn";b.textContent=String.fromCharCode(65+i)+".  "+answer;b.onclick=()=>choose(i,b);holder.appendChild(b)});
 interval=setInterval(()=>{timer--;$("timer").textContent=timer;if(timer<=0){clearInterval(interval);choose(-1,null)}},1000);
}
function choose(choice,button){
 if(locked)return;locked=true;clearInterval(interval);const q=deck[index];const buttons=[...$("answers").children];
 buttons.forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add("correct")});
 if(choice===q.correct){playSfx("correct");correct++;streak++;bestStreak=Math.max(bestStreak,streak);const gained=100+timer*4;score+=gained;$("feedback").textContent=`CORRECT! +${gained} — ${q.why}`;}
 else{playSfx(choice===-1?"timeout":"wrong");streak=0;if(button)button.classList.add("wrong");$("feedback").textContent=(choice===-1?"TIME'S UP! ":"NOT QUITE. ")+q.why;}
 $("currentScore").textContent=score;$("streakLabel").textContent=`🔥 STREAK: ${streak}`;
 setTimeout(()=>{index++;loadQuestion()},2100);
}
function finish(){
 clearInterval(interval);playSfx("finish");if(score>high){high=score;localStorage.setItem("ccsQuestHigh",high);$("highScore").textContent=high}
 $("finalScore").textContent=score;$("correctCount").textContent=`${correct}/${deck.length}`;$("bestStreak").textContent=bestStreak;
 $("resultTitle").textContent=correct===deck.length?"PERFECT QUEST!":correct>=4?"NICE WORK!":"KEEP EXPLORING!";
 $("resultMessage").textContent=`You answered ${correct} out of ${deck.length} questions correctly. Keep learning and try another quest!`;show("resultScreen");
 const history=JSON.parse(localStorage.getItem("ccsQuestHistory")||"[]");history.unshift({date:new Date().toLocaleDateString(),mode,score,correct,total:deck.length});localStorage.setItem("ccsQuestHistory",JSON.stringify(history.slice(0,20)));
}
function content(title,html){$("contentTitle").textContent=title;$("contentBody").innerHTML=html;show("contentScreen")}
$("dailyBtn").onclick=()=>startGame("DAILY QUEST");
$("unlimitedBtn").onclick=()=>startGame("UNLIMITED MODE");
$("playAgainBtn").onclick=()=>startGame(mode,selectedPack);
$("homeBtn").onclick=()=>show("homeScreen");
$("quitGameBtn").onclick=()=>{clearInterval(interval);show("homeScreen")};
$("archiveBtn").onclick=()=>{const h=JSON.parse(localStorage.getItem("ccsQuestHistory")||"[]");content("QUESTION ARCHIVE",h.length?h.map(x=>`<div class="list-item"><span>${x.date} · ${x.mode}</span><small>${x.correct}/${x.total} CORRECT · ${x.score} PTS</small></div>`).join(""):'<p>No completed quests yet. Play a game to build your archive!</p>')};
$("packsBtn").onclick=()=>content("QUESTIONS PACKS",packs.map(p=>`<button class="list-item pack-item" data-pack="${p}"><span>◆ ${p}</span><small>PLAY PACK →</small></button>`).join(""));
$("contentBody").addEventListener("click",e=>{const b=e.target.closest("[data-pack]");if(b)startGame("QUESTIONS PACK",b.dataset.pack)});
$("leaderboardBtn").onclick=()=>{const h=JSON.parse(localStorage.getItem("ccsQuestHistory")||"[]").sort((a,b)=>b.score-a.score);content("LOCAL LEADERBOARD",h.length?h.slice(0,10).map((x,i)=>`<div class="list-item"><span>#${i+1} · ${x.date}</span><small>${x.score} PTS</small></div>`).join(""):'<p>No scores yet. Complete a quest to appear here!</p>')};
$("contentBackBtn").onclick=()=>show("homeScreen");
$("settingsBtn").onclick=()=>content("SETTINGS",`<div class="list-item"><span>Sound effects</span><button class="secondary-btn" id="toggleSound">${soundOn?"ON":"OFF"}</button></div><p>Scores and quest history are saved in this browser on this device.</p><button class="secondary-btn" id="resetData">RESET LOCAL GAME DATA</button>`);
$("contentBody").addEventListener("click",e=>{if(e.target.id==="toggleSound"){soundOn=!soundOn;e.target.textContent=soundOn?"ON":"OFF";$("soundBtn").textContent=soundOn?"🔊":"🔇"}if(e.target.id==="resetData"){if(confirm("Clear saved high score and quest history?")){localStorage.removeItem("ccsQuestHigh");localStorage.removeItem("ccsQuestHistory");high=0;$("highScore").textContent="0";toast("Saved game data cleared")}}});
$("soundBtn").onclick=()=>{soundOn=!soundOn;$("soundBtn").textContent=soundOn?"🔊":"🔇";toast(soundOn?"Sound effects on":"Sound effects off");if(soundOn)playSfx("click")};
$("infoBtn").onclick=()=>content("ABOUT CCS QUEST",`<p>CCS Quest is an original land-themed educational trivia game for Computer Studies students.</p><p>Answer questions about computer history, hardware, programming, networking, cybersecurity, and artificial intelligence.</p><p><b>Daily Quest:</b> 7 questions · 25 seconds each.</p><p>This prototype saves scores locally in your browser. It does not use online accounts or a shared leaderboard yet.</p>`);
$("menuBtn").onclick=()=>show("homeScreen");

document.addEventListener("click",e=>{
 const b=e.target.closest("button");
 if(b && b.id!=="soundBtn" && !b.classList.contains("answer-btn")) playSfx("click");
});
