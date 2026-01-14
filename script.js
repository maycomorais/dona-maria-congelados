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