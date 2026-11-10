/* Piper Drone — interacción. Script clásico (sin módulos) para que funcione también abriendo el archivo local. */
(function () {
  "use strict";

  /* ===== EDITAR ACÁ ===== */
  var SITE = {
    whatsapp: "",   // Ej: "5493465000000" (54 + 9 + código de área sin 0 + número sin 15). Vacío = el botón lleva a Instagram.
    instagram: "https://www.instagram.com/piperdronepro/"
  };
  /* ===== FIN ===== */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var safe = function (fn, name) { try { fn(); } catch (e) { if (window.console) console.warn("[piper] " + name, e); } };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = !!(navigator.connection && navigator.connection.saveData);
  var canHover = window.matchMedia("(hover: hover)").matches;
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger); };

  /* ---------- Arranque ---------- */
  var booted = false;
  function endBoot() {
    if (booted) return; booted = true;
    var boot = $("#boot");
    document.body.classList.remove("is-booting");
    if (!boot) return heroIntro();
    boot.classList.add("is-done");
    if (hasGsap()) {
      gsap.to(".boot-frame", { scale: 1.6, opacity: 0, duration: .7, ease: "power3.in" });
      gsap.to(boot, { opacity: 0, duration: .6, delay: .35, ease: "power2.out", onComplete: function () { boot.remove(); } });
      gsap.delayedCall(.35, heroIntro);
    } else {
      boot.style.transition = "opacity .5s"; boot.style.opacity = "0";
      setTimeout(function () { boot.remove(); }, 550);
      heroIntro();
    }
  }
  document.body.classList.add("is-booting");
  var t0 = Date.now();
  window.addEventListener("load", function () { setTimeout(endBoot, Math.max(0, 1250 - (Date.now() - t0))); });
  setTimeout(endBoot, 2600); // red de seguridad: nunca queda trabado

  function heroIntro() {
    if (!hasGsap()) return;
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero-title .line > span", { yPercent: 110, duration: 1.3, stagger: .12 })
      .from(".hero-media", { scale: 1.18, duration: 2.2, ease: "power3.out" }, 0)
      .from(".hud .c", { opacity: 0, scale: .4, duration: .8, stagger: .05 }, .1)
      .from(".hud > div", { opacity: 0, y: 8, duration: .8, stagger: .06 }, .3)
      .from(".hero .reveal-up", { opacity: 0, y: 22, duration: 1, stagger: .1 }, .35)
      .from(".nav", { yPercent: -100, opacity: 0, duration: 1 }, .2);
  }

  /* ---------- Videos: cargan y se reproducen sólo en pantalla ---------- */
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function load(v) { if (!v.getAttribute("src") && v.dataset.src) { v.src = v.dataset.src; } }

  safe(function () {
    var hero = $("#heroVid");
    if (hero && !reduce && !saveData) { load(hero); play(hero); }
    var loops = $$("video.loop");
    if (reduce || saveData) {
      // Sin reproducción automática: el video arranca al pasar el mouse por encima.
      loops.forEach(function (v) {
        var host = v.closest(".work, .pane") ; if (!host) return;
        host.addEventListener("mouseenter", function () { load(v); play(v); });
        host.addEventListener("mouseleave", function () { v.pause(); });
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { load(v); play(v); } else { v.pause(); }
      });
    }, { rootMargin: "200px 200px", threshold: 0.01 });
    loops.forEach(function (v) { io.observe(v); });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { $$("video").forEach(function (v) { v.pause(); }); }
      else { if (hero && hero.getAttribute("src")) play(hero); }
    });
  }, "videos");

  /* ---------- HUD: código de tiempo, altitud y velocidad ---------- */
  safe(function () {
    var tc = $("#tc"), alt = $("#alt"), vel = $("#vel"), hz = $("#horizon");
    var start = performance.now(), lastY = window.scrollY, speed = 0;
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    function tick(now) {
      var t = (now - start) / 1000;
      var f = Math.floor((t % 1) * 30), s = Math.floor(t) % 60, m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
      if (tc) tc.textContent = pad(h) + ":" + pad(m) + ":" + pad(s) + ":" + pad(f);
      var y = window.scrollY, dy = Math.abs(y - lastY); lastY = y;
      speed += (Math.min(dy * 3.2, 99) - speed) * .08;
      if (vel) vel.textContent = pad(Math.round(speed));
      if (alt) alt.textContent = String(Math.max(0, Math.round(120 - y * .08))).padStart(3, "0");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    if (hz && canHover) {
      window.addEventListener("mousemove", function (e) {
        var rx = (e.clientX / window.innerWidth - .5) * 8, ry = (e.clientY / window.innerHeight - .5) * 14;
        hz.style.transform = "translateY(" + ry.toFixed(1) + "px) rotate(" + rx.toFixed(2) + "deg)";
      }, { passive: true });
    }
  }, "hud");

  /* ---------- Navegación ---------- */
  safe(function () {
    var nav = $("#nav"), last = 0;
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle("is-solid", y > 40);
      nav.classList.toggle("is-hidden", y > 400 && y > last + 4);
      if (y < last - 4) nav.classList.remove("is-hidden");
      last = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }, "nav");

  /* ---------- Cursor "Ver" sobre los videos ---------- */
  safe(function () {
    if (!canHover) return;
    var cur = $("#cursor"), x = 0, y = 0, cx = 0, cy = 0, first = true;
    window.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
      if (first) { cx = x; cy = y; first = false; }
    }, { passive: true });
    (function loop() {
      cx += (x - cx) * .2; cy += (y - cy) * .2;
      cur.style.left = cx + "px"; cur.style.top = cy + "px";
      requestAnimationFrame(loop);
    })();
    $$("[data-cursor]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-on"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-on"); });
    });
  }, "cursor");

  /* ---------- Botones magnéticos ---------- */
  safe(function () {
    if (!canHover) return;
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * .22, dy = (e.clientY - r.top - r.height / 2) * .3;
        b.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
      b.style.transition = "transform .35s cubic-bezier(.2,.7,.1,1), color .35s, border-color .35s";
    });
  }, "magnetic");

  /* ---------- Servicios: vista previa que sigue al mouse ---------- */
  safe(function () {
    var box = $("#svcFloat"), img = $("#svcImg"); if (!box || !canHover) return;
    var x = 0, y = 0, cx = 0, cy = 0, on = false;
    $$(".svc").forEach(function (row) {
      var src = row.dataset.preview; var pre = new Image(); pre.src = src;
      row.addEventListener("mouseenter", function () { img.src = src; box.classList.add("is-on"); on = true; });
      row.addEventListener("mouseleave", function () { box.classList.remove("is-on"); on = false; });
    });
    window.addEventListener("mousemove", function (e) { x = e.clientX + 28; y = e.clientY - 110; }, { passive: true });
    (function loop() {
      cx += (x - cx) * .14; cy += (y - cy) * .14;
      var rot = Math.max(-8, Math.min(8, (x - cx) * .06));
      box.style.translate = cx.toFixed(1) + "px " + cy.toFixed(1) + "px";
      box.style.rotate = rot.toFixed(2) + "deg";
      requestAnimationFrame(loop);
    })();
  }, "svc");

  /* ---------- Animaciones con scroll (GSAP) ---------- */
  function initScroll() {
    if (!hasGsap()) return reelFallback();
    gsap.registerPlugin(ScrollTrigger);

    safe(function () {
      gsap.to(".hero-media", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero-body", { yPercent: -18, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });
    }, "heroParallax");

    // Manifiesto: las palabras se encienden al bajar
    safe(function () {
      var st = $("#statement"); if (!st) return;
      var words = st.textContent.trim().split(/\s+/);
      st.setAttribute("aria-label", st.textContent.trim());
      st.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + "</span>"; }).join(" ");
      gsap.to(st.querySelectorAll(".w"), { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: st, start: "top 82%", end: "bottom 45%", scrub: .6 } });
    }, "statement");

    // Contadores
    safe(function () {
      $$(".count").forEach(function (el) {
        var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || "0", 10), o = { v: 0 };
        var fmt = function (n) { return dec ? n.toFixed(dec).replace(".", ",") : Math.round(n).toLocaleString("es-AR"); };
        el.textContent = fmt(0);
        ScrollTrigger.create({ trigger: el, start: "top 98%", once: true, onEnter: function () {
          gsap.to(o, { v: to, duration: 2, ease: "power3.out", onUpdate: function () { el.textContent = fmt(o.v); } });
        } });
      });
      gsap.from(".stat", { y: 40, opacity: 0, duration: 1, stagger: .1, ease: "expo.out", scrollTrigger: { trigger: ".stats", start: "top 88%" } });
    }, "counts");

    // Títulos de sección
    safe(function () {
      $$("h2").forEach(function (h) {
        gsap.from(h, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: h, start: "top 88%" } });
      });
      $$(".eyebrow:not(.reveal-up)").forEach(function (e) {
        gsap.from(e, { x: -20, opacity: 0, duration: .9, ease: "expo.out", scrollTrigger: { trigger: e, start: "top 92%" } });
      });
    }, "titles");

    // Trabajos: recorrido horizontal fijado (escritorio)
    safe(function () {
      var mm = gsap.matchMedia();
      mm.add("(min-width: 821px)", function () {
        var reel = $("#reel"), track = $("#reelTrack"), bar = $("#reelBar");
        reel.classList.add("is-pinned");
        var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
        var tween = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: reel, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (s) { bar.style.transform = "scaleX(" + s.progress.toFixed(4) + ")"; } } });
        $$(".work").forEach(function (w) {
          gsap.fromTo(w.querySelector(".work-media video"), { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: w, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
          gsap.from(w.querySelectorAll(".work-meta > *"), { y: 30, opacity: 0, stagger: .08, duration: .9, ease: "expo.out", scrollTrigger: { trigger: w, containerAnimation: tween, start: "left 75%" } });
        });
        return function () { reel.classList.remove("is-pinned"); gsap.set(track, { clearProps: "transform" }); };
      });
      mm.add("(max-width: 820px)", function () { reelFallback(); });
    }, "reel");

    safe(function () {
      gsap.from(".work", { clipPath: "inset(12% 8% 12% 8%)", duration: 1.4, ease: "expo.out", stagger: .08, scrollTrigger: { trigger: "#reel", start: "top 80%" } });
      gsap.from(".yt-card", { y: 60, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".channel-grid", start: "top 88%" } });
    }, "worksIn");

    // Servicios: filas que entran
    safe(function () {
      gsap.from(".svc", { y: 40, opacity: 0, duration: .9, stagger: .07, ease: "expo.out", scrollTrigger: { trigger: "#svcList", start: "top 85%" } });
    }, "svcIn");

    // Dos formas de volar: los paneles se abren desde el centro
    safe(function () {
      gsap.from("#paneA", { clipPath: "inset(0 0 0 100%)", duration: 1.5, ease: "expo.inOut", scrollTrigger: { trigger: ".split", start: "top 75%" } });
      gsap.from("#paneB", { clipPath: "inset(0 100% 0 0)", duration: 1.5, ease: "expo.inOut", scrollTrigger: { trigger: ".split", start: "top 75%" } });
      $$(".pane-media video").forEach(function (v) {
        gsap.fromTo(v, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: v.closest(".pane"), start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.from(".pane figcaption > *", { y: 30, opacity: 0, duration: 1, stagger: .08, ease: "expo.out", scrollTrigger: { trigger: ".split", start: "top 55%" } });
    }, "flight");

    // Proceso: la línea de cada paso se completa y la ruta se dibuja
    safe(function () {
      $$(".step").forEach(function (s, i) {
        ScrollTrigger.create({ trigger: s, start: "top 85%", end: "top 45%", scrub: true,
          onUpdate: function (st) { s.style.setProperty("--p", st.progress.toFixed(3)); s.classList.toggle("is-on", st.progress > .6); } });
        gsap.from(s.querySelectorAll("h3, p"), { y: 24, opacity: 0, duration: .9, delay: i * .05, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 85%" } });
      });
      var p = $("#fp");
      if (p) {
        var len = p.getTotalLength();
        gsap.fromTo(p, { strokeDashoffset: len, strokeDasharray: "4 8" }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".flightpath", start: "top 95%", end: "top 40%", scrub: true } });
        gsap.fromTo(".flightpath", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", ease: "none", scrollTrigger: { trigger: ".flightpath", start: "top 95%", end: "top 45%", scrub: true } });
      }
    }, "process");

    // Contacto y footer
    safe(function () {
      gsap.from(".brief", { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".brief", start: "top 88%" } });
      gsap.from(".footer-word", { yPercent: 40, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".footer", start: "top 92%" } });
    }, "contact");

    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
    // Si las fuentes cambian medidas, recalcular
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  // Sin GSAP o en móvil: barra de progreso según el desplazamiento horizontal nativo
  function reelFallback() {
    safe(function () {
      var track = $("#reelTrack"), bar = $("#reelBar"); if (!track || track.dataset.fb) return;
      track.dataset.fb = "1";
      var upd = function () { var m = track.scrollWidth - track.clientWidth; bar.style.transform = "scaleX(" + (m > 0 ? track.scrollLeft / m : 0).toFixed(4) + ")"; };
      track.addEventListener("scroll", upd, { passive: true }); upd();
    }, "reelFallback");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { safe(initScroll, "scroll"); });
  else safe(initScroll, "scroll");

  /* ---------- Palabra del pie ajustada al ancho ---------- */
  safe(function () {
    var w = $(".footer-word"); if (!w) return;
    function fit() {
      w.style.fontSize = "";
      var avail = w.parentElement.clientWidth - parseFloat(getComputedStyle(w.parentElement).paddingLeft) - parseFloat(getComputedStyle(w.parentElement).paddingRight);
      var fs = parseFloat(getComputedStyle(w).fontSize);
      if (w.scrollWidth > 0) w.style.fontSize = Math.min(fs * avail / w.scrollWidth, 260) + "px";
    }
    fit();
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }, "footerFit");

  /* ---------- Reproductor en pantalla ---------- */
  safe(function () {
    var dlg = $("#lightbox"), frame = $("#lbFrame");
    function open(title, sum, node) {
      $("#lbTitle").textContent = title; $("#lbSum").textContent = sum || "";
      frame.replaceChildren(node);
      $$("video.loop, #heroVid").forEach(function (v) { v.pause(); });
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    }
    $$(".work").forEach(function (w) {
      $(".work-open", w).addEventListener("click", function () {
        var v = document.createElement("video");
        v.src = w.dataset.video + "?v=20261110"; v.controls = true; v.autoplay = true; v.playsInline = true;
        var poster = $("video", w).getAttribute("poster"); if (poster) v.poster = poster;
        open(w.dataset.title, w.dataset.sum, v);
      });
    });
    $$(".yt-card").forEach(function (c) {
      c.addEventListener("click", function () {
        if (!/^https?:$/.test(location.protocol)) { window.open("https://www.youtube.com/watch?v=" + c.dataset.yt, "_blank", "noopener"); return; }
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + c.dataset.yt + "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
        f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; f.title = "Video: " + c.dataset.title;
        open(c.dataset.title, c.dataset.sum, f);
      });
    });
    function close() { if (dlg.open) dlg.close(); }
    dlg.addEventListener("close", function () {
      frame.replaceChildren();
      var hero = $("#heroVid"); if (hero && hero.getAttribute("src")) play(hero);
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
    $("#lbClose").addEventListener("click", close);
  }, "lightbox");

  /* ---------- Presupuesto por WhatsApp (o Instagram si no hay número) ---------- */
  safe(function () {
    var f = { tipo: $("#tipo"), fecha: $("#fecha"), lugar: $("#lugar"), detalle: $("#detalle") };
    function msg() {
      var l = ["Hola, quiero cotizar una grabación con drone.", "Tipo de trabajo: " + f.tipo.value + "."];
      if (f.lugar.value.trim()) l.push("Lugar: " + f.lugar.value.trim() + ".");
      if (f.fecha.value.trim()) l.push("Fecha aproximada: " + f.fecha.value.trim() + ".");
      if (f.detalle.value.trim()) l.push("Detalle: " + f.detalle.value.trim());
      return l.join("\n");
    }
    function refresh() {
      var m = msg(), send = $("#send");
      $("#preview").textContent = m;
      if (SITE.whatsapp) { send.href = "https://wa.me/" + SITE.whatsapp + "?text=" + encodeURIComponent(m); $("span", send).textContent = "Enviar por WhatsApp"; }
      else { send.href = SITE.instagram; $("span", send).textContent = "Escribir por Instagram"; }
    }
    Object.keys(f).forEach(function (k) { f[k].addEventListener("input", refresh); f[k].addEventListener("change", refresh); });
    $("#brief").addEventListener("submit", function (e) { e.preventDefault(); });
    refresh();
    $("#copy").addEventListener("click", function () {
      var m = msg(), st = $("#status");
      var done = function () { st.textContent = "Mensaje copiado."; setTimeout(function () { st.textContent = ""; }, 2500); };
      var legacy = function () {
        var t = document.createElement("textarea"); t.value = m; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) { st.textContent = "No se pudo copiar."; }
        document.body.removeChild(t);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(m).then(done, legacy); else legacy();
    });
  }, "form");
})();
