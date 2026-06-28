(function () {
  var targets = document.querySelectorAll("[data-about-section]");

  if (!targets.length) {
    return;
  }

  function renderAboutSection(index) {
    var titleId = index ? "personal-title-" + index : "personal-title";

    return [
      '<section class="personal-section" aria-labelledby="' + titleId + '">',
      '  <img src="./assets/face.png" alt="Ryan Sharr portrait">',
      '  <div class="prose">',
      '    <h2 id="' + titleId + '">Self-directed by necessity. Built for production.</h2>',
      "    <p>",
      "      I started in production art, and producing things is still the thread through all of my work. I grew up in Alaska playing hockey, went to art school in Seattle, got hired in game art, then kept moving toward the parts of production I did not understand yet. I taught myself C#, Unity, 2D/3D, pathfinding, state machines, behavior trees, tile maps, networking, shaders, lighting, render pipelines, post processing, game systems, animation systems, UI/UX, design, prototyping, editor tooling, AI-assisted workflows, and more because the work kept exposing the next bottleneck.",
      "    </p>",
      "    <p>",
      "      I am comfortable directing myself toward the weak part of a pipeline, deciding what needs to be learned or built next, and managing the work without waiting for someone else to define every step.",
      "    </p>",
      "    <p>",
      "      That's how I approach development now:",
      "    </p>",
      "    <p>",
      "      <strong>build the system, test the feel, fix what breaks, and keep pushing until it works.</strong>",
      "    </p>",
      "    <p>",
      "      I'm a competitive player at heart. I'm drawn to games where understanding the system, reading pressure, and executing better than the other player actually matter.",
      "    </p>",
      "    <p>",
      "      I am currently living in the middle of the woods, building game systems, prototypes, and AI-assisted workflows.",
      "    </p>",
      "  </div>",
      "</section>"
    ].join("\n");
  }

  targets.forEach(function (target, index) {
    target.outerHTML = renderAboutSection(index);
  });
})();
