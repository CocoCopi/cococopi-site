/* glaze.js — glazecraft browser runtime, v2.
 *
 * Two layers in one dependency-free file (plain ES5):
 *
 * 1. HYDRATION — the server renders components to HTML and marks every
 *    on_* handler with data-glaze-h / data-glaze-evt. This script wires
 *    them: on the marked event it POSTs {id, h, value} to /_glaze/event,
 *    and the server's Corros re-renders and replies "ok\n<new html>",
 *    which replaces the root. (v1 behaviour, kept.)
 *
 * 2. THE ENGINE — a small animation/interaction framework driven by data
 *    attributes the Corros renderer emits:
 *      data-reveal="up|left|right|scale"  scroll-in reveal (+ data-delay)
 *      data-count / data-dec               animated counters on view
 *      data-tilt                           3D tilt on hover (fine pointers)
 *      data-mag                             magnetic pull on hover
 *      data-type                           typewriter effect
 *      data-filter / data-cat              instant client-side filtering
 *    plus a custom cursor, a scroll progress bar, nav scrollspy, and
 *    smooth anchor scrolling. Everything respects prefers-reduced-motion.
 *
 * No build step, no dependencies. One file.
 */
(function (global) {
  "use strict";

  var doc = global.document;

  // ---- tiny helpers -------------------------------------------------------

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    var list = (ctx || doc).querySelectorAll(sel);
    return Array.prototype.slice.call(list);
  }
  function el(tag, cls) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  function coarse() {
    return global.matchMedia && global.matchMedia("(pointer: coarse)").matches;
  }
  function reduced() {
    return global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ---- 1. hydration (v1, kept) ---------------------------------------------

  function postForm(url, data, cb) {
    var body = Object.keys(data).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k] == null ? "" : data[k]);
    }).join("&");
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) cb(xhr.status, xhr.responseText);
    };
    xhr.send(body);
  }

  function apply(root, html) {
    root.innerHTML = html;
    wire(root, root.getAttribute("data-glaze-id"));
  }

  function wire(root, id) {
    var els = $$("[data-glaze-h]", root);
    for (var i = 0; i < els.length; i++) {
      (function (node) {
        if (node.__glaze_wired) return;
        node.__glaze_wired = true;
        var h = node.getAttribute("data-glaze-h");
        var evt = node.getAttribute("data-glaze-evt") || "click";
        node.addEventListener(evt, function (e) {
          if (e && e.preventDefault) e.preventDefault();
          var val = node.getAttribute("data-glaze-value");
          postForm("/_glaze/event", { id: id, h: h, value: val }, function (status, text) {
            if (status !== 200) { console.error("glazecraft: HTTP", status, text); return; }
            var nl = text.indexOf("\n");
            var head = text.slice(0, nl);
            var html = text.slice(nl + 1);
            if (head === "ok") { apply(root, html); }
            else { console.error("glazecraft: server error:", html); }
          });
        });
      })(els[i]);
    }
  }

  // ---- 2. the engine ----------------------------------------------------------

  var cursor = function () {
    if (!doc.body || coarse() || reduced()) return;
    var dot = el("div", "g-cursor");
    var ring = el("div", "g-cursor-ring");
    doc.body.appendChild(dot);
    doc.body.appendChild(ring);
    var x = -100, y = -100, rx = -100, ry = -100;
    global.document.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
      dot.style.transform = "translate(" + (x - 4) + "px," + (y - 4) + "px)";
    }, { passive: true });
    (function loop() {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      ring.style.transform = "translate(" + (rx - 20) + "px," + (ry - 20) + "px)";
      requestAnimationFrame(loop);
    })();
    global.document.addEventListener("mouseover", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("a,button,[data-tilt],[data-mag],.chip") : null;
      if (t) { dot.classList.add("on"); ring.classList.add("on"); }
    });
    global.document.addEventListener("mouseout", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("a,button,[data-tilt],[data-mag],.chip") : null;
      if (t) { dot.classList.remove("on"); ring.classList.remove("on"); }
    });
  };

  var progress = function () {
    if (!doc.body) return;
    var bar = el("div", "g-progress");
    doc.body.appendChild(bar);
    var upd = function () {
      var h = doc.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? (h.scrollTop || 0) / max : 0) + ")";
    };
    global.document.addEventListener("scroll", upd, { passive: true });
    upd();
  };

  var reveals = function () {
    var els = $$("[data-reveal]");
    if (!global.IntersectionObserver) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  };

  var counters = function () {
    var els = $$("[data-count]");
    if (!global.IntersectionObserver) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var node = en.target;
        var to = parseFloat(node.getAttribute("data-count"));
        var dec = parseInt(node.getAttribute("data-dec") || "0", 10);
        var t0 = null;
        (function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1500, 1);
          p = 1 - Math.pow(1 - p, 3);            // ease-out cubic
          node.textContent = (to * p).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
        })(0);
      });
    }, { threshold: 0.5 });
    els.forEach(function (e) { io.observe(e); });
  };

  var typewriter = function (node, speed) {
    if (!node) return;
    var text = node.getAttribute("data-type") || node.textContent;
    node.textContent = "";
    var txt = doc.createTextNode("");
    node.appendChild(txt);
    var caret = el("span", "g-caret");
    node.appendChild(caret);
    var i = 0;
    (function tick() {
      if (i < text.length) {
        txt.data = text.slice(0, i + 1);
        i++;
        setTimeout(tick, speed || 55);
      }
    })();
  };

  var tilt = function () {
    var els = $$("[data-tilt]");
    if (coarse() || reduced()) return;
    els.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(950px) rotateY(" + (x * 7) + "deg) rotateX(" + (-y * 7) + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  };

  var magnetic = function () {
    var els = $$("[data-mag]");
    if (coarse() || reduced()) return;
    els.forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.28;
        var y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  };

  var scrollspy = function () {
    var links = $$(".nav-links a[href^='#']");
    if (!links.length) return;
    var ids = links.map(function (a) { return a.getAttribute("href").slice(1); });
    var upd = function () {
      var y = (global.scrollY || 0) + 140, cur = "";
      ids.forEach(function (id) {
        var s = $("[id='" + id + "']");
        if (s && s.offsetTop <= y) cur = id;
      });
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + cur);
      });
    };
    global.document.addEventListener("scroll", upd, { passive: true });
    upd();
  };

  var anchors = function () {
    $$("a[href^='#']").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var t = $(a.getAttribute("href"));
        if (!t) return;
        e.preventDefault();
        global.scrollTo({ top: t.getBoundingClientRect().top + (global.scrollY || 0) - 76, behavior: "smooth" });
      });
    });
  };

  var filter = function () {
    var chips = $$("[data-filter]");
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var f = chip.getAttribute("data-filter");
        $$("[data-cat]").forEach(function (tile) {
          var match = f === "all" || tile.getAttribute("data-cat").indexOf(f) !== -1;
          tile.classList.toggle("hidden", !match);
        });
      });
    });
  };

  var typewriterInit = function () {
    var node = $("[data-type]");
    if (node) typewriter(node);
  };

  // ---- boot ------------------------------------------------------------------

  var glazecraft = {
    mount: function (id) {
      var root = doc && doc.querySelector('[data-glaze-id="' + id + '"]');
      if (root) wire(root, id);
    },
    mountAll: function () {
      if (!doc) return;
      var roots = $$("[data-glaze-id]");
      for (var i = 0; i < roots.length; i++) wire(roots[i], roots[i].getAttribute("data-glaze-id"));
    },
    engine: function () {
      if (!doc || !doc.body) return;
      cursor(); progress(); reveals(); counters(); tilt(); magnetic(); scrollspy(); anchors(); filter(); typewriterInit();
      doc.body.classList.add("g-ready");
    },
    typewriter: typewriter,
    filter: filter
  };

  global.glazecraft = glazecraft;

  function boot() {
    glazecraft.mountAll();
    glazecraft.engine();
  }
  if (doc) {
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
    else boot();
  }

  if (typeof module !== "undefined" && module.exports) module.exports = glazecraft;
})(typeof window !== "undefined" ? window : globalThis);
