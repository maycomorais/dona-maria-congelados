// VARIÁVEIS GLOBAIS DE ESTADO 
let itensPedido = [];
let limitePratos = 0;
let linhaBloqueada = false;
let freteCalculado = "Não calculado";
let valorFreteNumerico = 0;
let linkMapsCliente = "";
const ORIGEM_COORD = { lat: -25.240629, lon: -57.541956 };

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

    // Monitora quando alguém clica nos acompanhamentos base
    $(document).on('change', 'input[name="acomp_base"]', function() {
        var limite = 2;
        var quantidadeMarcada = $('input[name="acomp_base"]:checked').length;

        // Se já marcou 2, desabilita (deixa cinza) os que não estão marcados
        if (quantidadeMarcada >= limite) {
            $('input[name="acomp_base"]:not(:checked)').prop('disabled', true).parent().css('opacity', '0.5');
        } else {
            // Se tem menos de 2 marcados, libera tudo novamente
            $('input[name="acomp_base"]').prop('disabled', false).parent().css('opacity', '1');
        }
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

    // 1. Gramas da Proteína
    const gProtContainer = document.getElementById('g-prot-container');
    if (gProtContainer) gProtContainer.style.display = isPerso ? 'block' : 'none';

    // 2. Gramas de todos os acompanhamentos (Arroz, Feijão, etc)
    const camposGrama = document.querySelectorAll('.g-acomp');
    camposGrama.forEach(input => {
        input.style.display = isPerso ? 'inline-block' : 'none';
    });
    
    // 3. Ajuste específico para a Seleta
    const gSeleta = document.getElementById('g-seleta');
    if (gSeleta) {
        const seletaSim = document.querySelector('input[name="escolha_seleta"][value="Sim"]').checked;
        gSeleta.style.display = (isPerso && seletaSim) ? 'inline-block' : 'none';
    }
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
    const acompDiv = document.getElementById('base-sides'); // Corrigido para o seu HTML
    
    if (!linhaSelect || !protSelect || !acompDiv) return;

    const linha = linhaSelect.value;
    if (!cardapios[linha]) return;

    protSelect.innerHTML = cardapios[linha].map(p => `<option value="${p}">${p}</option>`).join('');

    const isPerso = document.getElementById('is-personalizado')?.checked;
    acompDiv.innerHTML = cardapios.acompanhamentos_base.map(a => `
        <div class="acomp-item-wrapper">
            <label class="option-item">
                <input type="checkbox" name="acomp_base" value="${a}"> <span>${a}</span>
            </label>
            <input type="number" class="g-acomp" placeholder="Gramas" style="display:${isPerso ? 'block' : 'none'}; width: 80px; margin-top: 5px; margin-left: 25px;">
        </div>`).join('');
}


function adicionarPratoLista() {
    // 1. Validação de Limite de Pratos
    if (itensPedido.length >= limitePratos && limitePratos > 0) {
        alert("Você já atingiu o limite de pratos do seu plano!");
        return;
    }

    const linha = document.getElementById('linha-escolhida').value;
    const prot = document.getElementById('select-proteina').value;
    const isPerso = document.getElementById('is-personalizado') ? document.getElementById('is-personalizado').checked : false;
    const gProt = document.getElementById('g-prot')?.value || ""; 

    // 2. Coleta Acompanhamentos Base
    const checksBase = document.querySelectorAll('input[name="acomp_base"]:checked');
    if (checksBase.length === 0) { 
        alert("Escolha pelo menos 1 acompanhamento base!"); 
        return; 
    }

    // 3. Coleta Seleta de Legumes
    const escolhaSeleta = document.querySelector('input[name="escolha_seleta"]:checked').value;
    
    // 4. Montagem do texto dos Acompanhamentos com Gramas (Padrão para o Cálculo)
    let acompTexto = [];
    checksBase.forEach(c => {
        let txt = c.value;
        if (isPerso) {
            const gInput = c.closest('.acomp-item-wrapper').querySelector('.g-acomp');
            const gVal = gInput && gInput.value ? gInput.value : '0';
            // Importante: Mantemos o nome do item colado no parênteses para o Regex
            txt += ` (${gVal}g)`;
        }
        acompTexto.push(txt);
    });

    // 5. Montagem da Seleta (Padrão para o Cálculo)
    let textoSeleta = "";
    if (escolhaSeleta === "Sim") {
        const gSeletaVal = document.getElementById('g-seleta')?.value || "0";
        textoSeleta = isPerso ? `+ Seleta de Legumes (${gSeletaVal}g)` : "+ Seleta de Legumes";
    } else {
        textoSeleta = "(sem seleta)";
    }

    // 6. Bloqueio de Linha para planos fixos (Exceto Individual)
    if (document.getElementById('plano-selecionado').value !== "Individual" && !linhaBloqueada) {
        linhaBloqueada = true;
        document.getElementById('linha-escolhida').disabled = true;
    }

    // 7. Formatação Final (Garante que a Proteína seja o primeiro item para o cálculo)
    const infoProt = (isPerso && gProt) ? ` (${gProt}g)` : "";
    const detalheFinal = `${prot}${infoProt} + ${acompTexto.join(', ')} ${textoSeleta}`;

    // 8. Salva e Renderiza
    itensPedido.push({ 
        linha: isPerso ? `${linha} (Personalizado)` : linha, 
        detalhe: detalheFinal 
    });

    renderizarCarrinho();
    salvarDadosLocalmente();

    // 9. Reset do Formulário
    document.querySelectorAll('input[name="acomp_base"]').forEach(i => i.checked = false);
    document.querySelectorAll('.g-acomp').forEach(i => i.value = ""); 
    if(document.getElementById('g-prot')) document.getElementById('g-prot').value = ""; 
    document.querySelector('input[name="escolha_seleta"][value="Sim"]').checked = true; 
    
    document.querySelectorAll('input[name="acomp_base"]').forEach(i => {
        i.disabled = false;
        if(i.parentElement) i.parentElement.style.opacity = "1";
    });

    // Feedback Visual (Toast)
    const toast = $('<div class="toast-success" style="position:fixed; bottom:20px; right:20px; background:#2D5A27; color:white; padding:15px; border-radius:5px; z-index:9999;">Prato adicionado ao seu plano!</div>');
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
    const btn = document.getElementById('btn-calcular-frete');
    const displayValor = document.getElementById('valor-frete-display');
    const displayInfo = document.getElementById('resultado-frete');
    const spanDistancia = document.getElementById('distancia-km');
    const spanValor = document.getElementById('valor-frete');

    if(btn) btn.innerText = "Obtendo localização...";

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            const resultado = calcularFreteDistancia(lat, lon);
        
            valorFreteNumerico = resultado.preco; 
            freteCalculado = `Gs ${resultado.preco.toLocaleString('es-PY')} (${resultado.distancia} km)`;
            linkMapsCliente = `http://googleusercontent.com/maps.google.com/?q=${lat},${lon}`;

            if(displayValor) displayValor.innerText = freteCalculado;
            if(spanDistancia) spanDistancia.innerText = resultado.distancia;
            if(spanValor) spanValor.innerText = `Gs ${resultado.preco.toLocaleString('es-PY')}`;
            if(displayInfo) displayInfo.style.display = 'block';
            
            if(btn) {
                btn.innerText = "Frete Calculado!";
                btn.style.background = "#2D5A27";
            }

        }, function(error) {
            console.error(error);
            alert("Erro ao obter GPS. Verifique a permissão.");
            if(btn) btn.innerText = "Tentar Novamente";
        }, { enableHighAccuracy: true, timeout: 10000 });
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

async function enviarPedidoZap() {
    const nome = document.getElementById('cliente-nome')?.value;
    const ddi = document.getElementById('cliente-ddi')?.value;
    const tel = document.getElementById('cliente-tel')?.value;
    const pag = document.getElementById('forma-pagamento')?.value;
    const planoNome = document.getElementById('plano-selecionado')?.value;
    const linhaSelecionada = document.getElementById('linha-escolhida')?.value; // Necessário para cálculo do pacote
    const obsGerais = document.getElementById('observacoes-gerais')?.value || "Nenhuma";

    // 1. Tabela de Preços Unitários
    const precosLinha = { 
        "Tradicional": 30000, 
        "Gourmet": 35000, 
        "Fit": 35000, 
        "Kids": 28000 
    };

    // 2. Validações
    let erros = [];
    if (!nome) erros.push("Seu Nome");
    if (!tel) erros.push("Telefone");
    if (!pag) erros.push("Forma de Pagamento");
    if (!linkMapsCliente) erros.push("Localização (Calcule o Frete)");
    if (itensPedido.length < limitePratos) erros.push(`Faltam pratos (Carrinho tem ${itensPedido.length})`);

    if (erros.length > 0) {
        alert("Corrija os erros:\n- " + erros.join("\n- "));
        return;
    }

    // 3. Processamento do Carrinho (Agrupamento e Extras)
    let somaPratosCarrinho = 0; // Usado apenas para Individual/Semanal
    let totalPersonalizacao = 0;
    const pedidosAgrupados = {};

    itensPedido.forEach(item => {
        // Limpa o nome para pegar preço unitário
        const nomeLinhaLimpa = item.linha.replace(" (Personalizado)", "").trim();
        somaPratosCarrinho += precosLinha[nomeLinhaLimpa] || 0;

        // Calcula gramas extras (Personalização sempre se paga a parte, referente ao que escolheu agora)
        if (item.linha.includes("Personalizado")) {
            totalPersonalizacao += calcularTaxaGrama(item.detalhe);
        }

        // Agrupa para visualização
        const chave = `${item.linha}|${item.detalhe}`;
        if (pedidosAgrupados[chave]) {
            pedidosAgrupados[chave].qtd += 1;
        } else {
            let partes = item.detalhe.split(' + ');
            let proteinaTexto = partes[0]; 
            let acompTexto = partes.length > 1 ? partes.slice(1).join(' + ') : "Sem acompanhamentos";

            pedidosAgrupados[chave] = { 
                textoCompleto: item.detalhe, 
                linha: item.linha, 
                qtd: 1,
                proteina: proteinaTexto,      
                acompanhamentos: acompTexto   
            };
        }
    });

    // 4. LÓGICA DE PREÇIFICAÇÃO (Regra de Negócio Corrigida)
    let valorFinalRefeicoes = 0;
    let descricaoPreco = ""; // Para mostrar no Zap como foi calculado

    // Preço base da linha principal escolhida no dropdown
    const precoUnitarioBase = precosLinha[linhaSelecionada] || 30000; 

    if (planoNome === "Mensal") {
        // MENSAL: Cobra 56 marmitas com 10% de desconto
        const totalSemDesconto = precoUnitarioBase * 56;
        valorFinalRefeicoes = totalSemDesconto * 0.90; // Aplica 10%
        descricaoPreco = `Plano Mensal (56 un. x Gs ${precoUnitarioBase/1000}k) - 10%`;
    } 
    else if (planoNome === "FDS") {
        // FDS: Cobra 40 marmitas com 5% de desconto
        const totalSemDesconto = precoUnitarioBase * 40;
        valorFinalRefeicoes = totalSemDesconto * 0.95; // Aplica 5%
        descricaoPreco = `Plano FDS (40 un. x Gs ${precoUnitarioBase/1000}k) - 5%`;
    } 
    else if (planoNome === "Semanal") {
        // SEMANAL: Soma do carrinho (14 un.) com 5% de desconto
        valorFinalRefeicoes = somaPratosCarrinho * 0.95;
        descricaoPreco = `Plano Semanal (14 un.) - 5%`;
    } 
    else {
        // INDIVIDUAL: Soma pura do carrinho
        valorFinalRefeicoes = somaPratosCarrinho;
        descricaoPreco = `Pedidos Avulsos`;
    }

    // Soma Final (Plano + Extras + Frete)
    const totalGeral = valorFinalRefeicoes + totalPersonalizacao + valorFreteNumerico;

    // 5. Prepara Lista para Planilha
    let listaParaPlanilha = [];
    for (const k in pedidosAgrupados) {
        listaParaPlanilha.push({
            linha: pedidosAgrupados[k].linha,
            qtd: pedidosAgrupados[k].qtd,
            proteina: pedidosAgrupados[k].proteina,
            acompanhamentos: pedidosAgrupados[k].acompanhamentos
        });
    }

    // 6. Envia para Planilha
    salvarNoSheets(nome, ddi+tel, planoNome, totalGeral, listaParaPlanilha);

    // 7. Monta Mensagem WhatsApp
    let msg = `Olá! Gostaria de fazer um pedido:\n\n*Cliente:* ${nome}\n*Plano:* ${planoNome}\n*Linha:* ${linhaSelecionada}\n*Telefone:* ${ddi}${tel}\n*Maps:* ${linkMapsCliente}\n\n*--- PRATOS DA SEMANA ---*\n`;

    for (const k in pedidosAgrupados) {
        const i = pedidosAgrupados[k];
        msg += `*[${i.linha}] ${i.textoCompleto}*\nQtd: ${i.qtd}\n-------------------\n`;
    }

    // Seção Financeira Detalhada
    msg += `\n*RESUMO FINANCEIRO:*`;
    msg += `\n${descricaoPreco}`;
    msg += `\nValor Refeições: Gs ${valorFinalRefeicoes.toLocaleString('es-PY')}`;
    
    if(totalPersonalizacao > 0) {
        msg += `\nPersonalização (Desta semana): Gs ${totalPersonalizacao.toLocaleString('es-PY')}`;
    }
    
    msg += `\nFrete: Gs ${valorFreteNumerico.toLocaleString('es-PY')}`;
    msg += `\n*TOTAL A PAGAR:* Gs ${totalGeral.toLocaleString('es-PY')}`;
    
    msg += `\n\nPagamento: ${pag}`;
    if(obsGerais !== "Nenhuma") msg += `\nObs: ${obsGerais}`;

    setTimeout(() => {
        window.open(`https://wa.me/595991635604?text=${encodeURIComponent(msg)}`, '_blank');
    }, 800);
}

function salvarNoSheets(nome, tel, plano, total, listaItens) {
    // URL DO SEU APP SCRIPT
    const urlPlanilha = "https://script.google.com/macros/s/AKfycbwQWmSVITTyLqcuAbVXpbpTP6W_4yVpCfJCLXTK6zSMoosDR1HDuMXru6-J7VlpUOcv/exec"; 
    
    fetch(urlPlanilha, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome: nome,
            telefone: tel,
            plano: plano,
            total: total,
            itens: listaItens // Enviando a lista estruturada corretamente
        })
    }).catch(err => console.error("Erro Planilha:", err));
}

function salvarNoSheets(nome, tel, plano, total, listaItens) {
    const urlPlanilha = "https://script.google.com/macros/s/AKfycbwQWmSVITTyLqcuAbVXpbpTP6W_4yVpCfJCLXTK6zSMoosDR1HDuMXru6-J7VlpUOcv/exec"; 
    
    fetch(urlPlanilha, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome: nome,
            telefone: tel,
            plano: plano,
            total: total,
            itens: listaItens
        })
    }).catch(err => console.error("Erro Planilha:", err));
}

// Função para enviar LISTA para o Google
function salvarNoSheets(nome, plano, listaItens) {
    const urlPlanilha = "https://script.google.com/macros/s/AKfycbwQWmSVITTyLqcuAbVXpbpTP6W_4yVpCfJCLXTK6zSMoosDR1HDuMXru6-J7VlpUOcv/exec"; 
    
    fetch(urlPlanilha, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nome: nome,
            plano: plano,
            itens: listaItens // Enviamos o Array processado
        })
    }).then(() => {
        console.log("Enviado para planilha!");
    }).catch(err => console.error("Erro Planilha:", err));
}

// Função auxiliar para calcular as gramas extras
function calcularTaxaGrama(detalhe) {
    let extraTotal = 0;

    // Função interna para extrair o número dentro de ( )
    const extrair = (termo) => {
        const regex = new RegExp(termo + '.*?\\((\\d+)g\\)', 'i');
        const match = detalhe.match(regex);
        return match ? parseInt(match[1]) : null;
    };

    // 1. Proteína (Base 130g | +500 Gs por 10g)
    // Pega o valor antes do primeiro "+" que é sempre a proteína
    const regexProt = detalhe.match(/^[^+]+?\((\d+)g\)/);
    const gProt = regexProt ? parseInt(regexProt[1]) : 130;
    if (gProt > 130) extraTotal += Math.ceil((gProt - 130) / 10) * 500;

    // 2. Arroz (Base 80g | +150 Gs por 10g)
    const gArroz = extrair('Arroz');
    if (gArroz !== null && gArroz > 80) extraTotal += Math.ceil((gArroz - 80) / 10) * 150;

    // 3. Feijão (Base 90g | +200 Gs por 10g)
    const gFeijao = extrair('Feijão');
    if (gFeijao !== null && gFeijao > 90) extraTotal += Math.ceil((gFeijao - 90) / 10) * 200;

    // 4. Purês (Base 120g | +200 Gs por 10g)
    const gPure = extrair('Purê');
    if (gPure !== null && gPure > 120) extraTotal += Math.ceil((gPure - 120) / 10) * 200;

    // 5. Seleta de Legumes (Base 80g | +250 Gs por 10g)
    const gSeleta = extrair('Seleta');
    if (gSeleta !== null && gSeleta > 80) extraTotal += Math.ceil((gSeleta - 80) / 10) * 250;

    return extraTotal;
}

function salvarNoSheets(nome, tel, plano, total, listaItens) {
    // CERTIFIQUE-SE QUE ESTA URL É A DA SUA IMPLANTAÇÃO
    const urlPlanilha = "https://script.google.com/macros/s/AKfycbwQWmSVITTyLqcuAbVXpbpTP6W_4yVpCfJCLXTK6zSMoosDR1HDuMXru6-J7VlpUOcv/exec"; 
    
    // Preparando os dados
    const dados = {
        nome: nome,
        telefone: tel,
        plano: plano,
        total: total,
        itens: listaItens
    };

    fetch(urlPlanilha, {
        method: 'POST',
        mode: 'no-cors', // Envia sem esperar resposta (para evitar erro de CORS)
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', // Mudança aqui: text/plain passa melhor pelos bloqueios
        },
        body: JSON.stringify(dados)
    }).then(() => {
        console.log("Tentativa de envio para planilha realizada.");
    }).catch(err => {
        console.error("Erro ao conectar com planilha:", err);
    });
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
    if (distancia <= 3) precoFrete = 8000;
    else if (distancia <= 5) precoFrete = 10000;
    else if (distancia <= 7) precoFrete = 15000;
    else if (distancia <= 10) precoFrete = 20000;
    else precoFrete = 25000;

    return { 
        distancia: distancia.toFixed(1), 
        preco: precoFrete 
    };
}