// VARIÁVEIS GLOBAIS DE ESTADO (Preserva dados entre funções)
let itensPedido = [];
let limitePratos = 0;
let linhaBloqueada = false;
let freteCalculado = "Não calculado";
let linkMapsCliente = "Não fornecido";
const ORIGEM_COORD = { lat: -25.2155, lon: -57.5358 };

$(document).ready(function(){
    // ==========================================
    // 1. EFEITOS VISUAIS E CONFIGURAÇÕES
    // ==========================================
    $(window).scroll(function(){
        if(this.scrollY > 20) $('.navbar').addClass("sticky");
        else $('.navbar').removeClass("sticky");
        
        // Controle do botão flutuante
        if(this.scrollY > 500){
            $('.float-btn-order').addClass("show");
        }else{
            $('.float-btn-order').removeClass("show");
        }
    });

    $('.menu-btn').click(function(){
        $('.navbar .menu').toggleClass("active");
        $('.menu-btn i').toggleClass("active");
    });

    // Inicializa TODOS os carrosséis
    $('.carousel').owlCarousel({
        margin: 20, loop: true, autoplay: true, autoplayTimeOut: 4000, autoplayHoverPause: true,
        responsive: {
            0:{ items: 1, nav: false },
            600:{ items: 2, nav: false },
            1000:{ items: 3, nav: false }
        }
    });

    new Typed(".typing", {
        strings: ["Práticas", "Deliciosas", "Saudáveis", "Balanceadas", "Congeladas"],
        typeSpeed: 100, backSpeed: 60, loop: true
    });

    new Typed(".typing-2", {
        strings: ["Descanse", "Estude", "Divirta-se", "Veja Séries", "Estude +"],
        typeSpeed: 100, backSpeed: 60, loop: true
    });

    // Evento de troca de planos para atualizar valores
    $('.planos-btn').click(function(){
        const categoria = $(this).attr('id'); 
        $('.planos-btn').removeClass('active');
        $(this).addClass('active');
        updatePrices(categoria); 
    });

    carregarDadosSalvos();
});

// ==========================================
// 2. BANCO DE DADOS E MODAL
// ==========================================
function getNutri(tipo) {
    if(tipo === 'bovina') return [
        { item: "Carboidratos", qtd: "45g", vd: "15%" }, { item: "Proteínas", qtd: "35g", vd: "70%" },
        { item: "Gorduras Totais", qtd: "18g", vd: "28%" }, { item: "Sódio", qtd: "650mg", vd: "27%" }
    ];
    if(tipo === 'frango') return [
        { item: "Carboidratos", qtd: "40g", vd: "13%" }, { item: "Proteínas", qtd: "38g", vd: "76%" },
        { item: "Gorduras Totais", qtd: "10g", vd: "15%" }, { item: "Sódio", qtd: "580mg", vd: "24%" }
    ];
    if(tipo === 'suino') return [
        { item: "Carboidratos", qtd: "42g", vd: "14%" }, { item: "Proteínas", qtd: "36g", vd: "72%" },
        { item: "Gorduras Totais", qtd: "15g", vd: "22%" }, { item: "Sódio", qtd: "600mg", vd: "25%" }
    ];
    if(tipo === 'kids') return [
        { item: "Carboidratos", qtd: "30g", vd: "10%" }, { item: "Proteínas", qtd: "20g", vd: "40%" },
        { item: "Gorduras Totais", qtd: "8g", vd: "12%" }, { item: "Sódio", qtd: "300mg", vd: "12%" }
    ];
    return [];
}


const detalhesPratos = {
    // LINHA TRADICIONAL
    "trad1": { titulo: "Carne Moída Refogada", ingredientes: "Patinho moído (200g), cebola, alho, tomate, cheiro verde e temperos naturais da casa.", img: "img/carne-moída.webp", cal400: 590, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "trad2": { titulo: "Macarrão com Almôndega", ingredientes: "Massa de sêmola al dente, almôndegas de carne bovina (180g), molho de tomate artesanal e manjericão.", img: "img/macarrao-com-almondega.webp", cal400: 620, alergenos: "CONTÉM GLÚTEN E OVOS.", tabela: getNutri('bovina') },
    "trad3": { titulo: "Carne de Panela Desfiada", ingredientes: "Carne bovina magra cozida lentamente, desfiada com cebola e pimentão.", img: "img/carne-desfiada.webp", cal400: 585, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "trad4": { titulo: "Carré Suíno", ingredientes: "Corte de lombo suíno grelhado, marinado no limão, alho e ervas finas.", img: "img/carre-suino.webp", cal400: 615, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('suino') },
    "trad5": { titulo: "Frango em Cubos Cremoso", ingredientes: "Peito de frango (200g), creme de leite leve, milho verde e temperos verdes.", img: "img/frango-cremoso.webp", cal400: 570, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('frango') },
    "trad6": { titulo: "Sobrecoxa Assada", ingredientes: "Sobrecoxa desossada e marinada, assada até dourar com toque de páprica e limão.", img: "img/sobrecoxa.webp", cal400: 640, alergenos: "PODE CONTER SOJA.", tabela: getNutri('frango') },
    "trad7": { titulo: "Frango Desfiado", ingredientes: "Peito de frango (130g) cozido e desfiado, refogado com tomate, cebola e salsinha.", img: "img/frango-desfiado.webp", cal400: 460, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "trad8": { titulo: "Frango a Parmegiana", ingredientes: "Filé de frango empanado, coberto com molho de tomate natural e mussarela gratinada.", img: "img/parmegiana.webp", cal400: 710, alergenos: "CONTÉM GLÚTEN E LACTOSE.", tabela: getNutri('frango') },
    "trad9": { titulo: "Frango Xadrez", ingredientes: "Cubos de frango, pimentões coloridos, cebola, amido de milho, molho à base de shoyu.", img: "img/Frango Xadrez.webp", cal400: 520, alergenos: "CONTÉM SOJA.", tabela: getNutri('frango') },
    "trad10": { titulo: "Strogonoff de Frango", ingredientes: "Peito de frango em cubos (130g), molho cremoso, champignon e um toque de ketchup artesanal.", img: "img/strogonoff.webp", cal400: 680, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('frango') },

    // LINHA GOURMET
    "gourmet1": { titulo: "Frango Mostarda e Mel", ingredientes: "Filé de frango grelhado ao molho de mostarda dijon e mel silvestre.", img: "img/mostarda-e-mel.webp", cal400: 580, alergenos: "CONTÉM MOSTARDA.", tabela: getNutri('frango') },
    "gourmet2": { titulo: "Escalopinho ao Molho Madeira", ingredientes: "Iscas de carne bovina, molho madeira artesanal e cogumelos frescos.", img: "img/escalopinho.webp", cal400: 630, alergenos: "CONTÉM GLÚTEN (MOLHO).", tabela: getNutri('bovina') },
    "gourmet3": { titulo: "Bife Acebolado", ingredientes: "Bife de alcatra ou patinho grelhado com camadas de cebola caramelizada.", img: "img/bife acebolado.webp", cal400: 610, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "gourmet4": { titulo: "Lombo Suíno Agridoce", ingredientes: "Lombo fatiado ao molho de abacaxi e especiarias agridoces.", img: "img/lombo-suino.webp", cal400: 595, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('suino') },
    "gourmet5": { titulo: "Costelinha BBQ", ingredientes: "Costelinha suína cozida lentamente ao molho barbecue defumado.", img: "img/costelinha-barbecue.webp", cal400: 720, alergenos: "CONTÉM SOJA E CANELA.", tabela: getNutri('suino') },
    "gourmet6": { titulo: "Rocambole de Frango", ingredientes: "Frango moído temperado, recheado com queijo e presunto, assado ao forno.", img: "img/rocambole.webp", cal400: 600, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('frango') },
    "gourmet7": { titulo: "Escondidinho", ingredientes: "Purê de batata inglesa cremosa com recheio de carne seca ou bovina refogada.", img: "img/escondidinho.webp", cal400: 650, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('bovina') },
    "gourmet8": { titulo: "Charuto de Repolho", ingredientes: "Folhas de repolho recheadas com blend de carne bovina, arroz e temperos árabes.", img: "img/charuto.webp", cal400: 490, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "gourmet9": { titulo: "Strogonoff de Carne", ingredientes: "Tiras de carne bovina, molho de creme de leite, champignon e temperos.", img: "img/strogonoff-de-carne.webp", cal400: 730, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('bovina') },
    "gourmet10": { titulo: "Iscas ao Molho Mostarda", ingredientes: "Iscas de frango ou carne ao molho de mostarda suave e creme.", img: "img/iscas-de-frango.webp", cal400: 580, alergenos: "CONTÉM MOSTARDA.", tabela: getNutri('frango') },

    // LINHA FIT
    "fit1": { titulo: "Peito de Frango Grelhado", ingredientes: "Peito de frango (200g) grelhado no azeite de oliva e ervas finas.", img: "img/frango-grelhado.webp", cal400: 410, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "fit2": { titulo: "Escondidinho Batata Doce", ingredientes: "Purê de batata doce (baixo IG) com frango desfiado temperado com cúrcuma.", img: "img/escondidinho-batata-doce.webp", cal400: 440, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "fit3": { titulo: "Panqueca de Frango Fit", ingredientes: "Massa integral (aveia e ovos) recheada com frango desfiado e molho de tomate natural.", img: "img/panqueca-frango.webp", cal400: 430, alergenos: "CONTÉM GLÚTEN E OVOS.", tabela: getNutri('frango') },
    "fit4": { titulo: "Patinho Moído ao Sugo", ingredientes: "Patinho extra magro (200g) com molho de tomate caseiro e manjericão.", img: "img/patinho-sugo.webp", cal400: 420, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "fit5": { titulo: "Frango em Cubos Grelhado", ingredientes: "Cubos de peito de frango dourados sem óleo com tempero lemon pepper.", img: "img/frango-em-cubos-grelhado.webp", cal400: 410, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "fit6": { titulo: "Picadinho de Patinho", ingredientes: "Patinho magro em cubos cozido com cenoura, vagem e chuchu.", img: "img/picadinho-patinho.webp", cal400: 435, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },

    // LINHA KIDS
    "kids1": { titulo: "Nuggets Artesanais", ingredientes: "Peito de frango moído com cenoura ralada, empanado na farinha de milho e assado.", img: "img/nuggets.webp", cal400: 480, alergenos: "CONTÉM MILHO.", tabela: getNutri('kids') },
    "kids2": { titulo: "Hamburger Nutritivo", ingredientes: "Mini hambúrguer bovino caseiro com beterraba batida na massa para mais nutrientes.", img: "img/hamburger.webp", cal400: 510, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('kids') },
    "kids3": { titulo: "Almôndega Kids", ingredientes: "Almôndegas bovinas pequenas ao molho de tomate docinho (com cenoura batida).", img: "img/almondega.webp", cal400: 495, alergenos: "CONTÉM OVOS.", tabela: getNutri('kids') },
    "kids4": { titulo: "Panqueca Colorida", ingredientes: "Massa de panqueca colorida naturalmente com espinafre, recheada com frango.", img: "img/panqueca-kids.webp", cal400: 470, alergenos: "CONTÉM GLÚTEN E LACTOSE.", tabela: getNutri('kids') },
    "kids5": { titulo: "Escondidinho Colorido", ingredientes: "Purê de batata baroa (mandioquinha) com carne moída bem suave.", img: "img/escondidinho-kids.webp", cal400: 485, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('kids') }
};

function abrirDetalhes(id) {
    const prato = detalhesPratos[id];
    if (!prato) return;

    document.getElementById('modal-titulo').innerText = prato.titulo;
    // Trocamos a descrição fixa pela lista de ingredientes detalhada
    document.getElementById('modal-ingredientes').innerText = prato.ingredientes;
    
    // Atualiza para 400g
    const calSpan = document.getElementById('cal-400');
    if(calSpan) calSpan.innerText = prato.cal400;

    document.getElementById('modal-alergenos').innerText = prato.alergenos;

    const imgModal = document.getElementById('modal-img');
    if (imgModal) {
        imgModal.src = prato.img;
        imgModal.alt = prato.titulo;
    }

    // Tabela nutricional (mantém o padrão)
    const tbody = document.getElementById('tabela-nutricional');
    if (tbody) {
        tbody.innerHTML = prato.tabela.map(linha => `
            <tr>
                <td>${linha.item}</td>
                <td>${linha.qtd}</td>
                <td>${linha.vd}</td>
            </tr>
        `).join('');
    }

    document.getElementById('dish-modal').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('dish-modal').style.display = "none";
}

// ==========================================
// 3. LÓGICA DE PREÇOS (SEÇÃO PLANOS)
// ==========================================
function updatePrices(linha, elemento) {
    const data = {
        'tradicional': { s: ['₲ 420.000', '5% OFF', '₲ 399.000'], b: ['₲ 1.200.000', '5% OFF', '₲ 1.140.000'], l: ['₲ 1.680.000', '10% OFF', '₲ 1.512.000'] },
        'gourmet': { s: ['₲ 490.000', '5% OFF', '₲ 465.500'], b: ['₲ 1.400.000', '5% OFF', '₲ 1.330.000'], l: ['₲ 1.960.000', '10% OFF', '₲ 1.764.000'] },
        'kids': { s: ['₲ 350.000', '5% OFF', '₲ 332.500'], b: ['₲ 1.000.000', '5% OFF', '₲ 950.000'], l: ['₲ 1.400.000', '10% OFF', '₲ 1.260.000'] },
        'personalizada': { s: ['---', '---', 'Sob Consulta'], b: ['---', '---', 'Sob Consulta'], l: ['---', '---', 'Sob Consulta'] }
    };

    if (elemento) {
        document.querySelectorAll('.line-selector .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        elemento.classList.add('active');
    }

    const sel = data[linha];
    if(!sel) return;

    if(document.getElementById('old-semanal')){
        document.getElementById('old-semanal').innerText = sel.s[0];
        document.getElementById('desc-semanal').innerText = sel.s[1];
        document.getElementById('price-semanal').innerText = sel.s[2];
        
        document.getElementById('old-business').innerText = sel.b[0];
        document.getElementById('desc-business').innerText = sel.b[1];
        document.getElementById('price-business').innerText = sel.b[2];
        
        document.getElementById('old-libertad').innerText = sel.l[0];
        document.getElementById('desc-libertad').innerText = sel.l[1];
        document.getElementById('price-libertad').innerText = sel.l[2];
    }
}


// ==========================================
// 4. PERSONALIZAÇÃO E MONTAGEM DO PEDIDO
// ==========================================
function togglePersonalizado() {
    const chk = document.getElementById('is-personalizado');
    const isPerso = chk ? chk.checked : false;
    const gProtContainer = document.getElementById('g-prot-container');
    if(gProtContainer) gProtContainer.style.display = isPerso ? 'block' : 'none';
    const containersG = document.querySelectorAll('.g-acomp-container');
    containersG.forEach(div => div.style.display = isPerso ? 'block' : 'none');
}

const cardapios = {
    "Tradicional": ["Carne Moida Refogada", "Macarrão com Almôndega", "Carne de Panela Desfiada", "Carré Suíno", "Frango em Cubos Cremoso", "Sobrecoxa", "Frango Desfiado", "Frango a Parmegiana", "Frango Xadrez", "Strogonoff de Frango"],
    "Gourmet": ["Frango Mostarda e Mel", "Escalopinho de Alcatra ao Molho Madeira", "Bife Acebolado", "Lombo Suíno Agridoce", "Costelinha Suína ao molho Barbecue", "Rocambole de Frango Recheado", "Escondidinho de Carne Moída (Ou Frango)", "Charuto de Repolho e Carne Moída (ou frango)", "Strogonoff de Carne Bovina", "Iscas de Frango ao Molho Mostarda"],
    "Kids": ["Nugget de frango enriquecido com Legumes", "Hamburger de Frango ou Carne enriquecido com Legumes", "Almôndega de Frango ou Carne Enriquecido com Legumes", "Panqueca recheada de frango ou carne enriquecida com Legumes", "Escondidinho Colorido"],
    "Fit": ["Peito de Frango Grelhado", "Escondidinho de Batata Doce e Frango", "Panqueca de Frango", "Patinho Moído ao Sugo", "Frango em Cubos Grelhado", "Picadinho de Patinho com Legumes"],
    "acompanhamentos_base": ["Arroz", "Feijão", "Macarrão", "Purê de Batata", "Purê de Batata Doce", "Purê de Mandioca", "Seleta de Legumes"]
};

function configurarPlano(isLoading = false) {
    const planoSelect = document.getElementById('plano-selecionado');
    if(!planoSelect) return;
    const plano = planoSelect.value;
    const limites = { "Individual": 13, "Mensal": 14, "FDS": 10, "Semanal": 14 };
    if (!isLoading && itensPedido.length > 0) {
        if (!confirm("Mudar de plano limpará o carrinho. Continuar?")) return;
        itensPedido = [];
        linhaBloqueada = false;
        document.getElementById('linha-escolhida').disabled = false;
    }
    limitePratos = limites[plano] || 0;
    document.getElementById('limite-txt').innerText = plano === "Individual" ? "13" : limitePratos;
    document.getElementById('progresso').max = plano === "Individual" ? 13 : limitePratos;
    document.getElementById('controles-prato').style.display = plano ? 'block' : 'none';
    atualizarOpcoesItens();
    renderizarCarrinho();
}

function atualizarOpcoesItens() {
    const linhaSelect = document.getElementById('linha-escolhida');
    const protSelect = document.getElementById('select-proteina');
    const acompDiv = document.getElementById('lista-acompanhamentos');
    const isPerso = document.getElementById('is-personalizado') ? document.getElementById('is-personalizado').checked : false;
    if (!cardapios[linhaSelect.value]) return;
    protSelect.innerHTML = cardapios[linhaSelect.value].map(p => `<option value="${p}">${p}</option>`).join('');
    acompDiv.innerHTML = cardapios.acompanhamentos_base.map(a => `
        <div class="acomp-item">
            <div class="acomp-check">
                <input type="checkbox" name="acomp" value="${a}" id="ac-${a}" onchange="limitarAcompanhamentos()">
                <label for="ac-${a}">${a}</label>
            </div>
            <div class="g-acomp-container" style="display:${isPerso ? 'block' : 'none'}; margin-left: 20px;">
                <input type="number" class="g-acomp" placeholder="Qtd (g)" style="width:70px; padding:3px;">
            </div>
        </div>`).join('');
}

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
    if (itensPedido.length >= limitePratos && limitePratos > 0) return;
    const linha = document.getElementById('linha-escolhida').value;
    const prot = document.getElementById('select-proteina').value;
    const isPerso = document.getElementById('is-personalizado') ? document.getElementById('is-personalizado').checked : false;
    const gProt = document.getElementById('g-prot')?.value || ""; 
    const checks = document.querySelectorAll('input[name="acomp"]:checked');
    if (checks.length === 0) { alert("Escolha os acompanhamentos!"); return; }
    if (document.getElementById('plano-selecionado').value !== "Individual" && !linhaBloqueada) {
        linhaBloqueada = true;
        document.getElementById('linha-escolhida').disabled = true;
    }
    let acompTexto = [];
    checks.forEach(c => {
        let txt = c.value;
        if (isPerso) {
            const gInput = c.closest('.acomp-item').querySelector('.g-acomp');
            const gVal = gInput && gInput.value ? gInput.value : '0';
            txt += ` (${gVal}g)`;
        }
        acompTexto.push(txt);
    });
    const infoProt = isPerso && gProt ? ` (${gProt}g)` : "";
    const detalheFinal = `${prot}${infoProt} + ${acompTexto.join(', ')}`;
    itensPedido.push({ linha: isPerso ? `${linha} (Personalizado)` : linha, detalhe: detalheFinal });
    renderizarCarrinho();
    salvarDadosLocalmente();
    const toast = $('<div class="toast-success">Prato adicionado ao seu plano!</div>');
    $('body').append(toast);
    toast.fadeIn().delay(1500).fadeOut(function() { $(this).remove(); });
}

function repetirPrato(i) {
    // Verifica se pode adicionar mais um
    if (limitePratos > 0 && itensPedido.length >= limitePratos) {
        alert("Limite de pratos do plano atingido!");
        return;
    }

    // Cria uma cópia profunda do objeto para evitar que um altere o outro
    const novoItem = JSON.parse(JSON.stringify(itensPedido[i]));
    itensPedido.push(novoItem);

    // Atualiza interface e salva
    renderizarCarrinho();
    salvarDadosLocalmente();
}

function removerPrato(i) {
    itensPedido.splice(i, 1);
    
    // Se o carrinho esvaziar, libera a troca de linha
    if (itensPedido.length === 0) {
        linhaBloqueada = false;
        const linhaSel = document.getElementById('linha-escolhida');
        if(linhaSel) linhaSel.disabled = false;
    }
    
    renderizarCarrinho();
    salvarDadosLocalmente();
}

function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-itens');
    const atualSpan = document.getElementById('atual');
    const progressoBar = document.getElementById('progresso');
    
    if(!lista) return;

    // Gera o HTML dos itens
    lista.innerHTML = itensPedido.map((p, i) => `
        <li style="border-bottom: 1px solid #eee; padding: 10px 0; list-style:none;">
            <div style="font-size: 14px;"><b>${i+1}.</b> [${p.linha}] ${p.detalhe}</div>
            <div style="margin-top: 5px; display: flex; gap: 10px;">
                <button type="button" onclick="repetirPrato(${i})" style="background:#2D5A27; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; font-size:11px;">
                    <i class="fas fa-copy"></i> Repetir
                </button>
                <button type="button" onclick="removerPrato(${i})" style="background:#ff4d4d; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; font-size:11px;">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
        </li>`).join('');

    // Atualiza contadores
    if(atualSpan) atualSpan.innerText = itensPedido.length;
    if(progressoBar) progressoBar.value = itensPedido.length;

    // Lógica do botão de finalizar (WhatsApp)
    const plano = document.getElementById('plano-selecionado')?.value;
    const pronto = (limitePratos > 0 && itensPedido.length === limitePratos) || (plano === "Individual" && itensPedido.length > 0);
    
    const btnZap = document.getElementById('btn-whatsapp');
    if(btnZap) {
        btnZap.disabled = !pronto;
        btnZap.className = pronto ? "btn-zap-ativo" : "disabled";
    }
}


// ==========================================
// 5. LOCALSTORAGE E ENVIO WHATSAPP
// ==========================================

function obterLocalizacaoEFrete() {
    // Tenta encontrar o botão pelo ID ou pela Classe (garantindo que funcione)
    const btn = document.getElementById('btn-calcular-frete') || document.querySelector('.btn-frete');
    
    if(btn) btn.innerText = "Obtendo localização...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // 1. Calcula o frete
            const resultado = calcularFreteDistancia(lat, lon);
            
            // 2. Guarda nas variáveis globais (importante para o WhatsApp ler depois)
            freteCalculado = `₲ ${resultado.preco.toLocaleString('es-PY')} (${resultado.distancia} km)`;
            
            // 3. CORREÇÃO DO LINK: Agora usando o padrão universal do Google Maps
            linkMapsCliente = `https://www.google.com/maps?q=${lat},${lon}`;
            
            // 4. Atualiza a tela para o cliente
            const display = document.getElementById('valor-frete-display');
            if(display) {
                display.innerText = freteCalculado;
                display.style.color = "#2D5A27";
                display.style.fontWeight = "bold";
            }
            
            if(btn) btn.innerText = "Frete Calculado!";

        }, function(error) {
            console.error(error);
            alert("Erro: Por favor, ative o GPS do seu celular/navegador para calcular o frete.");
            if(btn) btn.innerText = "Tentar Novamente";
        }, { enableHighAccuracy: true }); // Força maior precisão do GPS
    } else {
        alert("Seu navegador não suporta geolocalização.");
    }
}

function salvarDadosLocalmente() {
    const dados = {
        itens: itensPedido,
        plano: document.getElementById('plano-selecionado').value,
        linha: document.getElementById('linha-escolhida').value,
        linhaBloqueada: linhaBloqueada,
        obs: document.getElementById('observacoes-gerais')?.value || ""
    };
    localStorage.setItem('donaMaria_pedido', JSON.stringify(dados));
}

function carregarDadosSalvos() {
    const salvos = localStorage.getItem('donaMaria_pedido');
    if (salvos) {
        const d = JSON.parse(salvos);
        const planoSel = document.getElementById('plano-selecionado');
        if(planoSel) planoSel.value = d.plano;
        configurarPlano(true);
        itensPedido = d.itens;
        linhaBloqueada = d.linhaBloqueada;
        const linhaSel = document.getElementById('linha-escolhida');
        if(linhaSel) {
            linhaSel.value = d.linha;
            linhaSel.disabled = linhaBloqueada;
        }
        if(d.obs && document.getElementById('observacoes-gerais')) {
            document.getElementById('observacoes-gerais').value = d.obs;
        }
        renderizarCarrinho();
    }
}

function enviarPedidoZap() {
    const plano = document.getElementById('plano-selecionado')?.value || "Não selecionado";
    const obs = document.getElementById('observacoes-gerais')?.value || "NENHUMA";
    
    let msg = `*NOVO PEDIDO - DONA MARIA*\n`;
    msg += `*Plano:* ${plano}\n\n`;
    
    msg += `*ITENS ESCOLHIDOS:*\n`;
    if (typeof itensPedido !== 'undefined' && itensPedido.length > 0) {
        itensPedido.forEach((p, i) => {
            msg += `*${i+1}.* [${p.linha}] ${p.detalhe}\n`;
        });
    } else {
        msg += `Nenhum item selecionado\n`;
    }
    
    msg += `\n*ENTREGA E LOCALIZAÇÃO:*\n`;
    msg += `*Valor do Frete:* ${freteCalculado}\n`;
    msg += `*Mapa do Cliente:* ${linkMapsCliente}\n\n`;
    
    msg += `*Observações:* ${obs}`;

    const url = `https://wa.me/595991635604?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// Lógica FAQ
$(document).ready(function(){
    $('.faq .toggle').on('click', function(){
        const parent = $(this).parent();
        if (parent.hasClass('active')) {
            parent.removeClass('active');
        } else {
            $('.faq .wrapper').removeClass('active');
            parent.addClass('active');
        }
    });
});

// ==========================================
// 6. CALCULADORA DE FRETE (MRA - Paraguay)
// ==========================================
function calcularFreteDistancia(latDest, lonDest) {
    const R = 6371; // Raio da Terra em km
    const dLat = (latDest - ORIGEM_COORD.lat) * Math.PI / 180;
    const dLon = (lonDest - ORIGEM_COORD.lon) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(ORIGEM_COORD.lat * Math.PI / 180) * Math.cos(latDest * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c;

    let precoFrete = 0;
    if (distancia <= 2) precoFrete = 8000;
    else if (distancia <= 3) precoFrete = 10000;
    else if (distancia <= 5) precoFrete = 15000;
    else precoFrete = 15000 + (Math.ceil(distancia - 5) * 3000);

    return { 
        distancia: distancia.toFixed(1), 
        preco: precoFrete 
    };
}