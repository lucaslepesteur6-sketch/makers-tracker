// === IMPORTS ===
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, runTransaction, onSnapshot } from "firebase/firestore";

// === CONFIG FIREBASE ===
const firebaseConfig = {
  apiKey: "TA_API_KEY",
  authDomain: "TA_PROJECT.firebaseapp.com",
  projectId: "TA_PROJECT",
  storageBucket: "TA_PROJECT.appspot.com",
  messagingSenderId: "TA_SENDER_ID",
  appId: "TA_APP_ID",
  measurementId: "TA_MEASUREMENT_ID"
};

// === INIT FIREBASE ===
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// === TAB SWITCH ===
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.onclick = ()=>{
    document.querySelectorAll('.tab-content').forEach(tab=>tab.style.display='none');
    document.getElementById(btn.dataset.tab).style.display='block';
  }
});

// === DOM ELEMENTS ===
const signinBtn = document.getElementById('signinBtn');
const signoutBtn = document.getElementById('signoutBtn');
const profileCard = document.getElementById('profileCard');
const userInfo = document.getElementById('userInfo');
const domainsList = document.getElementById('domainsList');
const summary = document.getElementById('summary');
const addDomainBtn = document.getElementById('addDomainBtn');
const newDomainName = document.getElementById('newDomainName');
const addQuestBtn = document.getElementById('addQuest');
const questName = document.getElementById('questName');
const questXP = document.getElementById('questXP');
const questDomain = document.getElementById('questDomain');
const questsEl = document.getElementById('quests');
const exportBtn = document.getElementById('exportBtn');
const fileInput = document.getElementById('fileInput');
const sidebarIcons = document.querySelectorAll('.domain-icon');

// === DOMAINES INIT ===
const DEFAULT_DOMAINS = [
  {id:'M', name:'Motion', xp:0},
  {id:'A', name:'Art', xp:0},
  {id:'K', name:'Knowledge', xp:0},
  {id:'E', name:'Editing', xp:0},
  {id:'R', name:'Rendering', xp:0},
  {id:'S', name:'Strategy', xp:0},
];

// === NIVEAUX ===
const LEVELS = [
  {name:'Novice', cap:100},
  {name:'Apprenti', cap:300},
  {name:'Compétent', cap:600},
  {name:'Avancé', cap:1200},
  {name:'Maître', cap:2400}
];

// === XP → LEVEL ===
function xpToLevel(xp){
  let cum=0;
  for(let i=0;i<LEVELS.length;i++){
    cum+=LEVELS[i].cap;
    if(xp<cum) return {level:i+1, name:LEVELS[i].name, levelXp: xp-(cum-LEVELS[i].cap), levelCap:LEVELS[i].cap};
  }
  return {level:LEVELS.length, name:LEVELS.at(-1).name, levelXp: LEVELS.at(-1).cap, levelCap: LEVELS.at(-1).cap};
}

// === AUTH ===
signinBtn.onclick = ()=> signInWithPopup(auth, new GoogleAuthProvider());
signoutBtn.onclick = ()=> signOut(auth);

onAuthStateChanged(auth, async user=>{
  if(user){
    signinBtn.style.display='none';
    signoutBtn.style.display='inline-block';
    profileCard.style.display='block';
    userInfo.innerHTML = `<strong>${user.displayName}</strong><div style="font-size:12px;color:#9fb0c8">${user.email}</div>`;
    await ensureUserDoc(user);
    startRealtime(user);
  }else{
    signinBtn.style.display='inline-block';
    signoutBtn.style.display='none';
    profileCard.style.display='none';
    domainsList.innerHTML='';
    questsEl.innerHTML='';
    summary.innerHTML='';
  }
});

// === ENSURE DOC ===
async function ensureUserDoc(user){
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, {domains:DEFAULT_DOMAINS, quests:[]});
  }
}

// === REALTIME RENDER ===
function startRealtime(user){
  const ref = doc(db,'users',user.uid);
  onSnapshot(ref, snap=>{
    if(!snap.exists()) return;
    const data = snap.data();
    render(data,user);
  });
}

// === RENDER ===
function render(data,user){
  summary.innerHTML='';
  domainsList.innerHTML='';
  questsEl.innerHTML='';
  questDomain.innerHTML='';

  data.domains.forEach(d=>{
    const lvl = xpToLevel(d.xp);
    // Résumé
    const divSum = document.createElement('div');
    divSum.textContent=`${d.name}: ${lvl.name} (${d.xp} XP)`;
    summary.appendChild(divSum);

    // Liste domaines avec jauge
    const div = document.createElement('div');
    div.className='domain';
    const percent = Math.min((lvl.levelXp/lvl.levelCap)*100,100);
    div.innerHTML=`<strong>${d.name}</strong>
      <div class="bar-container">
        <div class="bar" style="width:${percent}%"></div>
      </div>
      <button data-add="10" data-id="${d.id}">+10 XP</button>`;
    domainsList.appendChild(div);

    // Sidebar hover
    sidebarIcons.forEach(icon=>{
      icon.onclick=()=>scrollToDomain(d.id);
    });

    // Select pour quêtes
    const o = document.createElement('option'); o.value=d.id;o.textContent=d.name; questDomain.appendChild(o);
  });

  data.quests.forEach(q=>{
    const div = document.createElement('div');
    div.className='quest';
    div.innerHTML=`${q.name} • ${q.xp} XP <button data-claim="${q.id}">Réclamer</button>`;
    questsEl.appendChild(div);
  });

  // EVENTS DOMAIN
  document.querySelectorAll('[data-add]').forEach(btn=>{
    btn.onclick=()=>modifyXP(user.uid, btn.dataset.id, Number(btn.dataset.add));
  });
  document.querySelectorAll('[data-claim]').forEach(btn=>{
    btn.onclick=()=>claimQuest(user.uid,btn.dataset.claim,user);
  });
}

// === SCROLL TO DOMAIN ===
function scrollToDomain(domainId){
  const domainEl = Array.from(domainsList.children).find(d=>d.querySelector('button')?.dataset.id===domainId);
  if(domainEl) domainEl.scrollIntoView({behavior:'smooth',block:'center'});
}

// === CRUD ===
async function modifyXP(uid,domainId,amount){
  const ref = doc(db,'users',uid);
  await runTransaction(db,async tx=>{
    const snap = await tx.get(ref);
    const data = snap.data();
    const domains = data.domains.map(d=>d.id===domainId?{...d,xp:d.xp+amount}:d);
    tx.update(ref,{domains});
  });
}

addDomainBtn.onclick=async ()=>{
  const name=newDomainName.value.trim();
  if(!name) return;
  const user=auth.currentUser; if(!user) return alert('Connecte-toi');
  const id=name.slice(0,1).toUpperCase()+Date.now().toString(36).slice(-3);
  const ref=doc(db,'users',user.uid);
  await updateDoc(ref,{domains:arrayUnion({id,name,xp:0})});
  newDomainName.value='';
};

addQuestBtn.onclick=async ()=>{
  const name=questName.value.trim(); const xp=Number(questXP.value)||0; const domain=questDomain.value;
  const user=auth.currentUser; if(!user)return alert('Connecte-toi');
  const qid=Date.now().toString(36);
  await updateDoc(doc(db,'users',user.uid),{quests:arrayUnion({id:qid,name,xp,domain})});
  questName.value=''; questXP.value='';
};

async function claimQuest(uid,qid,user){
  const ref=doc(db,'users',uid);
  await runTransaction(db,async tx=>{
    const snap=await tx.get(ref); const data=snap.data();
    const quest=data.quests.find(q=>q.id===qid);
    if(!quest)return;
    const domains=data.domains.map(d=>d.id===quest.domain?{...d,xp:d.xp+quest.xp}:d);
    const quests=data.quests.filter(q=>q.id!==qid);
    tx.update(ref,{domains,quests});
  });
}

// EXPORT / IMPORT
exportBtn.onclick=async ()=>{
  const user=auth.currentUser;if(!user)return alert('Connecte-toi');
  const snap=await getDoc(doc(db,'users',user.uid));
  const data=snap.data();
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='makers-data.json';a.click();URL.revokeObjectURL(url);
};

fileInput.onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  const str=await f.text();
  try{const parsed=JSON.parse(str);
    const user=auth.currentUser;if(!user)return alert('Connecte-toi');
    await setDoc(doc(db,'users',user.uid),parsed);
    alert('Importé avec succès');
  }catch(err){alert('Fichier invalide');}
};
