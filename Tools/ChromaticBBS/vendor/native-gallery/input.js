// GENERATED exact SDUI input/grant functions; no HUD bootstrap.
(function(root){const SDUI=root.SDUI||(root.SDUI={});
  SDUI.grant = function (el, reason) {
    if (el && el.setAttribute)
      el.setAttribute("data-sd-grant", reason || "granted");
    return el;
  };
  SDUI.swallowPairedClick = function () {
    if (SDUI._pairArmed) return; // one armor at a time
    SDUI._pairArmed = true;
    var cap = performance.now() + 4000;
    var sawUp = false;
    function onUp() { sawUp = true; setTimeout(off, 250); }
    function onClick(e) {
      if (performance.now() > cap) { off(); return; }
      e.preventDefault();
      e.stopPropagation();
      if (sawUp) off(); // that WAS the paired click — disarm
    }
    function off() {
      if (!SDUI._pairArmed) return;
      SDUI._pairArmed = false;
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("mouseup", onUp, true);
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("mouseup", onUp, true);
  };
  SDUI.press = function (el, fn) {
    var last = 0;
    function go(e, src) {
      var now = Date.now();
      if (now - last < 300) return;
      last = now;
      if (e && e.preventDefault) e.preventDefault();
      // pointerdown handled → the paired click is dead on arrival
      // (armed BEFORE fn so the handler's reflow can't outrun it)
      if (src === "pointerdown") SDUI.swallowPairedClick();
      fn(e, src);
    }
    el.addEventListener("pointerdown", function (e) {
      go(e, "pointerdown");
    });
    el.addEventListener("click", function (e) { go(e, "click"); });
    return el;
  };
})(window);
