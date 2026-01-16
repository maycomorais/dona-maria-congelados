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

    $('.navbar .menu li a').click(function(){
        $('.navbar .menu').removeClass("active");
        $('.menu-btn i').removeClass("active");
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
        margin: 20,
        loop: true,
        autoplay: true,
        autoplayTimeOut: 3000,
        autoplayHoverPause: true,
        responsive: {
            0:{ items: 1, nav: false },
            600:{ items: 2, nav: false },
            1000:{ items: 3, nav: false }
        }
    });
});

// ==========================================
// 2. BANCO DE DADOS DO CARDÁPIO
// ==========================================
const cardapios = {
    "Tradicional": ["Carne Moída Refogada", "Macarrão com Almôndega", "Carne de Panela Desfiada", "Carré Suíno", "Frango em Cubos", "Sobrecoxa", "Frango Desfiado", "Frango a Parmegiana", "Frango Xadrez", "Strogonoff de Frango"],
    "Gourmet": ["Frango Mostarda e Mel", "Escalopinho de Alcatra ao Molho Madeira", "Bife Acebolado", "Lombo Suíno Agridoce", "Costelinha Suína ao molho Barbecue", "Rocambole de Frango", "Escondidinho de Carne Moída (Ou Frango)", "Charuto de Repolho e Carne Moída (ou frango)", "Strogonoff de Carne", "Iscas de Frango ao Molho Mostarda"],
    "Kids": ["Nugget de frango enriquecido com Legumes", "Hamburger de Frango ou Carne enriquecido com Legumes", "Almôndega de Frango ou Carne Enriquecido com Legumes", "Panqueca recheada de frango ou carne enriquecida com Legumes", "Escondidinho Colorido"],
    "Fit": ["Peito de Frango Grelhado", "Escondidinho de Batata Doce e Frango", "Crepioca de Frango", "Patinho Moído ao Sugo", "Frango em Cubos Grelhado", "Picadinho de Patinho com Legumes", "Torta de Frango com Massa de Grão de Bico", "Lombo Suíno em Cubos"],
    "acompanhamentos_base": ["Feijão", "Arroz", "Macarrão", "Purê de Batata", "Purê de Batata Doce", "Purê de Mandioca", "Seleta de Legumes"]
};

// ==========================================
// 3. LÓGICA DO SISTEMA DE PEDIDOS
// ==========================================
let itensPedido = [];
let limitePratos = 0;
let linhaBloqueada = false;

function configurarPlano() {
    const plano = document.getElementById('plano-selecionado').value;
    const limites = { "Individual": 13, "Mensal": 14, "FDS": 10, "Semanal": 14 };
    
    if (itensPedido.length > 0) {
        if (confirm("Mudar de plano limpará sua lista atual. Deseja continuar?")) {
            itensPedido = [];
            linhaBloqueada = false;
            document.getElementById('linha-escolhida').disabled = false;
            renderizarCarrinho();
        } else { return; }
    }

    limitePratos = limites[plano] || 0;
    document.getElementById('limite-txt').innerText = limitePratos;
    document.getElementById('progresso').max = limitePratos;
    document.getElementById('controles-prato').style.display = plano ? 'block' : 'none';
    
    // Aviso visual sobre a trava de linha
    const aviso = document.getElementById('aviso-linha');
    if(aviso) aviso.style.display = (plano !== "Individual") ? "block" : "none";
    
    atualizarOpcoesItens();
}

function togglePersonalizado() {
    const isPerso = document.getElementById('is-personalizado').checked;
    document.getElementById('g-prot-container').style.display = isPerso ? 'block' : 'none';
    const containersG = document.querySelectorAll('.g-acomp-container');
    containersG.forEach(div => div.style.display = isPerso ? 'block' : 'none');
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
                <input type="checkbox" name="acomp" value="${a}" id="ac-${a} onchange="limitarAcompanhamentos()">
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

    const plano = document.getElementById('plano-selecionado').value;
    const linha = document.getElementById('linha-escolhida').value;
    const prot = document.getElementById('select-proteina').value;
    const isPerso = document.getElementById('is-personalizado').checked;
    const gProt = document.getElementById('g-prot').value;
    const checks = document.querySelectorAll('input[name="acomp"]:checked');

    if (checks.length === 0 || checks.length > 3) {
        alert("Escolha exatamente 1 proteína e de 1 a 3 acompanhamentos."); return;
    }

    // Trava a linha se não for plano Individual
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
        linha: isPerso ? `${linha} (Personalizado)` : linha,
        detalhe: `${prot}${isPerso ? ' ('+gProt+'g)' : ''} + ${acompTexto.join(', ')}`
    });

    // Reseta apenas o checkbox de personalização, mantém a linha se estiver bloqueada
    document.getElementById('is-personalizado').checked = false;
    togglePersonalizado();
    renderizarCarrinho();
}

function limitarAcompanhamentos() {
    const checks = document.querySelectorAll('input[name="acomp"]');
    const selecionados = document.querySelectorAll('input[name="acomp"]:checked');

    checks.forEach(check => {
        if (selecionados.length >= 3 && !check.checked) {
            check.disabled = true; // Fica cinza e não permite seleção
            check.parentElement.style.opacity = "0.5"; // Feedback visual
        } else {
            check.disabled = false;
            check.parentElement.style.opacity = "1";
        }
    });
}

function repetirPrato(i) {
    if (itensPedido.length >= limitePratos) {
        alert("Limite do plano atingido! Não é possível repetir o prato.");
        return;
    }

    // Clona o item do índice i e adiciona ao final da lista
    const pratoCopiado = { ...itensPedido[i] };
    itensPedido.push(pratoCopiado);
    
    renderizarCarrinho();
}


function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-itens');
    lista.innerHTML = itensPedido.map((p, i) => `
        <li>
            <span><b>${i+1}.</b> [${p.linha}] ${p.detalhe}</span>
            <button onclick="repetirPrato(${i})" style="background:#2D5A27; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:4px; margin-right:5px; font-size:12px;">Repetir</button>
            <button onclick="removerPrato(${i})" style="background:red; color:white; border:none; padding:2px 5px; cursor:pointer;">Remover</button>
        </li>
    `).join('');

    document.getElementById('atual').innerText = itensPedido.length;
    document.getElementById('progresso').value = itensPedido.length;

    // Lógica Botão Whatsapp
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
}

// ==========================================
// 4. FUNÇÃO ENVIAR WHATSAPP (COM OBSERVAÇÃO)
// ==========================================
function enviarPedidoZap() {
    const plano = document.getElementById('plano-selecionado').value;
    const obs = document.getElementById('observacoes-gerais') ? document.getElementById('observacoes-gerais').value : "";
    
    let msg = `*NOVO PEDIDO - DONA MARIA CONGELADOS*\n`;
    msg += `*Plano:* ${plano}\n\n`;
    
    itensPedido.forEach((p, i) => {
        msg += `*Prato ${i+1} (${p.linha}):* ${p.detalhe}\n`;
    });

    if (obs.trim() !== "") {
        msg += `\n*Observações:* ${obs}\n`;
    }

    const fone = "595991635604"; // Número atualizado
    const url = `https://wa.me/${fone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

// ==========================================
// 5. MODAL DE DETALHES NUTRICIONAIS
// ==========================================
const informacoesPratos = {
    "sobrecoxa": {
        titulo: "Sobrecoxa Assada",
        desc: "Sobrecoxa assada dourada e suculenta, acompanhada de arroz soltinho e feijão temperado.",
        cal350: 633, cal450: 817,
        alergenos: "Alergênicos: CONTÉM GLÚTEN. NÃO CONTÉM LACTOSE. ALÉRGICOS: CONTÉM DERIVADOS DE SOJA.",
        tabela: [
            { item: "Carboidratos", qtd: "61g", vd: "20%" },
            { item: "Proteínas", qtd: "39g", vd: "78%" },
            { item: "Gorduras Totais", qtd: "25g", vd: "38%" },
            { item: "Fibras", qtd: "3,4g", vd: "14%" },
            { item: "Sódio", qtd: "2091mg", vd: "105%" }
        ]
    }
};

function abrirDetalhes(idPrato) {
    const dados = informacoesPratos[idPrato];
    if (!dados) return;

    document.getElementById('modal-titulo').innerText = dados.titulo;
    document.getElementById('modal-descricao').innerText = dados.desc;
    document.getElementById('cal-350').innerText = dados.cal350;
    document.getElementById('cal-450').innerText = dados.cal450;
    document.getElementById('modal-alergenos').innerText = dados.alergenos;

    const tbody = document.getElementById('tabela-nutri');
    if(tbody) {
        tbody.innerHTML = dados.tabela.map(row => `
            <tr>
                <td>${row.item}</td>
                <td>${row.qtd}</td>
                <td>${row.vd}</td>
            </tr>
        `).join('');
    }
    document.getElementById('dish-modal').style.display = "block";
}

function fecharModal() {
    document.getElementById('dish-modal').style.display = "none";
}