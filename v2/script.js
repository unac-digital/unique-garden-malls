/* ==========================================================================
   Unique Garden Malls — script.js
   ========================================================================== */

(function () {
  'use strict';

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
            observer.unobserve(entry.target);
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
  document.querySelectorAll('.faq-item__question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var answer = document.getElementById(btn.getAttribute('aria-controls'));

      document.querySelectorAll('.faq-item__question').forEach(function (other) {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          var otherAnswer = document.getElementById(other.getAttribute('aria-controls'));
          if (otherAnswer) otherAnswer.setAttribute('data-open', 'false');
        }
      });

      btn.setAttribute('aria-expanded', String(!expanded));
      if (answer) answer.setAttribute('data-open', String(!expanded));
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

  /* ---- Carrossel de lançamentos (home) ---- */
  var carousel = document.querySelector('[data-carousel]');
  if (carousel) {
    var track = carousel.querySelector('.carousel__track');
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = carousel.querySelector('[data-carousel-prev]');
    var nextBtn = carousel.querySelector('[data-carousel-next]');
    var dots = Array.prototype.slice.call(carousel.querySelectorAll('[data-carousel-dot]'));
    var statusEl = carousel.querySelector('[data-carousel-status]');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var AUTOPLAY_MS = 6500;
    var current = 0;
    var autoTimer = null;
    var autoStopped = reduceMotion;
    var paused = false;

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
      if (autoStopped || paused || autoTimer) return;
      autoTimer = setInterval(function () { goTo(current + 1); }, AUTOPLAY_MS);
      if (statusEl) statusEl.setAttribute('aria-live', 'off');
    }

    function stopAuto() {
      autoStopped = true;
      clearAuto();
    }

    prevBtn.addEventListener('click', function () { stopAuto(); goTo(current - 1); });
    nextBtn.addEventListener('click', function () { stopAuto(); goTo(current + 1); });
    dots.forEach(function (dot, d) {
      dot.addEventListener('click', function () { stopAuto(); goTo(d); });
    });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { stopAuto(); goTo(current - 1); }
      else if (e.key === 'ArrowRight') { stopAuto(); goTo(current + 1); }
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
        stopAuto();
        goTo(current + (dx < 0 ? 1 : -1));
      }
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearAuto();
      else maybeStartAuto();
    });

    if ('IntersectionObserver' in window) {
      var carouselObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) maybeStartAuto();
          else clearAuto();
        });
      }, { threshold: 0.3 });
      carouselObserver.observe(carousel);
    } else {
      maybeStartAuto();
    }

    goTo(0);
  }
})();
