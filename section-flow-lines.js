(function () {
  var main = document.querySelector("main");
  var signalGrid = document.querySelector(".signal-grid");
  if (!main || !signalGrid) return;

  var segmentKeys = {};
  var flowIndex = 0;
  var pipeLayer;
  var lineLayer;
  var nodeLayer;
  var flowLayer;
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("section-flow-lines");
  svg.setAttribute("aria-hidden", "true");
  main.prepend(svg);

  function relativePoint(element, anchor) {
    var mainRect = main.getBoundingClientRect();
    var rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - mainRect.left,
      y: anchor === "bottom" ? rect.bottom - mainRect.top : rect.top - mainRect.top
    };
  }

  function segmentKey(a, b) {
    var ax = Math.round(a.x);
    var ay = Math.round(a.y);
    var bx = Math.round(b.x);
    var by = Math.round(b.y);
    return ax + "," + ay + ":" + bx + "," + by;
  }

  function addSegment(a, b, className) {
    var key = segmentKey(a, b);
    if (segmentKeys[key]) return;
    segmentKeys[key] = true;

    var d = "M" + a.x.toFixed(1) + " " + a.y.toFixed(1) + " L" + b.x.toFixed(1) + " " + b.y.toFixed(1);
    var pipe = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pipe.setAttribute("d", d);
    pipe.setAttribute("class", "section-flow-lines__pipe");
    pipeLayer.appendChild(pipe);

    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("class", className || "section-flow-lines__path");
    lineLayer.appendChild(path);
  }

  function pathData(points) {
    return points.map(function (point, index) {
      return (index ? "L" : "M") + point.x.toFixed(1) + " " + point.y.toFixed(1);
    }).join(" ");
  }

  function pathLength(points) {
    var length = 0;
    for (var i = 1; i < points.length; i += 1) {
      length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    return length;
  }

  function addFlowDots(points, className) {
    var length = pathLength(points);
    if (length < 30) return;

    var d = pathData(points);
    var count = Math.max(1, Math.min(6, Math.round(length / 120)));
    var duration = Math.max(3.2, Math.min(7.8, length / 48));

    for (var i = 0; i < count; i += 1) {
      var dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      var motion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      var delay = -(((i / count) * duration) + (flowIndex % 4) * 0.08);

      dot.setAttribute("r", className.indexOf("--split") !== -1 || className.indexOf("--merge") !== -1 ? "2.7" : "2.4");
      dot.setAttribute("class", "section-flow-lines__flow-dot");
      motion.setAttribute("path", d);
      motion.setAttribute("dur", duration.toFixed(2) + "s");
      motion.setAttribute("begin", delay.toFixed(2) + "s");
      motion.setAttribute("repeatCount", "indefinite");

      dot.appendChild(motion);
      flowLayer.appendChild(dot);
    }

    flowIndex += 1;
  }

  function addSplitFlow(center, targets) {
    if (!targets.length) return;
    var midY = center.y + (targets[0].y - center.y) / 2;
    var xs = targets.map(function (point) { return point.x; });
    var leftX = Math.min.apply(Math, xs);
    var rightX = Math.max.apply(Math, xs);

    addFlowDots([{ x: center.x, y: midY }, { x: leftX, y: midY }], "section-flow-lines__path--split");
    addFlowDots([{ x: center.x, y: midY }, { x: rightX, y: midY }], "section-flow-lines__path--split");
  }

  function addMergeFlow(sources, center) {
    if (!sources.length) return;
    var midY = sources[0].y + (center.y - sources[0].y) / 2;
    var xs = sources.map(function (point) { return point.x; });
    var leftX = Math.min.apply(Math, xs);
    var rightX = Math.max.apply(Math, xs);

    addFlowDots([{ x: leftX, y: midY }, { x: center.x, y: midY }], "section-flow-lines__path--merge");
    addFlowDots([{ x: rightX, y: midY }, { x: center.x, y: midY }], "section-flow-lines__path--merge");
  }

  function addNode(point) {
    var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x.toFixed(1));
    circle.setAttribute("cy", point.y.toFixed(1));
    circle.setAttribute("r", "2.5");
    circle.setAttribute("class", "section-flow-lines__node");
    nodeLayer.appendChild(circle);
  }

  function drawRoute(from, to, className) {
    var midY = from.y + (to.y - from.y) / 2;
    var routeClass = className || "section-flow-lines__path";
    addSegment(from, { x: from.x, y: midY }, routeClass);
    addSegment({ x: from.x, y: midY }, { x: to.x, y: midY }, routeClass);
    addSegment({ x: to.x, y: midY }, to, routeClass);
  }

  function draw() {
    var mainHeight = Math.max(main.scrollHeight, main.offsetHeight);
    segmentKeys = {};
    flowIndex = 0;
    svg.setAttribute("viewBox", "0 0 " + main.clientWidth + " " + mainHeight);
    svg.setAttribute("width", main.clientWidth);
    svg.setAttribute("height", mainHeight);
    svg.replaceChildren();
    pipeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    lineLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nodeLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    flowLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svg.appendChild(pipeLayer);
    svg.appendChild(lineLayer);
    svg.appendChild(nodeLayer);
    svg.appendChild(flowLayer);

    var blocks = Array.prototype.slice.call(main.children).filter(function (child) {
      return child !== svg && child.matches("section");
    });

    for (var i = 0; i < blocks.length - 1; i += 1) {
      var current = blocks[i];
      var next = blocks[i + 1];

      if (current.classList.contains("hero") && next.classList.contains("signal-grid")) {
        var heroOut = relativePoint(current, "bottom");
        var cardIns = Array.prototype.slice.call(next.querySelectorAll("article")).map(function (card) {
          return relativePoint(card, "top");
        });
        cardIns.forEach(function (cardIn) {
          drawRoute(heroOut, cardIn, "section-flow-lines__path section-flow-lines__path--split");
          addNode(cardIn);
        });
        addSplitFlow(heroOut, cardIns);
        addNode(heroOut);
        continue;
      }

      if (current.classList.contains("signal-grid")) {
        var nextIn = relativePoint(next, "top");
        var cardOuts = Array.prototype.slice.call(current.querySelectorAll("article")).map(function (card) {
          return relativePoint(card, "bottom");
        });
        cardOuts.forEach(function (cardOut) {
          drawRoute(cardOut, nextIn, "section-flow-lines__path section-flow-lines__path--merge");
          addNode(cardOut);
        });
        addMergeFlow(cardOuts, nextIn);
        addNode(nextIn);
        continue;
      }

      var from = relativePoint(current, "bottom");
      var to = relativePoint(next, "top");
      drawRoute(from, to, "section-flow-lines__path");
      addFlowDots([from, { x: from.x, y: from.y + (to.y - from.y) / 2 }, { x: to.x, y: from.y + (to.y - from.y) / 2 }, to], "section-flow-lines__path");
      addNode(from);
      addNode(to);
    }
  }

  function scheduleDraw() {
    window.requestAnimationFrame(draw);
  }

  if ("ResizeObserver" in window) {
    var observer = new ResizeObserver(scheduleDraw);
    observer.observe(main);
    Array.prototype.slice.call(main.children).forEach(function (child) {
      observer.observe(child);
    });
  }

  window.addEventListener("resize", scheduleDraw);
  window.addEventListener("load", scheduleDraw);
  scheduleDraw();
})();
