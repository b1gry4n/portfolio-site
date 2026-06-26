(function () {
  var PHASER_URL = "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js";
  var CLICK_WINDOW = 1500;
  var REQUIRED_CLICKS = 5;
  var HIGH_SCORE_KEY = "traversalEvidenceRunnerHighScores";
  var clickTimes = [];
  var overlay;
  var game;
  var phaserPromise;
  var bugTimer;
  var activeBug;
  var clickResetTimer;
  var clickCounter;
  var directCommands = ["run"];
  var guidanceCommands = ["help", "?", "-h", "--help", "man", "info", "commands", "command", "usage", "what", "how", "ls", "dir", "where", "why"];
  var riddles = [
    {
      prompt: "Riddle 1/6: I think in rules, states, inputs, edge cases, and what happens after the player presses a button. What do I build?",
      answers: ["systems", "gameplay systems", "game systems", "runtime systems"]
    },
    {
      prompt: "Riddle 2/6: I can talk shape and deformation with artists, then turn around and talk ownership and state with engineers. What bridge am I?",
      answers: ["technical artist", "tech artist", "technical art", "artist engineer", "artist-engineer", "bridge"]
    },
    {
      prompt: "Riddle 3/6: I do not just make the thing once. I build the path that helps people make it again without friction. What do I make?",
      answers: ["tools", "tooling", "editor tools", "pipelines", "pipeline", "workflow tools"]
    },
    {
      prompt: "Riddle 4/6: I do not trust vibes alone. I leave logs, traces, screenshots, and checks so decisions can be reviewed. What do I care about?",
      answers: ["evidence", "proof", "validation", "runtime evidence", "logs", "checks"]
    },
    {
      prompt: "Riddle 5/6: I use AI, but I do not let it wander loose. I give it maps, queues, boundaries, and review points. What keeps it useful?",
      answers: ["guardrails", "ai guardrails", "workflow", "ai workflow", "constraints", "boundaries"]
    },
    {
      prompt: "Riddle 6/6: My favorite result is not a slide, pitch, or promise. It is something you can control, test, and feel. What do I aim for?",
      answers: ["playable results", "playable", "prototype", "prototypes", "playable prototype", "playable prototypes"]
    }
  ];

  function targetImages() {
    var explicit = Array.prototype.slice.call(document.querySelectorAll("[data-traversal-evidence-trigger]"));
    var inferred = Array.prototype.slice.call(document.querySelectorAll('img[src*="judge-concept-to-prototype"], img[alt*="prototype"]')).filter(function (image) {
      return /ai|unity|prototype|workflow|judge/i.test(image.alt + " " + image.src);
    });
    return explicit.concat(inferred).filter(function (image, index, all) {
      return all.indexOf(image) === index;
    });
  }

  function loadPhaser() {
    if (window.Phaser) return Promise.resolve(window.Phaser);
    if (phaserPromise) return phaserPromise;

    phaserPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = PHASER_URL;
      script.async = true;
      script.onload = function () { resolve(window.Phaser); };
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return phaserPromise;
  }

  function buildOverlay() {
    var element = document.createElement("div");
    element.className = "traversal-runner-modal";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = [
      '<div class="traversal-runner-modal__backdrop" data-traversal-close></div>',
      '<section class="traversal-runner-modal__dialog" role="dialog" aria-modal="true" aria-label="Traversal Evidence Runner">',
      '  <button class="traversal-runner-modal__close" type="button" data-traversal-close aria-label="Close Traversal Evidence Runner">Close</button>',
      '  <div class="traversal-runner-modal__controls">',
      '    <b>W / Up / left tap: jump or grapple</b>',
      '    <b>S / Down / right tap: glide</b>',
      '  </div>',
      '  <div class="traversal-runner-modal__pad" aria-label="Runner touch controls">',
      '    <button class="traversal-runner-modal__pad-button" type="button" data-runner-control="primary" aria-label="Jump or grapple"><span aria-hidden="true"></span></button>',
      '    <button class="traversal-runner-modal__pad-button is-down" type="button" data-runner-control="glide" aria-label="Glide"><span aria-hidden="true"></span></button>',
      '  </div>',
      '  <div class="traversal-runner-modal__instructions" role="dialog" aria-modal="false" aria-labelledby="traversalRunnerInstructionsTitle">',
      '    <div class="traversal-runner-modal__instructions-panel">',
      '      <h2 id="traversalRunnerInstructionsTitle">How to Play</h2>',
      '      <p><b>Jump</b> from the ground with Up, W, left click, or the up button.</p>',
      '      <p><b>Double jump</b> once while airborne if no grapple connects.</p>',
      '      <p><b>Grapple</b> while airborne by pressing jump toward a target ring. Hold to stay attached, release to let go.</p>',
      '      <p><b>Glide</b> in the air with Down, S, right click, right tap, or the down button. It cancels grapple and slows your fall.</p>',
      '      <button class="traversal-runner-modal__instructions-ok" type="button" data-traversal-instructions-ok>OK</button>',
      '    </div>',
      '  </div>',
      '  <div class="traversal-runner-modal__game" id="traversalEvidenceGame"></div>',
      '</section>'
    ].join("");
    document.body.appendChild(element);
    bindRunnerPad(element);
    element.querySelector("[data-traversal-instructions-ok]").addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      dismissInstructions();
    });
    element.addEventListener("click", function (event) {
      if (event.target.matches("[data-traversal-close]")) closeGame();
    });
    element.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    return element;
  }

  function showInstructions() {
    if (!overlay) return;
    var instructions = overlay.querySelector(".traversal-runner-modal__instructions");
    if (instructions) {
      instructions.classList.add("is-visible");
      var ok = instructions.querySelector("[data-traversal-instructions-ok]");
      if (ok) ok.focus();
    }
  }

  function dismissInstructions() {
    if (!overlay) return;
    var instructions = overlay.querySelector(".traversal-runner-modal__instructions");
    if (instructions) instructions.classList.remove("is-visible");
    if (game && game.scene) game.scene.resume("TraversalEvidenceRunner");
  }

  function updateTriggerCounter(image, count) {
    var rect = image.getBoundingClientRect();
    if (!clickCounter) {
      clickCounter = document.createElement("div");
      clickCounter.className = "traversal-evidence-count";
      clickCounter.setAttribute("aria-hidden", "true");
      document.body.appendChild(clickCounter);
    }

    clickCounter.textContent = count + "/" + REQUIRED_CLICKS;
    clickCounter.style.left = (window.scrollX + rect.left + rect.width / 2) + "px";
    clickCounter.style.top = (window.scrollY + rect.top + 10) + "px";
    clickCounter.classList.add("is-visible");

    window.clearTimeout(clickResetTimer);
    clickResetTimer = window.setTimeout(function () {
      clickTimes = [];
      if (clickCounter) clickCounter.classList.remove("is-visible");
    }, CLICK_WINDOW);
  }

  function hideTriggerCounter() {
    window.clearTimeout(clickResetTimer);
    if (clickCounter) clickCounter.classList.remove("is-visible");
  }

  function loadBestScore() {
    try {
      var raw = window.localStorage.getItem(HIGH_SCORE_KEY);
      var parsed = JSON.parse(raw || "0");
      if (Array.isArray(parsed)) {
        return parsed.reduce(function (best, entry) {
          return Math.max(best, Math.floor(Number(entry.score) || 0));
        }, 0);
      }
      return Math.max(0, Math.floor(Number(parsed) || 0));
    } catch (error) {
      return 0;
    }
  }

  function saveBestScore(score) {
    try {
      window.localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(Math.max(0, Math.floor(score))));
    } catch (error) {
      return;
    }
  }

  function createHighScoreBurst(score, x, y) {
    var burst = document.createElement("div");
    var bits = ["NEW", "HIGH", "SCORE", String(score), "++", "01", "RUN"];
    burst.className = "sneaky-bug-splat runner-high-score-burst";
    burst.style.setProperty("--splat-x", x + "px");
    burst.style.setProperty("--splat-y", y + "px");

    for (var i = 0; i < 38; i += 1) {
      var bit = document.createElement("span");
      var angle = Math.random() * Math.PI * 2;
      var distance = 28 + Math.random() * 104;
      bit.textContent = bits[Math.floor(Math.random() * bits.length)];
      bit.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      bit.style.setProperty("--ty", Math.sin(angle) * distance + "px");
      bit.style.setProperty("--rot", (Math.random() * 180 - 90) + "deg");
      burst.appendChild(bit);
    }

    document.body.appendChild(burst);
    window.setTimeout(function () {
      if (burst.parentNode) burst.remove();
    }, 960);
  }

  function bindRunnerPad(element) {
    var activeButtons = new WeakSet();
    Array.prototype.forEach.call(element.querySelectorAll("[data-runner-control]"), function (button) {
      function controlName() {
        return button.getAttribute("data-runner-control");
      }

      function stopControlEvent(event) {
        event.preventDefault();
        event.stopPropagation();
      }

      button.addEventListener("pointerdown", function (event) {
        stopControlEvent(event);
        activeButtons.add(button);
        button.classList.add("is-pressed");
        if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
        document.dispatchEvent(new CustomEvent("traversal-runner-control-down", { detail: controlName() }));
      });

      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (type) {
        button.addEventListener(type, function (event) {
          stopControlEvent(event);
          if (!activeButtons.has(button)) return;
          activeButtons.delete(button);
          button.classList.remove("is-pressed");
          document.dispatchEvent(new CustomEvent("traversal-runner-control-up", { detail: controlName() }));
        });
      });

      button.addEventListener("click", stopControlEvent);
      button.addEventListener("contextmenu", stopControlEvent);
    });
  }

  function openGame() {
    if (!overlay) overlay = buildOverlay();
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("traversal-runner-open");
    overlay.querySelector("[data-traversal-close]").focus();

    loadPhaser().then(function () {
      if (!game) game = createGame();
    }).catch(function () {
      overlay.querySelector(".traversal-runner-modal__game").textContent = "Runner failed to load.";
    });
  }

  function closeGame() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("traversal-runner-open");
    Array.prototype.forEach.call(overlay.querySelectorAll(".traversal-runner-modal__instructions"), function (panel) {
      panel.classList.remove("is-visible");
      if (panel.hasAttribute("aria-hidden")) panel.setAttribute("aria-hidden", "true");
    });
    if (game) {
      game.destroy(true);
      game = null;
    }
  }

  function launchFireworks(message) {
    var layer = document.createElement("div");
    var colors = ["#7bd7c3", "#8ec7ff", "#9b6dff", "#f2f5f7", "#d8b56f"];
    layer.className = "traversal-fireworks";
    layer.setAttribute("aria-hidden", "true");

    for (var burst = 0; burst < 7; burst += 1) {
      var originX = 8 + Math.random() * 84;
      var originY = 12 + Math.random() * 62;
      for (var i = 0; i < 24; i += 1) {
        var particle = document.createElement("span");
        var angle = (Math.PI * 2 * i) / 24;
        var distance = 42 + Math.random() * 92;
        particle.style.setProperty("--x", originX + "vw");
        particle.style.setProperty("--y", originY + "vh");
        particle.style.setProperty("--tx", Math.cos(angle) * distance + "px");
        particle.style.setProperty("--ty", Math.sin(angle) * distance + "px");
        particle.style.setProperty("--color", colors[(i + burst) % colors.length]);
        particle.style.animationDelay = burst * 70 + Math.random() * 80 + "ms";
        layer.appendChild(particle);
      }
    }

    var label = document.createElement("strong");
    label.textContent = message || "Riddle solved";
    layer.appendChild(label);
    document.body.appendChild(layer);
    window.setTimeout(function () {
      layer.remove();
    }, 1800);
  }

  function scheduleSneakyBug() {
    if (bugTimer) window.clearTimeout(bugTimer);
    bugTimer = window.setTimeout(function () {
      spawnSneakyBug();
      scheduleSneakyBug();
    }, 3500 + Math.random() * 5500);
  }

  function createBugSplat(x, y) {
    var splat = document.createElement("div");
    var bits = ["01", "10", "0", "1", "11", "404", "NaN", "0x"];
    splat.className = "sneaky-bug-splat";
    splat.style.setProperty("--splat-x", x + "px");
    splat.style.setProperty("--splat-y", y + "px");

    for (var i = 0; i < 18; i += 1) {
      var bit = document.createElement("span");
      var angle = Math.random() * Math.PI * 2;
      var distance = 18 + Math.random() * 54;
      bit.textContent = bits[Math.floor(Math.random() * bits.length)];
      bit.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      bit.style.setProperty("--ty", Math.sin(angle) * distance + "px");
      bit.style.setProperty("--rot", (Math.random() * 140 - 70) + "deg");
      splat.appendChild(bit);
    }

    document.body.appendChild(splat);
    window.setTimeout(function () {
      if (splat.parentNode) splat.remove();
    }, 720);
  }

  function createTerminalCelebration(terminal) {
    var rect = terminal.getBoundingClientRect();
    var originX = rect.left + rect.width * 0.5;
    var originY = rect.top + rect.height * 0.48;
    var burst = document.createElement("div");
    var bits = ["01", "10", "OK", "RUN", "<>", "{}", "++", "✓"];
    var colors = ["#7bd7c3", "#8ec7ff", "#d8b56f", "#ffb86b", "#f2f5f7"];

    burst.className = "sneaky-bug-splat terminal-solve-burst";
    burst.style.setProperty("--splat-x", originX + "px");
    burst.style.setProperty("--splat-y", originY + "px");

    for (var i = 0; i < 34; i += 1) {
      var bit = document.createElement("span");
      var angle = Math.random() * Math.PI * 2;
      var distance = 28 + Math.random() * 92;
      bit.textContent = bits[Math.floor(Math.random() * bits.length)];
      bit.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      bit.style.setProperty("--ty", Math.sin(angle) * distance + "px");
      bit.style.setProperty("--rot", (Math.random() * 180 - 90) + "deg");
      bit.style.color = colors[i % colors.length];
      bit.style.textShadow = "0 0 12px " + colors[i % colors.length];
      burst.appendChild(bit);
    }

    document.body.appendChild(burst);
    window.setTimeout(function () {
      if (burst.parentNode) burst.remove();
    }, 820);
  }

  function createTerminalFinalCelebration(terminal) {
    var rect = terminal.getBoundingClientRect();
    var origins = [
      { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.5 },
      { x: rect.left + rect.width * 0.2, y: rect.top + rect.height * 0.32 },
      { x: rect.left + rect.width * 0.8, y: rect.top + rect.height * 0.34 },
      { x: rect.left + rect.width * 0.32, y: rect.top + rect.height * 0.76 },
      { x: rect.left + rect.width * 0.68, y: rect.top + rect.height * 0.72 }
    ];
    var bits = ["01", "10", "OK", "RUN", "<>", "{}", "++", "YES", "GO"];
    var colors = ["#7bd7c3", "#8ec7ff", "#d8b56f", "#ffb86b", "#f2f5f7", "#9b6dff"];

    origins.forEach(function (origin, burstIndex) {
      var burst = document.createElement("div");
      burst.className = "sneaky-bug-splat terminal-solve-burst terminal-solve-burst--final";
      burst.style.setProperty("--splat-x", origin.x + "px");
      burst.style.setProperty("--splat-y", origin.y + "px");

      for (var i = 0; i < 28; i += 1) {
        var bit = document.createElement("span");
        var angle = Math.random() * Math.PI * 2;
        var distance = 42 + Math.random() * 132;
        bit.textContent = bits[Math.floor(Math.random() * bits.length)];
        bit.style.setProperty("--tx", Math.cos(angle) * distance + "px");
        bit.style.setProperty("--ty", Math.sin(angle) * distance + "px");
        bit.style.setProperty("--rot", (Math.random() * 220 - 110) + "deg");
        bit.style.color = colors[(i + burstIndex) % colors.length];
        bit.style.textShadow = "0 0 14px " + colors[(i + burstIndex) % colors.length];
        burst.appendChild(bit);
      }

      document.body.appendChild(burst);
      window.setTimeout(function () {
        if (burst.parentNode) burst.remove();
      }, 1180);
    });
  }

  function createBugBite(x, y, face) {
    var bite = document.createElement("div");
    bite.className = "sneaky-bug-bite";
    bite.style.left = x + "px";
    bite.style.top = y + "px";
    bite.style.setProperty("--bite-face", String(face));
    bite.innerHTML = [
      "<span class=\"sneaky-bug-bite__sore\"></span>",
      "<span class=\"sneaky-bug-bite__wave\">((</span>",
      "<span class=\"sneaky-bug-bite__wave\">))</span>"
    ].join("");
    document.body.appendChild(bite);
    window.setTimeout(function () {
      if (bite.parentNode) bite.remove();
    }, 520);
  }

  function bugHeadPoint(bug) {
    var head = bug.querySelector(".sneaky-evidence-bug__ascii-head");
    var rect = (head || bug).getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 + (window.scrollX || window.pageXOffset || 0),
      y: rect.top + rect.height / 2 + (window.scrollY || window.pageYOffset || 0)
    };
  }

  function closestAngle(from, to) {
    while (to - from > 180) to -= 360;
    while (to - from < -180) to += 360;
    return to;
  }

  function spawnSneakyBug() {
    if (activeBug || document.body.classList.contains("traversal-runner-open")) return;

    var main = document.querySelector("main");
    var contentRect = main ? main.getBoundingClientRect() : { left: 64, right: window.innerWidth - 64 };
    var lanes = [];
    if (contentRect.left > 58) {
      lanes.push({ min: 8, max: Math.max(14, contentRect.left - 50), side: "left" });
    }
    if (window.innerWidth - contentRect.right > 58) {
      lanes.push({ min: Math.min(window.innerWidth - 54, contentRect.right + 12), max: window.innerWidth - 48, side: "right" });
    }
    if (!lanes.length) {
      lanes.push(Math.random() > 0.5
        ? { min: 8, max: 18, side: "left" }
        : { min: window.innerWidth - 54, max: window.innerWidth - 44, side: "right" });
    }

    var lane = lanes[Math.floor(Math.random() * lanes.length)];
    var panels = Array.prototype.slice.call(document.querySelectorAll(".hero, .signal-grid article, .work-preview, .media-proof, .split-section, .personal-section, .ai-proof, .ai-spine-section"));
    panels = panels.filter(function (panel) {
      var rect = panel.getBoundingClientRect();
      var onVisibleRow = rect.width > 130 && rect.height > 90 && rect.bottom > 90 && rect.top < window.innerHeight - 90;
      var onOuterEdge = lane.side === "left"
        ? rect.left <= contentRect.left + 42
        : rect.right >= contentRect.right - 42;
      return onVisibleRow && onOuterEdge;
    });
    var xRange = Math.max(1, lane.max - lane.min);
    var scrollX = window.scrollX || window.pageXOffset || 0;
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var startX = lane.min + Math.random() * xRange;
    var endX = lane.min + Math.random() * xRange;
    var startY = PhaserClamp(96 + Math.random() * (window.innerHeight - 190), 86, window.innerHeight - 72);
    var endY = PhaserClamp(startY + (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 260), 86, window.innerHeight - 72);
    var midX = PhaserClamp((startX + endX) * 0.5 + (lane.side === "left" ? 18 : -18), lane.min, lane.max);
    var midY = PhaserClamp(startY + (endY - startY) * 0.5 + (Math.random() - 0.5) * 80, 86, window.innerHeight - 72);
    var bitePanel = panels.length && Math.random() < 0.62 ? panels[Math.floor(Math.random() * panels.length)] : null;
    if (bitePanel) {
      var biteRect = bitePanel.getBoundingClientRect();
      midX = lane.side === "left" ? biteRect.left - 14 : biteRect.right + 8;
      midY = PhaserClamp(biteRect.top + 28 + Math.random() * Math.max(18, biteRect.height - 62), 86, window.innerHeight - 72);
      endY = PhaserClamp(midY + (Math.random() - 0.5) * 170, 86, window.innerHeight - 72);
    }
    var face = 1;
    var startAngle = Math.atan2(midY - startY, midX - startX) * 180 / Math.PI + 90;
    var biteAngle = closestAngle(startAngle, lane.side === "left" ? 90 : -90);
    var endAngle = closestAngle(biteAngle, Math.atan2(endY - midY, endX - midX) * 180 / Math.PI + 90);
    var pathDistance = Math.hypot(midX - startX, midY - startY) + Math.hypot(endX - midX, endY - midY);
    var animationDuration = PhaserClamp(pathDistance / 92, 4.6, 10.5);
    var skitter1X = startX + (midX - startX) * 0.28 + (Math.random() - 0.5) * 34;
    var skitter1Y = startY + (midY - startY) * 0.28 + (Math.random() - 0.5) * 52;
    var skitter2X = startX + (midX - startX) * 0.68 + (Math.random() - 0.5) * 34;
    var skitter2Y = startY + (midY - startY) * 0.68 + (Math.random() - 0.5) * 52;
    var skitter3X = midX + (endX - midX) * 0.36 + (Math.random() - 0.5) * 38;
    var skitter3Y = midY + (endY - midY) * 0.36 + (Math.random() - 0.5) * 54;
    var skitter4X = midX + (endX - midX) * 0.72 + (Math.random() - 0.5) * 38;
    var skitter4Y = midY + (endY - midY) * 0.72 + (Math.random() - 0.5) * 54;
    var variants = [
      { className: "variant-bracket", head: '\\(")/', body: "-(01)-", legs: "/(_)\\", code: "01{7}10" },
      { className: "variant-paren", head: "\\(')/", body: "-(0x)-", legs: "/(_)\\" , code: "0x((10))" },
      { className: "variant-slash", head: '\\(")7', body: "/(10)-", legs: "7(_)\\", code: "101/404" }
    ];
    var variant = variants[Math.floor(Math.random() * variants.length)];

    var bug = document.createElement("button");
    bug.type = "button";
    bug.className = "sneaky-evidence-bug sneaky-evidence-bug--" + variant.className;
    bug.setAttribute("aria-label", "Squish evidence bug");
    bug.style.left = "0";
    bug.style.top = "0";
    bug.style.setProperty("--bug-start-x", (startX + scrollX) + "px");
    bug.style.setProperty("--bug-start-y", (startY + scrollY) + "px");
    bug.style.setProperty("--bug-skitter-1-x", (skitter1X + scrollX) + "px");
    bug.style.setProperty("--bug-skitter-1-y", (skitter1Y + scrollY) + "px");
    bug.style.setProperty("--bug-skitter-2-x", (skitter2X + scrollX) + "px");
    bug.style.setProperty("--bug-skitter-2-y", (skitter2Y + scrollY) + "px");
    bug.style.setProperty("--bug-mid-x", (midX + scrollX) + "px");
    bug.style.setProperty("--bug-mid-y", (midY + scrollY) + "px");
    bug.style.setProperty("--bug-skitter-3-x", (skitter3X + scrollX) + "px");
    bug.style.setProperty("--bug-skitter-3-y", (skitter3Y + scrollY) + "px");
    bug.style.setProperty("--bug-skitter-4-x", (skitter4X + scrollX) + "px");
    bug.style.setProperty("--bug-skitter-4-y", (skitter4Y + scrollY) + "px");
    bug.style.setProperty("--bug-end-x", (endX + scrollX) + "px");
    bug.style.setProperty("--bug-end-y", (endY + scrollY) + "px");
    bug.style.setProperty("--bug-face", String(face));
    bug.style.setProperty("--bug-start-rot", startAngle + "deg");
    bug.style.setProperty("--bug-end-rot", endAngle + "deg");
    bug.style.setProperty("--bug-bite-rot", biteAngle + "deg");
    bug.style.setProperty("--bug-duration", animationDuration + "s");
    bug.innerHTML = [
      "<span class=\"sneaky-evidence-bug__ascii\" aria-hidden=\"true\">",
      "  <span class=\"sneaky-evidence-bug__ascii-line sneaky-evidence-bug__ascii-head\">" + variant.head + "</span>",
      "  <span class=\"sneaky-evidence-bug__ascii-line sneaky-evidence-bug__ascii-body\">" + variant.body + "</span>",
      "  <span class=\"sneaky-evidence-bug__ascii-line sneaky-evidence-bug__ascii-legs\">" + variant.legs + "</span>",
      "  <span class=\"sneaky-evidence-bug__code\">" + variant.code + "</span>",
      "</span>"
    ].join("");
    activeBug = bug;
    if (bitePanel) {
      window.setTimeout(function () {
        if (activeBug !== bug || bug.classList.contains("is-squished")) return;
        bug.classList.add("is-biting");
        bug.style.setProperty("--bug-start-rot", biteAngle + "deg");
        var head = bugHeadPoint(bug);
        createBugBite(head.x, head.y, lane.side === "left" ? -1 : 1);
        window.setTimeout(function () {
          bug.classList.remove("is-biting");
          bug.style.setProperty("--bug-start-rot", startAngle + "deg");
        }, 260);
      }, animationDuration * 480);
    }

    bug.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var rect = bug.getBoundingClientRect();
      createBugSplat(rect.left + rect.width / 2, rect.top + rect.height / 2);
      if (bug.parentNode) bug.remove();
      activeBug = null;
      window.setTimeout(function () {
        openGame();
      }, 540);
    });

    document.body.appendChild(bug);
    window.setTimeout(function () {
      if (activeBug === bug) activeBug = null;
      if (bug.parentNode) bug.remove();
    }, animationDuration * 1000 + 220);
  }

  function PhaserClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function createGame() {
    var Phaser = window.Phaser;
    var parent = overlay.querySelector(".traversal-runner-modal__game");
    parent.innerHTML = "";

    var scene = {
      key: "TraversalEvidenceRunner",
      preload: function () {},
      create: create,
      update: update
    };

    var config = {
      type: Phaser.AUTO,
      parent: parent,
      backgroundColor: "#05070b",
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: parent,
        width: parent.clientWidth,
        height: parent.clientHeight
      },
      scene: scene,
      render: {
        antialias: true,
        pixelArt: false
      }
    };

    var state = {};

    function create() {
      state.scene = this;
      state.width = this.scale.width;
      state.height = this.scale.height;
      state.baseSpeed = 275;
      state.distance = 0;
      state.visualTime = 0;
      state.best = loadBestScore();
      state.runHadInput = false;
      state.nextPlatformX = 0;
      state.platforms = [];
      state.rings = [];
      state.nodes = [];
      state.clouds = [];
      state.distantBuildings = [];
      state.islands = [];
      state.logs = [];
      state.hookTarget = null;
      state.ropeLength = 0;
      state.primaryHeld = false;
      state.glideHeld = false;
      state.releaseCoast = 0;
      state.maxGrappleRange = 360;
      state.bg = this.add.graphics().setDepth(0);
      state.world = this.add.graphics().setDepth(2);
      state.hookLine = this.add.graphics().setDepth(4);
      state.playerGfx = this.add.graphics().setDepth(5);
      state.hud = this.add.text(18, 16, "", {
        fontFamily: "Consolas, ui-monospace, monospace",
        fontSize: "14px",
        color: "#9be8ff"
      }).setDepth(7);

      state.player = {
        x: Math.min(170, state.width * 0.25),
        y: state.height * 0.52,
        vx: 0,
        vy: 0,
        w: 24,
        h: 34,
        grounded: false,
        glide: false,
        doubleJumpReady: true
      };

      for (var i = 0; i < 28; i += 1) {
        state.nodes.push({
          x: Math.random() * state.width,
          y: 40 + Math.random() * Math.max(120, state.height * 0.55),
          r: 1 + Math.random() * 2,
          s: 8 + Math.random() * 22
        });
      }

      for (var c = 0; c < 8; c += 1) {
        state.clouds.push({
          x: Math.random() * state.width,
          y: 36 + Math.random() * state.height * 0.22,
          w: 80 + Math.random() * 130,
          h: 16 + Math.random() * 18,
          s: 6 + Math.random() * 14,
          density: 5 + Math.floor(Math.random() * 5),
          phase: Math.random() * Math.PI * 2
        });
      }

      for (var b = 0; b < 24; b += 1) {
        var layer = b % 3;
        var heightMin = layer === 0 ? 34 : layer === 1 ? 58 : 92;
        var heightMax = layer === 0 ? 76 : layer === 1 ? 118 : 168;
        state.distantBuildings.push({
          x: Math.random() * (state.width + 240) - 120,
          w: (layer === 0 ? 42 : layer === 1 ? 38 : 44) + Math.random() * (layer === 0 ? 82 : layer === 1 ? 68 : 76),
          h: heightMin + Math.random() * (heightMax - heightMin),
          layer: layer,
          depth: (layer === 0 ? 0.1 : layer === 1 ? 0.24 : 0.48) + Math.random() * (layer === 0 ? 0.04 : layer === 1 ? 0.07 : 0.08),
          seed: Math.floor(Math.random() * 1000)
        });
      }

      for (var island = 0; island < 6; island += 1) {
        state.islands.push({
          x: Math.random() * state.width,
          yOffset: Math.random() * 18,
          w: 90 + Math.random() * 170,
          h: 14 + Math.random() * 18,
          s: 9 + Math.random() * 12
        });
      }

      addPlatform(-40, state.height * 0.72, state.width * 0.8);
      state.nextPlatformX = state.width * 0.7;
      while (state.nextPlatformX < state.width + 900) spawnPlatform();

      this.input.keyboard.on("keydown-UP", primaryPress);
      this.input.keyboard.on("keydown-W", primaryPress);
      this.input.keyboard.on("keyup-UP", primaryRelease);
      this.input.keyboard.on("keyup-W", primaryRelease);
      this.input.keyboard.on("keydown-DOWN", glidePress);
      this.input.keyboard.on("keydown-S", glidePress);
      this.input.keyboard.on("keyup-DOWN", glideRelease);
      this.input.keyboard.on("keyup-S", glideRelease);
      var runnerControlDown = function (event) {
        if (event.detail === "glide") {
          glidePress();
        } else {
          primaryPress();
        }
      };
      var runnerControlUp = function (event) {
        if (event.detail === "glide") {
          glideRelease();
        } else {
          primaryRelease();
        }
      };
      document.addEventListener("traversal-runner-control-down", runnerControlDown);
      document.addEventListener("traversal-runner-control-up", runnerControlUp);
      this.events.once("shutdown", function () {
        document.removeEventListener("traversal-runner-control-down", runnerControlDown);
        document.removeEventListener("traversal-runner-control-up", runnerControlUp);
      });
      this.input.on("pointerdown", function (pointer) {
        if (pointer.rightButtonDown()) {
          glidePress();
          return;
        }

        var nativeEvent = pointer.event || {};
        var isTouchInput = pointer.pointerType === "touch" || nativeEvent.pointerType === "touch" || nativeEvent.type && nativeEvent.type.indexOf("touch") === 0;
        if (isTouchInput && pointer.x > state.width * 0.52 && !state.player.grounded) {
          glidePress();
        } else {
          primaryPress();
        }
      });
      this.input.on("pointerup", function (pointer) {
        var nativeEvent = pointer.event || {};
        var isTouchInput = pointer.pointerType === "touch" || nativeEvent.pointerType === "touch" || nativeEvent.type && nativeEvent.type.indexOf("touch") === 0;
        if (nativeEvent.button === 2 || pointer.rightButtonReleased && pointer.rightButtonReleased()) {
          glideRelease();
          return;
        }
        if (isTouchInput && pointer.x > state.width * 0.52) {
          glideRelease();
        } else {
          primaryRelease();
        }
      });
      this.scale.on("resize", function (size) {
        state.width = size.width;
        state.height = size.height;
      });
      update.call(this, 0, 16);
      showInstructions();
      this.scene.pause();
    }

    function addPlatform(x, y, w) {
      state.platforms.push({
        x: x,
        y: y,
        w: w,
        h: state.height - y + 40,
        roofH: 18,
        windowSeed: Math.floor(Math.random() * 1000)
      });
    }

    function spawnPlatform() {
      var last = state.platforms[state.platforms.length - 1];
      var needsSwing = Math.random() > 0.3;
      var gap = needsSwing ? 190 + Math.random() * 150 : 105 + Math.random() * 90;
      var width = 180 + Math.random() * 240;
      var y = Phaser.Math.Clamp((last ? last.y : state.height * 0.7) + (Math.random() - 0.5) * 96, state.height * 0.48, state.height * 0.78);
      var x = state.nextPlatformX + gap;

      if (needsSwing && last) {
        var ringX = last.x + last.w + gap * (0.42 + Math.random() * 0.2);
        var lowerRoof = Math.min(last.y, y);
        state.rings.push({
          x: ringX,
          y: Math.max(58, lowerRoof - 185 - Math.random() * 105),
          used: false,
          pulse: Math.random() * Math.PI * 2
        });
      }

      addPlatform(x, y, width);
      state.nextPlatformX = x + width;
    }

    function primaryPress() {
      if (state.primaryHeld) return;
      state.primaryHeld = true;
      state.runHadInput = true;
      var p = state.player;
      if (p.grounded) {
        state.glideHeld = false;
        p.glide = false;
        p.vy = -340;
        p.grounded = false;
        p.doubleJumpReady = true;
        maybeLog("Jump arc verified", p.x, p.y - 40, 0.62);
        return;
      }

      var wasGliding = state.glideHeld || p.glide;
      if (attachGrapple()) return;
      if (wasGliding) return;
      if (!state.hookTarget && p.doubleJumpReady) {
        p.vy = -340;
        p.doubleJumpReady = false;
        maybeLog("Second jump confirmed", p.x, p.y - 40, 0.52);
      }
    }

    function primaryRelease() {
      state.primaryHeld = false;
      detachGrapple();
    }

    function attachGrapple() {
      if (state.hookTarget || state.player.grounded) return false;
      var p = state.player;
      var target = nearestRing();
      if (!target) return false;
      var distance = Math.hypot(target.x - p.x, target.y - p.y);
      if (distance > state.maxGrappleRange) return false;
      state.hookTarget = target;
      state.ropeLength = distance;
      target.used = true;
      state.glideHeld = false;
      p.glide = false;
      p.doubleJumpReady = true;
      maybeLog("Grapple intent matched", target.x, target.y - 28, 1);
      return true;
    }

    function detachGrapple() {
      if (state.hookTarget) {
        state.releaseCoast = 0.55;
      }
      state.hookTarget = null;
      state.ropeLength = 0;
    }

    function glidePress() {
      var p = state.player;
      if (p.grounded || state.glideHeld) return;
      state.runHadInput = true;
      state.glideHeld = true;
      state.primaryHeld = false;
      detachGrapple();
      p.glide = true;
      p.vx = Math.max(p.vx, 70);
      p.vy = Math.min(p.vy, 120);
      maybeLog("Glide trajectory stabilized", p.x + 20, p.y - 42, 0.42);
    }

    function glideRelease() {
      state.glideHeld = false;
      state.player.glide = false;
    }

    function nearestRing() {
      var p = state.player;
      var best = null;
      var bestScore = Infinity;
      state.rings.forEach(function (ring) {
        if (ring.used) return;
        var dx = ring.x - p.x;
        var dy = ring.y - p.y;
        var distance = Math.hypot(dx, dy);
        if (dx < 35 || distance > state.maxGrappleRange) return;
        var score = dx + Math.abs(dy) * 1.35;
        if (score < bestScore) {
          best = ring;
          bestScore = score;
        }
      });
      return best;
    }

    function maybeLog(text, x, y, chance) {
      if (Math.random() > chance) return;
      state.logs.push({
        text: text,
        x: x,
        y: y,
        life: 1.25,
        label: state.scene.add.text(x, y, text, {
          fontFamily: "Consolas, ui-monospace, monospace",
          fontSize: "12px",
          color: "#b8fff2",
          backgroundColor: "rgba(5, 9, 14, 0.58)",
          padding: { x: 7, y: 4 }
        }).setDepth(6)
      });
    }

    function update(time, delta) {
      var dt = Math.min(delta / 1000, 0.033);
      var p = state.player;
      var speed = state.baseSpeed + Math.min(90, state.distance * 0.0015);
      var oldX = p.x;
      var oldY = p.y;
      state.visualTime += dt;
      state.distance += speed * dt * 0.12;

      state.nodes.forEach(function (node) {
        node.x -= node.s * dt;
        if (node.x < -20) {
          node.x = state.width + Math.random() * 80;
          node.y = 40 + Math.random() * Math.max(120, state.height * 0.55);
        }
      });
      state.clouds.forEach(function (cloud) {
        cloud.x -= speed * 0.035 * dt + cloud.s * dt * 0.15;
        if (cloud.x + cloud.w < -80) {
          cloud.x = state.width + Math.random() * 160;
          cloud.y = 36 + Math.random() * state.height * 0.22;
          cloud.density = 5 + Math.floor(Math.random() * 5);
          cloud.phase = Math.random() * Math.PI * 2;
        }
      });
      state.distantBuildings.forEach(function (building) {
        building.x -= speed * building.depth * dt;
        if (building.x + building.w < -80) {
          var layer = building.layer || 0;
          var heightMin = layer === 0 ? 34 : layer === 1 ? 58 : 92;
          var heightMax = layer === 0 ? 76 : layer === 1 ? 118 : 168;
          building.x = state.width + Math.random() * 180;
          building.w = (layer === 0 ? 42 : layer === 1 ? 38 : 44) + Math.random() * (layer === 0 ? 82 : layer === 1 ? 68 : 76);
          building.h = heightMin + Math.random() * (heightMax - heightMin);
          building.depth = (layer === 0 ? 0.1 : layer === 1 ? 0.24 : layer === 2 ? 0.48 : 0.1) + Math.random() * (layer === 0 ? 0.04 : layer === 1 ? 0.07 : 0.08);
          building.seed = Math.floor(Math.random() * 1000);
        }
      });
      state.islands.forEach(function (island) {
        island.x -= speed * 0.08 * dt + island.s * dt * 0.08;
        if (island.x + island.w < -120) {
          island.x = state.width + Math.random() * 220;
          island.yOffset = Math.random() * 18;
        }
      });

      scrollWorld(speed * dt);
      state.rings.forEach(function (ring) {
        ring.pulse += dt * 4;
      });
      state.platforms = state.platforms.filter(function (platform) { return platform.x + platform.w > -80; });
      state.rings = state.rings.filter(function (ring) { return ring === state.hookTarget || ring.x > -80; });
      while (state.nextPlatformX < state.width + 900) spawnPlatform();

      p.glide = state.glideHeld && !state.hookTarget && !p.grounded;

      p.vx += (0 - p.vx) * dt * (state.hookTarget && !p.grounded ? 0.03 : 1.1);
      p.x += p.vx * dt;
      if (state.releaseCoast > 0) {
        state.releaseCoast = Math.max(0, state.releaseCoast - dt);
      }
      if (!state.hookTarget || p.grounded) {
        catchUpForwardCamera(dt);
      }

      var gravity = p.glide ? 250 : 1180;
      p.vy += gravity * dt;
      if (p.glide) {
        p.vx = Math.max(p.vx, 110);
        p.vy = Math.min(p.vy, 185);
        p.vy = Math.max(p.vy, -20);
      }
      p.y += p.vy * dt;

      p.grounded = false;
      for (var i = 0; i < state.platforms.length; i += 1) {
        var platform = state.platforms[i];
        var feet = p.y + p.h * 0.5;
        var previousFeet = feet - p.vy * dt;
        var insideX = p.x + p.w * 0.35 > platform.x && p.x - p.w * 0.35 < platform.x + platform.w;
        var roofY = platform.y;
        if (insideX && p.vy >= 0 && previousFeet <= roofY && feet >= roofY) {
          p.y = platform.y - p.h * 0.5;
          p.vy = 0;
          p.grounded = true;
          p.doubleJumpReady = true;
          state.glideHeld = false;
          p.glide = false;
          break;
        }
      }

      if (state.hookTarget) {
        if (p.grounded) {
          shortenGroundedRopeLength();
        } else {
          constrainRope(dt, oldX, oldY);
        }
      }

      if (p.y > state.height + 120 || p.x < -120 || p.x > state.width + 120) {
        resetPlayer();
      }

      updateLogs(dt, speed);
      draw();
    }

    function constrainRope(dt, oldX, oldY) {
      var p = state.player;
      var tx = state.hookTarget.x;
      var ty = state.hookTarget.y;
      var dx = p.x - tx;
      var dy = p.y - ty;
      var distance = Math.max(1, Math.hypot(dx, dy));
      state.ropeLength = Math.min(state.ropeLength, distance);
      if (distance <= state.ropeLength) {
        return;
      }

      var nx = dx / distance;
      var ny = dy / distance;
      p.x = tx + nx * state.ropeLength;
      p.y = ty + ny * state.ropeLength;

      p.vx = (p.x - oldX) / dt;
      p.vy = (p.y - oldY) / dt;
    }

    function shortenGroundedRopeLength() {
      var p = state.player;
      var dx = p.x - state.hookTarget.x;
      var dy = p.y - state.hookTarget.y;
      state.ropeLength = Math.max(1, Math.min(state.ropeLength, Math.hypot(dx, dy)));
    }

    function scrollWorld(amount) {
      state.platforms.forEach(function (platform) { platform.x -= amount; });
      state.rings.forEach(function (ring) { ring.x -= amount; });
      state.nextPlatformX -= amount;
    }

    function scrollParallax(amount) {
      state.clouds.forEach(function (cloud) { cloud.x -= amount * 0.035; });
      state.islands.forEach(function (island) { island.x -= amount * 0.08; });
      state.distantBuildings.forEach(function (building) {
        building.x -= amount * building.depth;
      });
    }

    function catchUpForwardCamera(dt) {
      var p = state.player;
      var leadX = state.width * 0.42;
      if (p.x <= leadX) return;

      var catchAmount = Math.min(p.x - leadX, (p.x - leadX) * 5.5 * dt);
      p.x -= catchAmount;
      scrollWorld(catchAmount);
      scrollParallax(catchAmount);
      state.distance += catchAmount * 0.12;
    }

    function resetPlayer() {
      var score = Math.floor(state.distance);
      if (state.runHadInput && score > state.best) {
        state.best = score;
        saveBestScore(score);
        createHighScoreBurst(score, state.width * 0.5, state.height * 0.36);
      }
      resetPlayerNow();
    }

    function resetPlayerNow() {
      var p = state.player;
      p.x = Math.min(170, state.width * 0.25);
      p.y = state.height * 0.45;
      p.vx = 0;
      p.vy = -120;
      p.glide = false;
      p.doubleJumpReady = true;
      state.primaryHeld = false;
      state.glideHeld = false;
      detachGrapple();
      state.releaseCoast = 0;
      state.distance = 0;
      state.runHadInput = false;
      maybeLog("Recovery route reacquired", p.x + 24, p.y - 20, 1);
    }

    function updateLogs(dt, speed) {
      state.logs = state.logs.filter(function (log) {
        log.life -= dt;
        log.x -= speed * dt * 0.45;
        log.y -= dt * 16;
        log.label.setPosition(log.x, log.y);
        log.label.setAlpha(Phaser.Math.Clamp(log.life, 0, 1));
        if (log.life > 0) return true;
        log.label.destroy();
        return false;
      });
    }

    function armPoint(origin, angle, length) {
      return {
        x: origin.x + Math.cos(angle) * length,
        y: origin.y + Math.sin(angle) * length
      };
    }

    function grappleHandPoint(p) {
      var shoulder = { x: p.x + 4, y: p.y - 8 };
      if (!state.hookTarget) return shoulder;
      var angle = Math.atan2(state.hookTarget.y - shoulder.y, state.hookTarget.x - shoulder.x);
      return armPoint(shoulder, angle, 20);
    }

    function drawPlayerRig(g, p) {
      var runCycle = Math.sin(state.distance * 0.28);
      var runCycleBack = Math.sin(state.distance * 0.28 + Math.PI);
      var airborne = !p.grounded;
      var grappling = !!state.hookTarget;
      var bodyColor = grappling ? 0x8ec7ff : p.glide ? 0x9b6dff : 0x7bd7c3;
      var suitDark = 0x071018;
      var glow = grappling ? 0x9be8ff : p.glide ? 0x9b6dff : 0x7bd7c3;
      var hip = { x: p.x - 1, y: p.y + 7 };
      var chest = { x: p.x + 1, y: p.y - 8 };
      var head = { x: p.x + 3, y: p.y - 21 };
      var leftShoulder = { x: p.x - 6, y: p.y - 8 };
      var rightShoulder = { x: p.x + 6, y: p.y - 8 };
      var leftFoot;
      var rightFoot;
      var leftHand;
      var rightHand;

      if (p.glide) {
        leftFoot = { x: p.x - 12, y: p.y + 17 };
        rightFoot = { x: p.x + 13, y: p.y + 14 };
        leftHand = { x: p.x - 24, y: p.y - 1 };
        rightHand = { x: p.x + 27, y: p.y - 2 };
      } else if (grappling) {
        var grappleAngle = Math.atan2(state.hookTarget.y - rightShoulder.y, state.hookTarget.x - rightShoulder.x);
        rightHand = armPoint(rightShoulder, grappleAngle, 20);
        leftHand = { x: p.x - 12, y: p.y + 1 };
        leftFoot = { x: p.x - 14, y: p.y + 17 };
        rightFoot = { x: p.x + 10, y: p.y + 18 };
      } else if (p.grounded) {
        leftFoot = { x: p.x - 8 + runCycle * 9, y: p.y + 18 };
        rightFoot = { x: p.x - 8 + runCycleBack * 9, y: p.y + 18 };
        leftHand = { x: p.x - 12 + runCycleBack * 5, y: p.y - 2 };
        rightHand = { x: p.x + 12 + runCycle * 5, y: p.y - 2 };
      } else {
        leftFoot = { x: p.x - 11, y: p.y + 14 };
        rightFoot = { x: p.x + 9, y: p.y + 17 };
        leftHand = { x: p.x - 13, y: p.y - 4 };
        rightHand = { x: p.x + 13, y: p.y - 5 };
      }

      if (p.glide) {
        g.fillStyle(0x4c2ea3, 0.38);
        g.fillTriangle(p.x - 6, p.y - 7, p.x - 36, p.y + 9, p.x - 4, p.y + 12);
        g.fillTriangle(p.x + 5, p.y - 7, p.x + 38, p.y + 8, p.x + 5, p.y + 12);
        g.lineStyle(2, 0x9b6dff, 0.82);
        g.lineBetween(p.x - 34, p.y + 9, p.x - 4, p.y + 12);
        g.lineBetween(p.x + 36, p.y + 8, p.x + 5, p.y + 12);
      }

      g.lineStyle(5, suitDark, 1);
      g.lineBetween(hip.x, hip.y, leftFoot.x, leftFoot.y);
      g.lineBetween(hip.x, hip.y, rightFoot.x, rightFoot.y);
      g.lineBetween(leftShoulder.x, leftShoulder.y, leftHand.x, leftHand.y);
      g.lineBetween(rightShoulder.x, rightShoulder.y, rightHand.x, rightHand.y);

      g.lineStyle(2, glow, 0.88);
      g.lineBetween(hip.x, hip.y, leftFoot.x, leftFoot.y);
      g.lineBetween(hip.x, hip.y, rightFoot.x, rightFoot.y);
      g.lineBetween(leftShoulder.x, leftShoulder.y, leftHand.x, leftHand.y);
      g.lineBetween(rightShoulder.x, rightShoulder.y, rightHand.x, rightHand.y);

      g.fillStyle(suitDark, 1);
      g.fillRoundedRect(p.x - 9, p.y - 14, 19, 25, 5);
      g.fillStyle(bodyColor, 1);
      g.fillRoundedRect(p.x - 7, p.y - 13, 15, 22, 4);
      g.lineStyle(2, 0xe9fcff, 0.88);
      g.lineBetween(chest.x - 5, chest.y + 3, chest.x + 7, chest.y + 3);
      g.lineStyle(1, 0x071018, 0.9);
      g.lineBetween(chest.x + 3, chest.y + 6, chest.x + 3, chest.y + 14);

      g.fillStyle(0x071018, 1);
      g.fillCircle(head.x - 1, head.y, 8);
      g.fillStyle(0xd8b56f, 1);
      g.fillCircle(head.x, head.y + 1, 6);
      g.fillRect(head.x, head.y - 1, 7, 6);
      g.fillStyle(0x071018, 1);
      g.fillRect(head.x - 17, head.y - 9, 14, 3);
      g.fillCircle(head.x - 2, head.y - 8, 7);
      g.fillRect(head.x - 7, head.y - 9, 15, 4);
      g.lineStyle(1, 0xe9fcff, 0.6);
      g.lineBetween(head.x - 5, head.y - 7, head.x + 7, head.y - 7);
      g.fillStyle(0x030506, 1);
      g.fillRoundedRect(head.x + 1, head.y - 3, 9, 6, 1);
      g.fillRoundedRect(head.x + 9, head.y - 2, 7, 5, 1);
      g.fillRect(head.x + 7, head.y - 1, 4, 2);
      g.fillStyle(0xe9fcff, 0.7);
      g.fillRect(head.x + 3, head.y - 2, 4, 1);
      g.fillStyle(0x071018, 1);
      g.fillCircle(head.x - 5, head.y + 1, 1);
      g.lineStyle(2, 0x030506, 1);
      g.strokeCircle(head.x - 7, head.y + 3, 2);
      g.fillStyle(0x2a1710, 1);
      g.fillCircle(head.x + 1, head.y + 7, 1);
      g.fillCircle(head.x + 4, head.y + 7, 1);
      g.fillCircle(head.x + 7, head.y + 6, 1);
      g.fillCircle(head.x - 1, head.y + 5, 1);
      g.fillCircle(head.x + 3, head.y + 4, 1);
      g.fillCircle(head.x + 6, head.y + 4, 1);

      g.fillStyle(glow, airborne ? 0.72 : 0.48);
      g.fillCircle(leftFoot.x, leftFoot.y, 3);
      g.fillCircle(rightFoot.x, rightFoot.y, 3);
      g.fillCircle(leftHand.x, leftHand.y, 3);
      g.fillCircle(rightHand.x, rightHand.y, grappling ? 4 : 3);

      if (grappling) {
        g.lineStyle(1, 0x9be8ff, 0.9);
        g.strokeCircle(rightHand.x, rightHand.y, 6);
        g.lineBetween(rightHand.x + 4, rightHand.y, rightHand.x + 11, rightHand.y - 3);
      }
    }

    function drawSkyline(g, w, h) {
      var horizon = h * 0.48;
      var waterTop = h * 0.54;
      var skyTop = 0x102033;
      var skyMid = 0x28506a;
      var skyHaze = 0x71d3d0;
      var bands = 18;
      for (var i = 0; i < bands; i += 1) {
        var t = i / (bands - 1);
        var color = t < 0.62
          ? Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(skyTop), Phaser.Display.Color.ValueToColor(skyMid), 100, t / 0.62 * 100)
          : Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(skyMid), Phaser.Display.Color.ValueToColor(skyHaze), 100, (t - 0.62) / 0.38 * 100);
        g.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
        g.fillRect(0, h * t / 1.65, w, h / bands + 3);
      }

      g.lineStyle(1, 0x19313c, 0.2);
      var gridBottom = horizon + 8;
      var offset = (state.distance * 3) % 42;
      for (var x = -offset; x < w + 42; x += 42) g.lineBetween(x, 0, x, gridBottom);
      for (var y = -offset; y < gridBottom + 42; y += 42) g.lineBetween(0, y, w, y);
      state.nodes.forEach(function (node) {
        if (node.y > gridBottom) return;
        g.fillStyle(0x65f4ff, 0.14);
        g.fillCircle(node.x, node.y, node.r);
        g.lineStyle(1, 0x7bd7c3, 0.05);
        g.lineBetween(node.x, node.y, node.x + 28, node.y + 14);
      });

      g.fillStyle(0x08111c, 1);
      g.fillRect(0, horizon, w, h - horizon);

      g.fillStyle(0x5ce4df, 0.18);
      g.fillRect(0, horizon - 12, w, 26);
      g.fillStyle(0x8ec7ff, 0.12);
      g.fillRect(0, horizon + 8, w, h * 0.16);

      state.clouds.forEach(function (cloud) {
        var pulse = Math.sin(state.visualTime * 0.75 + cloud.phase) * 2.5;
        var baseY = cloud.y + pulse;
        var step = cloud.w / cloud.density;
        g.fillStyle(0xc8f8ff, 0.16);
        g.fillRect(cloud.x - cloud.w * 0.48, baseY - cloud.h * 0.2, cloud.w, cloud.h * 0.48);
        for (var lobe = 0; lobe < cloud.density; lobe += 1) {
          var lobeT = cloud.density === 1 ? 0.5 : lobe / (cloud.density - 1);
          var cx = cloud.x - cloud.w * 0.44 + lobe * step;
          var size = 0.55 + Math.sin(lobeT * Math.PI) * 0.48;
          var cy = baseY - cloud.h * (0.12 + size * 0.26);
          g.fillRect(cx - step * 0.48, cy, step * 0.9, cloud.h * size);
        }
        g.fillStyle(0x7bd7c3, 0.09);
        g.fillRect(cloud.x - cloud.w * 0.5, baseY + cloud.h * 0.23, cloud.w * 0.88, 3);
        g.lineStyle(1, 0xdffcff, 0.18);
        g.lineBetween(cloud.x - cloud.w * 0.46, baseY - cloud.h * 0.22, cloud.x + cloud.w * 0.46, baseY - cloud.h * 0.22);
      });

      g.fillStyle(0x102c3c, 1);
      g.fillRect(0, waterTop, w, h - waterTop);
      state.islands.forEach(function (island) {
        var islandY = waterTop + 8 + island.yOffset;
        g.fillStyle(0x0b2430, 1);
        g.fillEllipse(island.x, islandY, island.w, island.h);
        g.fillStyle(0x123847, 1);
        g.fillTriangle(island.x - island.w * 0.36, islandY, island.x - island.w * 0.12, islandY - island.h * 1.6, island.x + island.w * 0.2, islandY);
        g.fillTriangle(island.x + island.w * 0.02, islandY, island.x + island.w * 0.28, islandY - island.h * 1.3, island.x + island.w * 0.44, islandY);
        g.fillStyle(0x7bd7c3, 0.1);
        g.fillEllipse(island.x, islandY + island.h * 0.75, island.w * 0.92, island.h * 0.75);
      });
      g.fillStyle(0x8ee8e2, 0.13);
      g.fillRect(0, waterTop - 8, w, 28);
      for (var wave = 0; wave < 10; wave += 1) {
        var waveY = waterTop + 18 + wave * 22;
        var waveOffset = (state.distance * (0.4 + wave * 0.035)) % 92;
        g.lineStyle(1, wave % 2 ? 0x8ec7ff : 0x7bd7c3, 0.09);
        for (var wx = -waveOffset; wx < w + 100; wx += 92) {
          g.lineBetween(wx, waveY, wx + 46, waveY - 3);
          g.lineBetween(wx + 46, waveY - 3, wx + 92, waveY);
        }
      }

      [0, 1, 2].forEach(function (layer) {
        var baseY = layer === 0 ? waterTop - 16 : layer === 1 ? waterTop + h * 0.1 : h * 0.72;
        var fill = layer === 0 ? 0x173344 : layer === 1 ? 0x0f2534 : 0x091722;
        var trim = layer === 0 ? 0x2c6d78 : layer === 1 ? 0x245461 : 0x183642;
        state.distantBuildings.forEach(function (building) {
          if ((building.layer || 0) !== layer) return;
          var bx = Math.round(building.x);
          var bw = Math.round(building.w);
          var bh = Math.round(building.h);
          g.fillStyle(fill, 1);
          g.fillRect(bx, baseY - bh, bw, bh);
          g.fillStyle(trim, 1);
          g.fillRect(bx, baseY - bh, bw, 3);
          g.fillStyle(layer === 0 ? 0x225262 : layer === 1 ? 0x1d4654 : 0x173541, 1);
          for (var lit = bx + 8 + building.seed % 11; lit < bx + bw - 8; lit += layer === 0 ? 24 : 19) {
            for (var ly = baseY - bh + 14; ly < baseY - 12; ly += layer === 0 ? 28 : 24) {
              if ((lit + ly + building.seed) % (layer === 2 ? 5 : 4) === 0) continue;
              g.fillRect(lit, ly, layer === 0 ? 4 : 5, layer === 0 ? 8 : 10);
            }
          }
        });

        g.fillStyle(0x79d7d3, layer === 0 ? 0.18 : layer === 1 ? 0.12 : 0.075);
        g.fillRect(0, baseY - 58, w, layer === 0 ? 82 : layer === 1 ? 78 : 92);
      });

      g.fillStyle(0x9ee9e2, 0.22);
      g.fillRect(0, horizon - 30, w, 54);
      g.fillStyle(0x7bd7c3, 0.16);
      g.fillRect(0, horizon + 4, w, 82);
      g.fillStyle(0xe9fcff, 0.12);
      g.fillRect(0, horizon - 62, w, 34);
    }

    function draw() {
      var g = state.bg;
      var w = state.width;
      var h = state.height;
      var p = state.player;
      g.clear();
      drawSkyline(g, w, h);

      g = state.world;
      g.clear();
      state.platforms.forEach(function (platform) {
        var roofH = platform.roofH || 18;
        var px = Math.round(platform.x);
        var py = Math.round(platform.y);
        var pw = Math.round(platform.w);
        g.fillStyle(0x0b1118, 1);
        g.fillRect(px, py + roofH, pw, Math.max(0, state.height - py));
        g.fillStyle(0x121a24, 1);
        g.fillRect(px, py, pw, roofH);
        g.lineStyle(2, 0x7bd7c3, 0.78);
        g.lineBetween(px, py, px + pw, py);
        g.lineStyle(1, 0x8ec7ff, 0.18);
        for (var wx = px + 18 + platform.windowSeed % 16; wx < px + pw - 12; wx += 34) {
          for (var wy = py + 42; wy < state.height + 12; wy += 42) {
            var column = Math.floor((wx - px) / 34);
            var row = Math.floor((wy - py) / 42);
            if ((column * 7 + row * 11 + platform.windowSeed) % 4 === 0) continue;
            g.fillStyle(0x7bd7c3, 0.08);
            g.fillRect(wx, wy, 10, 16);
          }
        }
        g.lineStyle(1, 0x875cff, 0.22);
        g.strokeRect(px, py + 4, pw, state.height - py + 34);
      });
      var targetRing = nearestRing();
      state.rings.forEach(function (ring) {
        var ringDistance = Math.hypot(ring.x - p.x, ring.y - p.y);
        var canGrapple = !ring.used && ring.x > p.x + 35 && ringDistance <= state.maxGrappleRange;
        var isTarget = ring === targetRing;
        var isUpcoming = !ring.used && ring.x > p.x + 35;
        var alpha = ring.used ? 0.08 : canGrapple ? 0.94 : isUpcoming ? 0.82 : 0.12;
        var radius = 13 + Math.sin(ring.pulse) * 2;
        if (isUpcoming && !canGrapple) {
          g.fillStyle(0x061019, 0.64);
          g.fillCircle(ring.x, ring.y, radius + 5);
          g.lineStyle(3, 0x0b1822, 0.94);
          g.strokeCircle(ring.x, ring.y, radius + 8);
        }
        g.lineStyle(isTarget ? 4 : 3, ring.used ? 0x202833 : canGrapple ? 0x9bfff0 : isUpcoming ? 0x102838 : 0x243542, alpha);
        g.strokeCircle(ring.x, ring.y, radius);
        g.lineStyle(1, canGrapple ? 0xb991ff : isUpcoming ? 0x07111a : 0x1c2a34, alpha * 0.78);
        g.lineBetween(ring.x - 18, ring.y, ring.x + 18, ring.y);
        if (isTarget) {
          var lock = 23 + Math.sin(ring.pulse * 1.4) * 3;
          g.lineStyle(2, 0x8ec7ff, 0.96);
          g.strokeCircle(ring.x, ring.y, lock);
          g.lineBetween(ring.x - lock - 7, ring.y, ring.x - lock + 3, ring.y);
          g.lineBetween(ring.x + lock - 3, ring.y, ring.x + lock + 7, ring.y);
          g.lineBetween(ring.x, ring.y - lock - 7, ring.x, ring.y - lock + 3);
          g.lineBetween(ring.x, ring.y + lock - 3, ring.x, ring.y + lock + 7);
        } else if (!ring.used && !isUpcoming) {
          g.lineStyle(1, 0x1d2a34, 0.1);
          g.strokeCircle(ring.x, ring.y, radius + 7);
        }
      });

      g = state.hookLine;
      g.clear();
      if (state.hookTarget) {
        var hand = grappleHandPoint(p);
        g.lineStyle(6, 0x031019, 0.72);
        g.lineBetween(hand.x, hand.y, state.hookTarget.x, state.hookTarget.y);
        g.lineStyle(3, 0xe9fcff, 0.96);
        g.lineBetween(hand.x, hand.y, state.hookTarget.x, state.hookTarget.y);
        g.lineStyle(1, 0x7bd7c3, 1);
        g.lineBetween(hand.x, hand.y, state.hookTarget.x, state.hookTarget.y);
      }

      g = state.playerGfx;
      g.clear();
      drawPlayerRig(g, p);

      state.hud.setText("DIST " + Math.floor(state.distance) + "  BEST " + Math.floor(state.best));
    }

    return new Phaser.Game(config);
  }

  function registerTriggers() {
    targetImages().forEach(function (image) {
      image.classList.add("traversal-evidence-trigger", "is-traversal-shimmering");
      image.setAttribute("title", image.getAttribute("title") || "Evidence image");
      image.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        var now = Date.now();
        clickTimes = clickTimes.filter(function (time) { return now - time < CLICK_WINDOW; });
        clickTimes.push(now);
        image.classList.remove("is-traversal-pulsing");
        void image.offsetWidth;
        image.classList.add("is-traversal-pulsing");
        window.setTimeout(function () {
          image.classList.remove("is-traversal-pulsing");
        }, 280);
        updateTriggerCounter(image, clickTimes.length);

        if (clickTimes.length >= REQUIRED_CLICKS) {
          clickTimes = [];
          hideTriggerCounter();
          openGame();
        }
      }, true);
    });
  }

  function registerTerminal() {
    var terminals = Array.prototype.slice.call(document.querySelectorAll("[data-traversal-terminal]"));
    terminals.forEach(function (terminal) {
      var input = terminal.querySelector("input");
      var output = terminal.querySelector("[data-traversal-terminal-output]");
      if (!input || input.dataset.traversalTerminalReady) return;
      input.dataset.traversalTerminalReady = "true";

      terminal.addEventListener("submit", function (event) {
        event.preventDefault();
        var command = input.value.trim().toLowerCase().replace(/\s+/g, " ");
        if (!command) return;

        if (directCommands.indexOf(command) !== -1) {
          if (output) output.textContent = "you ran!";
          input.value = "";
          openGame();
          return;
        }

        if (guidanceCommands.indexOf(command) !== -1) {
          if (output) output.textContent = "did you try to run it?";
          input.value = "";
          return;
        }

        var activeIndex = Number(input.dataset.activeRiddleIndex || -1);
        var activeRiddle = riddles[activeIndex];
        if (activeRiddle && activeRiddle.answers.indexOf(command) !== -1) {
          input.value = "";
          if (activeIndex >= riddles.length - 1) {
            if (output) output.textContent = "Correct";
            input.dataset.activeRiddleIndex = "-1";
            input.dataset.riddleIndex = "0";
            createTerminalFinalCelebration(terminal);
            window.setTimeout(openGame, 900);
            return;
          }

          var nextIndexAfterCorrect = activeIndex + 1;
          input.dataset.activeRiddleIndex = String(nextIndexAfterCorrect);
          input.dataset.riddleIndex = String(nextIndexAfterCorrect + 1);
          if (output) output.textContent = "Correct\n\n" + riddles[nextIndexAfterCorrect].prompt;
          createTerminalCelebration(terminal);
          return;
        }

        if (activeRiddle) {
          if (output) output.textContent = activeRiddle.prompt;
          input.value = "";
          return;
        }

        {
          var nextRiddle = Number(input.dataset.riddleIndex || 0);
          var riddle = riddles[nextRiddle % riddles.length];
          input.dataset.riddleIndex = String((nextRiddle + 1) % riddles.length);
          input.dataset.activeRiddleIndex = String(riddles.indexOf(riddle));
          if (output) {
            output.textContent = riddle.prompt;
          }
          input.value = "";
          return;
        }
      });
    });
  }

  function boot() {
    registerTriggers();
    registerTerminal();
    window.setTimeout(spawnSneakyBug, 1400);
    scheduleSneakyBug();
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeGame();
  });

    if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
