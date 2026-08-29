/* ==========================================================================
   Unique Garden Malls — script.js
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Video de fundo do hero ---- */
  /* O CSS ja esconde o video no modo "reduzir movimento", mas escondido ele
     ainda baixaria 1,9 MB. Aqui a fonte e removida antes disso acontecer. */
  (function () {
    var heroVideo = document.querySelector('.hero__video');
    if (!heroVideo) return;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
    Array.prototype.forEach.call(heroVideo.querySelectorAll('source'), function (s) {
      s.remove();
    });
    heroVideo.load();   /* sem o load() o navegador mantem a fonte anterior */
  })();

  /* ---- Header auto-medido: altura real + colapso apenas quando nao cabe ---- */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    var headerInner = siteHeader.querySelector('.site-header__inner');
    var headerSteps = ['site-header--collapsed', 'site-header--tight', 'site-header--mini', 'site-header--mini2'];
    var updateHeader = function () {
      headerSteps.forEach(function (c) { siteHeader.classList.remove(c); });
      for (var i = 0; i < headerSteps.length; i++) {
        if (headerInner.scrollWidth <= headerInner.clientWidth + 1) break;
        siteHeader.classList.add(headerSteps[i]);
      }
      document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
    };
    updateHeader();
    window.addEventListener('resize', updateHeader);
    window.addEventListener('orientationchange', updateHeader);
    window.addEventListener('load', updateHeader);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        updateHeader();
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { siteHeader.classList.add('site-header--anim'); });
        });
      });
    } else {
      siteHeader.classList.add('site-header--anim');
    }
  }

  /* ---- Scrollbar personalizada (discreta, some fora do header) ---- */
  (function () {
    /* Só em aparelhos com mouse. Em telas de toque o próprio celular desenha a
       barra dele e não há como escondê-la de forma confiável (o iOS ignora o
       CSS), então a nossa apareceria em cima da dele, duplicada. Sem montar,
       economiza também o listener de rolagem e o requestAnimationFrame. */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var track = document.createElement('div');
    track.className = 'custom-scrollbar-track';
    var thumb = document.createElement('div');
    thumb.className = 'custom-scrollbar-thumb';
    track.appendChild(thumb);
    document.body.appendChild(track);

    var hideTimer = null;
    function updateThumb() {
      var doc = document.documentElement;
      var scrollTop = window.scrollY || doc.scrollTop;
      var trackHeight = track.clientHeight;
      var scrollableHeight = doc.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 4 || trackHeight <= 0) {
        track.style.display = 'none';
        return;
      }
      track.style.display = '';
      var ratio = window.innerHeight / doc.scrollHeight;
      var thumbHeight = Math.max(ratio * trackHeight, 32);
      var maxThumbTop = trackHeight - thumbHeight;
      var scrollRatio = Math.min(Math.max(scrollTop / scrollableHeight, 0), 1);
      var thumbTop = scrollRatio * maxThumbTop;
      thumb.style.height = thumbHeight + 'px';
      thumb.style.transform = 'translateY(' + thumbTop + 'px)';
      track.classList.add('is-visible');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { track.classList.remove('is-visible'); }, 900);
    }

    var ticking = false;
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { updateThumb(); ticking = false; });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateThumb);
    updateThumb();
  })();

  /* ---- Luzes de fundo do hero: flutuação suave + paralaxe no scroll ---- */
  (function () {
    var decors = document.querySelectorAll('.hero__decor');
    if (!decors.length) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var params = [
      { parallax: 0.10, ampX: 40, ampY: 52, speed: 0.00030, phase: 0 },
      { parallax: -0.07, ampX: 46, ampY: 36, speed: 0.00025, phase: 2.4 }
    ];
    var rafId = null;
    function animate(t) {
      var scrollY = window.scrollY || window.pageYOffset || 0;
      decors.forEach(function (el, i) {
        var p = params[i % params.length];
        var dx = Math.sin(t * p.speed + p.phase) * p.ampX;
        var dy = Math.cos(t * p.speed * 0.8 + p.phase) * p.ampY + scrollY * p.parallax;
        el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px, 0)';
      });
      rafId = requestAnimationFrame(animate);
    }
    var heroSection = document.querySelector('.hero');
    if (heroSection && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && rafId === null) {
            rafId = requestAnimationFrame(animate);
          } else if (!entry.isIntersecting && rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        });
      });
      io.observe(heroSection);
    } else {
      rafId = requestAnimationFrame(animate);
    }
  })();

  /* ---- Alternância de tema (Tema Garden / Tema Light) ---- */
  var themeToggles = document.querySelectorAll('[data-theme-toggle]');
  if (themeToggles.length) {
    var syncThemeToggles = function () {
      var isLight = document.documentElement.getAttribute('data-theme') === 'light';
      themeToggles.forEach(function (btn) {
        btn.setAttribute('title', isLight ? 'Mudar para o Tema Garden' : 'Mudar para o Tema Light');
        btn.setAttribute('aria-label', isLight ? 'Ativar Tema Garden' : 'Ativar Tema Light');
      });
    };
    themeToggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isLight = document.documentElement.getAttribute('data-theme') === 'light';
        if (isLight) document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', 'light');
        try { localStorage.setItem('ugm-theme', isLight ? 'garden' : 'light'); } catch (e) {}
        syncThemeToggles();
      });
    });
    syncThemeToggles();
  }

  /* ---- Ano dinâmico no rodapé ---- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---- Menu mobile ---- */
  var navToggle = document.querySelector('.nav-toggle');
  var mainNav = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.getAttribute('data-open') === 'true';
      mainNav.setAttribute('data-open', String(!isOpen));
      navToggle.setAttribute('aria-expanded', String(!isOpen));
      document.body.style.overflow = !isOpen ? 'hidden' : '';
    });

    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.setAttribute('data-open', 'false');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.getAttribute('data-open') === 'true') {
        mainNav.setAttribute('data-open', 'false');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        navToggle.focus();
      }
    });
  }

  /* ---- Revelação ao rolar (IntersectionObserver) ---- */
  var revealTargets = document.querySelectorAll('.anim-fade-up, .anim-zoom-in');
  if ('IntersectionObserver' in window && revealTargets.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealTargets.forEach(function (target) { observer.observe(target); });
  } else {
    revealTargets.forEach(function (target) { target.classList.add('visible'); });
  }

  /* ---- FAQ / accordion ---- */
  var faqButtons = document.querySelectorAll('.faq-item__question');

  function faqClose(btn) {
    btn.setAttribute('aria-expanded', 'false');
    var answer = document.getElementById(btn.getAttribute('aria-controls'));
    if (answer) answer.setAttribute('data-open', 'false');
  }

  function faqOpen(btn) {
    faqButtons.forEach(function (other) {
      if (other !== btn) faqClose(other);
    });
    btn.setAttribute('aria-expanded', 'true');
    var answer = document.getElementById(btn.getAttribute('aria-controls'));
    if (answer) answer.setAttribute('data-open', 'true');
  }

  faqButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-expanded') === 'true') faqClose(btn);
      else faqOpen(btn);
    });
  });

  /* Abre ao passar o cursor — só em aparelhos com mouse.
     No celular e no tablet continua valendo só o toque. */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var faqHoverTimer = null;
    var faqUltimoMouseMove = 0;

    document.addEventListener('mousemove', function () {
      faqUltimoMouseMove = Date.now();
    }, { passive: true });

    /* Rolar a página não pode abrir nada */
    window.addEventListener('scroll', function () {
      clearTimeout(faqHoverTimer);
    }, { passive: true });

    document.querySelectorAll('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-item__question');
      if (!btn) return;
      /* O gatilho é o item inteiro (pergunta + resposta), e não só a pergunta:
         assim o visitante desce o cursor para ler a resposta sem que ela feche. */
      item.addEventListener('mouseenter', function () {
        /* Só abre se o cursor realmente se moveu até aqui. Sem esta checagem,
           a página rolando por baixo de um cursor parado abriria o item errado,
           roubando o que a pessoa tinha escolhido no clique ou no teclado. */
        if (Date.now() - faqUltimoMouseMove > 100) return;
        clearTimeout(faqHoverTimer);
        faqHoverTimer = setTimeout(function () { faqOpen(btn); }, 180);
      });
      item.addEventListener('mouseleave', function () {
        clearTimeout(faqHoverTimer);
      });
    });
  }

  /* Esc fecha a resposta aberta, sem precisar mover o cursor */
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    faqButtons.forEach(function (btn) {
      if (btn.getAttribute('aria-expanded') === 'true') faqClose(btn);
    });
  });

  /* ---- Formulário de contato ---- */
  var form = document.getElementById('form-contato');
  if (form) {
    var statusBox = document.getElementById('form-status');
    var WHATSAPP_NUMBER = '5511939459460';

    function setError(field, message) {
      var errorEl = document.getElementById(field.id + '-erro');
      if (!errorEl) return;
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
      } else {
        field.removeAttribute('aria-invalid');
        errorEl.textContent = '';
      }
    }

    function validate() {
      var valid = true;
      var nome = form.querySelector('#nome');
      var email = form.querySelector('#email');
      var telefone = form.querySelector('#telefone');
      var mensagem = form.querySelector('#mensagem');
      var perfil = form.querySelector('input[name="perfil"]:checked');

      if (!nome.value.trim()) { setError(nome, 'Por favor, informe seu nome completo.'); valid = false; }
      else setError(nome, '');

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
        setError(email, 'Informe um e-mail válido, no formato nome@dominio.com.');
        valid = false;
      } else setError(email, '');

      if (!telefone.value.trim()) { setError(telefone, 'Informe um WhatsApp com DDD para retornarmos o contato.'); valid = false; }
      else setError(telefone, '');

      if (!mensagem.value.trim()) { setError(mensagem, 'Conte brevemente o que você procura.'); valid = false; }
      else setError(mensagem, '');

      if (!perfil) {
        var perfilError = document.getElementById('perfil-erro');
        if (perfilError) perfilError.textContent = 'Selecione uma opção para continuarmos.';
        valid = false;
      } else {
        var perfilError2 = document.getElementById('perfil-erro');
        if (perfilError2) perfilError2.textContent = '';
      }

      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validate()) {
        statusBox.className = 'form-status--error';
        statusBox.setAttribute('role', 'alert');
        statusBox.textContent = '';
        requestAnimationFrame(function () {
          statusBox.textContent = 'Encontramos alguns campos para corrigir antes de enviar. Revise as mensagens destacadas abaixo.';
        });
        var firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var nome = form.querySelector('#nome').value.trim();
      var email = form.querySelector('#email').value.trim();
      var telefone = form.querySelector('#telefone').value.trim();
      var empresa = form.querySelector('#empresa') ? form.querySelector('#empresa').value.trim() : '';
      var mensagem = form.querySelector('#mensagem').value.trim();
      var perfil = form.querySelector('input[name="perfil"]:checked').value;

      var texto =
        'Olá, Unique Garden Malls! Meu nome é ' + nome + '.\n' +
        'Perfil: ' + perfil + '\n' +
        (empresa ? 'Empresa/marca: ' + empresa + '\n' : '') +
        'E-mail: ' + email + '\n' +
        'Telefone: ' + telefone + '\n' +
        'Mensagem: ' + mensagem;

      var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(texto);

      statusBox.className = 'form-status--success';
      statusBox.setAttribute('role', 'status');
      statusBox.textContent = '';
      requestAnimationFrame(function () {
        statusBox.textContent = 'Recebemos os dados! Vamos abrir o WhatsApp com sua mensagem pronta — é só confirmar o envio por lá. Se preferir, escreva para contato@uniquegardenmalls.com.';
      });

      window.open(url, '_blank', 'noopener');
      form.reset();
    });
  }

  /* ---- Fileiras com rolagem horizontal (lançamentos e portfólio) ---- */
  function initScrollRow(row) {
    var viewport = row.querySelector('.scroll-row__viewport');
    var prevBtn = row.querySelector('[data-scroll-prev]');
    var nextBtn = row.querySelector('[data-scroll-next]');
    if (!viewport || !prevBtn || !nextBtn) return;

    function step() {
      var item = viewport.querySelector('.scroll-row__item');
      if (!item) return viewport.clientWidth;
      var trackEl = item.parentElement;
      var gap = parseFloat(getComputedStyle(trackEl).columnGap || 0) || 0;
      return item.getBoundingClientRect().width + gap;
    }

    function update() {
      var maxScroll = viewport.scrollWidth - viewport.clientWidth;
      var scrollable = maxScroll > 4;
      prevBtn.disabled = !scrollable || viewport.scrollLeft <= 4;
      nextBtn.disabled = !scrollable || viewport.scrollLeft >= maxScroll - 4;
      row.classList.toggle('scroll-row--static', !scrollable);
    }

    prevBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: -step(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      viewport.scrollBy({ left: step(), behavior: 'smooth' });
    });

    var ticking = false;
    viewport.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { update(); ticking = false; });
      }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  document.querySelectorAll('[data-scroll-row]').forEach(initScrollRow);

  /* ---- Carrosséis de slides (lançamentos e portfólio) ---- */
  function initCarousel(carousel) {
    var track = carousel.querySelector('.carousel__track');
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-carousel-dot]'));
    var statusEl = carousel.querySelector('[data-carousel-status]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var persist = carousel.hasAttribute('data-carousel-persist');
    var AUTOPLAY_MS = parseInt(carousel.getAttribute('data-carousel-interval'), 10) || 6500;
    var current = 0;
    var autoTimer = null;
    var autoStopped = reduceMotion;
    var paused = false;
    /* Fora da tela o carrossel fica morto: não gira, não gasta processamento.
       O slide atual é preservado, então ao voltar ele está como o visitante deixou. */
    var naTela = false;

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function (dot, d) {
        dot.setAttribute('aria-current', String(d === current));
      });
      slides.forEach(function (slide, s) {
        var active = s === current;
        slide.setAttribute('aria-hidden', String(!active));
        slide.querySelectorAll('a, button').forEach(function (el) {
          if (active) el.removeAttribute('tabindex');
          else el.setAttribute('tabindex', '-1');
        });
      });
      if (statusEl) {
        var title = slides[current].querySelector('h3');
        statusEl.textContent = 'Slide ' + (current + 1) + ' de ' + slides.length + (title ? ': ' + title.textContent : '');
      }
    }

    function clearAuto() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
      if (statusEl) statusEl.setAttribute('aria-live', 'polite');
    }

    function maybeStartAuto() {
      /* naTela e document.hidden entram aqui porque TODO caminho que religa o
         autoplay (tirar o mouse, sair do foco, voltar de outra aba) passa por
         esta função. Sem a checagem, um carrossel fora da tela voltava a girar. */
      if (autoStopped || paused || autoTimer || !naTela || document.hidden) return;
      autoTimer = setInterval(function () { goTo(current + 1); }, AUTOPLAY_MS);
      if (statusEl) statusEl.setAttribute('aria-live', 'off');
    }

    function stopAuto() {
      autoStopped = true;
      clearAuto();
    }

    /* Em carrosséis 'persist', interações não desligam o autoplay — só reiniciam o timer */
    function interact(fn) {
      if (persist) { clearAuto(); fn(); maybeStartAuto(); }
      else { stopAuto(); fn(); }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { interact(function () { goTo(current - 1); }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { interact(function () { goTo(current + 1); }); });
    dots.forEach(function (dot, d) {
      dot.addEventListener('click', function () { interact(function () { goTo(d); }); });
    });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { interact(function () { goTo(current - 1); }); }
      else if (e.key === 'ArrowRight') { interact(function () { goTo(current + 1); }); }
    });

    carousel.addEventListener('mouseenter', function () { paused = true; clearAuto(); });
    carousel.addEventListener('mouseleave', function () { paused = false; maybeStartAuto(); });
    carousel.addEventListener('focusin', function () { paused = true; clearAuto(); });
    carousel.addEventListener('focusout', function (e) {
      if (!carousel.contains(e.relatedTarget)) { paused = false; maybeStartAuto(); }
    });

    var swipeStartX = null;
    var swipeStartY = null;
    track.addEventListener('pointerdown', function (e) {
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
    });
    track.addEventListener('pointerup', function (e) {
      if (swipeStartX === null) return;
      var dx = e.clientX - swipeStartX;
      var dy = e.clientY - swipeStartY;
      swipeStartX = null;
      swipeStartY = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        interact(function () { goTo(current + (dx < 0 ? 1 : -1)); });
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearAuto();
      else maybeStartAuto();
    });

    if ('IntersectionObserver' in window) {
      var carouselObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          /* Basta um pedaço visível para o carrossel viver; sumiu por completo,
             morre. Usar a proporção (ex.: 30%) quebraria em telas pequenas, onde
             um carrossel mais alto que a janela nunca alcança a proporção pedida
             e por isso jamais giraria. */
          naTela = entry.isIntersecting;
          if (naTela) maybeStartAuto();
          else clearAuto();   /* morre aqui; o slide atual continua guardado */
        });
      }, { threshold: 0 });
      carouselObserver.observe(carousel);
    } else {
      naTela = true;
      maybeStartAuto();
    }

    goTo(0);
  }
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
})();
