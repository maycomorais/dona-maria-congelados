$(document).ready(function(){
    
    // Navbar Fixa ao rolar (Sticky Navbar)
    $(window).scroll(function(){
        if(this.scrollY > 20){
            $('.navbar').addClass("sticky");
        }else{
            $('.navbar').removeClass("sticky");
        }
    });

    // Menu Mobile (Toggle)
    $('.menu-btn').click(function(){
        $('.navbar .menu').toggleClass("active");
        $('.menu-btn i').toggleClass("active");
    });

    // UX: Fechar menu mobile ao clicar em um link
    $('.navbar .menu li a').click(function(){
        $('.navbar .menu').removeClass("active");
        $('.menu-btn i').removeClass("active");
    });

    // Configuração dos Carrosséis (Owl Carousel)
    $('.carousel').owlCarousel({
        margin: 20,
        loop: true,
        autoplay: true,
        autoplayTimeOut: 3000, // Aumentei um pouco para leitura
        autoplayHoverPause: true,
        responsive: {
            0:{ items: 1, nav: false },
            600:{ items: 2, nav: false },
            1000:{ items: 3, nav: false }
        }
    });

    // Efeito de Digitação (Home)
    var typed = new Typed(".typing", {
        strings: ["Práticas", "Deliciosas", "Saudáveis", "Balanceadas", "Nutritivas"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });

    // Efeito de Digitação (Sobre)
    var typed2 = new Typed(".typing-2", {
        strings: ["Estude", "Descanse", "Divirta-se", "Namore"],
        typeSpeed: 100,
        backSpeed: 60,
        loop: true
    });
});

// Lógica de Preços (Seção Planos)
function updatePrices(linha) {
    const data = {
        'tradicional': {
            s: ['₲ 420.000', '5% OFF', '₲ 399.000'],
            b: ['₲ 1.200.000', '5% OFF', '₲ 1.140.000'],
            l: ['₲ 1.680.000', '10% OFF', '₲ 1.512.000']
        },
        'gourmet': {
            s: ['₲ 490.000', '5% OFF', '₲ 465.500'],
            b: ['₲ 1.400.000', '5% OFF', '₲ 1.330.000'],
            l: ['₲ 1.960.000', '10% OFF', '₲ 1.764.000']
        },
        'kids': {
            s: ['₲ 350.000', '5% OFF', '₲ 332.500'],
            b: ['₲ 1.000.000', '5% OFF', '₲ 950.000'],
            l: ['₲ 1.400.000', '10% OFF', '₲ 1.260.000']
        },
        'personalizada': {
            s: ['---', '---', 'Sob Consulta'],
            b: ['---', '---', 'Sob Consulta'],
            l: ['---', '---', 'Sob Consulta']
        }
    };

    const sel = data[linha];
    
    // Atualiza Semanal
    if(document.getElementById('price-semanal')) {
        document.getElementById('old-semanal').innerText = sel.s[0];
        document.getElementById('desc-semanal').innerText = sel.s[1];
        document.getElementById('price-semanal').innerText = sel.s[2];
    }

    // Atualiza Business
    if(document.getElementById('price-business')) {
        document.getElementById('old-business').innerText = sel.b[0];
        document.getElementById('desc-business').innerText = sel.b[1];
        document.getElementById('price-business').innerText = sel.b[2];
    }

    // Atualiza Libertad
    if(document.getElementById('price-libertad')) {
        document.getElementById('old-libertad').innerText = sel.l[0];
        document.getElementById('desc-libertad').innerText = sel.l[1];
        document.getElementById('price-libertad').innerText = sel.l[2];
    }

    // Toggle Active Class
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// Lógica do FAQ (Acordeão)
    $(".faq .toggle").click(function(){
        // Fecha os outros e abre o clicado
        const parent = $(this).parent();
        
        if(parent.hasClass('active')){
            parent.removeClass('active');
            parent.find('.content').css('height', '0');
        } else {
            // Fecha todos os outros primeiro (opcional, se quiser que fique só um aberto por vez)
            $(".faq .wrapper").removeClass('active');
            $(".faq .content").css('height', '0');
            
            // Abre o atual
            parent.addClass('active');
            // Pega a altura real do conteúdo para animar
            const contentHeight = parent.find('p').outerHeight() + 40; 
            parent.find('.content').css('height', contentHeight + 'px');
        }
    });

    // Lógica Pedidos
    const cardapios = {
    "Tradicional": ["Carne Moída Refogada", "Macarrão com Almôndega", "Carne de Panela Desfiada", "Carré Suíno", "Frango em Cubos", "Sobrecoxa", "Frango Desfiado", "Frango a Parmegiana", "Frango Xadrez", "Strogonoff de Frango"],
    "Gourmet": ["Frango Mostarda e Mel", "Escalopinho de Alcatra ao Molho Madeira", "Bife Acebolado", "Lombo Suíno Agridoce", "Costelinha Suína ao molho Barbecue", "Rocambole de Frango", "Escondidinho de Carne Moída (Ou Frango)", "Charuto de Repolho e Carne Moída (ou frango)", "Strogonoff de Carne", "Iscas de Frango ao Molho Mostarda"],
    "Kids": ["Nugget de frango enriquecido com Legumes", "Hamburger de Frango ou Carne enriquecido com Legumes", "Almôndega de Frango ou Carne Enriquecido com Legumes", "Panqueca recheada de frango ou carne enriquecida com Legumes", "Escondidinho Colorido"],
    "Fit": ["Peito de Frango Grelhado", "Escondidinho de Batata Doce e Frango", "Crepioca de Frango", "Patinho Moído ao Sugo", "Frango em Cubos Grelhado", "Picadinho de Patinho com Legumes", "Torna de Frango com Massa de Grão de Bico", "Lombo Suíno em Cubos"],
    "acompanhamentos_base": ["Feijão", "Arroz", "Macarrão", "Purê de Batata", "Purê de Batata Doce", "Purê de Mandioca", "Seleta de Legumes"]
};

let itensPedido = [];
let limitePratos = 0;

function configurarPlano() {
    const plano = document.getElementById('plano-selecionado').value;
    const limites = { "Individual": 13, "Mensal": 14, "FDS": 10, "Semanal": 14 };
    limitePratos = limites[plano] || 0;
    document.getElementById('limite-txt').innerText = limitePratos;
    document.getElementById('progresso').max = limitePratos;
    document.getElementById('controles-prato').style.display = plano ? 'block' : 'none';
    atualizarOpcoesItens();
}

function togglePersonalizado() {
    const isPerso = document.getElementById('is-personalizado').checked;
    document.getElementById('g-prot-container').style.display = isPerso ? 'block' : 'none';
    const inputsG = document.querySelectorAll('.g-acomp-container');
    inputsG.forEach(div => div.style.display = isPerso ? 'block' : 'none');
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
                <input type="checkbox" name="acomp" value="${a}" id="ac-${a}">
                <label for="ac-${a}">${a}</label>
            </div>
            <div class="g-acomp-container" style="display:${isPerso ? 'block' : 'none'}">
                <input type="number" class="g-acomp" placeholder="g">
            </div>
        </div>
    `).join('');
}

function adicionarPratoLista() {
    if (itensPedido.length >= limitePratos) {
        alert("Limite do plano atingido!"); return;
    }

    const linha = document.getElementById('linha-escolhida').value;
    const prot = document.getElementById('select-proteina').value;
    const isPerso = document.getElementById('is-personalizado').checked;
    const gProt = document.getElementById('g-prot').value;
    const checks = document.querySelectorAll('input[name="acomp"]:checked');

    if (checks.length === 0 || checks.length > 3) {
        alert("Escolha exatamente 1 proteína e até 3 acompanhamentos."); return;
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
        linha: isPerso ? `${linha} (Personalizado)` : linha,
        detalhe: `${prot}${isPerso ? ' ('+gProt+'g)' : ''} + ${acompTexto.join(', ')}`
    });

    // Reseta checkbox de personalização para o próximo prato
    document.getElementById('is-personalizado').checked = false;
    togglePersonalizado();
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-itens');
    lista.innerHTML = itensPedido.map((p, i) => `
        <li>
            <span><b>${i+1}.</b> [${p.linha}] ${p.detalhe}</span>
            <button onclick="removerPrato(${i})">Remover</button>
        </li>
    `).join('');
    document.getElementById('atual').innerText = itensPedido.length;
    document.getElementById('progresso').value = itensPedido.length;
    const pronto = (itensPedido.length === limitePratos) || (document.getElementById('plano-selecionado').value === "Individual" && itensPedido.length > 0);
    document.getElementById('btn-whatsapp').disabled = !pronto;
    document.getElementById('btn-whatsapp').className = pronto ? "btn-zap-ativo" : "disabled";
}

function removerPrato(i) { itensPedido.splice(i, 1); renderizarCarrinho(); }

function enviarPedidoZap() {
    let msg = `*NOVO PEDIDO - DONA MARIA*\nPlano: ${document.getElementById('plano-selecionado').value}\n\n`;
    itensPedido.forEach((p, i) => msg += `*Prato ${i+1} (${p.linha}):* ${p.detalhe}\n`);
    window.open(`https://wa.me/595976771714?text=${encodeURIComponent(msg)}`);
}