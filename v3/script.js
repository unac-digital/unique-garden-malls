/* ==========================================================================
   Unique Garden Malls — script.js
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Video de fundo do hero ---- */
  /* O CSS ja esconde o video no modo "reduzir movimento", mas escondido ele
     ainda baixaria 3 MB. Aqui a fonte e removida antes disso acontecer. */
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

  /* ---- Vídeo institucional: player próprio (qualidade, velocidade, tela cheia) ---- */
  function formatTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var mm = h ? (m < 10 ? '0' + m : m) : m;
    return (h ? h + ':' : '') + mm + ':' + (sec < 10 ? '0' + sec : sec);
  }

  function initVideoPlayer(root) {
    var video = root.querySelector('.vplayer__video');
    var sources = [];
    try { sources = JSON.parse(root.getAttribute('data-sources') || '[]'); } catch (e) {}
    if (!video || !sources.length) return null;

    var seek = root.querySelector('.vplayer__seek');
    var progress = root.querySelector('.vplayer__progress');
    var playedBar = root.querySelector('.vplayer__played');
    var bufferedBar = root.querySelector('.vplayer__buffered');
    var tooltip = root.querySelector('.vplayer__tooltip');
    var currentEl = root.querySelector('[data-vp-current]');
    var durationEl = root.querySelector('[data-vp-duration]');
    var toggleBtns = root.querySelectorAll('[data-vp-toggle]');
    var muteBtn = root.querySelector('[data-vp-mute]');
    var volumeRange = root.querySelector('.vplayer__volume-range');
    var fsBtn = root.querySelector('[data-vp-fullscreen]');
    var pipBtn = root.querySelector('[data-vp-pip]');
    var speedLabel = root.querySelector('[data-vp-speed-label]');
    var qualityLabel = root.querySelector('[data-vp-quality-label]');
    var menuBtns = root.querySelectorAll('[data-vp-menu]');

    var SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    var loaded = false;
    var dragging = false;
    var idleTimer = null;
    var lastPointer = 'mouse';

    /* Qualidade inicial: a menor que ainda cobre o tamanho real do player na
       tela (já contando a densidade de pixels). Quem ativou economia de dados
       começa na mais leve. A pessoa pode trocar a qualquer momento. */
    sources.sort(function (a, b) { return b.height - a.height; });
    var quality = (function () {
      var conn = navigator.connection;
      if (conn && conn.saveData) return sources.length - 1;
      var playerW = Math.min(window.innerWidth, 1200) * (window.devicePixelRatio || 1);
      var needH = playerW * 9 / 16;
      for (var i = sources.length - 1; i >= 0; i--) {
        if (sources[i].height >= needH) return i;
      }
      return 0;
    })();

    function load() {
      if (loaded) return;
      loaded = true;
      /* preload="none" no HTML evita o download antes da hora; depois de
         aberto, precisa ser auto, senão a troca de qualidade não carrega a
         nova fonte e o vídeo fica parado. */
      video.preload = 'auto';
      video.src = sources[quality].src;
    }

    function play() {
      load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    function togglePlay() {
      if (video.paused || video.ended) play();
      else video.pause();
    }

    function seekTo(t) {
      if (!loaded) load();
      if (!isFinite(video.duration)) return;
      video.currentTime = Math.min(Math.max(t, 0), video.duration);
      showControls();
    }

    /* ---- Estado visual ---- */
    function updatePlayState() {
      var playing = !video.paused && !video.ended;
      root.classList.toggle('is-playing', playing);
      toggleBtns.forEach(function (btn) {
        btn.setAttribute('aria-label', playing ? 'Pausar' : 'Reproduzir');
      });
      if (!playing) showControls();
      else scheduleIdle();
    }

    function updateTime() {
      var d = video.duration;
      var t = video.currentTime;
      currentEl.textContent = formatTime(t);
      if (!dragging && isFinite(d) && d > 0) {
        seek.value = Math.round((t / d) * 1000);
        playedBar.style.width = (t / d * 100) + '%';
      }
      seek.setAttribute('aria-valuetext', formatTime(t) + ' de ' + formatTime(d));
    }

    function updateBuffered() {
      var d = video.duration;
      if (!isFinite(d) || d <= 0) return;
      var end = 0;
      for (var i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime + 0.5) end = video.buffered.end(i);
      }
      bufferedBar.style.width = (end / d * 100) + '%';
    }

    function updateVolume() {
      var muted = video.muted || video.volume === 0;
      root.classList.toggle('is-muted', muted);
      muteBtn.setAttribute('aria-label', muted ? 'Ativar som' : 'Desativar som');
      var v = muted ? 0 : video.volume;
      volumeRange.value = v;
      volumeRange.style.setProperty('--vol', (v * 100) + '%');
    }

    /* ---- Controles que somem sozinhos ---- */
    function anyMenuOpen() {
      return !!root.querySelector('.vplayer__menu:not([hidden])');
    }
    function scheduleIdle() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (!video.paused && !anyMenuOpen() && !dragging) root.classList.add('is-idle');
      }, 2600);
    }
    function showControls() {
      root.classList.remove('is-idle');
      scheduleIdle();
    }

    /* ---- Menus de velocidade e qualidade ---- */
    function buildMenu(name, title, items, isChecked, onPick) {
      var list = root.querySelector('[data-vp-menu-list="' + name + '"]');
      list.innerHTML = '';
      var heading = document.createElement('p');
      heading.className = 'vplayer__menu-title';
      heading.setAttribute('aria-hidden', 'true');
      heading.textContent = title;
      list.appendChild(heading);
      items.forEach(function (item, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'vplayer__menu-item';
        btn.setAttribute('role', 'menuitemradio');
        btn.setAttribute('aria-checked', String(isChecked(i)));
        btn.setAttribute('tabindex', '-1');
        btn.textContent = item.label;
        if (item.hint) {
          var hint = document.createElement('small');
          hint.textContent = item.hint;
          btn.appendChild(hint);
        }
        btn.addEventListener('click', function () {
          onPick(i);
          closeMenus(true);
        });
        list.appendChild(btn);
      });
    }

    function renderSpeedMenu() {
      buildMenu('speed', 'Velocidade', SPEEDS.map(function (s) {
        return { label: s === 1 ? 'Normal' : String(s).replace('.', ',') + 'x' };
      }), function (i) { return SPEEDS[i] === video.playbackRate; }, setSpeed);
    }

    function renderQualityMenu() {
      buildMenu('quality', 'Qualidade', sources.map(function (s) {
        return { label: s.label, hint: s.height >= 1080 ? 'Full HD' : (s.height >= 720 ? 'HD' : '') };
      }), function (i) { return i === quality; }, setQuality);
    }

    function setSpeed(i) {
      var rate = SPEEDS[i];
      /* defaultPlaybackRate também, senão a troca de qualidade volta para 1x */
      video.defaultPlaybackRate = rate;
      video.playbackRate = rate;
      var txt = String(rate).replace('.', ',') + 'x';
      speedLabel.textContent = txt;
      root.querySelector('[data-vp-menu="speed"]').setAttribute('aria-label', 'Velocidade de reprodução: ' + txt);
      renderSpeedMenu();
    }

    function setQuality(i) {
      if (i === quality) return;
      quality = i;
      qualityLabel.textContent = sources[i].label;
      root.querySelector('[data-vp-menu="quality"]').setAttribute('aria-label', 'Qualidade do vídeo: ' + sources[i].label);
      renderQualityMenu();
      if (!loaded) return;

      /* Troca a fonte sem perder o ponto do vídeo nem o play/pause */
      var t = video.currentTime;
      var wasPlaying = !video.paused && !video.ended;
      root.classList.add('is-loading');
      video.src = sources[i].src;
      video.load();
      video.addEventListener('loadedmetadata', function () {
        video.currentTime = t;
        if (wasPlaying) play();
        else root.classList.remove('is-loading');
      }, { once: true });
    }

    function openMenu(btn) {
      var list = root.querySelector('[data-vp-menu-list="' + btn.getAttribute('data-vp-menu') + '"]');
      closeMenus(false);
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      showControls();
      var checked = list.querySelector('[aria-checked="true"]') || list.querySelector('.vplayer__menu-item');
      if (checked) checked.focus();
    }

    /* Devolve true se havia menu aberto (o Esc usa isso para fechar só o menu) */
    function closeMenus(returnFocus) {
      var closed = false;
      menuBtns.forEach(function (btn) {
        var list = root.querySelector('[data-vp-menu-list="' + btn.getAttribute('data-vp-menu') + '"]');
        if (!list.hidden) {
          list.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          if (returnFocus) btn.focus();
          closed = true;
        }
      });
      return closed;
    }

    menuBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (btn.getAttribute('aria-expanded') === 'true') closeMenus(false);
        else openMenu(btn);
      });
    });

    root.querySelectorAll('.vplayer__menu').forEach(function (list) {
      list.addEventListener('click', function (e) { e.stopPropagation(); });
      list.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(list.querySelectorAll('.vplayer__menu-item'));
        var idx = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          e.stopPropagation();
          var next = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
          items[(next + items.length) % items.length].focus();
        } else if (e.key === 'Tab') {
          closeMenus(false);
        } else if (e.key !== 'Escape') {
          e.stopPropagation();
        }
      });
    });

    root.addEventListener('click', function () { closeMenus(false); });

    /* ---- Tela cheia e picture-in-picture ---- */
    function isFullscreen() {
      return (document.fullscreenElement || document.webkitFullscreenElement) === root;
    }
    function toggleFullscreen() {
      if (isFullscreen()) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else if (root.requestFullscreen) {
        root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        root.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        /* iPhone: só o próprio vídeo entra em tela cheia, com o player do iOS */
        load();
        video.webkitEnterFullscreen();
      }
    }
    function onFullscreenChange() {
      var fs = isFullscreen();
      root.classList.toggle('is-fullscreen', fs);
      fsBtn.setAttribute('aria-label', fs ? 'Sair da tela cheia' : 'Tela cheia');
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    fsBtn.addEventListener('click', toggleFullscreen);

    if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
      pipBtn.hidden = false;
      pipBtn.addEventListener('click', function () {
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(function () {});
        } else {
          load();
          video.requestPictureInPicture().catch(function () {});
        }
      });
    }

    /* ---- Eventos do vídeo ---- */
    video.addEventListener('play', updatePlayState);
    video.addEventListener('pause', updatePlayState);
    video.addEventListener('ended', updatePlayState);
    /* Trocar o src pausa o vídeo sem disparar 'pause' */
    video.addEventListener('emptied', updatePlayState);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('volumechange', updateVolume);
    video.addEventListener('loadedmetadata', function () {
      durationEl.textContent = formatTime(video.duration);
      updateTime();
      updateBuffered();
    });
    video.addEventListener('waiting', function () { root.classList.add('is-loading'); });
    video.addEventListener('playing', function () { root.classList.remove('is-loading'); });
    video.addEventListener('canplay', function () { root.classList.remove('is-loading'); });
    video.addEventListener('seeked', function () { root.classList.remove('is-loading'); });

    /* No toque, o primeiro toque com os controles escondidos só os mostra */
    root.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType; });
    video.addEventListener('click', function () {
      if (lastPointer === 'touch' && root.classList.contains('is-idle')) { showControls(); return; }
      togglePlay();
    });
    video.addEventListener('dblclick', toggleFullscreen);
    toggleBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(); });
    });

    root.querySelectorAll('[data-vp-skip]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        seekTo(video.currentTime + parseFloat(btn.getAttribute('data-vp-skip')));
      });
    });

    muteBtn.addEventListener('click', function () {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        if (video.volume === 0) video.volume = 1;
      } else {
        video.muted = true;
      }
    });
    volumeRange.addEventListener('input', function () {
      var v = parseFloat(volumeRange.value);
      video.volume = v;
      video.muted = v === 0;
    });

    /* ---- Barra de progresso ---- */
    seek.addEventListener('input', function () {
      dragging = true;
      var d = video.duration;
      if (!isFinite(d)) return;
      var t = seek.value / 1000 * d;
      playedBar.style.width = (seek.value / 10) + '%';
      currentEl.textContent = formatTime(t);
      video.currentTime = t;
    });
    seek.addEventListener('change', function () {
      dragging = false;
      scheduleIdle();
    });
    progress.addEventListener('pointermove', function (e) {
      var rect = progress.getBoundingClientRect();
      var x = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
      var half = tooltip.offsetWidth / 2;
      tooltip.style.left = Math.min(Math.max(x, half), rect.width - half) + 'px';
      tooltip.textContent = formatTime(x / rect.width * (video.duration || 0));
    });

    root.addEventListener('pointermove', showControls);
    root.addEventListener('focusin', showControls);

    /* ---- Atalhos de teclado (iguais aos dos players mais conhecidos) ---- */
    function handleKey(e) {
      var target = e.target;
      var tag = target.tagName;
      if (target === volumeRange) return;
      var onButton = tag === 'BUTTON';
      switch (e.key) {
        case ' ':
        case 'Spacebar':
          if (onButton) return;
          e.preventDefault(); togglePlay(); break;
        case 'k': case 'K':
          e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft':
          e.preventDefault(); seekTo(video.currentTime - 5); break;
        case 'ArrowRight':
          e.preventDefault(); seekTo(video.currentTime + 5); break;
        case 'j': case 'J':
          seekTo(video.currentTime - 10); break;
        case 'l': case 'L':
          seekTo(video.currentTime + 10); break;
        case 'ArrowUp':
          e.preventDefault(); video.muted = false; video.volume = Math.min(1, video.volume + 0.1); showControls(); break;
        case 'ArrowDown':
          e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); showControls(); break;
        case 'm': case 'M':
          muteBtn.click(); showControls(); break;
        case 'f': case 'F':
          toggleFullscreen(); break;
        case 'Home':
          e.preventDefault(); seekTo(0); break;
        case 'End':
          e.preventDefault(); seekTo(video.duration); break;
        default:
          if (/^[0-9]$/.test(e.key) && isFinite(video.duration)) {
            seekTo(video.duration * parseInt(e.key, 10) / 10);
          }
      }
    }

    qualityLabel.textContent = sources[quality].label;
    root.querySelector('[data-vp-menu="quality"]').setAttribute('aria-label', 'Qualidade do vídeo: ' + sources[quality].label);
    renderSpeedMenu();
    renderQualityMenu();
    updateVolume();

    return {
      play: play,
      pause: function () { video.pause(); },
      handleKey: handleKey,
      closeMenus: closeMenus,
      exitFullscreen: function () { if (isFullscreen()) toggleFullscreen(); }
    };
  }

  /* ---- Janela do vídeo: abre por cima do site, com o fundo borrado ---- */
  document.querySelectorAll('[data-video-open]').forEach(function (trigger) {
    var modal = document.getElementById(trigger.getAttribute('data-video-open'));
    if (!modal || typeof modal.showModal !== 'function') return;
    var player = initVideoPlayer(modal.querySelector('[data-vplayer]'));
    if (!player) return;
    var closeTimer = null;

    function open() {
      clearTimeout(closeTimer);
      if (!modal.open) modal.showModal();
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { modal.classList.add('is-visible'); });
      player.play();
    }

    function close() {
      if (!modal.open) return;
      player.pause();
      player.closeMenus(false);
      player.exitFullscreen();
      modal.classList.remove('is-visible');
      /* Espera o fade-out antes de tirar a janela da tela */
      closeTimer = setTimeout(function () { modal.close(); }, 250);
    }

    trigger.addEventListener('click', open);
    modal.querySelector('[data-video-close]').addEventListener('click', close);

    /* Clique fora do player (no fundo borrado) fecha */
    modal.addEventListener('click', function (e) {
      if (e.target === modal) close();
    });

    /* Esc: primeiro fecha um menu aberto; se não houver, fecha a janela */
    modal.addEventListener('cancel', function (e) {
      e.preventDefault();
      if (!player.closeMenus(true)) close();
    });

    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') return;
      if (e.target.closest && e.target.closest('.video-modal__close')) return;
      player.handleKey(e);
    });

    modal.addEventListener('close', function () {
      modal.classList.remove('is-visible');
      document.body.style.overflow = '';
      trigger.focus();
    });
  });
})();
