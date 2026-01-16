$(document).ready(function(){
    // ==========================================
    // 1. EFEITOS VISUAIS E CONFIGURAÇÕES
    // ==========================================
    $(window).scroll(function(){
        if(this.scrollY > 20) $('.navbar').addClass("sticky");
        else $('.navbar').removeClass("sticky");
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

    $('.planos-btn').click(function(){
        const categoria = $(this).attr('id'); 
        $('.planos-btn').removeClass('active');
        $(this).addClass('active');
        updatePrices(categoria); 
    });

    carregarDadosSalvos();
});

// ==========================================
// 2. BANCO DE DADOS DE DETALHES DOS PRATOS (MODAL)
// ==========================================
// Função auxiliar para gerar tabela nutricional padrão baseada no tipo
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
    // --- LINHA TRADICIONAL ---
    "trad1": { titulo: "Carne Moída Refogada", desc: "Clássico caseiro, carne moída de primeira refogada com temperos naturais.", img: "https://images.unsplash.com/photo-1541518763669-27f70452fcc0?auto=format&fit=crop&w=500", cal350: 580, cal450: 750, alergenos: "CONTÉM DERIVADOS DE SOJA.", tabela: getNutri('bovina') },
    "trad2": { titulo: "Macarrão com Almôndega", desc: "Massa al dente com almôndegas suculentas ao molho sugo.", img: "https://images.unsplash.com/photo-1515516969-d4008cc6241a?auto=format&fit=crop&w=500", cal350: 600, cal450: 780, alergenos: "CONTÉM GLÚTEN E OVOS.", tabela: getNutri('bovina') },
    "trad3": { titulo: "Carne de Panela Desfiada", desc: "Carne cozida lentamente até desfiar, cheia de sabor.", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500", cal350: 590, cal450: 760, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "trad4": { titulo: "Carré Suíno", desc: "Corte suíno selecionado, grelhado e temperado com ervas.", img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500", cal350: 610, cal450: 790, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('suino') },
    "trad5": { titulo: "Frango em Cubos Cremoso", desc: "Cubos de peito de frango em molho branco leve e cremoso.", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500", cal350: 550, cal450: 710, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('frango') },
    "trad6": { titulo: "Sobrecoxa Assada", desc: "Sobrecoxa dourada e suculenta, temperada com limão e ervas.", img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500", cal350: 633, cal450: 817, alergenos: "PODE CONTER SOJA.", tabela: getNutri('frango') },
    "trad7": { titulo: "Frango Desfiado", desc: "Peito de frango cozido e desfiado, ideal para quem busca leveza.", img: "https://images.unsplash.com/photo-1606728035253-49e8a23146de?auto=format&fit=crop&w=500", cal350: 420, cal450: 550, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "trad8": { titulo: "Frango a Parmegiana", desc: "Empanado crocante coberto com molho de tomate e queijo derretido.", img: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?auto=format&fit=crop&w=500", cal350: 680, cal450: 850, alergenos: "CONTÉM GLÚTEN E LACTOSE.", tabela: getNutri('frango') },
    "trad9": { titulo: "Frango Xadrez", desc: "Cubos de frango com pimentões, cebola e molho shoyu especial.", img: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=500", cal350: 490, cal450: 640, alergenos: "CONTÉM SOJA.", tabela: getNutri('frango') },
    "trad10": { titulo: "Strogonoff de Frango", desc: "O queridinho de todos: frango macio em molho cremoso com cogumelos.", img: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=500", cal350: 620, cal450: 800, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('frango') },

    // --- LINHA GOURMET ---
    "gourmet1": { titulo: "Frango Mostarda e Mel", desc: "Combinação agridoce sofisticada em cubos de frango.", img: "https://images.unsplash.com/photo-1607330207224-e676b47c0589?auto=format&fit=crop&w=500", cal350: 560, cal450: 720, alergenos: "CONTÉM MOSTARDA.", tabela: getNutri('frango') },
    "gourmet2": { titulo: "Escalopinho ao Molho Madeira", desc: "Fatias finas de carne bovina em molho escuro e encorpado.", img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=500", cal350: 610, cal450: 790, alergenos: "CONTÉM GLÚTEN (MOLHO).", tabela: getNutri('bovina') },
    "gourmet3": { titulo: "Bife Acebolado", desc: "Bife macio coberto com cebolas caramelizadas.", img: "https://images.unsplash.com/photo-1603073163308-9654c3fb70b9?auto=format&fit=crop&w=500", cal350: 590, cal450: 770, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "gourmet4": { titulo: "Lombo Suíno Agridoce", desc: "Lombo assado com toque especial agridoce.", img: "https://images.unsplash.com/photo-1624726175512-19c9746903ce?auto=format&fit=crop&w=500", cal350: 600, cal450: 780, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('suino') },
    "gourmet5": { titulo: "Costelinha BBQ", desc: "Costelinha suína desmanchando ao molho barbecue defumado.", img: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500", cal350: 650, cal450: 840, alergenos: "CONTÉM SOJA.", tabela: getNutri('suino') },
    "gourmet6": { titulo: "Rocambole de Frango", desc: "Frango moído e recheado, assado até dourar.", img: "https://images.unsplash.com/photo-1631515243349-e0603604305a?auto=format&fit=crop&w=500", cal350: 580, cal450: 750, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('frango') },
    "gourmet7": { titulo: "Escondidinho", desc: "Purê cremoso cobrindo recheio suculento de carne ou frango.", img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500", cal350: 620, cal450: 810, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('bovina') },
    "gourmet8": { titulo: "Charuto de Repolho", desc: "Folhas de repolho recheadas com carne e arroz, cozidas em molho.", img: "https://images.unsplash.com/photo-1616509091215-57bbffe75a64?auto=format&fit=crop&w=500", cal350: 480, cal450: 620, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "gourmet9": { titulo: "Strogonoff de Carne", desc: "Cubos de carne macia em molho cremoso com champignon.", img: "https://images.unsplash.com/photo-1555126634-323283e090fa?auto=format&fit=crop&w=500", cal350: 640, cal450: 830, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('bovina') },
    "gourmet10": { titulo: "Iscas ao Molho Mostarda", desc: "Tiras de frango grelhadas envolvidas em molho de mostarda suave.", img: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=500", cal350: 550, cal450: 710, alergenos: "CONTÉM MOSTARDA.", tabela: getNutri('frango') },

    // --- LINHA FIT ---
    "fit1": { titulo: "Peito de Frango Grelhado", desc: "Grelhado simples com ervas finas, zero gordura adicionada.", img: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=500", cal350: 380, cal450: 490, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "fit2": { titulo: "Escondidinho Batata Doce", desc: "Versão leve do clássico, com purê de batata doce de baixo índice glicêmico.", img: "https://images.unsplash.com/photo-1505253304499-671c55fb57fe?auto=format&fit=crop&w=500", cal350: 410, cal450: 530, alergenos: "PODE CONTER LEITE.", tabela: getNutri('frango') },
    "fit3": { titulo: "Panqueca de Frango Fit", desc: "Massa integral leve recheada com frango desfiado.", img: "https://images.unsplash.com/photo-1605493666579-08bfab87e838?auto=format&fit=crop&w=500", cal350: 400, cal450: 520, alergenos: "CONTÉM GLÚTEN E OVOS.", tabela: getNutri('frango') },
    "fit4": { titulo: "Patinho Moído ao Sugo", desc: "Carne magra moída com molho de tomate caseiro natural.", img: "https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?auto=format&fit=crop&w=500", cal350: 390, cal450: 510, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },
    "fit5": { titulo: "Frango em Cubos Grelhado", desc: "Cubos dourados na chapa sem óleo.", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=500", cal350: 380, cal450: 490, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('frango') },
    "fit6": { titulo: "Picadinho de Patinho", desc: "Carne magra em cubos cozida com legumes.", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500", cal350: 400, cal450: 520, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('bovina') },

    // --- LINHA KIDS ---
    "kids1": { titulo: "Nuggets Artesanais", desc: "Feitos à mão com peito de frango e legumes escondidos.", img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500", cal350: 450, cal450: 580, alergenos: "CONTÉM GLÚTEN.", tabela: getNutri('kids') },
    "kids2": { titulo: "Hamburger Nutritivo", desc: "Blend de carne ou frango enriquecido com cenoura e abobrinha.", img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=500", cal350: 480, cal450: 620, alergenos: "NÃO CONTÉM GLÚTEN.", tabela: getNutri('kids') },
    "kids3": { titulo: "Almôndega Kids", desc: "Bolinhas de carne macias e fáceis de mastigar.", img: "https://images.unsplash.com/photo-1515516969-d4008cc6241a?auto=format&fit=crop&w=500", cal350: 460, cal450: 590, alergenos: "CONTÉM OVOS.", tabela: getNutri('kids') },
    "kids4": { titulo: "Panqueca Colorida", desc: "Massa com beterraba ou espinafre recheada.", img: "https://images.unsplash.com/photo-1605493666579-08bfab87e838?auto=format&fit=crop&w=500", cal350: 440, cal450: 570, alergenos: "CONTÉM GLÚTEN E LACTOSE.", tabela: getNutri('kids') },
    "kids5": { titulo: "Escondidinho Colorido", desc: "Purê misto (batata e cenoura) cobrindo carninha moída.", img: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=500", cal350: 450, cal450: 580, alergenos: "CONTÉM LACTOSE.", tabela: getNutri('kids') }
};

function abrirDetalhes(idPrato) {
    const dados = detalhesPratos[idPrato];
    if (!dados) return;

    document.getElementById('modal-titulo').innerText = dados.titulo;
    document.getElementById('modal-descricao').innerText = dados.desc;
    document.getElementById('cal-350').innerText = dados.cal350;
    document.getElementById('cal-450').innerText = dados.cal450;
    document.getElementById('modal-alergenos').innerText = dados.alergenos;
    
    // ATUALIZA A IMAGEM DO MODAL
    const modalImg = document.getElementById('modal-img');
    if(modalImg) modalImg.src = dados.img;

    const tbody = document.getElementById('tabela-nutri');
    if(tbody) {
        tbody.innerHTML = dados.tabela.map(row => `
            <tr><td>${row.item}</td><td>${row.qtd}</td><td>${row.vd}</td></tr>
        `).join('');
    }
    document.getElementById('dish-modal').style.display = "block";
}

function fecharModal() {
    document.getElementById('dish-modal').style.display = "none";
}

// ==========================================
// 3. LÓGICA DE PREÇOS (SEÇÃO PLANOS)
// ==========================================
function updatePrices(linha) {
    const data = {
        'tradicional': { s: ['₲ 420.000', '5% OFF', '₲ 399.000'], b: ['₲ 1.200.000', '5% OFF', '₲ 1.140.000'], l: ['₲ 1.680.000', '10% OFF', '₲ 1.512.000'] },
        'gourmet': { s: ['₲ 490.000', '5% OFF', '₲ 465.500'], b: ['₲ 1.400.000', '5% OFF', '₲ 1.330.000'], l: ['₲ 1.960.000', '10% OFF', '₲ 1.764.000'] },
        'kids': { s: ['₲ 350.000', '5% OFF', '₲ 332.500'], b: ['₲ 1.000.000', '5% OFF', '₲ 950.000'], l: ['₲ 1.400.000', '10% OFF', '₲ 1.260.000'] },
        'personalizada': { s: ['---', '---', 'Sob Consulta'], b: ['---', '---', 'Sob Consulta'], l: ['---', '---', 'Sob Consulta'] }
    };

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
// 4. FUNÇÕES DE PERSONALIZAÇÃO E PEDIDOS
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

let itensPedido = [];
let limitePratos = 0;
let linhaBloqueada = false;

function configurarPlano(isLoading = false) {
    const planoSelect = document.getElementById('plano-selecionado');
    if(!planoSelect) return;
    const plano = planoSelect.value;
    const limites = { "Individual": 1, "Mensal": 14, "FDS": 10, "Semanal": 14 };
    
    if (!isLoading && itensPedido.length > 0) {
        if (!confirm("Mudar de plano limpará o carrinho. Continuar?")) return;
        itensPedido = [];
        linhaBloqueada = false;
        document.getElementById('linha-escolhida').disabled = false;
    }

    limitePratos = limites[plano] || 0;
    document.getElementById('limite-txt').innerText = limitePratos;
    document.getElementById('progresso').max = limitePratos;
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
        </div>
    `).join('');
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
    
    if(isPerso) togglePersonalizado(); 
}

function repetirPrato(i) {
    if (itensPedido.length >= limitePratos && limitePratos > 0) return;
    itensPedido.push({...itensPedido[i]});
    renderizarCarrinho();
    salvarDadosLocalmente();
}

function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-itens');
    if(!lista) return;

    lista.innerHTML = itensPedido.map((p, i) => `
        <li style="border-bottom: 1px solid #eee; padding: 10px 0; list-style:none;">
            <div style="font-size: 14px;"><b>${i+1}.</b> [${p.linha}] ${p.detalhe}</div>
            <div style="margin-top: 5px;">
                <button onclick="repetirPrato(${i})" style="background:#2D5A27; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:4px; font-size:11px;">Repetir</button>
                <button onclick="removerPrato(${i})" style="background:#ff4d4d; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:4px; font-size:11px;">Remover</button>
            </div>
        </li>
    `).join('');

    document.getElementById('atual').innerText = itensPedido.length;
    document.getElementById('progresso').value = itensPedido.length;

    const plano = document.getElementById('plano-selecionado').value;
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
    salvarDadosLocalmente();
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
    const plano = document.getElementById('plano-selecionado').value;
    const obs = document.getElementById('observacoes-gerais')?.value || "";
    let msg = `*NOVO PEDIDO - DONA MARIA*\n*Plano:* ${plano}\n\n`;
    itensPedido.forEach((p, i) => msg += `*${i+1}.* [${p.linha}] ${p.detalhe}\n`);
    if(obs) msg += `\n*Obs:* ${obs}`;
    
    window.open(`https://wa.me/595991635604?text=${encodeURIComponent(msg)}`, '_blank');
    localStorage.removeItem('donaMaria_pedido');
}

// Mostrar aviso de sucesso
const toast = $('<div class="toast-success">Prato adicionado ao seu plano!</div>');
$('body').append(toast);
toast.fadeIn().delay(2000).fadeOut(function() { $(this).remove(); });