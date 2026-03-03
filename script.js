/* ============================================================
   DOÑA MARIA — script.js  (versão atualizada)
   ============================================================ */

const SUPA_URL = 'https://frdtjwhomeojosqygyow.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZHRqd2hvbWVvam9zcXlneW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTY5MDgsImV4cCI6MjA4Nzk5MjkwOH0.viBjPZ1JH0ezDzoJo5Bb97pynZeXtfdpPSq9zfIykh8';
const supa = supabase.createClient(SUPA_URL, SUPA_KEY);

const NUTRI_DB = {
  bovina: [
    { n:'Carboidratos', q:'45g', v:'15%' }, { n:'Proteínas', q:'35g', v:'70%' },
    { n:'Gorduras', q:'18g', v:'28%' }, { n:'Sódio', q:'650mg', v:'27%' },
  ],
  frango: [
    { n:'Carboidratos', q:'40g', v:'13%' }, { n:'Proteínas', q:'38g', v:'76%' },
    { n:'Gorduras', q:'10g', v:'15%' }, { n:'Sódio', q:'580mg', v:'24%' },
  ],
  suino: [
    { n:'Carboidratos', q:'42g', v:'14%' }, { n:'Proteínas', q:'36g', v:'72%' },
    { n:'Gorduras', q:'15g', v:'22%' }, { n:'Sódio', q:'600mg', v:'25%' },
  ],
  kids: [
    { n:'Carboidratos', q:'30g', v:'10%' }, { n:'Proteínas', q:'20g', v:'40%' },
    { n:'Gorduras', q:'8g', v:'12%' }, { n:'Sódio', q:'300mg', v:'12%' },
  ],
};

const PRECOS_LINHA = { Tradicional: 30000, Gourmet: 35000, Fit: 35000, Kids: 28000 };
const GRAM_RULES = {
  'Proteína':            { base: 130, extra: 500 },
  'Arroz Branco':        { base: 80,  extra: 150 },
  'Feijão Preto':        { base: 90,  extra: 200 },
  'Purê de Batata':      { base: 120, extra: 200 },
  'Purê de Batata Doce': { base: 120, extra: 200 },
  'Purê de Abóbora':     { base: 120, extra: 200 },
  'Macarrão':            { base: 120, extra: 200 },
  'Seleta':              { base: 80,  extra: 250 },
};
function calcularTaxaGrama(tipo, gramas) {
  const rule = GRAM_RULES[tipo];
  if (!rule || !gramas || gramas <= rule.base) return 0;
  return Math.ceil((gramas - rule.base) / 10) * rule.extra;
}

const CONFIG_PLANOS = {
  Individual:    { min:1,  max:13,   exato:false, linhaLock:false, permiteMix:true  },
  Semanal:       { min:14, max:14,   exato:true,  linhaLock:true,  permiteMix:false },
  FDS:           { min:10, max:10,   exato:true,  linhaLock:true,  permiteMix:false },
  Mensal:        { min:14, max:14,   exato:true,  linhaLock:true,  permiteMix:false },
  Personalizado: { min:1,  max:null, exato:false, linhaLock:false, permiteMix:true  },
};

let CARDAPIO = {};
let itensPedido = [];
let linhaLocked = null;
let pagamentoSel = '';
let freteValor = 0;
let freteLabel = '—';
let linkMaps = '';
let pratoPendente = null;
let pratoPendenteTemp = null; // prato clicado antes de escolher plano
let quereSeleta = true;
let modoPersonalizado = false;

const ORIGEM = { lat: -25.240629, lon: -57.541956 };

/* ── INIT ────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  initNav(); initScroll(); initTyped();
  carregarDadosSalvos();
  await carregarCardapio();
  atualizarCarrinho();

  document.getElementById("modal-prato")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) fecharModalPrato();
  });
  document.getElementById("modal-carrinho")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) fecharCarrinho();
  });
  document.getElementById("cliente-nome")?.addEventListener("input", verificarBotao);
  document.getElementById("cliente-tel")?.addEventListener("input", verificarBotao);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") { fecharModalPrato(); fecharCarrinho(); }
});

/* ── NAV ─────────────────────────────────────────────────────── */
function initNav() {
  const toggle=document.getElementById("nav-toggle"), menu=document.getElementById("nav-menu"), overlay=document.getElementById("nav-overlay");
  toggle?.addEventListener("click", () => {
    const open=menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    if (overlay) overlay.hidden=!open;
    document.body.style.overflow=open?"hidden":"";
  });
  overlay?.addEventListener("click", fecharNavMobile);
  menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", fecharNavMobile));
}
function fecharNavMobile() {
  const menu=document.getElementById("nav-menu"), toggle=document.getElementById("nav-toggle"), overlay=document.getElementById("nav-overlay");
  menu?.classList.remove("open"); toggle?.setAttribute("aria-expanded","false");
  if (overlay) overlay.hidden=true; document.body.style.overflow="";
}
function initScroll() {
  const navbar=document.getElementById("navbar"), st=document.getElementById("scroll-top");
  window.addEventListener("scroll",()=>{
    const y=window.scrollY;
    navbar?.classList.toggle("scrolled",y>40);
    if(st) st.classList.toggle("visible",y>400);
  },{passive:true});
}
function initTyped() {
  if(typeof Typed==="undefined") return;
  const el=document.querySelector(".typing-text");
  if(el) new Typed(".typing-text",{strings:["Prácticas", "Deliciosas", "Saludables", "Equilibradas"],typeSpeed:90,backSpeed:55,loop:true});
}

/* ── CARDÁPIO ────────────────────────────────────────────────── */
async function carregarCardapio() {
  try {
    const {data,error}=await supa.from("cardapio").select("*").eq("ativo",true).order("ordem",{ascending:true});
    if(error) throw error;
    CARDAPIO={};
    data.forEach(p=>{ if(!CARDAPIO[p.linha]) CARDAPIO[p.linha]=[]; CARDAPIO[p.linha].push(p); });
    renderizarGrids();
  } catch(e) {
    console.warn("Usando dados locais.",e);
    CARDAPIO=CARDAPIO_LOCAL; renderizarGrids();
  }
}

const CARDAPIO_LOCAL = {
  Tradicional: [
    {id:"t1",nome:"Carne Moída Refogada",linha:"Tradicional",img_url:"img/carne-moída.webp",ingredientes:"Carne moída, alho, cebola, tomate, sal e temperos naturais.",kcal:420,tipo_nutri:"bovina",alergenos:""},
    {id:"t2",nome:"Macarrão com Almôndega",linha:"Tradicional",img_url:"img/macarrao-com-almondega.webp",ingredientes:"Macarrão, almôndegas, molho de tomate, queijo parmesão.",kcal:480,tipo_nutri:"bovina",alergenos:"Contém glúten e laticínios."},
    {id:"t3",nome:"Carne de Panela Desfiada",linha:"Tradicional",img_url:"img/carne-desfiada.webp",ingredientes:"Carne de panela, cenoura, batata, cebola, alho, louro.",kcal:390,tipo_nutri:"bovina",alergenos:""},
    {id:"t4",nome:"Carré Suíno",linha:"Tradicional",img_url:"img/carre-suino.webp",ingredientes:"Carré suíno, alho, ervas, azeite, sal.",kcal:450,tipo_nutri:"suino",alergenos:""},
    {id:"t5",nome:"Frango em Cubos Cremoso",linha:"Tradicional",img_url:"img/frango-cremoso.webp",ingredientes:"Frango, creme de leite, requeijão, alho, cebola.",kcal:380,tipo_nutri:"frango",alergenos:"Contém laticínios."},
    {id:"t6",nome:"Sobrecoxa Assada",linha:"Tradicional",img_url:"img/sobrecoxa.webp",ingredientes:"Sobrecoxa, limão, alho, páprica, sal.",kcal:360,tipo_nutri:"frango",alergenos:""},
    {id:"t7",nome:"Frango Desfiado",linha:"Tradicional",img_url:"img/frango-desfiado.webp",ingredientes:"Peito de frango, tomate, pimentão, cebola, alho.",kcal:320,tipo_nutri:"frango",alergenos:""},
    {id:"t8",nome:"Frango a Parmegiana",linha:"Tradicional",img_url:"img/parmegiana.webp",ingredientes:"Filé de frango, mussarela, presunto, farinha de rosca.",kcal:490,tipo_nutri:"frango",alergenos:"Contém glúten e laticínios."},
    {id:"t9",nome:"Frango Xadrez",linha:"Tradicional",img_url:"img/Frango Xadrez.webp",ingredientes:"Frango, pimentão, shoyu, gengibre, amido de milho.",kcal:370,tipo_nutri:"frango",alergenos:"Contém soja."},
    {id:"t10",nome:"Strogonoff de Frango",linha:"Tradicional",img_url:"img/strogonoff.webp",ingredientes:"Frango, creme de leite, catchup, mostarda, cogumelos.",kcal:400,tipo_nutri:"frango",alergenos:"Contém laticínios."},
  ],
  Gourmet: [
    {id:"g1",nome:"Frango Mostarda e Mel",linha:"Gourmet",img_url:"img/mostarda-e-mel.webp",ingredientes:"Filé de frango, mostarda dijon, mel, alho, azeite.",kcal:380,tipo_nutri:"frango",alergenos:""},
    {id:"g2",nome:"Escalopinho ao Molho Madeira",linha:"Gourmet",img_url:"img/escalopinho.webp",ingredientes:"Escalope bovino, molho madeira, cogumelos, cebola.",kcal:420,tipo_nutri:"bovina",alergenos:""},
    {id:"g3",nome:"Bife Acebolado",linha:"Gourmet",img_url:"img/bife acebolado.webp",ingredientes:"Bife bovino, cebola caramelizada, alho, sal, pimenta.",kcal:410,tipo_nutri:"bovina",alergenos:""},
    {id:"g4",nome:"Lombo Suíno Agridoce",linha:"Gourmet",img_url:"img/lombo-suino.webp",ingredientes:"Lombo suíno, abacaxi, shoyu, mel, alho.",kcal:440,tipo_nutri:"suino",alergenos:"Contém soja."},
    {id:"g5",nome:"Costelinha BBQ",linha:"Gourmet",img_url:"img/costelinha-barbecue.webp",ingredientes:"Costelinha suína, molho barbecue, alho, cebola, mel.",kcal:510,tipo_nutri:"suino",alergenos:""},
    {id:"g6",nome:"Rocambole de Frango",linha:"Gourmet",img_url:"img/rocambole.webp",ingredientes:"Frango, presunto, queijo, ervas, tomate.",kcal:390,tipo_nutri:"frango",alergenos:"Contém laticínios."},
    {id:"g7",nome:"Escondidinho",linha:"Gourmet",img_url:"img/escondidinho.webp",ingredientes:"Carne moída, purê de mandioca, queijo coalho.",kcal:480,tipo_nutri:"bovina",alergenos:"Contém laticínios."},
    {id:"g8",nome:"Charuto de Repolho",linha:"Gourmet",img_url:"img/charuto.webp",ingredientes:"Folhas de repolho, carne moída, arroz, temperos.",kcal:370,tipo_nutri:"bovina",alergenos:""},
    {id:"g9",nome:"Strogonoff de Carne",linha:"Gourmet",img_url:"img/strogonoff-de-carne.webp",ingredientes:"Carne bovina, creme de leite, cogumelos, mostarda.",kcal:440,tipo_nutri:"bovina",alergenos:"Contém laticínios."},
    {id:"g10",nome:"Iscas ao Molho Mostarda",linha:"Gourmet",img_url:"img/iscas-de-frango.webp",ingredientes:"Iscas de frango, mostarda, mel, alho, limão.",kcal:350,tipo_nutri:"frango",alergenos:""},
  ],
  Fit: [
    {id:"f1",nome:"Peito de Frango Grelhado",linha:"Fit",img_url:"img/frango-grelhado.webp",ingredientes:"Peito de frango, limão, ervas, sal marinho.",kcal:280,tipo_nutri:"frango",alergenos:""},
    {id:"f2",nome:"Escondidinho Batata Doce",linha:"Fit",img_url:"img/escondidinho-batata-doce.webp",ingredientes:"Carne moída magra, batata doce, ricota.",kcal:340,tipo_nutri:"bovina",alergenos:"Contém laticínios."},
    {id:"f3",nome:"Panqueca de Frango",linha:"Fit",img_url:"img/panqueca-frango.webp",ingredientes:"Panqueca integral, recheio de frango desfiado.",kcal:320,tipo_nutri:"frango",alergenos:"Contém glúten."},
    {id:"f4",nome:"Patinho Moído ao Sugo",linha:"Fit",img_url:"img/patinho-sugo.webp",ingredientes:"Patinho moído, molho sugo artesanal, manjericão.",kcal:310,tipo_nutri:"bovina",alergenos:""},
    {id:"f5",nome:"Frango em Cubos Grelhado",linha:"Fit",img_url:"img/frango-em-cubos-grelhado.webp",ingredientes:"Cubos de frango, azeite, ervas finas, alho assado.",kcal:290,tipo_nutri:"frango",alergenos:""},
    {id:"f6",nome:"Picadinho de Patinho",linha:"Fit",img_url:"img/picadinho-patinho.webp",ingredientes:"Patinho em cubos, tomate, cebola, ervas.",kcal:300,tipo_nutri:"bovina",alergenos:""},
  ],
  Kids: [
    {id:"k1",nome:"Nuggets c/ Legumes",linha:"Kids",img_url:"img/nuggets.webp",ingredientes:"Nuggets de frango, cenoura, batata, brócolis.",kcal:350,tipo_nutri:"kids",alergenos:"Contém glúten."},
    {id:"k2",nome:"Hamburger c/ Legumes",linha:"Kids",img_url:"img/hamburger.webp",ingredientes:"Hambúrguer artesanal, cenoura, batata doce, ervilha.",kcal:380,tipo_nutri:"kids",alergenos:""},
    {id:"k3",nome:"Almôndega c/ Legumes",linha:"Kids",img_url:"img/almondega.webp",ingredientes:"Almôndegas, molho de tomate, legumes.",kcal:360,tipo_nutri:"bovina",alergenos:""},
    {id:"k4",nome:"Panqueca c/ Legumes",linha:"Kids",img_url:"img/panqueca-kids.webp",ingredientes:"Panqueca, frango, cenoura, abobrinha.",kcal:300,tipo_nutri:"frango",alergenos:"Contém glúten."},
    {id:"k5",nome:"Escondidinho Colorido",linha:"Kids",img_url:"img/escondidinho-kids.webp",ingredientes:"Purê de batata doce, carne moída, cenoura, milho.",kcal:320,tipo_nutri:"bovina",alergenos:""},
  ],
};

function renderizarGrids() {
  Object.keys(CARDAPIO).forEach(linha => {
    const grid=document.getElementById(`grid-${linha}`);
    if(!grid) return;
    grid.innerHTML="";
    CARDAPIO[linha].forEach(prato => {
      const card=document.createElement("article");
      card.className="prato-card";
      card.innerHTML=`
        <div class="prato-card-img"><img src="${prato.img_url}" alt="${prato.nome}" loading="lazy"></div>
        <div class="prato-card-body">
          <p class="prato-card-name">${prato.nome}</p>
          <button class="prato-card-btn" onclick="abrirModalPrato('${prato.id}','${linha}')">
            <i class="fas fa-plus"></i> Adicionar
          </button>
        </div>`;
      grid.appendChild(card);
    });
  });
}

/* ── RESTRIÇÃO DE LINHA ──────────────────────────────────────── */
function verificarRestricaoLinha(linhaPrato) {
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  if(!cfg) return {permitido:false,mensagem:'Selecione um plano primeiro.'};
  if(cfg.permiteMix) return {permitido:true,mensagem:''};
  if(!linhaLocked) return {permitido:true,mensagem:''};
  if(linhaLocked!==linhaPrato) return {permitido:false,mensagem:`Este plano exige a linha ${linhaLocked}.`};
  return {permitido:true,mensagem:''};
}
function atualizarVisibilidadePratos() {
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  if(!cfg||cfg.permiteMix) {
    document.querySelectorAll('.prato-card').forEach(c=>{c.style.opacity='1';c.style.pointerEvents='auto';c.style.filter='none';});
    document.getElementById('aviso-linha-travada')?.remove(); return;
  }
  if(linhaLocked) {
    ['Tradicional','Gourmet','Fit','Kids'].forEach(l=>{
      document.getElementById(`grid-${l}`)?.querySelectorAll('.prato-card').forEach(c=>{
        const ok=l===linhaLocked;
        c.style.opacity=ok?'1':'0.35'; c.style.pointerEvents=ok?'auto':'none'; c.style.filter=ok?'none':'grayscale(0.8)';
      });
    });
    mostrarAvisoLinhaTravada(linhaLocked);
  }
}
function mostrarAvisoLinhaTravada(linha) {
  document.getElementById('aviso-linha-travada')?.remove();
  const aviso=document.createElement('div');
  aviso.id='aviso-linha-travada'; aviso.className='linha-travada-aviso';
  aviso.innerHTML=`<i class="fas fa-lock"></i>
    <span>Linha <strong>${linha}</strong> — somente pratos desta linha.</span>
    <button onclick="resetarLinhaTravada()" class="btn-reset-linha"><i class="fas fa-undo"></i> Trocar</button>`;
  document.querySelector('.pedido-card')?.prepend(aviso);
}
function resetarLinhaTravada() {
  if(itensPedido.length>0&&!confirm('Trocar a linha vai limpar o carrinho. Continuar?')) return;
  itensPedido=[]; linhaLocked=null;
  document.getElementById('aviso-linha-travada')?.remove();
  atualizarVisibilidadePratos(); atualizarCarrinho();
  mostrarToast('Linha resetada.');
}

/* ══════════════════════════════════════════════════════════════
   MODAL DE PRATO
══════════════════════════════════════════════════════════════ */
function abrirModalPrato(pratoId, linha) {
  const plano=document.getElementById('plano-selecionado').value;

  // ── Sem plano? Salvar prato e redirecionar
  if(!plano) {
    pratoPendenteTemp={pratoId,linha};
    mostrarToast('👆 Primeiro escolha seu plano!');
    document.getElementById('pedido')?.scrollIntoView({behavior:'smooth'});
    setTimeout(()=>{
      const sel=document.getElementById('plano-selecionado');
      if(sel){sel.focus();sel.classList.add('highlight-pulse');setTimeout(()=>sel.classList.remove('highlight-pulse'),2000);}
    },600);
    return;
  }

  const restricao=verificarRestricaoLinha(linha);
  if(!restricao.permitido){mostrarToast(restricao.mensagem);return;}
  const cfg=CONFIG_PLANOS[plano];
  if(plano==='Individual'&&itensPedido.length>=13){mostrarToast('Limite de 13 pratos para Individual.');return;}
  if(cfg?.exato&&itensPedido.length>=cfg.max){mostrarToast(`Limite de ${cfg.max} pratos atingido.`);return;}

  const prato=CARDAPIO[linha]?.find(p=>String(p.id)===pratoId);
  if(!prato) return;
  pratoPendente={...prato,linhaNome:linha};

  document.getElementById('modal-img').src=prato.img_url;
  document.getElementById('modal-img').alt=prato.nome;
  document.getElementById('modal-prato-nome').textContent=prato.nome;
  const tag=document.getElementById('modal-linha-tag');
  tag.textContent=linha; tag.className=`modal-linha-tag badge-${linha.toLowerCase()}`;
  document.getElementById('modal-ingredientes').textContent=prato.ingredientes||'';
  const alEl=document.getElementById('modal-alergenos');
  alEl.textContent=prato.alergenos||''; alEl.hidden=!prato.alergenos;
  document.getElementById('modal-kcal').textContent=prato.kcal||'—';
  const tbody=document.getElementById('modal-nutri-tbody');
  const rows=NUTRI_DB[prato.tipo_nutri]||NUTRI_DB.frango;
  tbody.innerHTML=rows.map(r=>`<tr><td>${r.n}</td><td>${r.q}</td><td>${r.v}</td></tr>`).join('');
  document.getElementById('modal-preco-base').textContent=`₲ ${(PRECOS_LINHA[linha]||30000).toLocaleString('es-PY')}`;

  // Reset
  document.querySelectorAll('.acomp-check').forEach(cb=>{cb.checked=false;cb.disabled=false;});
  document.querySelectorAll('.acomp-grams').forEach(g=>g.hidden=true);
  document.querySelectorAll('.acomp-display-g').forEach(d=>d.hidden=true);
  document.getElementById('proteina-gramas').value='130';
  document.getElementById('proteina-label').textContent=prato.nome;
  document.getElementById('seleta-gramas').value='80';
  if(document.getElementById('obs-prato')) document.getElementById('obs-prato').value='';
  quereSeleta=true; toggleSeleta(true);

  // Personalização DESATIVADA por padrão
  document.getElementById('chk-personalizar').checked=false;
  modoPersonalizado=false; aplicarModoPersonalizado();

  document.querySelectorAll('.acomp-check').forEach(cb=>{
    cb.onchange=()=>{
      const row=cb.closest('.acomp-row');
      const gWrap=row?.querySelector('.acomp-grams');
      const gDisp=row?.querySelector('.acomp-display-g');
      if(modoPersonalizado){
        // Personalizado: mostra input editável
        if(gWrap){gWrap.hidden=!cb.checked;if(cb.checked){const inp=gWrap.querySelector('.gram-input');const rule=GRAM_RULES[cb.value];inp.value=rule?rule.base:80;}}
        if(gDisp) gDisp.hidden=true;
      } else {
        // Normal: sem exibir gramas — só o check visual da linha
        if(gWrap) gWrap.hidden=true;
        if(gDisp) gDisp.hidden=true;
      }
      const checked=document.querySelectorAll('.acomp-check:checked').length;
      document.querySelectorAll('.acomp-check:not(:checked)').forEach(o=>o.disabled=checked>=2);
      atualizarPrecoModal();
    };
  });
  document.querySelectorAll('.acomp-grams .gram-input').forEach(inp=>inp.oninput=atualizarPrecoModal);
  document.getElementById('proteina-gramas').oninput=atualizarPrecoModal;
  document.getElementById('seleta-gramas').oninput=atualizarPrecoModal;
  atualizarPrecoModal();

  const overlay=document.getElementById('modal-prato');
  overlay.classList.add('open'); overlay.removeAttribute('hidden');
  document.body.style.overflow='hidden';
}

/* Sincroniza visual do modo personalizado */
function aplicarModoPersonalizado() {
  const wrapProt=document.getElementById('proteina-gramas-wrap');
  const dispProt=document.getElementById('proteina-gramas-display');
  if(wrapProt) wrapProt.hidden=!modoPersonalizado;
  if(dispProt){dispProt.hidden=modoPersonalizado; dispProt.textContent=`${document.getElementById('proteina-gramas').value||130}g`;}

  const gramSel=document.getElementById('seleta-gram-row');
  const dispSel=document.getElementById('seleta-gram-display');
  if(gramSel) gramSel.hidden=!modoPersonalizado||!quereSeleta;
  if(dispSel) dispSel.hidden=modoPersonalizado||!quereSeleta;

  document.querySelectorAll('.acomp-check:checked').forEach(cb=>{
    const row=cb.closest('.acomp-row');
    if(row){
      const g=row.querySelector('.acomp-grams'); const d=row.querySelector('.acomp-display-g');
      if(g) g.hidden=!modoPersonalizado; if(d) d.hidden=modoPersonalizado;
    }
  });

  const obsRow=document.getElementById('obs-prato-row');
  if(obsRow) obsRow.hidden=!modoPersonalizado;
  document.getElementById('preco-normal-wrap').hidden=modoPersonalizado;
  document.getElementById('preco-consulta-wrap').hidden=!modoPersonalizado;
}

function togglePersonalizar() {
  modoPersonalizado=document.getElementById('chk-personalizar').checked;
  if(modoPersonalizado){
    // Muda o plano para Personalizado e desbloqueia todas as linhas
    const sel=document.getElementById('plano-selecionado');
    if(sel && sel.value!=='Personalizado'){
      sel.value='Personalizado';
      linhaLocked=null;
      document.getElementById('aviso-linha-travada')?.remove();
      document.querySelectorAll('.prato-card').forEach(c=>{c.style.opacity='1';c.style.pointerEvents='auto';c.style.filter='none';});
      const lTxt=document.getElementById('limite-txt');
      if(lTxt) lTxt.textContent='∞';
      const wrap=document.getElementById('pedido-progress');
      if(wrap) wrap.hidden=false;
    }
    mostrarToast('Personalizado ativado — ajuste gramas e misture linhas à vontade!');
  }
  aplicarModoPersonalizado();
  if(!modoPersonalizado) atualizarPrecoModal();
}

function atualizarPrecoModal() {
  const el=document.getElementById('modal-preco-total');
  if(!el||!pratoPendente) return;
  if(modoPersonalizado){el.innerHTML='<span class="preco-consulta-txt">A combinar</span>';return;}
  const precoBase=PRECOS_LINHA[pratoPendente.linhaNome]||30000;
  let extras=0;
  extras+=calcularTaxaGrama('Proteína',parseInt(document.getElementById('proteina-gramas').value)||0);
  document.querySelectorAll('.acomp-check:checked').forEach(cb=>{
    const row=cb.closest('.acomp-row');
    extras+=calcularTaxaGrama(cb.value,parseInt(row?.querySelector('.gram-input')?.value)||0);
  });
  if(quereSeleta) extras+=calcularTaxaGrama('Seleta',parseInt(document.getElementById('seleta-gramas').value)||0);
  const total=precoBase+extras;
  const fmt=v=>`₲ ${Math.round(v).toLocaleString('es-PY')}`;
  let html=`<span class="preco-base">${fmt(precoBase)}</span>`;
  if(extras>0) html+=` <span class="preco-extra">+ ${fmt(extras)} extras</span> <span class="preco-total-item">= ${fmt(total)}</span>`;
  el.innerHTML=html;
  const dp=document.getElementById('proteina-gramas-display');
  if(dp) dp.textContent=`${document.getElementById('proteina-gramas').value||130}g`;
}

function fecharModalPrato() {
  const o=document.getElementById("modal-prato");
  o?.classList.remove("open"); if(o) o.hidden=true;
  document.body.style.overflow=""; pratoPendente=null;
}

function toggleSeleta(sim) {
  quereSeleta=sim;
  document.getElementById('btn-sim')?.classList.toggle('active',sim);
  document.getElementById('btn-nao')?.classList.toggle('active',!sim);
  const info=document.getElementById('seleta-info');
  if(info) info.style.display=sim?'flex':'none';
  const gRow=document.getElementById('seleta-gram-row');
  const gDisp=document.getElementById('seleta-gram-display');
  if(gRow) gRow.hidden=!sim||!modoPersonalizado;
  if(gDisp) gDisp.hidden=!sim||modoPersonalizado;
  atualizarPrecoModal();
}

function confirmarAdicaoPrato() {
  if(!pratoPendente) return;
  const acomps=[];
  document.querySelectorAll('.acomp-check:checked').forEach(cb=>{
    const row=cb.closest('.acomp-row');
    const rule=GRAM_RULES[cb.value];
    const g=modoPersonalizado?(parseInt(row?.querySelector('.gram-input')?.value)||rule?.base||80):(rule?.base||80);
    acomps.push({nome:cb.value,gramas:g});
  });
  const gProt=modoPersonalizado?(parseInt(document.getElementById('proteina-gramas').value)||130):130;
  const gSel=quereSeleta?(modoPersonalizado?(parseInt(document.getElementById('seleta-gramas').value)||80):80):null;
  const obsPrato=modoPersonalizado?(document.getElementById('obs-prato')?.value?.trim()||''):'';
  const precoBase=PRECOS_LINHA[pratoPendente.linhaNome]||30000;
  let extras=0;
  if(modoPersonalizado){
    extras+=calcularTaxaGrama('Proteína',gProt);
    acomps.forEach(a=>extras+=calcularTaxaGrama(a.nome,a.gramas));
    if(quereSeleta&&gSel) extras+=calcularTaxaGrama('Seleta',gSel);
  }
  itensPedido.push({
    ...pratoPendente,
    gramasProteina:gProt,acompanhamentos:acomps,seleta:quereSeleta,gramasSeleta:gSel,
    precoBase,extrasGrama:extras,
    precoItem:modoPersonalizado?null:precoBase,
    personalizado:modoPersonalizado,obsPrato,
  });
  const plano=document.getElementById('plano-selecionado').value;
  if(CONFIG_PLANOS[plano]?.linhaLock&&!linhaLocked){
    linhaLocked=pratoPendente.linhaNome;
    mostrarToast(`Linha ${linhaLocked} selecionada!`);
    atualizarVisibilidadePratos();
  }
  const nomePrato = pratoPendente.nome;
  atualizarCarrinho(); salvarDados(); fecharModalPrato();
  mostrarToast(`"${nomePrato}" adicionado!`);
}

/* ══════════════════════════════════════════════════════════════
   CONFIGURAR PLANO — reabre prato pendente se havia um
══════════════════════════════════════════════════════════════ */
function configurarPlano() {
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  linhaLocked=null; itensPedido=[];
  document.getElementById('aviso-linha-travada')?.remove();
  const wrap=document.getElementById('pedido-progress');
  if(wrap) wrap.hidden=!plano;
  const lTxt=document.getElementById('limite-txt');
  if(lTxt){
    if(!plano) lTxt.textContent='—';
    else if(plano==='Individual') lTxt.textContent='13 máx.';
    else if(plano==='Personalizado') lTxt.textContent='∞';
    else if(cfg?.exato) lTxt.textContent=String(cfg.max);
    else lTxt.textContent=`${cfg?.min}+`;
  }
  atualizarVisibilidadePratos(); atualizarCarrinho(); salvarDados();

  // ── Reabrir o prato que o cliente clicou antes de escolher o plano
  if(pratoPendenteTemp&&plano){
    const {pratoId,linha}=pratoPendenteTemp; pratoPendenteTemp=null;
    setTimeout(()=>{
      document.getElementById('cardapio')?.scrollIntoView({behavior:'smooth'});
      setTimeout(()=>abrirModalPrato(pratoId,linha),700);
    },300);
  }
}

/* ══════════════════════════════════════════════════════════════
   MODAL CARRINHO
══════════════════════════════════════════════════════════════ */
function abrirCarrinho() {
  renderizarModalCarrinho();
  const modal=document.getElementById('modal-carrinho');
  if(!modal) return;
  modal.classList.add('open'); modal.removeAttribute('hidden');
  document.body.style.overflow='hidden';
}
function fecharCarrinho() {
  const modal=document.getElementById('modal-carrinho');
  if(!modal) return;
  modal.classList.remove('open'); modal.hidden=true;
  document.body.style.overflow='';
}
function renderizarModalCarrinho() {
  const lista=document.getElementById('carrinho-modal-itens');
  const resumoEl=document.getElementById('carrinho-modal-resumo');
  if(!lista) return;
  const n=itensPedido.length;
  const fmt=v=>`₲ ${Math.round(v).toLocaleString('es-PY')}`;
  if(n===0){
    lista.innerHTML=`<div class="carrinho-vazio"><i class="fas fa-shopping-basket"></i><p>Carrinho vazio.</p><button class="btn btn-outline" onclick="fecharCarrinho()">Escolher Pratos</button></div>`;
    if(resumoEl) resumoEl.hidden=true; return;
  }
  lista.innerHTML=itensPedido.map((item,i)=>{
    const aStr=item.acompanhamentos?.length?item.acompanhamentos.map(a=>`${a.nome} (${a.gramas}g)`).join(', '):'sem acompanhamento';
    const sStr=item.seleta?`Seleta (${item.gramasSeleta}g)`:'sem seleta';
    const preco=item.personalizado?'<span class="consulta-badge-mini">Sob Consulta</span>':fmt(item.precoItem||item.precoBase);
    return `<div class="carrinho-modal-item">
      <div class="cm-item-img"><img src="${item.img_url}" alt="${item.nome}"></div>
      <div class="cm-item-info">
        <p class="cm-item-nome">${item.nome}</p>
        <p class="cm-item-linha">${item.linhaNome}</p>
        <p class="cm-item-sub">Prot: ${item.gramasProteina}g · ${aStr} · ${sStr}</p>
        ${item.obsPrato?`<p class="cm-item-obs"><i class="fas fa-comment-alt"></i> ${item.obsPrato}</p>`:''}
      </div>
      <div class="cm-item-preco">${preco}</div>
      <div class="cm-item-actions">
        <button class="cm-btn cm-btn-repeat" onclick="repetirItemModal(${i})" title="Repetir prato"><i class="fas fa-copy"></i></button>
        <button class="cm-btn cm-btn-del"    onclick="removerItemModal(${i})"  title="Remover"><i class="fas fa-trash"></i></button>
      </div>
    </div>`;
  }).join('');
  const t=calcularTotalPedido();
  if(t&&resumoEl){
    let html='<div class="resumo-modal">';
    html+=`<div class="rm-row"><span>${n} prato(s)</span><span>${fmt(t.baseTotal)}</span></div>`;
    if(t.desconto>0) html+=`<div class="rm-row rm-desc"><span>Desconto ${(t.desconto*100).toFixed(0)}%</span><span>− ${fmt(t.descValor)}</span></div>`;
    if(t.extrasGrama>0) html+=`<div class="rm-row"><span>Personalização</span><span>+ ${fmt(t.extrasGrama)}</span></div>`;
    if(t.frete>0) html+=`<div class="rm-row"><span>Frete</span><span>${fmt(t.frete)}</span></div>`;
    else if(freteLabel!=='—') html+=`<div class="rm-row rm-desc"><span>Frete</span><span>GRÁTIS</span></div>`;
    html+=`<div class="rm-total"><span>Total</span><strong>${fmt(t.total)}</strong></div></div>`;
    resumoEl.innerHTML=html; resumoEl.hidden=false;
  }
}
function removerItemModal(i){
  itensPedido.splice(i,1);
  if(itensPedido.length===0){linhaLocked=null;document.getElementById('aviso-linha-travada')?.remove();atualizarVisibilidadePratos();}
  atualizarCarrinho(); renderizarModalCarrinho(); salvarDados();
}
function repetirItemModal(i){
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  if(plano==='Individual'&&itensPedido.length>=13){mostrarToast('Limite de 13 pratos atingido.');return;}
  if(cfg?.exato&&itensPedido.length>=cfg.max){mostrarToast(`Limite de ${cfg.max} pratos atingido.`);return;}
  const nome=itensPedido[i].nome;
  itensPedido.push({...itensPedido[i]});
  atualizarCarrinho(); renderizarModalCarrinho(); salvarDados();
  mostrarToast(`"${nome}" repetido!`);
}

/* ── CARRINHO INLINE ─────────────────────────────────────────── */
function atualizarCarrinho() {
  const n=itensPedido.length;
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  const max=cfg?.exato?cfg.max:(plano==='Individual'?13:null);
  const fmt=v=>`₲ ${Math.round(v).toLocaleString('es-PY')}`;

  const badge=document.getElementById('carrinho-badge');
  if(badge){badge.textContent=n;badge.hidden=n===0;}

  const atualEl=document.getElementById('atual');
  if(atualEl) atualEl.textContent=n;
  const fill=document.getElementById('progress-fill');
  if(fill) fill.style.width=(max?Math.min(n/max*100,100):Math.min(n*6,100))+'%';

  const dEl=document.getElementById('individual-desconto-hint');
  if(dEl){
    if(plano==='Personalizado'){
      dEl.hidden=false;
      dEl.textContent=n>56?'🎉 10% desconto!':n>14?'👍 5% desconto!':`Adicione ${15-n} prato(s) para 5% OFF`;
    } else if(plano==='Individual'){
      dEl.hidden=false;
      dEl.textContent=n>=13?'✅ Carrinho completo!':` ${n}/13 pratos`;
    } else dEl.hidden=true;
  }

  const lista=document.getElementById('carrinho-itens');
  if(lista){
    lista.innerHTML=n===0
      ?'<li class="carrinho-empty">Nenhum prato adicionado ainda.<br><small>Escolha no cardápio acima.</small></li>'
      :itensPedido.map((item,i)=>`
        <li class="carrinho-item">
          <div class="carrinho-item-info">
            <p class="carrinho-item-nome">${item.nome}${item.personalizado?' <span class="consulta-badge-mini">Sob Consulta</span>':''}</p>
            <p class="carrinho-item-sub">${item.linhaNome} · Prot: ${item.gramasProteina}g</p>
          </div>
          <span class="carrinho-item-preco">${item.personalizado?'—':fmt(item.precoItem||item.precoBase)}</span>
          <button class="ci-btn ci-btn-rep" onclick="repetirItemInline(${i})" title="Repetir"><i class="fas fa-copy"></i></button>
          <button class="ci-btn ci-btn-del" onclick="removerItem(${i})"       title="Remover"><i class="fas fa-times"></i></button>
        </li>`).join('');
  }
  renderizarResumo(); verificarBotao();
}
function removerItem(i){
  itensPedido.splice(i,1);
  if(itensPedido.length===0){linhaLocked=null;document.getElementById('aviso-linha-travada')?.remove();atualizarVisibilidadePratos();}
  atualizarCarrinho(); salvarDados();
}
function repetirItemInline(i){
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  if(plano==='Individual'&&itensPedido.length>=13){mostrarToast('Limite de 13 pratos.');return;}
  if(cfg?.exato&&itensPedido.length>=cfg.max){mostrarToast(`Limite de ${cfg.max} pratos.`);return;}
  const nome=itensPedido[i].nome;
  itensPedido.push({...itensPedido[i]});
  atualizarCarrinho(); salvarDados();
  mostrarToast(`"${nome}" repetido!`);
}

/* ── RESUMO FINANCEIRO ───────────────────────────────────────── */
function calcularTotalPedido() {
  const plano=document.getElementById('plano-selecionado').value;
  const cfg=CONFIG_PLANOS[plano];
  const n=itensPedido.length;
  if(!cfg||n===0) return null;
  let extrasGrama=0;
  itensPedido.filter(i=>i.personalizado).forEach(item=>{
    extrasGrama+=calcularTaxaGrama('Proteína',item.gramasProteina);
    (item.acompanhamentos||[]).forEach(a=>extrasGrama+=calcularTaxaGrama(a.nome,a.gramas));
    if(item.seleta&&item.gramasSeleta) extrasGrama+=calcularTaxaGrama('Seleta',item.gramasSeleta);
  });
  let baseTotal=0,desconto=0;
  if(plano==='Individual'){
    baseTotal=itensPedido.reduce((s,i)=>s+(PRECOS_LINHA[i.linhaNome]||30000),0);
  } else if(plano==='Personalizado'){
    baseTotal=itensPedido.reduce((s,i)=>s+(PRECOS_LINHA[i.linhaNome]||30000),0);
    if(n>56) desconto=0.10; else if(n>14) desconto=0.05;
  } else if(plano==='Semanal'){
    baseTotal=itensPedido.reduce((s,i)=>s+(PRECOS_LINHA[i.linhaNome]||30000),0); desconto=0.05;
  } else if(plano==='FDS'){
    baseTotal=(PRECOS_LINHA[linhaLocked]||30000)*40; desconto=0.05;
  } else if(plano==='Mensal'){
    baseTotal=(PRECOS_LINHA[linhaLocked]||30000)*56; desconto=0.10;
  }
  const descValor=Math.round(baseTotal*desconto);
  const total=(baseTotal-descValor)+extrasGrama+freteValor;
  return {baseTotal,desconto,descValor,extrasGrama,frete:freteValor,total};
}
function renderizarResumo() {
  const wrap=document.getElementById('resumo-financeiro');
  if(!wrap) return;
  const t=calcularTotalPedido();
  if(!t||itensPedido.length===0){wrap.hidden=true;return;}
  const fmt=v=>`₲ ${Math.round(v).toLocaleString('es-PY')}`;
  const plano=document.getElementById('plano-selecionado').value;
  let html='';
  if(plano==='FDS'||plano==='Mensal')
    html+=`<div class="resumo-row"><span>${plano==='FDS'?40:56} marmitas (${linhaLocked})</span><span>${fmt(t.baseTotal)}</span></div>`;
  else
    html+=`<div class="resumo-row"><span>${itensPedido.length} prato(s)</span><span>${fmt(t.baseTotal)}</span></div>`;
  if(t.desconto>0) html+=`<div class="resumo-row resumo-desconto"><span>Desconto ${(t.desconto*100).toFixed(0)}%</span><span>− ${fmt(t.descValor)}</span></div>`;
  if(t.extrasGrama>0) html+=`<div class="resumo-row"><span>Personalização</span><span>+ ${fmt(t.extrasGrama)}</span></div>`;
  if(t.frete>0) html+=`<div class="resumo-row"><span>Frete</span><span>${fmt(t.frete)}</span></div>`;
  else if(freteLabel!=='—') html+=`<div class="resumo-row resumo-desconto"><span>Frete</span><span>GRÁTIS</span></div>`;
  html+=`<div class="resumo-total"><span>Total estimado</span><strong>${fmt(t.total)}</strong></div>`;
  wrap.innerHTML=html; wrap.hidden=false;
}

/* ── PAGAMENTO ───────────────────────────────────────────────── */
function selecionarPagamento(el,forma){
  document.querySelectorAll(".pag-opt").forEach(b=>b.classList.remove("selected"));
  el.classList.add("selected"); pagamentoSel=forma;
  document.getElementById("forma-pagamento").value=forma; verificarBotao();
}
function verificarBotao(){
  const plano=document.getElementById('plano-selecionado').value;
  const nome=document.getElementById('cliente-nome').value.trim();
  const tel=document.getElementById('cliente-tel').value.trim();
  const cfg=CONFIG_PLANOS[plano]; const n=itensPedido.length;
  let planOk=false;
  if(plano==='Individual') planOk=n>=1&&n<=13;
  else if(plano==='Personalizado') planOk=n>=1;
  else if(cfg?.exato) planOk=n===cfg.max;
  const ok=planOk&&nome&&tel&&pagamentoSel;
  const btn=document.getElementById('btn-whatsapp');
  if(btn) btn.disabled=!ok;
  const hint=document.getElementById('botao-hint');
  if(hint){
    if(!plano) hint.textContent='Selecione um plano.';
    else if(plano==='Individual'&&n<1) hint.textContent='Adicione pelo menos 1 prato.';
    else if(plano==='Individual'&&n>13) hint.textContent='Máximo 13 pratos no Individual.';
    else if(cfg?.exato&&n<cfg.max) hint.textContent=`Adicione mais ${cfg.max-n} prato(s).`;
    else if(!nome||!tel) hint.textContent='Preencha nome e WhatsApp.';
    else if(!pagamentoSel) hint.textContent='Escolha a forma de pagamento.';
    else hint.textContent='';
    hint.hidden=!hint.textContent;
  }
}

/* ── FRETE ───────────────────────────────────────────────────── */
function obterLocalizacaoEFrete(){
  if(!navigator.geolocation){mostrarToast("Geolocalização não disponível.");return;}
  mostrarToast("Obtendo sua localização…");
  navigator.geolocation.getCurrentPosition(
    pos=>{
      const{latitude,longitude}=pos.coords;
      linkMaps=`https://www.google.com/maps?q=${latitude},${longitude}`;
      salvarLinkMapsCliente(latitude,longitude);
      const r=calcularFreteDistancia(latitude,longitude);
      exibirResultadoFrete(r);
      mostrarToast(`✅ Localização capturada! ~${r.distancia} km`);
    },
    err=>{
      const msgs={1:"Permissão negada.",2:"Localização indisponível.",3:"Tempo esgotado."};
      mostrarToast(msgs[err.code]||"Não foi possível obter localização.");
    },
    {enableHighAccuracy:true,timeout:10000,maximumAge:60000}
  );
}

/* Tabela de preços ORIGINAL */
function calcularFreteDistancia(latDest,lonDest){
  const R=6371;
  const dLat=(latDest-ORIGEM.lat)*Math.PI/180;
  const dLon=(lonDest-ORIGEM.lon)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(ORIGEM.lat*Math.PI/180)*Math.cos(latDest*Math.PI/180)*Math.sin(dLon/2)**2;
  const distancia=R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  let preco;
  if     (distancia<=3)  preco=8000;
  else if(distancia<=5)  preco=10000;
  else if(distancia<=7)  preco=15000;
  else if(distancia<=8)  preco=25000;
  else if(distancia<=10) preco=30000;
  else                    preco=35000;
  return{distancia:distancia.toFixed(1),preco};
}
function exibirResultadoFrete(r){
  freteValor=r.preco;
  freteLabel=r.preco===0?'GRÁTIS':`₲ ${r.preco.toLocaleString('es-PY')}`;
  const display=document.getElementById('valor-frete-display');
  if(display) display.innerHTML=r.preco===0?'<span class="frete-gratis">GRÁTIS</span>':`₲ ${r.preco.toLocaleString('es-PY')}`;
  const detalhe=document.getElementById('frete-detalhe');
  if(detalhe){detalhe.innerHTML=`<i class="fas fa-map-marker-alt"></i> ~${r.distancia} km | <a href="${linkMaps}" target="_blank">Ver no Maps <i class="fas fa-external-link-alt"></i></a>`;detalhe.hidden=false;}
  renderizarResumo();
}
async function salvarLinkMapsCliente(lat,lon){
  const tel=document.getElementById('cliente-tel')?.value?.trim();
  if(!tel) return;
  const ddi=document.getElementById('cliente-ddi')?.value||'+595';
  const link=`https://www.google.com/maps?q=${lat},${lon}`;
  try{const{data}=await supa.from('clientes').select('id').eq('tel',ddi+tel).limit(1);if(data?.length) await supa.from('clientes').update({link_maps:link}).eq('id',data[0].id);}catch(e){}
}

/* ── TRACKER ─────────────────────────────────────────────────── */
async function buscarStatusEntrega(){
  const ddi=document.getElementById('tracker-ddi')?.value||'';
  const telInput=document.getElementById('tracker-tel').value.trim();
  const resultDiv=document.getElementById('tracker-result');
  if(!telInput){resultDiv.innerHTML='<p class="empty-msg">Digite seu número.</p>';resultDiv.hidden=false;return;}
  try{
    let pedidos;
    for(const fn of[
      ()=>supa.from('pedidos').select('*').eq('cliente_tel',telInput),
      ()=>supa.from('pedidos').select('*').eq('cliente_tel',ddi+telInput),
      ()=>supa.from('pedidos').select('*').ilike('cliente_tel',`%${telInput.replace(/\D/g,'')}%`),
    ]){pedidos=await fn();if(pedidos?.data?.length) break;}
    if(!pedidos?.data?.length){resultDiv.innerHTML='<div class="tracker-empty"><i class="fas fa-search"></i><p>Nenhum pedido encontrado.</p></div>';resultDiv.hidden=false;return;}
    renderizarStatusEntregas(pedidos.data);
  }catch(e){resultDiv.innerHTML='<p>Erro ao buscar.</p>';resultDiv.hidden=false;}
}
function renderizarStatusEntregas(pedidos){
  const resultDiv=document.getElementById('tracker-result');
  const SL={
    pendente:{text:'Pendente',cls:'status-pending',icon:'fa-clock'},
    aceito:{text:'Aceito',cls:'status-accepted',icon:'fa-check'},
    em_producao:{text:'Em Produção',cls:'status-production',icon:'fa-fire'},
    pronto:{text:'Pronto',cls:'status-ready',icon:'fa-box'},
    em_entrega:{text:'Em Entrega',cls:'status-delivery',icon:'fa-motorcycle'},
    entregue:{text:'Entregue',cls:'status-delivered',icon:'fa-check-circle'},
    recusado:{text:'Recusado',cls:'status-rejected',icon:'fa-times-circle'},
    cancelado:{text:'Cancelado',cls:'status-cancelled',icon:'fa-ban'},
  };
  let html=`<div class="tracker-list"><h4>${pedidos.length} pedido(s)</h4>`;
  pedidos.forEach(p=>{
    const pratos=Array.isArray(p.pratos)?p.pratos:JSON.parse(p.pratos||'[]');
    const s=SL[p.status]||{text:p.status,cls:'',icon:'fa-question'};
    html+=`<div class="tracker-item ${s.cls}">
      <div class="tracker-header">
        <span class="tracker-status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${s.text}</span>
        <span class="tracker-date">${new Date(p.created_at).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span>
        <span class="tracker-plano">${p.plano}</span>
      </div>
      <ul class="tracker-pratos">${pratos.map(pr=>`<li>${pr.nome}</li>`).join('')}</ul>
      ${p.observacoes?`<p class="tracker-obs"><i class="fas fa-info-circle"></i> ${p.observacoes}</p>`:''}
    </div>`;
  });
  html+='</div>'; resultDiv.innerHTML=html; resultDiv.hidden=false;
}

/* ── ENVIAR PEDIDO ───────────────────────────────────────────── */
async function enviarPedidoZap(){
  const plano=document.getElementById('plano-selecionado').value;
  const nome=document.getElementById('cliente-nome').value.trim();
  const ddi=document.getElementById('cliente-ddi').value;
  const tel=document.getElementById('cliente-tel').value.trim();
  const obs=document.getElementById('observacoes-gerais').value.trim();
  if(!nome||!tel){mostrarToast('Preencha nome e telefone.');return;}
  try{
    // ── Vincular ao cliente cadastrado pelo telefone
    let clienteId=null;
    try{
      const{data}=await supa.from('clientes').select('id').eq('tel',ddi+tel).maybeSingle();
      if(data?.id) clienteId=data.id;
    }catch(e){}

    const{data:pedido,error}=await supa.from('pedidos').insert([{
      cliente_nome:nome, cliente_tel:ddi+tel,
      cliente_id:clienteId,   // ← vinculado se cadastrado
      plano, pratos:itensPedido, observacoes:obs,
      forma_pag:pagamentoSel, semana:getSemanaAtual(),
      status:'pendente',
    }]).select().single();
    if(error) throw error;

    const msg=gerarMensagemPedido(nome,plano,itensPedido,obs,pedido.id);
    window.open(`https://api.whatsapp.com/send?phone=595991635604&text=${encodeURIComponent(msg)}`,'_blank');
    itensPedido=[]; linhaLocked=null;
    atualizarCarrinho(); salvarDados();
    mostrarToast('✅ Pedido enviado com sucesso!');
  }catch(e){console.error(e);mostrarToast('Erro ao salvar pedido.');}
}
function gerarMensagemPedido(nome,plano,itens,obs,pedidoId){
  const total=calcularTotalPedido();
  const fmt=v=>`₲ ${Math.round(v).toLocaleString('es-PY')}`;
  let msg=`🍽️ *NOVO PEDIDO — Doña Maria*\n📋 #${pedidoId?.slice(-6)||'-----'}\n\n*Cliente:* ${nome}\n*Plano:* ${plano}\n\n*PRATOS:*\n`;
  itens.forEach((item,i)=>{
    msg+=`${i+1}. ${item.nome} (${item.linhaNome})\n   Proteína: ${item.gramasProteina}g\n`;
    if(item.acompanhamentos?.length) msg+=`   Acomp: ${item.acompanhamentos.map(a=>`${a.nome} (${a.gramas}g)`).join(', ')}\n`;
    msg+=item.seleta?`   Seleta: ${item.gramasSeleta}g\n`:`   Sem seleta\n`;
    if(item.obsPrato) msg+=`   📝 ${item.obsPrato}\n`;
    msg+=item.personalizado?`   ⚠️ PERSONALIZADO\n\n`:`   ${fmt(item.precoItem||item.precoBase)}\n\n`;
  });
  if(total){
    msg+=`*RESUMO:*\nSubtotal: ${fmt(total.baseTotal)}\n`;
    if(total.desconto>0) msg+=`Desconto ${(total.desconto*100).toFixed(0)}%: -${fmt(total.descValor)}\n`;
    if(total.extrasGrama>0) msg+=`Personalização: +${fmt(total.extrasGrama)}\n`;
    msg+=`Frete: ${freteValor>0?fmt(freteValor):'A calcular'}\n*TOTAL: ${fmt(total.total)}*\n\n`;
  }
  msg+=`*Pagamento:* ${pagamentoSel}\n`;
  if(linkMaps) msg+=`\n📍 *Localização:* ${linkMaps}\n`;
  if(obs) msg+=`\n📝 *Obs:* ${obs}\n`;
  return msg;
}
function getSemanaAtual(){
  const d=new Date(),onejan=new Date(d.getFullYear(),0,1);
  return `${d.getFullYear()}-W${String(Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7)).padStart(2,'0')}`;
}

/* ── UTILS ───────────────────────────────────────────────────── */
function salvarDados(){try{localStorage.setItem('dm_pedido',JSON.stringify({itensPedido,linhaLocked,pagamentoSel,freteValor,freteLabel,linkMaps}));}catch(e){}}
function carregarDadosSalvos(){try{const s=localStorage.getItem('dm_pedido');if(s){const d=JSON.parse(s);itensPedido=d.itensPedido||[];linhaLocked=d.linhaLocked||null;pagamentoSel=d.pagamentoSel||'';freteValor=d.freteValor||0;freteLabel=d.freteLabel||'—';linkMaps=d.linkMaps||'';}}catch(e){}}
function mostrarToast(msg){
  let el=document.getElementById('toast-msg');
  if(!el){el=document.createElement('div');el.id='toast-msg';el.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a3a16;color:#fff;padding:14px 24px;border-radius:30px;font-size:.95rem;z-index:99999;opacity:0;transition:opacity .3s;pointer-events:none;max-width:90vw;text-align:center;';document.body.appendChild(el);}
  el.textContent=msg;el.style.opacity='1';clearTimeout(el._t);el._t=setTimeout(()=>el.style.opacity='0',3500);
}
function toggleFaq(btn){const exp=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',!exp);btn.nextElementSibling.hidden=exp;}