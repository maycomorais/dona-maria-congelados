$(document).ready(function(){
    // ==========================================
    // 1. EFEITOS VISUAIS (NAVBAR E TYPING)
    // ==========================================
    $(window).scroll(function(){
        if(this.scrollY > 20){
            $('.navbar').addClass("sticky");
        }else{
            $('.navbar').removeClass("sticky");
        }
    });

    $('.menu-btn').click(function(){
        $('.navbar .menu').toggleClass("active");
        $('.menu-btn i').toggleClass("active");
    });

    var typed = new Typed(".typing", {
        strings: ["Práticas", "Deliciosas", "Saudáveis", "Balanceadas", "Congeladas"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    var typed2 = new Typed(".typing-2", {
        strings: ["Coma bem", "Desfrute", "Descanse", "Estude"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    $('.carousel').owlCarousel({
        margin: 20, loop: true, autoplay: true, autoplayTimeOut: 3000, autoplayHoverPause: true,
        responsive: { 0:{ items: 1, nav: false }, 600:{ items: 2, nav: false }, 1000:{ items: 3, nav: false } }
    });

    // CARREGAR DADOS SALVOS AO INICIAR
    carregarDadosSalvos();
});

// ==========================================
// 2. BANCO DE DADOS E VARIÁVEIS GLOBAIS
// ==========================================
const cardapios = {
    "Tradicional": ["Carne Moída Refogada", "Macarrão com Almôndega", "Carne de Panela Desfiada", "Carré Suíno", "Frango em Cubos", "Sobrecoxa", "Frango Desfiado", "Frango a Parmegiana", "Frango Xadrez", "Strogonoff de Frango"],
    "Gourmet": ["Frango Mostarda e Mel", "Escalopinho de Alcatra ao Molho Madeira", "Bife Acebolado", "Lombo Suíno Agridoce", "Costelinha Suína ao molho Barbecue", "Rocambole de Frango", "Escondidinho de Carne Moída (Ou Frango)", "Charuto de Repolho e Carne Moída (ou frango)", "Strogonoff de Carne", "Iscas de Frango ao Molho Mostarda"],
    "Kids": ["Nugget de frango enriquecido com Legumes", "Hamburger de Frango ou Carne enriquecido com Legumes", "Almôndega de Frango ou Carne Enriquecido com Legumes", "Panqueca recheada de frango ou carne enriquecida com Legumes", "Escondidinho Colorido"],
    "Fit": ["Peito de Frango Grelhado", "Escondidinho de Batata Doce e Frango", "Crepioca de Frango", "Patinho Moído ao Sugo", "Frango em Cubos Grelhado", "Picadinho de Patinho com Legumes", "Torta de Frango com Massa de Grão de Bico", "Lombo Suíno em Cubos"],
    "acompanhamentos_base": ["Feijão", "Arroz", "Macarrão", "Purê de Batata", "Purê de Batata Doce", "Purê de Mandioca", "Seleta de Legumes"]
};

let itensPedido = [];
let limitePratos = 0;
let linhaBloqueada = false;

// ==========================================
// 3. PERSISTÊNCIA DE DADOS (LOCALSTORAGE)
// ==========================================
function salvarDadosLocalmente() {
    const dados = {
        itens: itensPedido,
        plano: document.getElementById('plano-selecionado').value,
        linha: document.getElementById('linha-escolhida').value,
        linhaBloqueada: linhaBloqueada,
        obs: document.getElementById('observacoes-gerais') ? document.getElementById('observacoes-gerais').value : ""
    };
    localStorage.setItem('donaMaria_pedido', JSON.stringify(dados));
}

function carregarDadosSalvos() {
    const salvos = localStorage.getItem('donaMaria_pedido');
    if (salvos) {
        const dados = JSON.parse(salvos);
        document.getElementById('plano-selecionado').value = dados.plano;
        configurarPlano(true); // true para evitar o confirm inicial
        itensPedido = dados.itens;
        linhaBloqueada = dados.linhaBloqueada;
        document.getElementById('linha-escolhida').value = dados.linha;
        document.getElementById('linha-escolhida').disabled = linhaBloqueada;
        if(dados.obs && document.getElementById('observacoes-gerais')) document.getElementById('observacoes-gerais').value = dados.obs;
        renderizarCarrinho();
    }
}

// ==========================================
// 4. LÓGICA DO SISTEMA DE PEDIDOS
// ==========================================
function configurarPlano(isLoading = false) {
    const plano = document.getElementById('plano-selecionado').value;
    const limites = { "Individual": 13, "Mensal": 14, "FDS": 10, "Semanal": 14 };
    
    if (!isLoading && itensPedido.length > 0) {
        if (confirm("Mudar de plano limpará sua lista atual. Deseja continuar?")) {
            itensPedido = [];
            linhaBloqueada = false;
            document.getElementById('linha-escolhida').disabled = false;
            localStorage.removeItem('donaMaria_pedido');
        } else { return; }
    }

    limitePratos = limites[plano] || 0;
    document.getElementById('limite-txt').innerText = limitePratos;
    document.getElementById('progresso').max = limitePratos;
    document.getElementById('controles-prato').style.display = plano ? 'block' : 'none';
    
    const aviso = document.getElementById('aviso-linha');
    if(aviso) aviso.style.display = (plano !== "Individual") ? "block" : "none";
    
    atualizarOpcoesItens();
    renderizarCarrinho();
}

function atualizarOpcoesItens() {
    const linha = document.getElementById('linha-escolhida').value;
    const protSelect = document.getElementById('select-proteina');
    const acompDiv = document.getElementById('lista-acompanhamentos');
    const isPerso = document.getElementById('is-personalizado').checked;

    protSelect.innerHTML = cardapios[linha].map(p => `<option value="${p}">${p}</option>`).join('');
    
    acompDiv.innerHTML = cardapios.acompanhamentos_base.map(a => `
        <div class="acomp-item">
            <div class="acomp-check">
                <input type="checkbox" name="acomp" value="${a}" id="ac-${a}" onchange="limitarAcompanhamentos()">
                <label for="ac-${a}">${a}</label>
            </div>
            <div class="g-acomp-container" style="display:${isPerso ? 'block' : 'none'}">
                <input type="number" class="g-acomp" placeholder="g">
            </div>
        </div>
    `).join('');
}

// BLOQUEIA SELEÇÃO APÓS 3 ITENS
function limitarAcompanhamentos() {
    const checks = document.querySelectorAll('input[name="acomp"]');
    const selecionados = document.querySelectorAll('input[name="acomp"]:checked');

    checks.forEach(check => {
        if (selecionados.length >= 3 && !check.checked) {
            check.disabled = true;
            check.parentElement.style.opacity = "0.5";
        } else {
            check.disabled = false;
            check.parentElement.style.opacity = "1";
        }
    });
}

function adicionarPratoLista() {
    if (itensPedido.length >= limitePratos) { alert("Limite do plano atingido!"); return; }

    const plano = document.getElementById('plano-selecionado').value;
    const linha = document.getElementById('linha-escolhida').value;
    const prot = document.getElementById('select-proteina').value;
    const isPerso = document.getElementById('is-personalizado').checked;
    const gProt = document.getElementById('g-prot').value;
    const checks = document.querySelectorAll('input[name="acomp"]:checked');

    if (checks.length === 0) { alert("Escolha pelo menos 1 acompanhamento."); return; }

    if (plano !== "Individual" && !linhaBloqueada) {
        linhaBloqueada = true;
        document.getElementById('linha-escolhida').disabled = true;
    }

    let acompTexto = [];
    checks.forEach(c => {
        let txt = c.value;
        if (isPerso) {
            const g = c.closest('.acomp-item').querySelector('.g-acomp').value;
            txt += ` (${g || 0}g)`;
        }
        acompTexto.push(txt);
    });

    itensPedido.push({
        linha: isPerso ? `${linha} (Pers.)` : linha,
        detalhe: `${prot}${isPerso ? ' ('+gProt+'g)' : ''} + ${acompTexto.join(', ')}`
    });

    renderizarCarrinho();
    salvarDadosLocalmente(); //
}

function repetirPrato(i) {
    if (itensPedido.length >= limitePratos) { alert("Limite do plano atingido!"); return; }
    itensPedido.push({...itensPedido[i]});
    renderizarCarrinho();
    salvarDadosLocalmente(); //
}

function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-itens');
    const plano = document.getElementById('plano-selecionado').value;
    
    lista.innerHTML = itensPedido.map((p, i) => `
        <li style="border-bottom: 1px solid #eee; padding: 10px 0;">
            <div style="font-size: 14px;"><b>${i+1}.</b> [${p.linha}] ${p.detalhe}</div>
            <div style="margin-top: 5px;">
                <button onclick="repetirPrato(${i})" style="background:#2D5A27; color:white; border:none; padding:3px 10px; cursor:pointer; border-radius:4px; font-size:11px; margin-right:5px;">Repetir</button>
                <button onclick="removerPrato(${i})" style="background:#ff4d4d; color:white; border:none; padding:3px 10px; cursor:pointer; border-radius:4px; font-size:11px;">Remover</button>
            </div>
        </li>
    `).join('');

    document.getElementById('atual').innerText = itensPedido.length;
    document.getElementById('progresso').value = itensPedido.length;

    const pronto = (itensPedido.length === limitePratos && limitePratos > 0) || (plano === "Individual" && itensPedido.length > 0);
    const btnZap = document.getElementById('btn-whatsapp');
    if(btnZap) {
        btnZap.disabled = !pronto;
        btnZap.className = pronto ? "btn-zap-ativo" : "disabled";
    }
}

function removerPrato(i) {
    itensPedido.splice(i, 1);
    if (itensPedido.length === 0) {
        linhaBloqueada = false;
        document.getElementById('linha-escolhida').disabled = false;
    }
    renderizarCarrinho();
    salvarDadosLocalmente(); //
}

function enviarPedidoZap() {
    const plano = document.getElementById('plano-selecionado').value;
    const obs = document.getElementById('observacoes-gerais') ? document.getElementById('observacoes-gerais').value : "";
    let msg = `*NOVO PEDIDO - DONA MARIA*\n*Plano:* ${plano}\n\n`;
    itensPedido.forEach((p, i) => { msg += `*${i+1}.* ${p.detalhe}\n`; });
    if (obs.trim() !== "") msg += `\n*Obs:* ${obs}`;

    window.open(`https://wa.me/595991635604?text=${encodeURIComponent(msg)}`, '_blank');
    localStorage.removeItem('donaMaria_pedido'); // Limpa após envio
}

function togglePersonalizado() {
    const isPerso = document.getElementById('is-personalizado').checked;
    document.getElementById('g-prot-container').style.display = isPerso ? 'block' : 'none';
    document.querySelectorAll('.g-acomp-container').forEach(div => div.style.display = isPerso ? 'block' : 'none');
}

// ==========================================
// 5. MODAL (NUTRIÇÃO)
// ==========================================
function abrirDetalhes(id) { /* Função de modal conforme sua necessidade */ }
function fecharModal() { document.getElementById('dish-modal').style.display = "none"; }