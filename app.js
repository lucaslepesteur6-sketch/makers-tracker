// app.js - fichier UNIQUE complet (compat Firebase, multi-pages)
// Charge Firebase compat dynamiquement, gère auth / firestore, UI, sauvegarde locale, rendu MAKERS

(function(){
  // ---------- Helpers ----------
  const $ = id => document.getElementById(id);
  const localKey = uid => `makers_levels_${uid}`;

  function showToast(txt, isError=false){
    const box = document.getElementById('error-box');
    if(box){
      box.textContent = txt;
      box.style.display = 'block';
      box.style.background = isError ? '#7b1f1f' : '#05261e';
      box.style.color = isError ? '#ffd6d6' : '#aaffdd';
      setTimeout(()=> box.style.display = 'none', 3600);
    } else {
      console.log((isError ? 'ERR: ' : 'MSG: ') + txt);
    }
  }

  // ---------- Load Firebase compat scripts ----------
  function loadScript(src){ return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error('Failed to load ' + src));
    document.head.appendChild(s);
  });}

  async function initFirebaseCompat(){
    const base = 'https://www.gstatic.com/firebasejs/9.22.1/';
    await loadScript(base + 'firebase-app-compat.js');
    await loadScript(base + 'firebase-auth-compat.js');
    await loadScript(base + 'firebase-firestore-compat.js');
  }

  // ---------- Data: makersData (full M A K E R S - 10 niveaux each) ----------
  const makersData = {
    M: [
      {level:1,title:"Bases du Motion",theme:"Découverte",desc:"Principes d'animation : timing, easing, anticipation.",exercise:"Animer un cercle qui rebondit.",video:"https://www.youtube.com/embed/vJzcr2YXwFY"},
      {level:2,title:"Keyframes & Easing",theme:"Technique",desc:"Maîtriser keyframes et courbes d'accélération.",exercise:"Animer un texte fluide.",video:"https://www.youtube.com/embed/u8BuF1qpmnI"},
      {level:3,title:"Typographie animée",theme:"Typo",desc:"Animer titres et typographie.",exercise:"Créer un titre animé 6s.",video:"https://www.youtube.com/embed/d2jM-OZOt6s"},
      {level:4,title:"Illustration animée",theme:"Illustration",desc:"Importer et animer vecteurs/SVG.",exercise:"Animer un logo vectoriel.",video:"https://www.youtube.com/embed/DQcyWqWaiyE"},
      {level:5,title:"Transitions créatives",theme:"Effets",desc:"Concevoir transitions stylées entre scènes.",exercise:"Enchaîner 2 plans avec une transition.",video:"https://www.youtube.com/embed/6Xl8s4HlL1g"},
      {level:6,title:"Motion infographique",theme:"Infographie",desc:"Animer graphiques et datas.",exercise:"Créer un graphique animé.",video:"https://www.youtube.com/embed/8s4Gd2l0c5k"},
      {level:7,title:"Animation personnage (base)",theme:"Personnage",desc:"Cycles simples et poses clés.",exercise:"Créer un cycle de marche.",video:"https://www.youtube.com/embed/3N6qJ4F2bq8"},
      {level:8,title:"Compositing motion",theme:"Compo",desc:"Composer plusieurs couches et effets.",exercise:"Intégrer plusieurs couches animées.",video:"https://www.youtube.com/embed/9y7z5c8G3zI"},
      {level:9,title:"Rendering & export",theme:"Rendu",desc:"Optimiser export pour web/vidéo.",exercise:"Exporter versions web et HD.",video:"https://www.youtube.com/embed/2n8QM0cI2hA"},
      {level:10,title:"Projet motion complet",theme:"Portfolio",desc:"Réaliser une séquence complète.",exercise:"Produire une vidéo 20-30s.",video:"https://www.youtube.com/embed/5y1q8bG6r1E"}
    ],
    A: [
      {level:1,title:"Intro Animation 2D",theme:"Découverte",desc:"Bases de l'animation 2D",exercise:"Balle rebond",video:"https://www.youtube.com/embed/StYOybx-v3k"},
      {level:2,title:"Timing & Spacing",theme:"Technique",desc:"Gérer timing et espacement.",exercise:"Animer une chute réaliste.",video:"https://www.youtube.com/embed/TwH3s3h5s0g"},
      {level:3,title:"Text & Shape",theme:"Technique",desc:"Animer formes et textes.",exercise:"Titre + icone animés",video:"https://www.youtube.com/embed/-DM5XF1BvW4"},
      {level:4,title:"Personnage simple",theme:"Personnage",desc:"Bases du character animation.",exercise:"Cycle de marche 8 frames",video:"https://www.youtube.com/embed/EetloQGJ2yM"},
      {level:5,title:"Expressions & automation",theme:"Technique",desc:"Expressions pour automatiser.",exercise:"Créer oscillation",video:"https://www.youtube.com/embed/v3N0_4lXqH8&pp=ygUjYW5pbWF0aW9uIGV4cHJlc3Npb3NuIGV0IGF1dG9tYXRpb24%3D"},
      {level:6,title:"Vector animation",theme:"Vector",desc:"Animer SVG et assets vectoriels.",exercise:"Animer un logo SVG",video:"https://www.youtube.com/embed/yLb7SSygBsU&pp=ygUedmVjdG9yIGFuaW1hdGlvbiBhZnRlciBlZmZlY3Rz"},
      {level:7,title:"Lip-sync basique",theme:"Personnage",desc:"Synchroniser son et bouche.",exercise:"Animer court dialogue",video:"https://www.youtube.com/embed/FF_ueJei7qI&pp=ugMGCgJmchABugUEEgJmcsoFKGxpcC1zeW5jIGJhc2lxdWUgYW5pbWF0aW9uIGFmdGVyIGVmZmVjdHPYBwE%3D"},
      {level:8,title:"Scene composition",theme:"Avancé",desc:"Coordonner plusieurs éléments animés.",exercise:"Mini-scène 10s",video:"https://www.youtube.com/embed/NaK35FZzq_w&t=286s&pp=ygUec2NlbmUgY29tcG9zaXRpb24gYWZ0ZXIgZWZmZWN00gcJCQMKAYcqIYzv"},
      {level:9,title:"FX & particles",theme:"FX",desc:"Ajouter particules et effets.",exercise:"Ajouter particles",video:"https://www.youtube.com/embed/TSX5G6UJ9Uo&pp=ygUPRlggZXQgcGFydGljbGVz0gcJCQMKAYcqIYzv"},
      {level:10,title:"Projet animation final",theme:"Portfolio",desc:"Créer projet 20s complet.",exercise:"Vidéo finale",video:"https://www.youtube.com/embed/ZRRQFWT17B8&pp=ugMGCgJmchABugUEEgJmcsoFHXByb2pldCBhbmltYXRpb24gYWZ0ZXIgZWZmZWN02AcB"}
    ],
    K: [
      {level:1,title:"Bases du design",theme:"Design",desc:"Hiérarchie visuelle, contraste.",exercise:"Créer un logo simple",video:"https://www.youtube.com/embed/gC0HzB0Kc2U"},
      {level:2,title:"Typographie",theme:"Typo",desc:"Choisir et associer polices.",exercise:"Affiche typographique",video:"https://www.youtube.com/embed/RcFGigywyhw&pp=ygUQdHlwb2dyYXBoaWUgdHV0bw%3D%3D"},
      {level:3,title:"Couleurs",theme:"Couleur",desc:"Palettes et harmonies.",exercise:"Composer 3 palettes",video:"https://www.youtube.com/embed/2O1-lndRxA0"},
      {level:4,title:"Layout & grid",theme:"Layout",desc:"Grilles et mise en page.",exercise:"Mise en page flyer",video:"https://www.youtube.com/embed/yUvGHNzqG7M&pp=ygUVbGF5b3V0IGdyYXBoaWMgZGVzaWdu"},
      {level:5,title:"Illustration digitale",theme:"Illustration",desc:"Dessin vectoriel.",exercise:"Dessiner personnage simple",video:"https://www.youtube.com/embed/F76Wblm6OIE&pp=ygUaaWxsdXN0cmF0aW9uIGRpZ2l0YWxlIHR1dG8%3D"},
      {level:6,title:"Branding",theme:"Marque",desc:"Définir identité visuelle.",exercise:"Mini-branding",video:"https://www.youtube.com/embed/_JM2voga6oQ&pp=ygUTaWRlbnRpdHTDqSB2aXN1ZWxsZQ%3D%3D"},
      {level:7,title:"UX basics",theme:"UX",desc:"Parcours utilisateur.",exercise:"Wireframe",video:"https://www.youtube.com/embed/RqCJRrseD1k"},
      {level:8,title:"Design system",theme:"System",desc:"Composants réutilisables.",exercise:"5 composants UI",video:"https://www.youtube.com/embed/4wqXGdOeT6A&pp=ygUNZGVzaWduIHN5c3RlbQ%3D%3D"},
      {level:9,title:"Portfolio design",theme:"Portfolio",desc:"Assembler portfolio.",exercise:"Page portfolio",video:"https://www.youtube.com/embed/sWNdkLvCFJo"},
      {level:10,title:"Projet design final",theme:"Final",desc:"Réaliser projet complet.",exercise:"Projet final",video:"https://www.youtube.com/embed/LUmoAtE3Hz0&pp=ygUScHJvamV0IGRlc2lnbiB0dXRv"}
    ],
    E: [
      {level:1,title:"Montage débutant",theme:"Montage",desc:"Couper et assembler.",exercise:"Monter 3 clips",video:"https://www.youtube.com/embed/lTfagJJB-SA&pp=ygUVYmFzZSBkZSBtb250YWdlIHZpZGVv"},
      {level:2,title:"Transitions",theme:"Montage",desc:"Transitions propres.",exercise:"Montage 30s",video:"https://www.youtube.com/embed/dWm6wVUoYWo&t=169s&pp=ygUhYmFzZSBkZSBtb250YWdlIHZpZGVvIHRyYW5zaXRpb25z"},
      {level:3,title:"Audio & mix",theme:"Audio",desc:"Équilibrer ses pistes.",exercise:"Mixer audio",video:"https://www.youtube.com/embed/-Ysr4a0DRLM&pp=ygUcYmFzZSBkZSBtb250YWdlIGF1ZGlvIHByIHJwbw%3D%3D"},
      {level:4,title:"Titres & sous-titres",theme:"Textes",desc:"Créer titres animés.",exercise:"Ajouter titres animés",video:"https://www.youtube.com/embed/2iM4Fg8Pxt0&pp=ygUaYWpvdXRlciB0aXRyZSBhbmltZSBwciBwcm8%3D"},
      {level:5,title:"Color grading",theme:"Color",desc:"Correction colorimétrique.",exercise:"Appliquer correction",video:"https://www.youtube.com/embed/uXW2QVIZEkA&pp=ygUiY29ycmVjdGlvbiBjb2xvcmltZXRocmlxdWUgIHByIHBybw%3D%3D"},
      {level:6,title:"Montage avancé",theme:"Technique",desc:"Multi-cam et rythme.",exercise:"Séquence multi-cam",video:"https://www.youtube.com/embed/z3TFl7kk1eI&pp=ygUgbXVsdGkgY2FtIGV0IHJ5dGhtZSBwcmVtaWVyZSBwcm8%3D"},
      {level:7,title:"Effets visuels",theme:"FX",desc:"Compositing.",exercise:"Ajouter effet",video:"https://www.youtube.com/embed/NgElo1sP5ag&pp=ygUaYWpvdXRlciBlZmZldCBwcmVtaWVyZSBwcm8%3D"},
      {level:8,title:"Motion graphics",theme:"Motion",desc:"Enrichir montage.",exercise:"Motion intro",video:"https://www.youtube.com/embed/uG7qfI-Olpw&pp=ygUeZW5yaWNoaXJlIG1vbnRhZ2UgcHJlbWllcmUgcHJv"},
      {level:9,title:"Export & plateformes",theme:"Rendu",desc:"Formats selon plateforme.",exercise:"Exporter YouTube & IG",video:"https://www.youtube.com/embed/_xeK0baJN6c&pp=ygUdYmllbiBleHBvcnRhdGlvbiBwcmVtaWVyZSBwcm8%3D"},
      {level:10,title:"Projet vidéo final",theme:"Portfolio",desc:"Court-métrage 60s.",exercise:"Produire montage final",video:"https://www.youtube.com/embed/2LoerlGrj2k&pp=ygUUbW9udGFnZSBwcmVtaWVyZSBwcm8%3D"}
    ],
    R: [
      {level:1,title:"Bases marketing",theme:"Marketing",desc:"Cibles et objectifs.",exercise:"Définir audience",video:"https://www.youtube.com/embed/i0Dpx_aiDQk"},
      {level:2,title:"Réseaux sociaux",theme:"Social",desc:"Formats & ton.",exercise:"Créer 3 posts",video:"https://www.youtube.com/embed/i-p7ydVPfgo&pp=ygUebWFya2V0aW5nIHJlc2VhdXggc29jaWF1eCB0dXRv"},
      {level:3,title:"SEO & contenu",theme:"SEO",desc:"Bases SEO on-page.",exercise:"Optimiser une page",video:"https://www.youtube.com/embed/FIKpcA-A9Sk&pp=ygUDU0VP"},
      {level:4,title:"Campagne pub",theme:"Pub",desc:"Créer campagne simple.",exercise:"Concevoir pub FB/IG",video:"https://www.youtube.com/embed/KyyRx6pT-nE&pp=ygURY2FtcGFnbmUgcHViIHR1dG8%3D"},
      {level:5,title:"Email marketing",theme:"Email",desc:"Séquences e-mail.",exercise:"Créer newsletter",video:"https://www.youtube.com/embed/lx690e1hIl4&pp=ygUPZW1haWwgbWFya2V0aW5n"},
      {level:6,title:"Analytics",theme:"Analyse",desc:"Mesurer KPI.",exercise:"Analyser campagne",video:"https://www.youtube.com/embed/syzrpsOhnaE&t=22s&pp=ygUTYW5hbHl0aWNzIG1hcmtldGluZw%3D%3D"},
      {level:7,title:"Growth basics",theme:"Growth",desc:"Acquisition organique.",exercise:"Idée growth",video:"https://www.youtube.com/embed/RvFTNnOyWZ0&t=49s&pp=ugMICgJmchABGAHKBQ1ncm93dGggYmFzaWNz"},
      {level:8,title:"Brand strategy",theme:"Brand",desc:"Positionnement.",exercise:"Rédiger positionnement",video:"https://www.youtube.com/embed/cPOuOqpjHi4&pp=ygUOYnJhbmQgc3RyYXRlZ3nSBwkJAwoBhyohjO8%3D"},
      {level:9,title:"Multi-canal",theme:"Complet",desc:"Coordonner canaux.",exercise:"Plan multi-canal",video:"https://www.youtube.com/embed/XWPgGGrharE&pp=ygULbXVsdGkgY2FuYWw%3D"},
      {level:10,title:"Projet marketing final",theme:"Portfolio",desc:"Exécuter campagne complète.",exercise:"Réaliser campagne finale",video:"https://www.youtube.com/embed/jTwB-D6be1s&t=207s&pp=ygUUcmVhbGlzZXIgdW4gY2FtcGFnbmXSBwkJAwoBhyohjO8%3D"}
    ],
    S: [
      {level:1,title:"StoryBrand basics",theme:"Story",desc:"Message clair pour marque.",exercise:"Écrire message produit",video:"https://www.youtube.com/embed/KcSaHpqO2wA&pp=ygUfc3RvcnlicmFuZCBiYXNpY3MgZnJhbmNhaXMgdHV0b9IHCQkDCgGHKiGM7w%3D%3D"},
      {level:2,title:"Copywriting",theme:"Texte",desc:"Rédiger textes efficaces.",exercise:"Rédiger page produit",video:"https://www.youtube.com/embed/WmGlwfkXt_0"},
      {level:3,title:"Content strategy",theme:"Contenu",desc:"Planifier contenu.",exercise:"Plan 2 semaines posts",video:"https://www.youtube.com/embed/H9DXLvR-Yb8&pp=ygUQY29udGVudCBzdHJhdGVneQ%3D%3D"},
      {level:4,title:"Visual storytelling",theme:"Visuel",desc:"Associer images & message.",exercise:"Story visuelle",video:"https://www.youtube.com/embed/NeTJRCycYXQ&pp=ugMJCgVlbi1VUxABugUHEgVlbi1VU8oFEmlzdWFsIHN0b3J5dGVsbGluZ9gHAQ%3D%3D"},
      {level:5,title:"Narrative ads",theme:"Pub",desc:"Publicités narratives.",exercise:"Créer annonce narrative",video:"https://www.youtube.com/embed/Yo3HSQRKSYk&pp=ygUWdHV0byBhbm5vbmNlIG5hcnJhdGl2ZQ%3D%3D"},
      {level:6,title:"Video storytelling",theme:"Vidéo",desc:"Structure vidéo marketing.",exercise:"Scénariser courte vidéo",video:"https://www.youtube.com/embed/V8EKJKESJhI&pp=ygUWdHV0byBhbm5vbmNlIG5hcnJhdGl2ZQ%3D%3D"},
      {level:7,title:"Brand voice",theme:"Brand",desc:"Définir voix de marque.",exercise:"Charte ton",video:"https://www.youtube.com/embed/et-a39drCsU&pp=ygURYnJhbmQgdm9pY2UgbGluZXM%3D"},
      {level:8,title:"Campaign storytelling",theme:"Campagne",desc:"Campagnes narratives.",exercise:"Plan campagne storytelling",video:"https://www.youtube.com/embed/hNuAv-42jzY&pp=ygUVQ2FtcGFpZ24gc3Rvcnl0ZWxsaW5n"},
      {level:9,title:"Automation narratives",theme:"Tech",desc:"Automatiser messages.",exercise:"Workflow email",video:"https://www.youtube.com/embed/JtdUgJGI_Oo&t=885s&pp=ygUZd29ya2Zsb3cgZW1haWwgYXV0b21hdGlvbg%3D%3D"},
      {level:10,title:"Projet StoryBrand final",theme:"Portfolio",desc:"Projet complet StoryBrand.",exercise:"Campagne finale",video:"https://www.youtube.com/embed/Q5p38-ETXII&pp=ygUScHJvamV0IHN0b3J5YnJhbmQg"}
    ]
  };

  // ---------- Main after Firebase compat loaded ----------
  (async function main(){
    try{
      await initFirebaseCompat();
    }catch(e){
      console.error('Could not load Firebase libs', e);
      showToast('Impossible de charger Firebase (scripts).', true);
      return;
    }

    // Firebase compat is available as global "firebase"
    const firebaseConfig = {
  apiKey: "AIzaSyBFwRsMpR29TmKDH6xd9yW35vZZPTnDchs",
  authDomain: "makerstracker-bec70.firebaseapp.com",
  projectId: "makerstracker-bec70",
  storageBucket: "makerstracker-bec70.firebasestorage.app",
  messagingSenderId: "184377384993",
  appId: "1:184377384993:web:b89e532a6ecb158caac360",
  measurementId: "G-9CM9P8RWMG"
};
  

    try{
      firebase.initializeApp(firebaseConfig);
    }catch(e){
      console.error('Firebase init error', e);
      showToast('Erreur initialisation Firebase', true);
      return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // grab DOM elements that may exist on the current page (multi-page support)
    const emailInput = $('email');
    const passInput = $('password');
    const emailLoginBtn = $('email-login');
    const emailRegisterBtn = $('email-register');
    const googleLoginBtn = $('google-login');
    const logoutBtn = $('logout-btn');
    const navAuthLink = document.querySelector('.auth-link') || $('nav-auth-link');
    const globalProgressEl = $('global-progress');
    const makersProgressEl = $('makers-progress');
    const makersDetailEl = $('makers-detail') || $('makers-page') && document.querySelector('.makers-detail');

    // color helper
    function getColor(letter){
      switch(letter){
        case 'M': return '#00ffff';
        case 'A': return '#ff8c00';
        case 'K': return '#ff00ff';
        case 'E': return '#00ff00';
        case 'R': return '#ff4444';
        case 'S': return '#ffdd00';
        default: return '#7ce7ff';
      }
    }

    // state
    let currentUID = null;
    let userLevels = { M:0, A:0, K:0, E:0, R:0, S:0 };

    // local storage helpers
    function saveLocal(uid, levels){
      try{ localStorage.setItem(localKey(uid), JSON.stringify(levels)); }catch(e){/*ignore*/ }
    }
    function loadLocal(uid){
      try{ const raw = localStorage.getItem(localKey(uid)); return raw ? JSON.parse(raw) : null; }catch(e){ return null; }
    }

    // update nav auth link if present
    function updateAuthLink(user){
      const link = document.querySelector('#nav-auth-link') || document.querySelector('.auth-link');
      if(!link) return;
      if(user){
        link.textContent = user.displayName || (user.email || 'Profil');
        link.href = 'makers.html';
      } else {
        link.textContent = 'Se connecter';
        link.href = 'login.html';
      }
    }

    // RENDER functions
    function renderHomeProgress(){
      if(!globalProgressEl) return;
      globalProgressEl.innerHTML = '';
      ['M','A','K','E','R','S'].forEach(l=>{
        const lvl = userLevels[l] || 0;
        const percent = Math.round((lvl/10)*100);
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
          <div class="letter ${l}">${l}</div>
          <div class="level-info">
            <p><strong>${l}</strong></p>
            <p>Niveau ${lvl}/10</p>
            <div class="bar-bg"><div class="bar-fill" style="width:${percent}%;background:${getColor(l)}"></div></div>
          </div>
        `;
        globalProgressEl.appendChild(card);
      });
    }

    function renderMakersPanel(){
      if(!makersProgressEl) return;
      makersProgressEl.innerHTML = '';
      ['M','A','K','E','R','S'].forEach(letter=>{
        const lvl = userLevels[letter] || 0;
        const percent = Math.round((lvl/10)*100);
        const container = document.createElement('div');
        container.className = 'level-card';
        container.innerHTML = `
          <div class="letter ${letter}">${letter}</div>
          <div class="level-info">
            <p>${getDomainName(letter)}</p>
            <p>Niveau ${lvl}/10</p>
            <div class="bar-bg"><div class="bar-fill" style="width:${percent}%;background:${getColor(letter)}"></div></div>
            <div style="margin-top:10px;">
              <button class="level-open" data-letter="${letter}">Voir ${letter}</button>
              <button class="level-up" data-letter="${letter}">+ Niveau</button>
            </div>
          </div>
        `;
        makersProgressEl.appendChild(container);
      });

      // attach events
      document.querySelectorAll('.level-open').forEach(b=>{
        b.addEventListener('click', e=>{
          const L = e.currentTarget.dataset.letter;
          displayMakers(L);
          // navigate on multipage setup
          if(!window.location.pathname.endsWith('makers.html')){
            window.location.href = 'makers.html#' + L;
          }
        });
      });

      document.querySelectorAll('.level-up').forEach(b=>{
        b.addEventListener('click', async e=>{
          const L = e.currentTarget.dataset.letter;
          if(!currentUID){ showToast('Connecte-toi pour sauvegarder', true); return; }
          const newLevel = Math.min(10, (userLevels[L] || 0) + 1);
          userLevels[L] = newLevel;
          saveLocal(currentUID, userLevels);
          try{
            await db.collection('users').doc(currentUID).update({ levels: userLevels });
            showToast(`Niveau ${newLevel} validé pour ${L}`);
          }catch(err){
            // fallback: set with merge
            await db.collection('users').doc(currentUID).set({ levels: userLevels }, { merge:true }).catch(()=>{});
            showToast(`Niveau ${newLevel} validé pour ${L}`);
          }
          renderHomeProgress();
          renderMakersPanel();
        });
      });
    }

    function getDomainName(letter){
      switch(letter){
        case 'M': return 'Management';
        case 'A': return 'Art & créativité';
        case 'K': return 'Knowledge';
        case 'E': return 'Expérience & design';
        case 'R': return 'Réalisation & technique';
        case 'S': return 'Storybrand & marketing';
        default: return letter;
      }
    }

    function clearMakersDetail(){
      if(!makersDetailEl) return;
      makersDetailEl.innerHTML = '';
    }

    function displayMakers(letter){
      // ensure we have the makers detail container on the page
      const detail = makersDetailEl || $('makers-detail');
      if(!detail){
        // if not present, attempt to navigate to makers page (multi-page)
        if(!window.location.pathname.endsWith('makers.html')){
          window.location.href = 'makers.html#' + letter;
          return;
        } else {
          return;
        }
      }
      detail.innerHTML = '';
      const header = document.createElement('div');
      header.className = 'card';
      header.style.border = `1px solid ${getColor(letter)}`;
      header.innerHTML = `<h2 style="color:${getColor(letter)}">${letter} — ${makersData[letter][0].theme || ''}</h2>
        <p style="color:rgba(255,255,255,0.8)">Chaque niveau contient description, exercice et vidéo (bloquée si non débloquée). Clique "Terminé" pour valider.</p>`;
      detail.appendChild(header);

      makersData[letter].forEach(n=>{
        const lvlCard = document.createElement('div');
        lvlCard.className = 'card';
        const unlocked = (n.level <= ((userLevels[letter]||0) + 1));
        const completed = (n.level <= (userLevels[letter]||0));
        let videoHtml = '';
        if(unlocked && n.video){
          videoHtml = `<div class="video-wrap"><iframe src="${n.video}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        } else if(n.video){
          videoHtml = `<div class="video-wrap blocked" style="padding:12px;border-radius:8px;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.5)">Vidéo bloquée — débloque le niveau précédent</div>`;
        }

        lvlCard.innerHTML = `
          <h3 style="color:${getColor(letter)}">Niveau ${n.level} — ${escapeHtml(n.title)}</h3>
          <p><strong>Thème :</strong> ${escapeHtml(n.theme || '')}</p>
          <p style="color:rgba(255,255,255,0.85)">${escapeHtml(n.desc)}</p>
          <p><strong>Exercice :</strong> ${escapeHtml(n.exercise)}</p>
          ${videoHtml}
          <div style="margin-top:10px">
            <button class="video-btn" ${unlocked && n.video ? '' : 'disabled'} style="margin-right:10px">Voir la vidéo</button>
            <button class="done-btn" ${completed ? 'disabled' : (unlocked ? '' : 'disabled')}>${completed ? 'Déjà fait' : 'Terminé'}</button>
          </div>
        `;
        detail.appendChild(lvlCard);

        const videoBtn = lvlCard.querySelector('.video-btn');
        const doneBtn = lvlCard.querySelector('.done-btn');

        if(videoBtn){
          videoBtn.addEventListener('click', ()=>{
            if(!n.video){ showToast('Pas de vidéo', true); return; }
            openVideoModal(n.video);
          });
        }
        if(doneBtn){
          doneBtn.addEventListener('click', async ()=>{
            if(!currentUID){ showToast('Connecte-toi pour sauvegarder', true); return; }
            if(n.level > ((userLevels[letter]||0) + 1)){ showToast('Débloque le niveau précédent', true); return; }
            if(n.level <= (userLevels[letter]||0)){ showToast('Niveau déjà validé'); return; }
            userLevels[letter] = n.level;
            saveLocal(currentUID, userLevels);
            try{
              await db.collection('users').doc(currentUID).update({ levels: userLevels });
            }catch(e){
              await db.collection('users').doc(currentUID).set({ levels: userLevels }, { merge:true }).catch(()=>{});
            }
            showToast(`Niveau ${n.level} validé pour ${letter}`);
            renderHomeProgress();
            renderMakersPanel();
            displayMakers(letter);
          });
        }
      });

      detail.scrollIntoView({ behavior:'smooth' });
    }

    function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

    // video modal
    function openVideoModal(url){
      const modal = document.createElement('div');
      modal.style.position='fixed';
      modal.style.left=0; modal.style.top=0; modal.style.right=0; modal.style.bottom=0;
      modal.style.background='rgba(0,0,0,0.85)';
      modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
      modal.style.zIndex=99999;
      modal.onclick = (e) => { if(e.target === modal) modal.remove(); };

      const inner = document.createElement('div');
      inner.style.width = 'min(1100px,95%)';
      inner.style.maxWidth = '1100px';
      inner.style.borderRadius = '10px';
      inner.style.overflow = 'hidden';
      inner.innerHTML = `<iframe width="100%" height="620" src="${url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        <button aria-label="Fermer" style="position:absolute;top:12px;right:12px;padding:8px 10px;border-radius:8px;border:none;background:#ff5a5a;color:#fff;cursor:pointer;">✖</button>`;
      modal.appendChild(inner);
      document.body.appendChild(modal);
      const closeBtn = inner.querySelector('button');
      if(closeBtn) closeBtn.addEventListener('click', ()=> modal.remove());
    }

    // auth UI interactions (login/register/google) - attach only if exist
    if(emailLoginBtn){
      emailLoginBtn.addEventListener('click', async ()=>{
        const email = (emailInput && emailInput.value||'').trim();
        const pass = (passInput && passInput.value||'');
        if(!email || pass.length < 6){ showToast('Email et mot de passe (≥6) requis', true); return; }
        try{
          await auth.signInWithEmailAndPassword(email, pass);
          showToast('Connecté !');
        }catch(err){
          console.error('login err', err);
          showToast('Erreur connexion : ' + (err.message || err), true);
          alert('Erreur : ' + (err.message||err));
        }
      });
    }

    if(emailRegisterBtn){
      emailRegisterBtn.addEventListener('click', async ()=>{
        const email = (emailInput && emailInput.value||'').trim();
        const pass = (passInput && passInput.value||'');
        if(!email || pass.length < 6){ showToast('Email et mot de passe (≥6) requis', true); return; }
        try{
          const res = await auth.createUserWithEmailAndPassword(email, pass);
          currentUID = res.user.uid;
          userLevels = { M:1, A:1, K:1, E:1, R:1, S:1 };
          // create user doc
          await db.collection('users').doc(currentUID).set({ name: res.user.displayName || email.split('@')[0], email: email, levels: userLevels });
          saveLocal(currentUID, userLevels);
          showToast('Inscription réussie — Bienvenue !');
        }catch(err){
          console.error('register err', err);
          showToast('Erreur inscription : ' + (err.message||err), true);
        }
      });
    }

    if(googleLoginBtn){
      googleLoginBtn.addEventListener('click', async ()=>{
        const provider = new firebase.auth.GoogleAuthProvider();
        try{
          const res = await auth.signInWithPopup(provider);
          currentUID = res.user.uid;
          const docRef = db.collection('users').doc(currentUID);
          const snap = await docRef.get();
          if(!snap.exists){
            userLevels = { M:1, A:1, K:1, E:1, R:1, S:1 };
            await docRef.set({ name: res.user.displayName || res.user.email.split('@')[0], email: res.user.email, levels: userLevels });
            saveLocal(currentUID, userLevels);
          }
          showToast('Connecté avec Google');
        }catch(err){
          console.error('google err', err);
          showToast('Erreur Google : ' + (err.message||err), true);
        }
      });
    }

    if(logoutBtn){
      logoutBtn.addEventListener('click', async ()=>{
        try{
          await auth.signOut();
          showToast('Déconnecté');
        }catch(err){
          showToast('Erreur déconnexion', true);
        }
      });
    }

    // auth state observer
    auth.onAuthStateChanged(async (user) => {
      if(user){
        currentUID = user.uid;
        updateAuthLink(user);
        // try load local progress
        const local = loadLocal(currentUID);
        if(local){
          userLevels = local;
        } else {
          // load from firestore
          try{
            const snap = await db.collection('users').doc(currentUID).get();
            if(snap.exists){
              const data = snap.data();
              // accept both shapes: { levels: {M:1,...} } or { M:1, A:1 ... }
              if(data.levels) userLevels = data.levels;
              else {
                // if doc has nested 'levels' key or direct keys
                const keys = ['M','A','K','E','R','S'];
                if(keys.every(k => typeof data[k] !== 'undefined')) userLevels = { M:data.M, A:data.A, K:data.K, E:data.E, R:data.R, S:data.S };
                else userLevels = data.levels || { M:1, A:1, K:1, E:1, R:1, S:1 };
              }
            } else {
              // create default doc
              userLevels = { M:1, A:1, K:1, E:1, R:1, S:1 };
              await db.collection('users').doc(currentUID).set({ name: user.displayName || user.email.split('@')[0], email: user.email, levels: userLevels });
            }
            saveLocal(currentUID, userLevels);
          }catch(e){
            console.error('firestore read err', e);
            showToast('Impossible de charger la progression (Firestore).', true);
            userLevels = { M:1, A:1, K:1, E:1, R:1, S:1 };
          }
        }

        // render UI
        renderHomeProgress();
        renderMakersPanel();

        // if makers page and hash present, open letter
        if(window.location.pathname.endsWith('makers.html')){
          const h = window.location.hash.replace('#','');
          if(h && makersData[h]) displayMakers(h);
        }
      } else {
        // logged out
        currentUID = null;
        userLevels = { M:0, A:0, K:0, E:0, R:0, S:0 };
        updateAuthLink(null);
        renderHomeProgress();
        renderMakersPanel();
        clearMakersDetail();
      }
    });

    // initial render (for pages where no auth yet)
    renderHomeProgress();
    renderMakersPanel();

    // neon subtle animation
    const neonColors = ['#00ffff','#ff8c00','#ff00ff','#00ff00','#ff4444','#ffdd00'];
    setInterval(()=>{
      document.querySelectorAll('.letter').forEach(el=>{
        const letterClass = el.className.split(' ').find(c=>/^[MAKERS]$/.test(c));
        const color = getColor(letterClass) || neonColors[Math.floor(Math.random()*neonColors.length)];
        el.style.textShadow = `0 0 6px ${color}, 0 0 18px ${color}`;
      });
      document.querySelectorAll('.bar-fill').forEach(b=>{
        const parent = b.closest('.level-card');
        if(parent){
          const letter = parent.querySelector('.letter') && parent.querySelector('.letter').textContent.trim();
          if(letter) b.style.boxShadow = `0 6px 18px rgba(0,0,0,0.5), 0 0 18px ${getColor(letter)}`;
        }
      });
    }, 1100);

  })(); // end main

})(); // end wrapper



