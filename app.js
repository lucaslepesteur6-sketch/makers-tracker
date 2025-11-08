// === IMPORTS ===
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction, onSnapshot } from "firebase/firestore";

// === CONFIGURATION FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyBWyDwP8aJBSc3Ouyxm9cYpFcDF_bTYZs4",
  authDomain: "makers-678.firebaseapp.com",
  projectId: "makers-678",
  storageBucket: "makers-678.appspot.com",
  messagingSenderId: "832822039979",
  appId: "1:832822039979:web:38d9499d9dfe9b6c256eee",
  measurementId: "G-MB8ZQPS1VE"
};

// === INIT FIREBASE ===
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// === DOMAINS PAR DEFAUT ===
const DEFAULT_DOMAINS = [
  {id:'M', name:'Motion', xp:0},
  {id:'A', name:'Art / Illustration', xp:0},
  {id:'K', name:'Knowledge', xp:0},
  {id:'E', name:'Editing', xp:0},
  {id:'R', name:'Rendering & Tools', xp:0},
  {id:'S', name:'Strategy & Brand', xp:0},
];

// === NIVEAUX ===
const LEVELS = [
  {name:'Novice', cap:100},
  {name:'Apprenti', cap:300},
  {name:'Compétent', cap:600},
  {name:'Avancé', cap:1200},
  {name:'Maître', cap:2400}
];

// === FONCTION UTILE POUR CALCULER LE NIVEAU ===
function xpToLevel(xp){
  let cum=0;
  for(let i=0;i<LEVELS.length;i++){
    cum += LEVELS[i].cap;
    if(xp < cum) return {level:i+1, name:LEVELS[i].name, levelXp: xp - (cum - LEVELS[i].cap), levelCap: LEVELS[i].cap};
  }
  return {level:LEVELS.length, name:LEVELS.at(-1).name, levelXp: LEVELS.at(-1).cap, levelCap: LEVELS.at(-1).cap};
}

// === DOM REFERENCES ===
const signinBtn = document.getElementById('signinBtn');
const signoutBtn = document.getElementById('signoutBtn');
const userInfo = document.getElementById('userInfo');
const profileCard = document.getElementById('profileCard');
const domainsList = document.getElementById('domainsList');
const addDomainBtn = document.getElementById('addDomainBtn');
const newDomainName = document.getElementById('newDomainName');
const questsEl = document.getElementById('quests');
const questDomain = document.getElementById('questDomain');
const addQuestBtn = document.getElementById('addQuest');
const questName = document.getElementById('questName');
const questXP = document.getElementById('questXP');
const exportBtn = document.getElementById('exportBtn');
const fileInput = document.getElementById('fileInput');
const summary = document.getElementById('summary');

// === AUTHENTICATION ===
signinBtn.onclick = ()=> {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider);
};
signoutBtn.onclick = ()=> signOut(auth);

// === OBSERVER AUTH STATE ===
onAuthStateChanged(auth, async user=>{
  if(user){
    signinBtn.style.display='none';
    signoutBtn.style.display='inline-block';
    profileCard.style.display='block';
    userInfo.innerHTML = `<strong>${user.displayName}</strong><div style="font-size:12px;color:#9fb0c8">${user.email}</div>`;
    await ensureUserDoc(user);
    startRealtime(user);
  } else {
    signinBtn.style.display='inline-block';
    signoutBtn.style.display='none';
    profileCard.style.display='none';
    domainsList.innerHTML='';
    questsEl.innerHTML='';
  }
});

// === ASSURE QUE L’UTILISATEUR A UN DOC ===
async function ensureUserDoc(user){
  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);
  if(!docSnap.exists()){
    await setDoc(docRef, {
      domains: DEFAULT_DOMAINS,
      quests: []
    });
  }
}

// === LISTENER FIRESTORE EN TEMPS REEL ===
function startRealtime(user){
  const docRef = doc(db, 'users', user.uid);
  onSnapshot(docRef, snap=>{
    if(!snap.exists()) return;
    const data = snap.data();
    render(data, user);
  });
}

// === RENDER UI ===
function render(data, user){
  // summary
  summary.innerHTML = '';
  data.domains.forEach(d=>{
    const lvl = xpToLevel(d.xp);
    const p = document.createElement('div');
    p.textContent = `${d.name}: ${lvl.name} (${d.xp} XP)`;
    summary.appendChild(p);
  });

  // domains
  domainsList.innerHTML='';
  data.domains.forEach(d=>{
    const el = document.createElement('div');
    el.className='domain';
    el.innerHTML = `
      <div>
        <div style="font-weight:600">${escapeHtml(d.name)}</div>
        <div style="font-family:monospace">${d.xp} XP</div>
      </div>
      <div style="display:flex;gap:6px">
        <button data-add="10" data-id="${d.id}">+10</button>
        <button data-add="50" data-id="${d.id}">+50</button>
        <button data-add="100" data-id="${d.id}" class="primary">+100</button>
        <button data-del="${d.id}" style="border-color:rgba(255,0,0,0.12)">Suppr</button>
      </div>
    `;
    domainsList.appendChild(el);
  });

  // quests
  questsEl.innerHTML='';
  data.quests.forEach(q=>{
    const domain = data.domains.find(x=>x.id===q.domain);
    const el = document.createElement('div');
    el.className='quest';
    el.innerHTML = `<div>${escapeHtml(q.name)}<div style="font-size:12px;color:#9fb0c8">${domain?domain.name:'-'} • ${q.xp} XP</div></div>
      <div style="display:flex;gap:6px">
        <button data-claim="${q.id}">Réclamer</button>
        <button data-remove="${q.id}" style="border-color:rgba(255,0,0,0.12)">X</button>
      </div>`;
    questsEl.appendChild(el);
  });

  // questDomain select
  questDomain.innerHTML='';
  data.domains.forEach(d=>{
    const o = document.createElement('option'); o.value = d.id; o.textContent = d.name; questDomain.appendChild(o);
  });

  // bind domain actions
  document.querySelectorAll('[data-add]').forEach(btn=>{
    btn.onclick = ()=> modifyXP(user.uid, btn.dataset.id, Number(btn.dataset.add));
  });
  document.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = async ()=>{
      if(!confirm('Supprimer ce domaine ?')) return;
      await removeDomain(user.uid, btn.dataset.del);
    }
  });

  // bind quest claim/remove
  document.querySelectorAll('[data-claim]').forEach(btn=>{
    btn.onclick = async ()=>{
      await claimQuest(user.uid, btn.dataset.claim, user);
    }
  });
  document.querySelectorAll('[data-remove]').forEach(btn=>{
    btn.onclick = async ()=>{
      if(!confirm('Supprimer la quête ?')) return;
      await removeQuest(user.uid, btn.dataset.remove);
    }
  });
}

// === CRUD FUNCTIONS ===
async function modifyXP(uid, domainId, amount){
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async tx=>{
    const docSnap = await tx.get(ref);
    const data = docSnap.data();
    const domains = data.domains.map(d=> d.id===domainId ? {...d, xp: Math.max(0, d.xp + amount)} : d );
    tx.update(ref, {domains});
  });
}

addDomainBtn.onclick = async ()=>{
  const name = newDomainName.value.trim();
  if(!name) return;
  const id = name.trim().slice(0,1).toUpperCase() + Date.now().toString(36).slice(-3);
  const user = auth.currentUser;
  if(!user) return alert('Connecte-toi d\'abord');
  const ref = doc(db, 'users', user.uid);
  await updateDoc(ref, { domains: arrayUnion({id, name, xp:0}) });
  newDomainName.value='';
};

async function removeDomain(uid, domainId){
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async tx=>{
    const docSnap = await tx.get(ref); const data = docSnap.data();
    const domains = data.domains.filter(d=> d.id!==domainId);
    const quests = data.quests.map(q=> q.domain===domainId ? {...q, domain: domains[0]?.id || null} : q);
    tx.update(ref, {domains, quests});
  });
}

addQuestBtn.onclick = async ()=>{
  const name = questName.value.trim(); const xp = Number(questXP.value) || 0; const domain = questDomain.value;
  const user = auth.currentUser; if(!user) return alert('Connecte-toi d\'abord');
  const ref = doc(db, 'users', user.uid);
  const qid = Date.now().toString(36);
  await updateDoc(ref, { quests: arrayUnion({id: qid, name, xp, domain}) });
  questName.value=''; questXP.value='';
};

async function removeQuest(uid, qid){
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async tx=>{
    const docSnap = await tx.get(ref); const data = docSnap.data();
    const quests = data.quests.filter(q=> q.id!==qid);
    tx.update(ref, {quests});
  });
}

async function claimQuest(uid, qid, user){
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async tx=>{
    const docSnap = await tx.get(ref); const data = docSnap.data();
    const quest = data.quests.find(q=> q.id===qid);
    if(!quest) return;
    const domains = data.domains.map(d => d.id===quest.domain ? {...d, xp: d.xp + quest.xp} : d );
    const quests = data.quests.filter(q=> q.id!==qid);
    tx.update(ref, {domains, quests});
  });
}

// === EXPORT / IMPORT ===
exportBtn.onclick = async ()=>{
  const user = auth.currentUser; if(!user) return alert('Connecte-toi');
  const docSnap = await getDoc(doc(db, 'users', user.uid));
  const data = docSnap.data();
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'makers-data.json'; a.click(); URL.revokeObjectURL(url);
};

fileInput.onchange = async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  const str = await f.text(); try{
    const parsed = JSON.parse(str);
    const user = auth.currentUser; if(!user) return alert('Connecte-toi');
    await setDoc(doc(db, 'users', user.uid), parsed);
    alert('Importé avec succès');
  }catch(err){ alert('Fichier invalide'); }
};

// === ESCAPE HTML SIMPLE ===
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
