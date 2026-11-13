/* ==========================================================================
   RVV SYSTEM — JavaScript único (V2)
   - Header y menú móvil
   - Navegación activa según la sección visible
   - Validación del formulario y envío por WhatsApp
   - Preselección del servicio desde los enlaces "Hablemos de tu proyecto"
   - Animaciones bidireccionales al hacer scroll (IntersectionObserver + CSS)
   Las funciones de scroll y de interfaz comparten un solo ámbito y un solo
   archivo; no se registran eventos duplicados.
   ========================================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '59170680432';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealElements = [];

  /* ======================================================================
     01. HEADER Y MENÚ MÓVIL
     ====================================================================== */
  function initHeaderAndMenu() {
    var header = document.getElementById('site-header');
    var toggle = document.querySelector('.menu-toggle');
    var nav = document.getElementById('main-nav');

    /* Header con sombra al hacer scroll. Un único listener, con rAF. */
    var scrollTicking = false;
    function updateHeader() {
      if (header) {
        header.classList.toggle('is-scrolled', window.scrollY > 16);
      }
      scrollTicking = false;
    }
    window.addEventListener('scroll', function () {
      if (!scrollTicking) {
        window.requestAnimationFrame(updateHeader);
        scrollTicking = true;
      }
    }, { passive: true });
    updateHeader();

    if (!toggle || !nav) return;

    function closeMenu() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('menu-open');
    }

    function openMenu() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Cerrar menú');
      document.body.classList.add('menu-open');
    }

    toggle.addEventListener('click', function () {
      var isOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (
        toggle.getAttribute('aria-expanded') === 'true' &&
        !nav.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1080) closeMenu();
    });
  }

  /* ======================================================================
     02. ENLACE ACTIVO EN LA NAVEGACIÓN
     ====================================================================== */
  function initActiveNavigation() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav ul a[href^="#"]'));
    var sections = navLinks.map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    }).filter(Boolean);

    if (!('IntersectionObserver' in window) || !sections.length) return;

    function setActiveLink(id) {
      navLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
      });
    }

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, {
      root: null,
      rootMargin: '-42% 0px -52% 0px',
      threshold: 0
    });
    sections.forEach(function (section) { sectionObserver.observe(section); });
  }

  /* ======================================================================
     03. AÑO ACTUAL
     ====================================================================== */
  function initYear() {
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ======================================================================
     04. PRESELECCIÓN DE SERVICIO
     ====================================================================== */
  function initServicePreselection() {
    var serviceSelect = document.getElementById('servicio');
    var serviceLinks = Array.prototype.slice.call(document.querySelectorAll('[data-service]'));

    function selectService(value) {
      if (!serviceSelect || !value) return;
      var optionExists = Array.prototype.some.call(serviceSelect.options, function (option) {
        return option.value === value;
      });
      if (optionExists) {
        serviceSelect.value = value;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    serviceLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        selectService(link.getAttribute('data-service'));
      });
    });

    var queryService = new URLSearchParams(window.location.search).get('servicio');
    if (queryService) selectService(queryService);
  }

  /* ======================================================================
     05. FORMULARIO: VALIDACIÓN Y ENVÍO POR WHATSAPP
     ====================================================================== */
  function initQuoteForm() {
    var form = document.getElementById('quote-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var fields = {
      nombre: document.getElementById('nombre'),
      empresa: document.getElementById('empresa'),
      telefono: document.getElementById('telefono'),
      correo: document.getElementById('correo'),
      servicio: document.getElementById('servicio'),
      descripcion: document.getElementById('descripcion')
    };

    var validators = {
      nombre: function (value) {
        return value.trim().length >= 2 ? '' : 'Escribe tu nombre (mínimo 2 caracteres).';
      },
      empresa: function (value) {
        return value.trim().length <= 100 ? '' : 'El nombre de la empresa es demasiado largo.';
      },
      telefono: function (value) {
        /* Solo se permiten dígitos y los separadores habituales. */
        var cleaned = value.replace(/[\s().+-]/g, '');
        return /^\d{7,15}$/.test(cleaned)
          ? ''
          : 'Ingresa un teléfono válido, de 7 a 15 dígitos.';
      },
      correo: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
          ? ''
          : 'Ingresa un correo electrónico válido.';
      },
      servicio: function (value) {
        return value ? '' : 'Selecciona el servicio que necesitas.';
      },
      descripcion: function (value) {
        return value.trim().length >= 15
          ? ''
          : 'Describe tu proyecto con al menos 15 caracteres.';
      }
    };

    function showError(name, message) {
      var input = fields[name];
      if (!input) return;
      var field = input.closest('.field');
      var error = document.getElementById('error-' + name);
      field.classList.toggle('is-invalid', Boolean(message));
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (error) error.textContent = message;
    }

    function validateField(name) {
      var input = fields[name];
      if (!input || !validators[name]) return true;
      var message = validators[name](input.value);
      showError(name, message);
      return !message;
    }

    Object.keys(fields).forEach(function (name) {
      var input = fields[name];
      if (!input) return;

      input.addEventListener('blur', function () { validateField(name); });

      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('is-invalid')) {
          validateField(name);
        }
      });

      if (input.tagName === 'SELECT') {
        input.addEventListener('change', function () { validateField(name); });
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = null;
      Object.keys(validators).forEach(function (name) {
        var isValid = validateField(name);
        if (!isValid && !firstInvalid) firstInvalid = fields[name];
      });

      if (firstInvalid) {
        if (status) {
          status.textContent = 'Revisa los campos marcados antes de continuar.';
          status.style.color = '#b42318';
        }
        firstInvalid.focus();
        return;
      }

      var message = [
        'Hola, RVV SYSTEM. Quiero solicitar una cotización.',
        '',
        'Nombre: ' + fields.nombre.value.trim(),
        'Empresa: ' + (fields.empresa.value.trim() || 'No indicada'),
        'Teléfono: ' + fields.telefono.value.trim(),
        'Correo: ' + fields.correo.value.trim(),
        'Servicio: ' + fields.servicio.value,
        '',
        'Descripción del proyecto:',
        fields.descripcion.value.trim()
      ].join('\n');

      var whatsappUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);

      if (status) {
        status.style.color = '';
        status.textContent = 'Abriendo WhatsApp con tu solicitud lista para revisar y enviar…';
      }

      /* Abre WhatsApp en otra pestaña. Si el navegador bloquea la ventana,
         se abre en la misma pestaña para no perder la consulta. */
      var popup = window.open(whatsappUrl, '_blank');

      if (popup) {
        popup.opener = null;
        if (status) {
          status.textContent = 'WhatsApp se abrió en otra pestaña. Revisa el mensaje y pulsa enviar; el sitio no envía datos por sí solo.';
        }
      } else {
        if (status) {
          status.textContent = 'El navegador bloqueó la pestaña. Abriendo WhatsApp en esta pestaña…';
        }
        window.location.href = whatsappUrl;
      }
    });
  }

  /* ======================================================================
     06. ANIMACIONES BIDIRECCIONALES AL HACER SCROLL
     ====================================================================== */
  function initScrollReveals() {
    /* Reparte retardos escalonados. En los servicios, primero aparece la
       imagen y después título, descripción, lista y botón. */
    document.querySelectorAll('[data-stagger]').forEach(function (group) {
      var items = Array.prototype.slice.call(group.querySelectorAll('.reveal'));
      var copy = group.classList.contains('service') ? group.querySelector('.service-copy') : null;

      items.forEach(function (element) {
        var delay = 0;

        if (copy) {
          var copyItems = Array.prototype.slice.call(copy.querySelectorAll('.reveal'));
          var copyIndex = copyItems.indexOf(element);
          delay = copyIndex > -1 ? 420 + copyIndex * 85 : Math.min(items.indexOf(element) * 55, 210);
        } else {
          delay = Math.min(items.indexOf(element) * 80, 640);
        }

        element.style.setProperty('--reveal-delay', delay + 'ms');
      });
    });

    revealElements = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    function showAll() {
      revealElements.forEach(function (element) {
        element.classList.add('is-visible');
      });
    }

    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      showAll();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var element = entry.target;
        if (entry.isIntersecting) {
          element.classList.add('is-visible');
        } else {
          /* Al salir se restablece el estado inicial para permitir la
             animación inversa al volver a entrar, tanto al bajar como al subir. */
          element.classList.remove('is-visible');
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    revealElements.forEach(function (element) {
      observer.observe(element);
    });

    reducedMotion.addEventListener('change', function (event) {
      if (event.matches) {
        observer.disconnect();
        showAll();
      }
    });
  }

  /* ======================================================================
     INICIALIZACIÓN
     ====================================================================== */
  initHeaderAndMenu();
  initActiveNavigation();
  initYear();
  initServicePreselection();
  initQuoteForm();
  initScrollReveals();
})();
