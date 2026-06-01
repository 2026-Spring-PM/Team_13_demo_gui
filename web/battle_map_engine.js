const config=window.BATTLE_MAP_CONFIG;
const scene=document.getElementById("battle-scene");
const background=document.getElementById("battle-background");
const objectLayer=document.getElementById("object-layer");
const selectableNodes=[];
let mapTransform={originX:0,originY:0,size:0};
let selectedHeroId=null;
let currentStage=null;
let battleRunning=false;
const BATTLE_UI_BOUNDS={minX:.15,maxX:.85,minY:.25,maxY:.75};

const BATTLE_ATLAS="../assets/generated/battle_character_atlas.png";
const BATTLE_ACTION_DIR="../assets/generated/battle_actions";
const BATTLE_UNIT_DIR="../assets/generated/battle_units";
const BATTLE_SKILL_DIR="../assets/generated/battle_skills";

function savedFarmState(){
  try{return JSON.parse(sessionStorage.getItem("farmVillageState")||"{}");}catch(error){return{};}
}

const battleParams=new URLSearchParams(location.search);
const battleLang=battleParams.get("lang")==="en"||savedFarmState().lang==="en"?"en":"ko";
if(battleLang==="en"){
  document.documentElement.lang="en";
  document.title=config.title&&/^Battle Map/.test(config.title)?config.title:"Battle Map";
}

function bt(ko,en){
  return battleLang==="en"?en:ko;
}

const MAP1_TUTORIAL_KEY="battleMap1TutorialDone";
const mapTutorial={
  active:config.mapId==="battle_map_1"&&!tutorialFlagDone(),
  stepIndex:0,
  root:null,
  focus:null,
  card:null
};

function tutorialFlagDone(){
  try{return sessionStorage.getItem(MAP1_TUTORIAL_KEY)==="1";}catch(error){return false;}
}

function setTutorialDone(){
  try{sessionStorage.setItem(MAP1_TUTORIAL_KEY,"1");}catch(error){}
}

const MAP_TUTORIAL_STEPS=[
  {
    id:"clickStage",
    color:"#facc15",
    title:bt("첫 전투 시작","Start Your First Battle"),
    body:bt("먼저 1-1 스테이지를 클릭해서 전투 준비 화면을 열어보세요.","Click stage 1-1 to open the battle preparation screen."),
    goal:bt("1-1 스테이지 클릭","Click stage 1-1")
  },
  {
    id:"selectHero",
    color:"#60a5fa",
    title:bt("속성과 상성 이해하기","Elements and Matchups"),
    body:bt("영웅 하나를 클릭해서 출전시킬 영웅을 고르세요.\n속성은 불 > 풀 > 물 > 불 순서로 유리합니다.\n유리한 속성은 주는 피해가 2배, 불리한 속성은 0.5배가 됩니다.\n1-1의 몬스터는 풀 속성이므로 불 영웅이 유리해요.","Click one hero to choose who will fight.\nElement advantage flows Fire > Grass > Water > Fire.\nAdvantage deals 2x damage; disadvantage deals 0.5x damage.\nThe 1-1 monster is Grass, so Fire is strong here."),
    goal:bt("출전 영웅 선택","Choose a hero")
  },
  {
    id:"startBattle",
    color:"#22c55e",
    title:bt("전투 시작","Start Battle"),
    body:bt("영웅을 골랐다면 활성화된 전투 시작 버튼을 눌러 실제 전투로 들어가세요.","After choosing a hero, press the enabled Start Battle button to enter combat."),
    goal:bt("전투 시작 버튼 클릭","Click Start Battle")
  }
];

const EN_STAGE_DATA={
  stage_1_1:{stageId:"1-1",background:"../assets/generated/battle_backgrounds/battle_bg_1_1.png",monster:{name:"Grass Slime",element:"Grass",attack:6,health:42,sprite:3,action:3,skill:"Sprout Bounce"},reward:{gold:20,experience:25}},
  stage_1_2:{stageId:"1-2",background:"../assets/generated/battle_backgrounds/battle_bg_1_2.png",monster:{name:"Fire Vine",element:"Fire",attack:8,health:58,sprite:4,action:4,skill:"Flame Whip"},reward:{gold:28,experience:35}},
  stage_1_3:{stageId:"1-3",background:"../assets/generated/battle_backgrounds/battle_bg_1_3.png",monster:{name:"Water Mushroom",element:"Water",attack:11,health:76,sprite:5,action:5,skill:"Mushroom Splash"},reward:{gold:36,experience:48}},
  stage_1_4:{stageId:"1-4",background:"../assets/generated/battle_backgrounds/battle_bg_1_4.png",monster:{name:"Grass Boar",element:"Grass",attack:14,health:98,sprite:6,action:6,skill:"Moss Charge"},reward:{gold:48,experience:62}},
  stage_1_5:{stageId:"1-5",background:"../assets/generated/battle_backgrounds/battle_bg_1_5.png",monster:{name:"Forest Guardian",element:"Fire",attack:18,health:128,sprite:7,action:7,skill:"Guardian Judgment"},reward:{gold:65,experience:85}},
  stage_2_1:{stageId:"2-1",background:"../assets/generated/battle_backgrounds/battle_bg_2_1.png",monster:{name:"Cave Bat",element:"Water",attack:20,health:145,sprite:8,action:8,skill:"Sonic Dive"},reward:{gold:78,experience:100}},
  stage_2_2:{stageId:"2-2",background:"../assets/generated/battle_backgrounds/battle_bg_2_2.png",monster:{name:"Fire Golem",element:"Fire",attack:24,health:170,sprite:9,action:9,skill:"Lava Fist"},reward:{gold:92,experience:120}},
  stage_2_3:{stageId:"2-3",background:"../assets/generated/battle_backgrounds/battle_bg_2_3.png",monster:{name:"Moss Golem",element:"Grass",attack:29,health:205,sprite:10,action:10,skill:"Stone Root"},reward:{gold:110,experience:145}},
  stage_2_4:{stageId:"2-4",background:"../assets/generated/battle_backgrounds/battle_bg_2_4.png",monster:{name:"Water Wisp",element:"Water",attack:34,health:242,sprite:11,action:11,skill:"Blue Vortex"},reward:{gold:132,experience:175}},
  stage_2_5:{stageId:"2-5",background:"../assets/generated/battle_backgrounds/battle_bg_2_5.png",monster:{name:"Cave Lord",element:"Fire",attack:40,health:290,sprite:12,action:12,skill:"Abyss Roar"},reward:{gold:160,experience:220}}
};

const EN_DEFAULT_HEROES=[
  {id:"fire",label:"Fire Hero",element:"Fire",sprite:0,action:0,level:1,attack:12,health:60,skill:"Crimson Slash"},
  {id:"water",label:"Water Hero",element:"Water",sprite:1,action:1,level:1,attack:12,health:60,skill:"Wave Spear"},
  {id:"grass",label:"Grass Hero",element:"Grass",sprite:2,action:2,level:1,attack:12,health:60,skill:"Vine Shot"}
];

const STAGE_DATA={
  stage_1_1:{stageId:"1-1",background:"../assets/generated/battle_backgrounds/battle_bg_1_1.png",monster:{name:"초원 슬라임",element:"풀",attack:6,health:42,sprite:3,action:3,skill:"새싹 튕기기"},reward:{gold:20,experience:25}},
  stage_1_2:{stageId:"1-2",background:"../assets/generated/battle_backgrounds/battle_bg_1_2.png",monster:{name:"불꽃 덩굴",element:"불",attack:8,health:58,sprite:4,action:4,skill:"화염 채찍"},reward:{gold:28,experience:35}},
  stage_1_3:{stageId:"1-3",background:"../assets/generated/battle_backgrounds/battle_bg_1_3.png",monster:{name:"물방울 버섯",element:"물",attack:11,health:76,sprite:5,action:5,skill:"버섯 물폭탄"},reward:{gold:36,experience:48}},
  stage_1_4:{stageId:"1-4",background:"../assets/generated/battle_backgrounds/battle_bg_1_4.png",monster:{name:"초원 멧돼지",element:"풀",attack:14,health:98,sprite:6,action:6,skill:"이끼 돌진"},reward:{gold:48,experience:62}},
  stage_1_5:{stageId:"1-5",background:"../assets/generated/battle_backgrounds/battle_bg_1_5.png",monster:{name:"숲의 수호자",element:"불",attack:18,health:128,sprite:7,action:7,skill:"수호자의 심판"},reward:{gold:65,experience:85}},
  stage_2_1:{stageId:"2-1",background:"../assets/generated/battle_backgrounds/battle_bg_2_1.png",monster:{name:"동굴 박쥐",element:"물",attack:20,health:145,sprite:8,action:8,skill:"음파 급습"},reward:{gold:78,experience:100}},
  stage_2_2:{stageId:"2-2",background:"../assets/generated/battle_backgrounds/battle_bg_2_2.png",monster:{name:"불꽃 광석병",element:"불",attack:24,health:170,sprite:9,action:9,skill:"용암 주먹"},reward:{gold:92,experience:120}},
  stage_2_3:{stageId:"2-3",background:"../assets/generated/battle_backgrounds/battle_bg_2_3.png",monster:{name:"이끼 골렘",element:"풀",attack:29,health:205,sprite:10,action:10,skill:"바위 뿌리"},reward:{gold:110,experience:145}},
  stage_2_4:{stageId:"2-4",background:"../assets/generated/battle_backgrounds/battle_bg_2_4.png",monster:{name:"지하수 정령",element:"물",attack:34,health:242,sprite:11,action:11,skill:"푸른 소용돌이"},reward:{gold:132,experience:175}},
  stage_2_5:{stageId:"2-5",background:"../assets/generated/battle_backgrounds/battle_bg_2_5.png",monster:{name:"동굴 군주",element:"불",attack:40,health:290,sprite:12,action:12,skill:"심연의 포효"},reward:{gold:160,experience:220}}
};

const DEFAULT_HEROES=[
  {id:"fire",label:"불꽃 영웅",element:"불",sprite:0,action:0,level:1,attack:12,health:60,skill:"홍련 베기"},
  {id:"water",label:"물 영웅",element:"물",sprite:1,action:1,level:1,attack:12,health:60,skill:"파도 창"},
  {id:"grass",label:"풀 영웅",element:"풀",sprite:2,action:2,level:1,attack:12,health:60,skill:"덩굴 사격"}
];

injectBattleStyles();

function injectBattleStyles(){
  if(document.getElementById("battle-engine-polish"))return;
  const style=document.createElement("style");
  style.id="battle-engine-polish";
  style.textContent=`
    #battle-scene::before{content:"";position:fixed;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle at 20% 30%,rgba(255,247,168,.15),transparent 18%),radial-gradient(circle at 82% 26%,rgba(147,197,253,.14),transparent 20%);animation:worldBreath 6s ease-in-out infinite alternate}
    #battle-scene::after{content:"";position:fixed;inset:-20%;z-index:1;pointer-events:none;background:repeating-linear-gradient(115deg,rgba(255,255,255,.045) 0 1px,transparent 1px 48px);opacity:.42;animation:mapDrift 18s linear infinite}
    #object-layer{z-index:2}
    @keyframes worldBreath{to{filter:saturate(1.16) brightness(1.06);transform:scale(1.02)}}
    @keyframes mapDrift{to{transform:translate3d(80px,40px,0)}}
    .stage-node::before,.portal-node::before{content:"";position:absolute;inset:15%;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.58),rgba(255,255,255,0) 62%);filter:blur(3px);opacity:.5;animation:nodePulse 2s ease-in-out infinite}
    .portal-node::after{content:"";position:absolute;inset:8%;border:2px solid rgba(199,210,254,.78);border-radius:50%;animation:portalSpin 3s linear infinite}
    .map-selectable img{transform-origin:50% 76%;animation:livingMapIcon 2.5s ease-in-out infinite;will-change:transform,filter}
    .stage-node img{animation-delay:.18s}.portal-node img{animation:portalIconLive 2s ease-in-out infinite}
    .map-selectable.is-hovered{transform:translate(-50%,-50%) scale(1.08)!important}
    .map-selectable.is-hovered img{animation:mapIconReady .72s ease-in-out infinite;filter:drop-shadow(0 12px 18px rgba(255,247,168,.52)) saturate(1.22) brightness(1.08)}
    @keyframes nodePulse{50%{transform:scale(1.18);opacity:.88}}
    @keyframes portalSpin{to{transform:rotate(360deg)}}
    @keyframes livingMapIcon{0%,100%{transform:translateY(0) scale(1) rotate(0deg)}45%{transform:translateY(-7px) scale(1.08) rotate(-2deg)}75%{transform:translateY(2px) scale(.99) rotate(1deg)}}
    @keyframes portalIconLive{0%,100%{transform:translateY(0) scale(1) rotate(0deg)}50%{transform:translateY(-9px) scale(1.12) rotate(5deg)}}
    @keyframes mapIconReady{50%{transform:translateY(-11px) scale(1.18) rotate(-5deg)}}
    #stage-prep{position:fixed!important;inset:auto!important;left:var(--battle-ui-left)!important;top:var(--battle-ui-top)!important;width:var(--battle-ui-width)!important;height:var(--battle-ui-height)!important;max-width:none!important;max-height:none!important;overflow:auto!important;border-radius:22px;background:radial-gradient(circle at 18% 20%,rgba(254,243,199,.8),transparent 26%),linear-gradient(135deg,#f8fafc,#fff7ed);color:#111827;box-shadow:0 26px 70px rgba(15,23,42,.38)}
    #stage-prep.is-open{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);animation:prepIn .22s ease-out both}
    @keyframes prepIn{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:scale(1)}}
    .prep-left{background:linear-gradient(160deg,rgba(17,24,39,.58),rgba(35,48,71,.62) 54%,rgba(59,36,21,.5)),url("../assets/generated/portal_screen_bg.png") center/cover!important;color:#fff8dd;border-right:0!important;position:relative;overflow:hidden}
    .prep-left::before{content:"";position:absolute;inset:-20%;background:radial-gradient(circle at 50% 35%,rgba(251,191,36,.25),transparent 32%),radial-gradient(circle at 20% 80%,rgba(96,165,250,.22),transparent 26%);animation:slowDrift 8s ease-in-out infinite alternate}
    @keyframes slowDrift{to{transform:translate3d(20px,-12px,0) rotate(2deg)}}
    .prep-panel{position:relative;z-index:1;min-width:0;padding:clamp(14px,2.6vmin,34px)!important}
    .close-prep{z-index:25!important;pointer-events:auto!important;display:grid!important;place-items:center!important}
    .monster-card img{display:none}
    .sprite-portrait{width:min(58vw,260px);aspect-ratio:1;border-radius:22px;border:3px solid rgba(255,255,255,.68);box-shadow:0 24px 60px rgba(0,0,0,.32),inset 0 0 0 1px rgba(255,255,255,.35);animation:floatPortrait 3s ease-in-out infinite;overflow:hidden;position:relative;background:linear-gradient(145deg,rgba(255,253,244,.92),rgba(226,232,240,.72))}
    .sprite-art{position:absolute;inset:-7%;background-image:var(--atlas);background-size:400% 400%;background-position:var(--pos);transform-origin:50% 72%;animation:livingPortrait 2.8s ease-in-out infinite;will-change:transform,filter}
    .sprite-portrait::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 18%,rgba(255,255,255,.24),transparent 34%),linear-gradient(135deg,rgba(255,255,255,.22),transparent 42%);pointer-events:none}
    @keyframes floatPortrait{50%{transform:translateY(-4px) rotateX(2deg)}}
    @keyframes livingPortrait{0%,100%{transform:translateY(0) scale(1.04) rotate(0deg)}35%{transform:translateY(-5px) scale(1.075) rotate(-1.2deg)}70%{transform:translateY(2px) scale(1.035) rotate(1deg)}}
    .hero-card{background:linear-gradient(180deg,#fff,#f8fafc)!important;box-shadow:0 12px 28px rgba(15,23,42,.12);position:relative;overflow:hidden}
    .hero-grid{grid-template-columns:repeat(3,minmax(88px,1fr))!important;gap:clamp(8px,1.8vmin,16px)!important;margin:clamp(10px,2vmin,18px) 0!important}
    .hero-card::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.7),transparent 42%);pointer-events:none}
    .hero-card .sprite-portrait{width:112px;border-radius:18px;border-color:#e5e7eb;box-shadow:inset 0 0 0 1px rgba(255,255,255,.55),0 12px 20px rgba(15,23,42,.14);animation:none}
    .hero-card.is-hovered .sprite-art{animation:heroCardReady .85s ease-in-out infinite}
    @keyframes heroCardReady{50%{transform:translateY(-7px) scale(1.1) rotate(-2deg);filter:saturate(1.18) brightness(1.06)}}
    .battle-overlay{position:fixed;inset:auto;left:var(--battle-ui-left);top:var(--battle-ui-top);width:var(--battle-ui-width);height:var(--battle-ui-height);z-index:30;display:grid;place-items:center;border-radius:22px;background:radial-gradient(circle at 50% 38%,rgba(248,250,252,.08),transparent 26%),linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.96));color:#fff8dd;font-family:"Noto Sans KR","Malgun Gothic",system-ui,sans-serif;perspective:1100px;overflow:hidden;box-shadow:0 26px 70px rgba(15,23,42,.42)}
    .battle-overlay.shake{animation:screenShake .28s linear}
    .battle-overlay.clash{animation:screenShake .28s linear}
    @keyframes screenShake{20%{transform:translate(7px,-4px)}40%{transform:translate(-6px,5px)}60%{transform:translate(5px,3px)}80%{transform:translate(-4px,-3px)}}
    .battle-arena{width:100%;height:100%;position:relative;border-radius:22px;overflow:hidden;background:#172033;box-shadow:0 20px 56px rgba(0,0,0,.42);transform:none;border:1px solid rgba(255,255,255,.16)}
    .arena-bg{position:absolute;inset:0;background-image:var(--battle-bg);background-size:cover;background-position:center;filter:saturate(1.1) contrast(1.04);transform:scale(1.04);animation:bgDrift 10s ease-in-out infinite alternate}
    .battle-arena.combat-focus .arena-bg{filter:saturate(1.32) contrast(1.08) brightness(.92);animation:bgClash .44s ease-out both}
    .battle-arena::before{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse at 50% 74%,rgba(251,191,36,.18),transparent 38%),linear-gradient(180deg,rgba(15,23,42,.18),rgba(15,23,42,.02) 42%,rgba(0,0,0,.2)),linear-gradient(90deg,rgba(96,165,250,.08),transparent,rgba(248,113,113,.08));animation:arenaBreath 4s ease-in-out infinite;pointer-events:none}
    .battle-arena::after{content:"";position:absolute;left:-10%;right:-10%;bottom:7%;height:28%;z-index:1;background:repeating-linear-gradient(90deg,rgba(255,255,255,.045) 0 2px,transparent 2px 52px);transform:rotateX(66deg);opacity:.22;pointer-events:none}
    @keyframes bgDrift{to{transform:scale(1.08) translate3d(-10px,-5px,0)}}
    @keyframes bgClash{35%{transform:scale(1.11) translate3d(var(--pan-x,0),-8px,0);filter:saturate(1.48) contrast(1.12) brightness(.86)}}
    @keyframes arenaBreath{50%{filter:saturate(1.25) brightness(1.07)}}
    .battle-title{position:absolute;left:28px;top:22px;z-index:5;font-weight:950;font-size:clamp(22px,4vw,42px);text-shadow:0 3px 16px rgba(0,0,0,.42)}
    .battle-log{position:absolute;left:50%;top:26px;z-index:5;transform:translateX(-50%);min-width:260px;padding:10px 18px;border-radius:999px;background:rgba(15,23,42,.66);border:1px solid rgba(255,255,255,.18);font-weight:900;text-align:center}
    .fighter{position:absolute;bottom:138px;z-index:4;width:min(30vw,270px);aspect-ratio:1;transform-style:preserve-3d;transition:transform .32s cubic-bezier(.18,.82,.2,1.02),filter .28s ease;will-change:transform,filter}
    .fighter.hero{left:18%;filter:drop-shadow(0 26px 28px rgba(56,189,248,.32))}
    .fighter.monster{right:18%;filter:drop-shadow(0 26px 28px rgba(248,113,113,.34))}
    .battle-sprite{position:absolute;inset:0;overflow:visible;background:transparent}
    .battle-sprite::before{content:"";position:absolute;left:18%;right:18%;bottom:8%;height:12%;border-radius:50%;background:rgba(0,0,0,.32);filter:blur(9px);transform:scaleX(1.05);animation:shadowPulse 1.25s ease-in-out infinite}
    .action-img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:contain;transform-origin:50% 78%;animation:battleIdleBody 1.25s ease-in-out infinite;will-change:transform,filter;image-rendering:auto}
    @keyframes shadowPulse{50%{transform:scaleX(.86);opacity:.62}}
    @keyframes battleIdleBody{0%,100%{transform:translateY(0) scale(1.06)}45%{transform:translateY(-12px) scale(1.1)}70%{transform:translateY(2px) scale(1.05)}}
    .fighter.step-in.hero{transform:translate3d(72px,-14px,70px) scale(1.06)}
    .fighter.step-in.monster{transform:translate3d(-72px,-14px,70px) scale(1.06)}
    .fighter.monster .battle-sprite{transform:scaleX(-1)}
    .fighter.monster .action-img{animation-delay:.25s}
    .fighter.focus{filter:drop-shadow(0 30px 30px rgba(255,247,173,.38)) drop-shadow(0 0 22px var(--focus-color,rgba(251,146,60,.72)))}
    .fighter.windup .action-img{animation:frameWindup .24s ease-out both}
    .fighter.attack .action-img{animation:frameAttack .3s cubic-bezier(.18,.8,.14,1) both}
    .fighter.hit .action-img{animation:frameHit .42s ease both}
    .fighter.recover .action-img{animation:frameRecover .28s ease both}
    @keyframes frameWindup{to{transform:translateY(-8px) scale(1.12) rotate(-3deg);filter:brightness(1.08) saturate(1.18)}}
    @keyframes frameAttack{40%{transform:translateY(-20px) scale(1.2) rotate(5deg);filter:brightness(1.25) saturate(1.35)}100%{transform:translateY(-4px) scale(1.11)}}
    @keyframes frameHit{20%{transform:translateX(var(--hit-x,0)) translateY(8px) scale(.98) rotate(6deg);filter:brightness(2.2) saturate(1.5)}55%{transform:translateX(calc(var(--hit-x,0) * -.4)) translateY(-4px) scale(1.08) rotate(-4deg)}}
    @keyframes frameRecover{to{transform:translateY(0) scale(1.06)}}
    .fighter.casting .action-img{filter:drop-shadow(0 0 18px rgba(96,165,250,.75)) brightness(1.15)}
    .hp-card{position:absolute;bottom:38px;z-index:5;width:330px;max-width:38vw;padding:14px 16px;border-radius:18px;background:rgba(15,23,42,.76);border:1px solid rgba(255,255,255,.18);box-shadow:0 16px 34px rgba(0,0,0,.28)}
    .hp-card.hero{left:32px}.hp-card.monster{right:32px}
    .hp-name{display:flex;justify-content:space-between;font-weight:950;margin-bottom:9px}
    .hp-track{height:13px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden}
    .hp-fill{height:100%;width:100%;border-radius:999px;background:linear-gradient(90deg,#22c55e,#bef264);transition:width .45s cubic-bezier(.2,.8,.2,1)}
    .monster .hp-fill{background:linear-gradient(90deg,#ef4444,#f97316)}
    .slash,.spell-ring,.damage-pop,.contact-flash,.foot-dust,.speed-line{position:absolute;pointer-events:none;z-index:3}
    .slash{width:230px;height:100px;border-top:10px solid #fff7ad;border-radius:50%;filter:drop-shadow(0 0 16px #f97316);animation:slash .42s ease-out forwards}
    @keyframes slash{from{opacity:0;transform:translate(-50%,-50%) rotate(calc(var(--dir,1) * -24deg)) scale(.42)}48%{opacity:1}to{opacity:0;transform:translate(-50%,-50%) rotate(calc(var(--dir,1) * 18deg)) scale(1.38)}}
    .spell-ring{width:160px;height:160px;border-radius:50%;border:5px solid rgba(147,197,253,.9);box-shadow:0 0 35px rgba(96,165,250,.8),inset 0 0 28px rgba(96,165,250,.48);animation:ring .62s ease-out forwards}
    @keyframes ring{to{opacity:0;transform:translate(-50%,-50%) scale(1.8) rotate(90deg)}}
    .damage-pop{font-size:34px;font-weight:1000;color:#fee2e2;text-shadow:0 4px 18px rgba(239,68,68,.9);animation:popDmg .8s ease-out forwards}
    @keyframes popDmg{to{opacity:0;transform:translate(-50%,-120%) scale(1.25)}}
    .contact-flash{width:140px;height:140px;border-radius:50%;background:radial-gradient(circle,#fff 0 8%,var(--fc) 9% 32%,rgba(255,255,255,0) 58%);mix-blend-mode:screen;filter:blur(.2px);animation:contactFlash .34s ease-out forwards}
    @keyframes contactFlash{from{opacity:0;transform:translate(-50%,-50%) scale(.28)}38%{opacity:.95}to{opacity:0;transform:translate(-50%,-50%) scale(1.7)}}
    .foot-dust{width:150px;height:54px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,232,179,.46),rgba(255,232,179,0) 70%);filter:blur(2px);animation:dustOut .48s ease-out forwards}
    @keyframes dustOut{from{opacity:0;transform:translate(-50%,-50%) scale(.45)}35%{opacity:.8}to{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% - 14px)) scale(1.8)}}
    .speed-line{width:240px;height:5px;border-radius:999px;background:linear-gradient(90deg,transparent,#fff7ad,var(--lc),transparent);filter:drop-shadow(0 0 10px var(--lc));animation:speedLine .36s ease-out forwards}
    @keyframes speedLine{from{opacity:0;transform:translate(-50%,-50%) rotate(var(--rot)) scaleX(.2)}35%{opacity:.9}to{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot)) scaleX(1.25)}}
    .fighter-ghost{position:absolute;width:min(30vw,270px);aspect-ratio:1;object-fit:contain;opacity:.34;filter:blur(.5px) brightness(1.22);mix-blend-mode:screen;pointer-events:none;z-index:2;animation:ghostFade .42s ease-out forwards}
    .fighter-ghost.monster{scale:-1 1}
    @keyframes ghostFade{to{opacity:0;transform:translate(var(--gx),var(--gy)) scale(1.08)}}
    .projectile{position:absolute;width:250px;height:126px;pointer-events:none;z-index:3;transform-origin:50% 50%;animation:projectileFly .66s cubic-bezier(.22,.74,.18,1) forwards}
    .projectile img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 18px var(--pc));transform:scaleX(var(--flip,1))}
    @keyframes projectileFly{from{opacity:0;transform:translate(var(--sx),var(--sy)) rotate(var(--rot)) scale(.5)}28%{opacity:1}to{opacity:0;transform:translate(var(--tx),var(--ty)) rotate(var(--rot)) scale(1.08)}}
    .impact-sparks{position:absolute;width:120px;height:120px;pointer-events:none;z-index:4;transform:translate(-50%,-50%);animation:sparkFade .52s ease-out forwards}
    .impact-sparks i{position:absolute;left:50%;top:50%;width:4px;height:28px;border-radius:999px;background:var(--sc);box-shadow:0 0 12px var(--sc);transform:rotate(var(--r)) translateY(-46px)}
    @keyframes sparkFade{from{opacity:0;transform:translate(-50%,-50%) scale(.45) rotate(0)}35%{opacity:1}to{opacity:0;transform:translate(-50%,-50%) scale(1.25) rotate(25deg)}}
    .result-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.92);width:min(480px,86vw);padding:28px;border-radius:26px;background:rgba(255,253,244,.96);color:#111827;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.45);animation:resultIn .34s ease-out forwards;z-index:5}
    @keyframes resultIn{to{transform:translate(-50%,-50%) scale(1)}}
    .result-card h2{font-size:34px;margin-bottom:8px}.result-card p{font-weight:850;margin:8px 0;color:#475569}.result-card button{margin-top:18px;border:0;border-radius:14px;background:#16a34a;color:white;padding:13px 24px;font-weight:950;cursor:pointer}
    .map-tutorial-root{position:fixed;inset:0;z-index:60;pointer-events:none;font-family:"Noto Sans KR","Malgun Gothic",system-ui,sans-serif;--map-tutorial-scale:1}
    .map-tutorial-root.is-hidden{display:none}
    .map-tutorial-focus{position:fixed;border:calc(3px * var(--map-tutorial-scale)) solid var(--tutorial-color,#facc15);border-radius:calc(18px * var(--map-tutorial-scale));box-shadow:0 0 0 9999px rgba(15,23,42,.18),0 0 calc(24px * var(--map-tutorial-scale)) var(--tutorial-color,#facc15);animation:tutorialFocusPulse 1.2s ease-in-out infinite;transition:left .18s ease,top .18s ease,width .18s ease,height .18s ease}
    @keyframes tutorialFocusPulse{50%{transform:scale(1.04);box-shadow:0 0 0 9999px rgba(15,23,42,.2),0 0 34px var(--tutorial-color,#facc15)}}
    .map-tutorial-card{position:fixed;bottom:calc(22px * var(--map-tutorial-scale));width:min(calc(370px * var(--map-tutorial-scale)),calc(100vw - 24px));max-height:calc(100vh - 24px);overflow:auto;padding:calc(18px * var(--map-tutorial-scale)) calc(20px * var(--map-tutorial-scale));border-radius:calc(18px * var(--map-tutorial-scale));background:rgba(255,253,244,.97);border:calc(2px * var(--map-tutorial-scale)) solid var(--tutorial-color,#facc15);box-shadow:0 calc(20px * var(--map-tutorial-scale)) calc(50px * var(--map-tutorial-scale)) rgba(15,23,42,.28);color:#1f2937;pointer-events:auto;transition:left .18s ease}
    .map-tutorial-step{font-size:calc(11px * var(--map-tutorial-scale));font-weight:950;color:var(--tutorial-color,#d97706);margin-bottom:calc(7px * var(--map-tutorial-scale))}
    .map-tutorial-title{font-size:calc(20px * var(--map-tutorial-scale));font-weight:1000;line-height:1.12;margin-bottom:calc(9px * var(--map-tutorial-scale))}
    .map-tutorial-body{font-size:calc(13px * var(--map-tutorial-scale));font-weight:760;line-height:1.45;color:#475569;white-space:pre-line}
    .map-tutorial-goal{margin-top:calc(12px * var(--map-tutorial-scale));padding:calc(8px * var(--map-tutorial-scale)) calc(10px * var(--map-tutorial-scale));border-radius:calc(10px * var(--map-tutorial-scale));background:rgba(15,23,42,.06);font-size:calc(11px * var(--map-tutorial-scale));font-weight:900;color:#334155}
    .map-tutorial-skip{position:absolute;right:calc(14px * var(--map-tutorial-scale));top:calc(14px * var(--map-tutorial-scale));border:0;border-radius:999px;background:rgba(241,245,249,.95);color:#475569;padding:calc(7px * var(--map-tutorial-scale)) calc(11px * var(--map-tutorial-scale));font-size:calc(11px * var(--map-tutorial-scale));font-weight:950;cursor:pointer}
    .map-tutorial-skip:hover{transform:scale(1.04)}
    @media (max-width:760px){#stage-prep.is-open{grid-template-columns:1fr}.hero-grid{grid-template-columns:1fr!important}.sprite-portrait{width:min(42vw,180px)}.fighter{width:min(34vw,180px);bottom:35%}.fighter.hero{left:8%}.fighter.monster{right:8%}.hp-card{bottom:16px;width:42%;max-width:none;padding:10px}.battle-title{font-size:20px}.battle-log{top:54px;min-width:180px;font-size:12px}}
    #stage-prep,.battle-overlay{border-radius:calc(22px * var(--battle-ui-scale))!important;box-shadow:0 calc(26px * var(--battle-ui-scale)) calc(70px * var(--battle-ui-scale)) rgba(15,23,42,.38)!important}
    #stage-prep{overflow:hidden!important;font-size:calc(16px * var(--battle-ui-scale))!important}
    #stage-prep.is-open{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important}
    .prep-panel{padding:calc(26px * var(--battle-ui-scale))!important;gap:calc(10px * var(--battle-ui-scale))!important}
    .prep-title{font-size:calc(38px * var(--battle-ui-scale))!important;line-height:1.08!important;margin-bottom:calc(22px * var(--battle-ui-scale))!important;letter-spacing:0!important}
    .monster-card{gap:calc(11px * var(--battle-ui-scale))!important}
    .prep-left,.monster-card{align-items:center!important;text-align:center!important}
    .monster-card{justify-items:center!important}
    .stat-line{font-size:calc(21px * var(--battle-ui-scale))!important;line-height:1.15!important}
    .reward-box{margin-top:calc(12px * var(--battle-ui-scale))!important;padding:calc(12px * var(--battle-ui-scale)) calc(14px * var(--battle-ui-scale))!important;border-radius:calc(12px * var(--battle-ui-scale))!important;font-size:calc(17px * var(--battle-ui-scale))!important}
    .sprite-portrait{width:calc(255px * var(--battle-ui-scale))!important;border-radius:calc(18px * var(--battle-ui-scale))!important;border-width:calc(3px * var(--battle-ui-scale))!important;box-shadow:0 calc(18px * var(--battle-ui-scale)) calc(38px * var(--battle-ui-scale)) rgba(0,0,0,.28),inset 0 0 0 1px rgba(255,255,255,.35)!important}
    .hero-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:calc(14px * var(--battle-ui-scale))!important;margin:calc(18px * var(--battle-ui-scale)) 0!important}
    .hero-card{min-width:0!important;padding:calc(12px * var(--battle-ui-scale))!important;border-radius:calc(14px * var(--battle-ui-scale))!important;border-width:calc(3px * var(--battle-ui-scale))!important;gap:calc(7px * var(--battle-ui-scale))!important;font-size:calc(16px * var(--battle-ui-scale))!important;line-height:1.12!important}
    .hero-card strong,.hero-card span{max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:clip}
    .hero-card .sprite-portrait{width:calc(106px * var(--battle-ui-scale))!important;border-radius:calc(14px * var(--battle-ui-scale))!important}
    .prep-actions{gap:calc(12px * var(--battle-ui-scale))!important}
    .start-button{padding:calc(12px * var(--battle-ui-scale)) calc(28px * var(--battle-ui-scale))!important;border-radius:calc(12px * var(--battle-ui-scale))!important;font-size:calc(20px * var(--battle-ui-scale))!important}
    .prep-message{min-height:calc(24px * var(--battle-ui-scale))!important;font-size:calc(15px * var(--battle-ui-scale))!important}
    .close-prep{right:calc(20px * var(--battle-ui-scale))!important;top:calc(20px * var(--battle-ui-scale))!important;width:calc(56px * var(--battle-ui-scale))!important;height:calc(56px * var(--battle-ui-scale))!important;border-radius:calc(14px * var(--battle-ui-scale))!important;font-size:calc(28px * var(--battle-ui-scale))!important}
    .battle-arena{border-radius:calc(22px * var(--battle-ui-scale))!important;box-shadow:0 calc(20px * var(--battle-ui-scale)) calc(56px * var(--battle-ui-scale)) rgba(0,0,0,.42)!important}
    .battle-title{left:calc(28px * var(--battle-ui-scale))!important;top:calc(22px * var(--battle-ui-scale))!important;font-size:calc(38px * var(--battle-ui-scale))!important}
    .battle-log{top:calc(26px * var(--battle-ui-scale))!important;min-width:calc(260px * var(--battle-ui-scale))!important;padding:calc(10px * var(--battle-ui-scale)) calc(18px * var(--battle-ui-scale))!important;border-radius:calc(999px * var(--battle-ui-scale))!important;font-size:calc(16px * var(--battle-ui-scale))!important}
    .fighter{width:calc(270px * var(--battle-ui-scale))!important;bottom:calc(138px * var(--battle-ui-scale))!important}
    .fighter.hero{left:18%!important}.fighter.monster{right:18%!important}
    .fighter.step-in.hero{transform:translate3d(calc(72px * var(--battle-ui-scale)),calc(-14px * var(--battle-ui-scale)),calc(70px * var(--battle-ui-scale))) scale(1.06)!important}
    .fighter.step-in.monster{transform:translate3d(calc(-72px * var(--battle-ui-scale)),calc(-14px * var(--battle-ui-scale)),calc(70px * var(--battle-ui-scale))) scale(1.06)!important}
    .hp-card{bottom:calc(38px * var(--battle-ui-scale))!important;width:calc(330px * var(--battle-ui-scale))!important;max-width:none!important;padding:calc(14px * var(--battle-ui-scale)) calc(16px * var(--battle-ui-scale))!important;border-radius:calc(18px * var(--battle-ui-scale))!important;font-size:calc(15px * var(--battle-ui-scale))!important}
    .hp-card.hero{left:calc(32px * var(--battle-ui-scale))!important}.hp-card.monster{right:calc(32px * var(--battle-ui-scale))!important}
    .hp-name{margin-bottom:calc(9px * var(--battle-ui-scale))!important}.hp-track{height:calc(13px * var(--battle-ui-scale))!important}
    .slash{width:calc(230px * var(--battle-ui-scale))!important;height:calc(100px * var(--battle-ui-scale))!important;border-top-width:calc(10px * var(--battle-ui-scale))!important}
    .spell-ring{width:calc(160px * var(--battle-ui-scale))!important;height:calc(160px * var(--battle-ui-scale))!important;border-width:calc(5px * var(--battle-ui-scale))!important}
    .damage-pop{font-size:calc(34px * var(--battle-ui-scale))!important}
    .contact-flash{width:calc(140px * var(--battle-ui-scale))!important;height:calc(140px * var(--battle-ui-scale))!important}
    .foot-dust{width:calc(150px * var(--battle-ui-scale))!important;height:calc(54px * var(--battle-ui-scale))!important}
    .speed-line{width:calc(240px * var(--battle-ui-scale))!important;height:calc(5px * var(--battle-ui-scale))!important}
    .fighter-ghost{width:calc(270px * var(--battle-ui-scale))!important}
    .projectile{width:calc(250px * var(--battle-ui-scale))!important;height:calc(126px * var(--battle-ui-scale))!important}
    .impact-sparks{width:calc(120px * var(--battle-ui-scale))!important;height:calc(120px * var(--battle-ui-scale))!important}
    .impact-sparks i{width:calc(4px * var(--battle-ui-scale))!important;height:calc(28px * var(--battle-ui-scale))!important;transform:rotate(var(--r)) translateY(calc(-46px * var(--battle-ui-scale)))!important}
    .result-card{width:calc(480px * var(--battle-ui-scale))!important;max-width:86%!important;padding:calc(28px * var(--battle-ui-scale))!important;border-radius:calc(26px * var(--battle-ui-scale))!important}
    .result-card h2{font-size:calc(34px * var(--battle-ui-scale))!important;margin-bottom:calc(8px * var(--battle-ui-scale))!important}
    .result-card p{font-size:calc(16px * var(--battle-ui-scale))!important;margin:calc(8px * var(--battle-ui-scale)) 0!important}
    .result-card button{margin-top:calc(18px * var(--battle-ui-scale))!important;padding:calc(13px * var(--battle-ui-scale)) calc(24px * var(--battle-ui-scale))!important;border-radius:calc(14px * var(--battle-ui-scale))!important;font-size:calc(16px * var(--battle-ui-scale))!important}
    @media (max-width:760px){#stage-prep.is-open{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important}.hero-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.fighter{bottom:calc(138px * var(--battle-ui-scale))!important}.fighter.hero{left:18%!important}.fighter.monster{right:18%!important}}
    #stage-prep,.battle-overlay{font-size:var(--battle-font-base)!important;border-radius:1.375em!important}
    #stage-prep{overflow:hidden!important}
    #stage-prep.is-open{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important}
    .prep-panel{padding:1.55em!important}
    .prep-title{font-size:2.28em!important;line-height:1.06!important;margin-bottom:.58em!important}
    .monster-card{gap:.62em!important}.stat-line{font-size:1.16em!important;line-height:1.15!important}
    .reward-box{margin-top:.65em!important;padding:.7em .82em!important;border-radius:.72em!important;font-size:.98em!important}
    .sprite-portrait{width:15.2em!important;border-radius:1.05em!important}
    .hero-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:.78em!important;margin:.9em 0!important}
    .hero-card{padding:.68em!important;border-radius:.82em!important;gap:.42em!important;font-size:1em!important;line-height:1.1!important}
    .hero-card .sprite-portrait{width:6.2em!important;border-radius:.8em!important}
    .start-button{padding:.72em 1.55em!important;border-radius:.72em!important;font-size:1.15em!important}
    .close-prep{right:.75em!important;top:.75em!important;width:2.8em!important;height:2.8em!important;border-radius:.82em!important;font-size:1.45em!important}
    .battle-title{left:.75em!important;top:.58em!important;font-size:2.3em!important}
    .battle-log{top:.72em!important;min-width:15em!important;padding:.58em 1.05em!important;font-size:.98em!important}
    .fighter{width:15.9em!important;bottom:8.1em!important}
    .hp-card{bottom:2.15em!important;width:19.2em!important;padding:.82em .94em!important;border-radius:1.05em!important;font-size:.95em!important}
    .hp-card.hero{left:1.85em!important}.hp-card.monster{right:1.85em!important}.hp-track{height:.76em!important}
    .slash{width:13.5em!important;height:5.9em!important;border-top-width:.58em!important}.spell-ring{width:9.4em!important;height:9.4em!important;border-width:.3em!important}
    .damage-pop{font-size:2.1em!important}.contact-flash{width:8.2em!important;height:8.2em!important}.foot-dust{width:8.8em!important;height:3.15em!important}
    .speed-line{width:14.1em!important;height:.3em!important}.fighter-ghost{width:15.9em!important}.projectile{width:14.7em!important;height:7.4em!important}.impact-sparks{width:7.1em!important;height:7.1em!important}
    .result-card{width:28em!important;max-width:86%!important;padding:1.65em!important;border-radius:1.5em!important}.result-card h2{font-size:2.05em!important}.result-card p,.result-card button{font-size:1em!important}
    @media (max-width:760px){#stage-prep.is-open{grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important}.hero-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.fighter.hero{left:18%!important}.fighter.monster{right:18%!important}}
  `;
  document.head.appendChild(style);
}

function atlasPosition(index){
  const col=index%4,row=Math.floor(index/4);
  return`${col*33.333333}% ${row*33.333333}%`;
}

function spriteNode(index,className="sprite-portrait"){
  const node=document.createElement("div");
  node.className=className;
  node.style.setProperty("--atlas",`url("${BATTLE_ATLAS}")`);
  node.style.setProperty("--pos",atlasPosition(index));
  const art=document.createElement("div");
  art.className="sprite-art";
  art.style.setProperty("--atlas",`url("${BATTLE_ATLAS}")`);
  art.style.setProperty("--pos",atlasPosition(index));
  node.appendChild(art);
  return node;
}

function actionPosition(characterIndex,frame){
  const groupRow=Math.floor(characterIndex/2);
  const groupCol=(characterIndex%2)*4+frame;
  return`${groupCol*(100/7)}% ${groupRow*(100/7)}%`;
}

function actionSpritePath(characterIndex,frame){
  return`${BATTLE_UNIT_DIR}/unit_${String(characterIndex).padStart(2,"0")}.png`;
}

function skillSpritePath(characterIndex){
  return`${BATTLE_SKILL_DIR}/skill_${String(characterIndex).padStart(2,"0")}.png`;
}

function actionSpriteNode(characterIndex,frame=0){
  const node=document.createElement("div");
  node.className="battle-sprite";
  node.dataset.characterIndex=String(characterIndex);
  const img=document.createElement("img");
  img.className="action-img";
  img.alt="";
  img.decoding="async";
  img.src=actionSpritePath(characterIndex,frame);
  node.appendChild(img);
  return node;
}

function setActionFrame(fighter,frame){
  const sprite=fighter.querySelector(".battle-sprite");
  const img=fighter.querySelector(".action-img");
  if(!sprite||!img)return;
  img.src=actionSpritePath(Number(sprite.dataset.characterIndex),0);
}

function setFighterState(fighter,frame,state){
  fighter.classList.remove("windup","attack","hit","recover","step-in","casting");
  setActionFrame(fighter,frame);
  if(state)fighter.classList.add(state);
}

function saveFarmState(farm){
  sessionStorage.setItem("farmVillageState",JSON.stringify(farm));
}

function progressState(){
  try{
    const saved=sessionStorage.getItem("battleProgressState");
    if(saved)return JSON.parse(saved);
  }catch(error){}
  const initial={initialized:true,clearedStages:[]};
  sessionStorage.setItem("battleProgressState",JSON.stringify(initial));
  return initial;
}

function saveProgress(progress){
  progress.initialized=true;
  progress.clearedStages=[...new Set(progress.clearedStages||[])];
  sessionStorage.setItem("battleProgressState",JSON.stringify(progress));
}

function isCleared(stageId){
  return (progressState().clearedStages||[]).includes(stageId);
}

function markCleared(stageId){
  const progress=progressState();
  if(!(progress.clearedStages||[]).includes(stageId)){
    progress.clearedStages=[...(progress.clearedStages||[]),stageId];
    saveProgress(progress);
  }
}

function stageNumber(stage){
  return Number((stage.label||"").split("-")[1]||1);
}

function stageUnlocked(stage){
  const number=stageNumber(stage);
  if(number<=1)return true;
  const prefix=(stage.label||"").split("-")[0];
  for(let i=1;i<number;i++){
    if(!isCleared(`${prefix}-${i}`))return false;
  }
  return true;
}

function portalUnlocked(portal){
  return !portal.requiresStage||isCleared(portal.requiresStage);
}

function saveWorldState(portal){
  const farm=savedFarmState();
  farm.battleWorld={mapId:config.mapId,portalId:portal.id};
  saveFarmState(farm);
  sessionStorage.setItem("battleWorldState",JSON.stringify({mapId:config.mapId,portalId:portal.id}));
}

function portalDestination(portal){
  if(!portal)return null;
  if(Array.isArray(portal.destinations))return portal.destinations[0]||null;
  return portal.destination||null;
}

function navigationTarget(mapId){
  if(mapId==="farm_village")return"farm_village.html";
  if(mapId==="map2")return"battle_map_2.html";
  if(mapId==="map1")return"battle_map_1.html";
  return mapId+".html";
}

function navigate(portal){
  if(!portalUnlocked(portal)||battleRunning)return;
  const destination=portalDestination(portal);
  if(!destination)return;
  saveWorldState(portal);
  const langQuery=battleLang==="en"?"&lang=en":"";
  if(destination.mapId==="farm_village"){
    sessionStorage.setItem("farmSpawnPortal",destination.portalId);
    location.href=navigationTarget(destination.mapId);
    return;
  }
  sessionStorage.setItem("battleSpawnPortal",destination.portalId);
  location.href=navigationTarget(destination.mapId)+"?spawn="+encodeURIComponent(destination.portalId)+langQuery;
}

function normalizedMapPointToScreen(point){
  return{
    x:mapTransform.originX+point.x*mapTransform.size,
    y:mapTransform.originY+(1-point.y)*mapTransform.size
  };
}

function normalizedMapRectToScreen(bounds){
  const topLeft=normalizedMapPointToScreen({x:bounds.minX,y:bounds.maxY});
  const bottomRight=normalizedMapPointToScreen({x:bounds.maxX,y:bounds.minY});
  return{
    left:topLeft.x,
    top:topLeft.y,
    width:bottomRight.x-topLeft.x,
    height:bottomRight.y-topLeft.y
  };
}

function applyBattleUiRect(){
  const rect=normalizedMapRectToScreen(BATTLE_UI_BOUNDS);
  const scale=Math.max(.34,Math.min(1,rect.height/600));
  const root=document.documentElement.style;
  root.setProperty("--battle-ui-left",rect.left+"px");
  root.setProperty("--battle-ui-top",rect.top+"px");
  root.setProperty("--battle-ui-width",rect.width+"px");
  root.setProperty("--battle-ui-height",rect.height+"px");
  root.setProperty("--battle-ui-scale",String(scale));
  root.setProperty("--battle-font-base",(16*scale)+"px");
}

function calculateMapTransform(){
  const visibleBounds=config.requiredVisibleBounds||{minX:0,maxX:1,minY:0,maxY:1};
  const horizontalSpan=visibleBounds.maxX-visibleBounds.minX;
  const verticalSpan=visibleBounds.maxY-visibleBounds.minY;
  const size=Math.min(innerWidth/horizontalSpan,innerHeight/verticalSpan);
  const originX=(innerWidth-(visibleBounds.minX+visibleBounds.maxX)*size)/2;
  const originY=(innerHeight-((1-visibleBounds.maxY)+(1-visibleBounds.minY))*size)/2;
  return{originX,originY,size};
}

function selectableDistance(node,event){
  const rect=node.getBoundingClientRect();
  return Math.hypot(event.clientX-(rect.left+rect.width/2),event.clientY-(rect.top+rect.height/2));
}

function updateHoverState(event){
  selectableNodes.forEach(node=>{
    const radius=Number(node.dataset.hoverRadius);
    node.classList.toggle("is-hovered",!node.disabled&&selectableDistance(node,event)<=radius);
  });
}

function clearHoverState(){
  selectableNodes.forEach(node=>node.classList.remove("is-hovered"));
}

function iconSize(kind){
  const baseSize=kind==="portal" ? .075 : .06;
  const minimum=kind==="portal"?58:46;
  const maximum=kind==="portal"?118:90;
  return Math.max(minimum,Math.min(maximum,mapTransform.size*baseSize));
}

function placeSelectable(node,coordinates,kind){
  const position=normalizedMapPointToScreen(coordinates);
  const size=iconSize(kind);
  const interactionSize=size*1.44;
  node.style.left=position.x+"px";
  node.style.top=position.y+"px";
  node.style.width=interactionSize+"px";
  node.style.height=interactionSize+"px";
  node.style.setProperty("--icon-size",size+"px");
  node.style.setProperty("--label-offset",size*.48+"px");
  node.dataset.hoverRadius=String(interactionSize/2);
}

function refreshLocks(){
  anchoredObjects.forEach(object=>{
    if(object.stage){
      const locked=!stageUnlocked(object.stage);
      object.node.disabled=locked;
      object.node.classList.toggle("is-locked",locked);
      object.node.setAttribute("aria-disabled",String(locked));
    }
    if(object.portal){
      const locked=!portalUnlocked(object.portal);
      object.node.disabled=locked;
      object.node.classList.toggle("is-locked",locked);
      object.node.setAttribute("aria-disabled",String(locked));
    }
  });
}

function createStage(stage){
  const node=document.createElement("button");
  const label=document.createElement("div");
  const icon=document.createElement("img");
  node.type="button";
  node.className="map-selectable stage-node";
  node.setAttribute("aria-label",stage.label);
  label.className="stage-label";
  label.textContent=stage.label;
  icon.src=config.stageIcon;
  icon.alt="";
  node.append(label,icon);
  node.addEventListener("click",()=>{
    if(mapTutorial.active&&currentMapTutorialStep()?.id==="clickStage"&&stage.label!=="1-1")return;
    openStagePrep(stage);
  });
  objectLayer.appendChild(node);
  selectableNodes.push(node);
  return{node,coordinates:stage.coordinates,kind:"stage",stage};
}

function createPortal(portal){
  const node=document.createElement("button");
  const icon=document.createElement("img");
  node.type="button";
  node.className="map-selectable portal-node";
  node.setAttribute("aria-label",portal.label);
  icon.src=config.portalIcon;
  icon.alt="";
  node.appendChild(icon);
  node.addEventListener("click",()=>navigate(portal));
  objectLayer.appendChild(node);
  selectableNodes.push(node);
  return{node,coordinates:portal.coordinates,kind:"portal",portal};
}

function currentMapTutorialStep(){
  return MAP_TUTORIAL_STEPS[mapTutorial.stepIndex]||null;
}

function mapTutorialTarget(){
  const step=currentMapTutorialStep();
  if(!step)return null;
  if(step.id==="clickStage"){
    const object=anchoredObjects.find(item=>item.stage&&item.stage.label==="1-1");
    return object&&object.node;
  }
  if(step.id==="selectHero")return document.getElementById("prep-hero-grid");
  if(step.id==="startBattle")return document.querySelector("#stage-prep .start-button");
  return null;
}

function ensureMapTutorial(){
  if(mapTutorial.root)return mapTutorial.root;
  const root=document.createElement("div");
  root.className="map-tutorial-root is-hidden";
  root.innerHTML=`
    <div class="map-tutorial-focus"></div>
    <section class="map-tutorial-card" aria-live="polite">
      <button class="map-tutorial-skip" type="button">${bt("건너뛰기","Skip")}</button>
      <div class="map-tutorial-step"></div>
      <div class="map-tutorial-title"></div>
      <div class="map-tutorial-body"></div>
      <div class="map-tutorial-goal"></div>
    </section>`;
  document.body.appendChild(root);
  mapTutorial.root=root;
  mapTutorial.focus=root.querySelector(".map-tutorial-focus");
  mapTutorial.card=root.querySelector(".map-tutorial-card");
  root.querySelector(".map-tutorial-skip").addEventListener("click",completeMapTutorial);
  return root;
}

function refreshMapTutorial(){
  if(!mapTutorial.active)return;
  const step=currentMapTutorialStep();
  const target=mapTutorialTarget();
  if(!step||!target)return;
  const root=ensureMapTutorial();
  const rect=target.getBoundingClientRect();
  const tutorialScale=Math.max(.58,Math.min(1,Math.min(innerWidth/920,innerHeight/620)));
  const sideGap=18*tutorialScale;
  const pad=(step.id==="clickStage"?12:8)*tutorialScale;
  root.classList.remove("is-hidden");
  root.style.setProperty("--tutorial-color",step.color);
  root.style.setProperty("--map-tutorial-scale",String(tutorialScale));
  Object.assign(mapTutorial.focus.style,{
    left:Math.max(8,rect.left-pad)+"px",
    top:Math.max(8,rect.top-pad)+"px",
    width:Math.min(innerWidth-16,rect.width+pad*2)+"px",
    height:Math.min(innerHeight-16,rect.height+pad*2)+"px"
  });
  const cardWidth=Math.min(370*tutorialScale,innerWidth-sideGap*2);
  const targetCenter=rect.left+rect.width/2;
  const cardLeft=targetCenter<innerWidth/2?innerWidth-cardWidth-sideGap:sideGap;
  mapTutorial.card.style.left=Math.max(sideGap,cardLeft)+"px";
  mapTutorial.card.querySelector(".map-tutorial-step").textContent=bt(`현재 단계 ${mapTutorial.stepIndex+1}/${MAP_TUTORIAL_STEPS.length}`,`Step ${mapTutorial.stepIndex+1}/${MAP_TUTORIAL_STEPS.length}`);
  mapTutorial.card.querySelector(".map-tutorial-title").textContent=step.title;
  mapTutorial.card.querySelector(".map-tutorial-body").textContent=step.body;
  mapTutorial.card.querySelector(".map-tutorial-goal").textContent=bt(`완료 조건: ${step.goal}`,`Goal: ${step.goal}`);
}

function hideMapTutorial(){
  if(mapTutorial.root)mapTutorial.root.classList.add("is-hidden");
}

function completeMapTutorial(){
  mapTutorial.active=false;
  setTutorialDone();
  hideMapTutorial();
}

function advanceMapTutorial(stepId){
  if(!mapTutorial.active)return;
  const step=currentMapTutorialStep();
  if(!step||step.id!==stepId)return;
  if(mapTutorial.stepIndex>=MAP_TUTORIAL_STEPS.length-1){
    completeMapTutorial();
    return;
  }
  mapTutorial.stepIndex++;
  setTimeout(refreshMapTutorial,0);
}

function farmHeroes(){
  const farm=savedFarmState();
  const savedHeroes=Array.isArray(farm.heroes)?farm.heroes:[];
  const sourceHeroes=battleLang==="en"?EN_DEFAULT_HEROES:DEFAULT_HEROES;
  return sourceHeroes.map(hero=>{
    const saved=savedHeroes.find(item=>item.element===hero.id||item.id===hero.id);
    const level=saved&&saved.level?saved.level:hero.level;
    return{...hero,level,attack:10+level*2,health:50+level*10};
  });
}

function ensurePrepElement(){
  let prep=document.getElementById("stage-prep");
  if(prep)return prep;
  prep=document.createElement("section");
  prep.id="stage-prep";
  prep.innerHTML=`
    <button class="close-prep" type="button" aria-label="준비 화면 닫기">X</button>
    <div class="prep-panel prep-left">
      <div class="prep-title" id="prep-stage-title"></div>
      <div class="monster-card">
        <div id="prep-monster-sprite"></div>
        <div class="stat-line" id="prep-monster-name"></div>
        <div class="stat-line" id="prep-monster-element"></div>
        <div class="stat-line" id="prep-monster-attack"></div>
        <div class="stat-line" id="prep-monster-health"></div>
        <div class="reward-box" id="prep-reward"></div>
      </div>
    </div>
    <div class="prep-panel">
      <div class="prep-title">출전 영웅 선택</div>
      <div class="hero-grid" id="prep-hero-grid"></div>
      <div class="prep-actions">
        <button class="start-button" type="button" disabled>전투 시작</button>
        <div class="prep-message" id="prep-message"></div>
      </div>
    </div>`;
  document.body.appendChild(prep);
  if(battleLang==="en"){
    prep.querySelector(".close-prep").setAttribute("aria-label","Close");
    prep.querySelectorAll(".prep-title")[1].textContent="Choose Hero";
    prep.querySelector(".start-button").textContent="Start Battle";
  }
  const closeButton=prep.querySelector(".close-prep");
  closeButton.addEventListener("pointerdown",event=>{event.preventDefault();event.stopPropagation();closeStagePrep();});
  closeButton.addEventListener("click",event=>{event.preventDefault();event.stopPropagation();closeStagePrep();});
  prep.querySelector(".start-button").addEventListener("click",startStageBattle);
  return prep;
}

function renderHeroes(prep){
  const grid=prep.querySelector("#prep-hero-grid");
  grid.innerHTML="";
  farmHeroes().forEach(hero=>{
    const card=document.createElement("button");
    card.type="button";
    card.className="hero-card";
    card.dataset.heroId=hero.id;
    card.appendChild(spriteNode(hero.sprite));
    card.insertAdjacentHTML("beforeend",`
      <strong>${hero.label}</strong>
      <span>속성 ${hero.element}</span>
      <span>체력 ${hero.health}</span>
      <span>공격력 ${hero.attack}</span>`);
    if(battleLang==="en"){
      card.innerHTML="";
      card.appendChild(spriteNode(hero.sprite));
      card.insertAdjacentHTML("beforeend",`
        <strong>${hero.label}</strong>
        <span>Element ${hero.element}</span>
        <span>HP ${hero.health}</span>
        <span>Attack ${hero.attack}</span>`);
    }
    card.addEventListener("mouseenter",()=>card.classList.add("is-hovered"));
    card.addEventListener("mouseleave",()=>card.classList.remove("is-hovered"));
    card.addEventListener("click",()=>{
      selectedHeroId=hero.id;
      grid.querySelectorAll(".hero-card").forEach(node=>node.classList.toggle("is-selected",node.dataset.heroId===hero.id));
      prep.querySelector(".start-button").disabled=false;
      advanceMapTutorial("selectHero");
      prep.querySelector("#prep-message").textContent=battleLang==="en"?`${hero.label} selected`:`${hero.label} 선택`;
    });
    grid.appendChild(card);
  });
}

function openStagePrep(stage){
  if(!stageUnlocked(stage)||battleRunning)return;
  currentStage=stage;
  selectedHeroId=null;
  const data=(battleLang==="en"?EN_STAGE_DATA:STAGE_DATA)[stage.id];
  const prep=ensurePrepElement();
  const slot=prep.querySelector("#prep-monster-sprite");
  slot.innerHTML="";
  slot.appendChild(spriteNode(data.monster.sprite));
  prep.querySelector("#prep-stage-title").textContent=`스테이지 ${stage.label}`;
  prep.querySelector("#prep-monster-name").textContent=`몬스터 ${data.monster.name}`;
  prep.querySelector("#prep-monster-element").textContent=`속성 ${data.monster.element}`;
  prep.querySelector("#prep-monster-attack").textContent=`공격력 ${data.monster.attack}`;
  prep.querySelector("#prep-monster-health").textContent=`체력 ${data.monster.health}`;
  prep.querySelector("#prep-reward").textContent=`승리 보상: 골드 ${data.reward.gold} · 경험치 ${data.reward.experience}`;
  prep.querySelector(".start-button").disabled=true;
  prep.querySelector("#prep-message").textContent="";
  if(battleLang==="en"){
    prep.querySelector("#prep-stage-title").textContent=`Stage ${stage.label}`;
    prep.querySelector("#prep-monster-name").textContent=`Monster: ${data.monster.name}`;
    prep.querySelector("#prep-monster-element").textContent=`Element ${data.monster.element}`;
    prep.querySelector("#prep-monster-attack").textContent=`Attack ${data.monster.attack}`;
    prep.querySelector("#prep-monster-health").textContent=`HP ${data.monster.health}`;
    prep.querySelector("#prep-reward").textContent=`Victory Reward: Gold ${data.reward.gold} · EXP ${data.reward.experience}`;
  }
  renderHeroes(prep);
  prep.classList.add("is-open");
  if(stage.label==="1-1")advanceMapTutorial("clickStage");
  else refreshMapTutorial();
}

function closeStagePrep(){
  if(battleRunning)return;
  const prep=document.getElementById("stage-prep");
  if(prep)prep.classList.remove("is-open");
  currentStage=null;
  selectedHeroId=null;
  if(mapTutorial.active&&mapTutorial.stepIndex>0){
    mapTutorial.stepIndex=0;
    setTimeout(refreshMapTutorial,0);
  }
}

function createHpCard(kind,name,hp,maxHp){
  const node=document.createElement("div");
  node.className=`hp-card ${kind}`;
  node.innerHTML=`
    <div class="hp-name"><span>${name}</span><span class="hp-value">${hp}/${maxHp}</span></div>
    <div class="hp-track"><div class="hp-fill"></div></div>`;
  return node;
}

function updateHp(card,hp,maxHp){
  card.querySelector(".hp-value").textContent=`${Math.max(0,hp)}/${maxHp}`;
  card.querySelector(".hp-fill").style.width=`${Math.max(0,Math.min(1,hp/maxHp))*100}%`;
}

function burst(parent,type,x,y,text){
  const node=document.createElement("div");
  node.className=type;
  node.style.left=x+"%";
  node.style.top=y+"%";
  if(text)node.textContent=text;
  parent.appendChild(node);
  setTimeout(()=>node.remove(),900);
}

function effectAt(parent,type,x,y,options={}){
  const node=document.createElement("div");
  node.className=type;
  node.style.left=x+"px";
  node.style.top=y+"px";
  if(options.text)node.textContent=options.text;
  for(const [key,value] of Object.entries(options.vars||{}))node.style.setProperty(key,value);
  parent.appendChild(node);
  setTimeout(()=>node.remove(),options.life||900);
  return node;
}

function fighterCenterInArena(arena,fighter){
  const a=arena.getBoundingClientRect(),r=fighter.getBoundingClientRect();
  return{x:r.left-a.left+r.width/2,y:r.top-a.top+r.height/2,w:r.width,h:r.height};
}

function fighterPointInArena(arena,fighter,dir){
  const p=fighterCenterInArena(arena,fighter);
  return{x:p.x+dir*p.w*.28,y:p.y-p.h*.03,w:p.w,h:p.h};
}

function ghostFighter(arena,fighter,dir){
  const img=fighter.querySelector(".action-img");
  if(!img)return;
  const p=fighterCenterInArena(arena,fighter);
  const ghost=document.createElement("img");
  ghost.className=`fighter-ghost ${fighter.classList.contains("monster")?"monster":""}`;
  ghost.src=img.src;
  ghost.alt="";
  ghost.style.left=(p.x-p.w/2)+"px";
  ghost.style.top=(p.y-p.h/2)+"px";
  ghost.style.setProperty("--gx",(dir*34)+"px");
  ghost.style.setProperty("--gy","-14px");
  arena.appendChild(ghost);
  setTimeout(()=>ghost.remove(),520);
}

function projectile(arena,fromFighter,toFighter,color,dir){
  const from=fighterPointInArena(arena,fromFighter,dir),to=fighterPointInArena(arena,toFighter,-dir);
  const node=document.createElement("div");
  node.className="projectile";
  node.style.left=(from.x-125)+"px";
  node.style.top=(from.y-63)+"px";
  node.style.setProperty("--pc",color);
  node.style.setProperty("--sx","0px");
  node.style.setProperty("--sy","0px");
  node.style.setProperty("--tx",(to.x-from.x)+"px");
  node.style.setProperty("--ty",(to.y-from.y)+"px");
  node.style.setProperty("--rot",`${Math.atan2(to.y-from.y,to.x-from.x)}rad`);
  node.style.setProperty("--flip",dir<0?"-1":"1");
  const sprite=fromFighter.querySelector(".battle-sprite");
  const img=document.createElement("img");
  img.alt="";
  img.decoding="async";
  img.src=skillSpritePath(Number(sprite?.dataset.characterIndex||0));
  node.appendChild(img);
  arena.appendChild(node);
  setTimeout(()=>node.remove(),820);
}

function impactPoint(arena,targetFighter,dir){
  return fighterPointInArena(arena,targetFighter,-dir);
}

function impactSparks(arena,targetFighter,color,dir=1){
  const p=impactPoint(arena,targetFighter,dir);
  const node=document.createElement("div");
  node.className="impact-sparks";
  node.style.left=p.x+"px";
  node.style.top=(p.y-8)+"px";
  node.style.setProperty("--sc",color);
  for(let i=0;i<8;i++){
    const ray=document.createElement("i");
    ray.style.setProperty("--r",`${i*45}deg`);
    node.appendChild(ray);
  }
  arena.appendChild(node);
  setTimeout(()=>node.remove(),650);
}

function footDust(arena,fighter,dir){
  const p=fighterCenterInArena(arena,fighter);
  effectAt(arena,"foot-dust",p.x-dir*p.w*.18,p.y+p.h*.32,{life:560,vars:{"--dx":`${-dir*30}px`}});
}

function contactFlash(arena,targetFighter,color,dir){
  const p=impactPoint(arena,targetFighter,dir);
  effectAt(arena,"contact-flash",p.x,p.y,{life:420,vars:{"--fc":color}});
}

function speedLines(arena,fromFighter,toFighter,color,dir){
  const from=fighterPointInArena(arena,fromFighter,dir),to=fighterPointInArena(arena,toFighter,-dir);
  const rot=Math.atan2(to.y-from.y,to.x-from.x);
  for(let i=0;i<4;i++){
    const t=.22+i*.14;
    effectAt(arena,"speed-line",from.x+(to.x-from.x)*t,from.y+(to.y-from.y)*t+(i-1.5)*18,{
      life:440,
      vars:{"--lc":color,"--rot":`${rot}rad`,"--dx":`${dir*(90+i*18)}px`,"--dy":`${(i-1.5)*4}px`}
    });
  }
}

function delay(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

function elementColor(element){
  const normalized=normalizeElement(element);
  if(normalized==="Water")return"#60a5fa";
  if(normalized==="Grass")return"#84cc16";
  return"#fb923c";
}

function normalizeElement(element){
  if(element==="Fire"||element==="불")return"Fire";
  if(element==="Water"||element==="물")return"Water";
  if(element==="Grass"||element==="풀")return"Grass";
  return element;
}

function isWaterElement(element){
  return normalizeElement(element)==="Water";
}

function damageMultiplier(attackerElement,defenderElement){
  const attacker=normalizeElement(attackerElement);
  const defender=normalizeElement(defenderElement);
  if(attacker===defender)return 1;
  if((attacker==="Fire"&&defender==="Grass")||(attacker==="Water"&&defender==="Fire")||(attacker==="Grass"&&defender==="Water"))return 2;
  return .5;
}

function calculateBattleDamage(attack,attackerElement,defenderElement){
  return Math.max(1,Math.round(attack*damageMultiplier(attackerElement,defenderElement)));
}

async function animateStrike({arena,overlay,attacker,defender,element,dir,burstType}){
  const color=elementColor(element);
  arena.classList.add("combat-focus");
  arena.style.setProperty("--pan-x",`${dir*-16}px`);
  attacker.style.setProperty("--focus-color",color);
  setFighterState(attacker,1,"windup");
  if(isWaterElement(element))attacker.classList.add("casting");
  await delay(230);
  setFighterState(attacker,2,"attack");
  attacker.classList.add("step-in","focus");
  if(isWaterElement(element))attacker.classList.add("casting");
  await delay(150);
  ghostFighter(arena,attacker,dir);
  footDust(arena,attacker,dir);
  speedLines(arena,attacker,defender,color,dir);
  projectile(arena,attacker,defender,color,dir);
  const hit=impactPoint(arena,defender,dir);
  if(burstType==="spell-ring")effectAt(arena,"spell-ring",hit.x,hit.y,{life:720});
  else effectAt(arena,"slash",hit.x,hit.y,{life:620,vars:{"--dir":String(dir)}});
  await delay(320);
  contactFlash(arena,defender,color,dir);
  overlay.classList.add("clash","shake");
  await delay(90);
}

function finishStrike(overlay,attacker,defender){
  setFighterState(attacker,0,"recover");
  setFighterState(defender,0,"recover");
  attacker.classList.remove("focus");
  attacker.closest(".battle-arena")?.classList.remove("combat-focus");
  overlay.classList.remove("shake","clash");
}

async function playBattle(hero,stage,data){
  battleRunning=true;
  const prep=ensurePrepElement();
  prep.classList.remove("is-open");
  const overlay=document.createElement("section");
  overlay.className="battle-overlay";
  overlay.innerHTML=`
    <div class="battle-arena" style="--battle-bg:url('${data.background}')">
      <div class="arena-bg"></div>
      <div class="battle-title">${data.stageId} ${bt("전투","Battle")}</div>
      <div class="battle-log">${bt("전투 개시","Battle Start")}</div>
      <div class="fighter hero"></div>
      <div class="fighter monster"></div>
    </div>`;
  document.body.appendChild(overlay);
  const arena=overlay.querySelector(".battle-arena");
  const log=overlay.querySelector(".battle-log");
  const heroNode=overlay.querySelector(".fighter.hero");
  const monsterNode=overlay.querySelector(".fighter.monster");
  heroNode.appendChild(actionSpriteNode(hero.action,0));
  monsterNode.appendChild(actionSpriteNode(data.monster.action,0));
  const heroMax=hero.health;
  const monsterMax=data.monster.health;
  let heroHp=heroMax;
  let monsterHp=monsterMax;
  const heroHpCard=createHpCard("hero",hero.label,heroHp,heroMax);
  const monsterHpCard=createHpCard("monster",data.monster.name,monsterHp,monsterMax);
  arena.append(heroHpCard,monsterHpCard);
  await delay(650);

  while(monsterHp>0&&heroHp>0){
    log.textContent=`${hero.label} · ${hero.skill}`;
    await animateStrike({arena,overlay,attacker:heroNode,defender:monsterNode,element:hero.element,dir:1,burstType:isWaterElement(hero.element)?"spell-ring":"slash"});
    const heroDamage=calculateBattleDamage(hero.attack,hero.element,data.monster.element);
    monsterHp-=heroDamage;
    updateHp(monsterHpCard,monsterHp,monsterMax);
    monsterNode.style.setProperty("--hit-x","18px");
    setFighterState(monsterNode,3,"hit");
    impactSparks(arena,monsterNode,elementColor(hero.element),1);
    const heroHit=impactPoint(arena,monsterNode,1);
    effectAt(arena,"damage-pop",heroHit.x+24,heroHit.y-62,{text:`-${heroDamage}`,life:900});
    await delay(430);
    finishStrike(overlay,heroNode,monsterNode);
    if(monsterHp<=0)break;

    log.textContent=`${data.monster.name} · ${data.monster.skill}`;
    await animateStrike({arena,overlay,attacker:monsterNode,defender:heroNode,element:data.monster.element,dir:-1,burstType:isWaterElement(data.monster.element)?"spell-ring":"slash"});
    const monsterDamage=calculateBattleDamage(data.monster.attack,data.monster.element,hero.element);
    heroHp-=monsterDamage;
    updateHp(heroHpCard,heroHp,heroMax);
    heroNode.style.setProperty("--hit-x","-18px");
    setFighterState(heroNode,3,"hit");
    impactSparks(arena,heroNode,elementColor(data.monster.element),-1);
    const monsterHit=impactPoint(arena,heroNode,-1);
    effectAt(arena,"damage-pop",monsterHit.x-24,monsterHit.y-62,{text:`-${monsterDamage}`,life:900});
    await delay(430);
    finishStrike(overlay,monsterNode,heroNode);
  }

  const heroWon=monsterHp<=0&&heroHp>0;
  if(heroWon){
    monsterHp=0;
    updateHp(monsterHpCard,monsterHp,monsterMax);
    log.textContent=bt("승리!","Victory!");
    markStageReward(data);
  }else{
    updateHp(heroHpCard,heroHp,heroMax);
    log.textContent=bt("패배...","Defeat...");
  }
  const result=document.createElement("div");
  result.className="result-card";
  result.innerHTML=heroWon?`
    <h2>전투 승리</h2>
    <p>${data.stageId} · ${data.monster.name} 격파</p>
    <p>골드 +${data.reward.gold} · 경험치 +${data.reward.experience}</p>
    <button type="button">맵으로 돌아가기</button>`:`
    <h2>전투 패배</h2>
    <p>${hero.label}의 체력이 바닥났습니다.</p>
    <p>스테이지는 열리지 않습니다. 훈련소에서 성장 후 다시 도전하세요.</p>
    <button type="button">맵으로 돌아가기</button>`;
  arena.appendChild(result);
  if(battleLang==="en"){
    result.innerHTML=heroWon?`
    <h2>Battle Victory</h2>
    <p>${data.stageId} · ${data.monster.name} defeated</p>
    <p>Gold +${data.reward.gold} · EXP +${data.reward.experience}</p>
    <button type="button">Return to Map</button>`:`
    <h2>Battle Defeat</h2>
    <p>${hero.label}'s HP reached 0.</p>
    <p>The stage was not cleared. Train your heroes and try again.</p>
    <button type="button">Return to Map</button>`;
  }
  result.querySelector("button").addEventListener("click",()=>{
    overlay.remove();
    battleRunning=false;
    currentStage=null;
    selectedHeroId=null;
    refreshLocks();
  });
}

function markStageReward(data){
  markCleared(data.stageId);
  const farm=savedFarmState();
  farm.gold=(farm.gold||0)+data.reward.gold;
  farm.exp=(farm.exp||0)+data.reward.experience;
  farm.clearedStages=[...new Set([...(farm.clearedStages||[]),data.stageId])];
  if(data.stageId==="1-5")farm.stage15Cleared=true;
  saveFarmState(farm);
}

function startStageBattle(){
  if(!currentStage||!selectedHeroId||battleRunning)return;
  const data=(battleLang==="en"?EN_STAGE_DATA:STAGE_DATA)[currentStage.id];
  const hero=farmHeroes().find(item=>item.id===selectedHeroId);
  if(!hero||!data)return;
  advanceMapTutorial("startBattle");
  playBattle(hero,currentStage,data);
}

const anchoredObjects=[
  ...(config.stages||[]).map(createStage),
  ...(config.portals||[]).map(createPortal)
];

function resizeScene(){
  mapTransform=calculateMapTransform();
  scene.style.setProperty("--map-left",mapTransform.originX+"px");
  scene.style.setProperty("--map-top",mapTransform.originY+"px");
  scene.style.setProperty("--map-size",mapTransform.size+"px");
  applyBattleUiRect();
  anchoredObjects.forEach(object=>placeSelectable(object.node,object.coordinates,object.kind));
  refreshLocks();
  refreshMapTutorial();
}

progressState();
for(let character=0;character<13;character++){
  const unitImg=new Image();
  unitImg.src=actionSpritePath(character,0);
  const skillImg=new Image();
  skillImg.src=skillSpritePath(character);
}
background.src=config.background;
background.alt=config.title||"";
addEventListener("resize",resizeScene);
addEventListener("mousemove",updateHoverState);
addEventListener("mouseleave",clearHoverState);
resizeScene();

function maybeAutoBattle(){
  const params=new URLSearchParams(location.search);
  if(params.get("autobattle")!=="1")return;
  const stageId=params.get("stage")||"stage_1_1";
  const heroId=params.get("hero")||"grass";
  const stage=(config.stages||[]).find(item=>item.id===stageId)||(config.stages||[])[0];
  if(!stage)return;
  currentStage=stage;
  selectedHeroId=heroId;
  setTimeout(startStageBattle,350);
}

maybeAutoBattle();
