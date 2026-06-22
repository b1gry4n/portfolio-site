(function () {
  function toEmbedUrl(url) {
    try {
      var parsed = new URL(url, window.location.href);
      var videoId = "";

      if (parsed.hostname.indexOf("youtu.be") !== -1) {
        videoId = parsed.pathname.replace("/", "");
      } else if (parsed.hostname.indexOf("youtube.com") !== -1) {
        if (parsed.pathname.indexOf("/embed/") === 0) {
          videoId = parsed.pathname.split("/embed/")[1];
        } else {
          videoId = parsed.searchParams.get("v") || "";
        }
      }

      if (!videoId) return "";
      videoId = videoId.split(/[?&#/]/)[0];
      return "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0";
    } catch (error) {
      return "";
    }
  }

  function buildModal() {
    var modal = document.createElement("div");
    modal.className = "video-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="video-modal__backdrop" data-video-close></div>',
      '<div class="video-modal__dialog" role="dialog" aria-modal="true" aria-label="Video player">',
      '  <button class="video-modal__close" type="button" data-video-close aria-label="Close video">Close</button>',
      '  <iframe title="Video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>',
      '  <div class="video-modal__controls" hidden>',
      '    <button class="video-modal__cycle" type="button" data-video-prev aria-label="Previous video">‹</button>',
      '    <span class="video-modal__count" aria-live="polite"></span>',
      '    <button class="video-modal__cycle" type="button" data-video-next aria-label="Next video">›</button>',
      "  </div>",
      "</div>"
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  var modal;
  var iframe;
  var controls;
  var counter;
  var lastTrigger;
  var playlist = [];
  var playlistIndex = 0;

  function videoLinksFor(trigger) {
    var scope = trigger.closest(".case-study");
    if (!scope) return [trigger.href];

    var links = Array.prototype.slice.call(scope.querySelectorAll('a[href*="youtube.com/watch"], a[href*="youtu.be/"]'));
    var urls = [];
    links.forEach(function (link) {
      if (!toEmbedUrl(link.href)) return;
      if (urls.indexOf(link.href) === -1) urls.push(link.href);
    });
    return urls.length ? urls : [trigger.href];
  }

  function renderCurrentVideo() {
    var embedUrl = toEmbedUrl(playlist[playlistIndex] || "");
    if (!embedUrl) return;

    iframe.src = embedUrl;
    if (playlist.length > 1) {
      controls.hidden = false;
      counter.textContent = "Video " + (playlistIndex + 1) + " / " + playlist.length;
    } else {
      controls.hidden = true;
      counter.textContent = "";
    }
  }

  function cycleVideo(direction) {
    if (playlist.length < 2) return;
    playlistIndex = (playlistIndex + direction + playlist.length) % playlist.length;
    renderCurrentVideo();
  }

  function openVideo(trigger) {
    var embedUrl = toEmbedUrl(trigger.href);
    if (!embedUrl) return;

    if (!modal) {
      modal = buildModal();
      iframe = modal.querySelector("iframe");
      controls = modal.querySelector(".video-modal__controls");
      counter = modal.querySelector(".video-modal__count");
      modal.addEventListener("click", function (event) {
        if (event.target.matches("[data-video-close]")) closeVideo();
        if (event.target.matches("[data-video-prev]")) cycleVideo(-1);
        if (event.target.matches("[data-video-next]")) cycleVideo(1);
      });
    }

    lastTrigger = trigger;
    playlist = videoLinksFor(trigger);
    playlistIndex = Math.max(0, playlist.indexOf(trigger.href));
    renderCurrentVideo();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("video-modal-open");
    modal.querySelector("[data-video-close]").focus();
  }

  function closeVideo() {
    if (!modal) return;
    iframe.src = "";
    playlist = [];
    playlistIndex = 0;
    if (controls) controls.hidden = true;
    if (counter) counter.textContent = "";
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("video-modal-open");
    if (lastTrigger) lastTrigger.focus();
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href*="youtube.com/watch"], a[href*="youtu.be/"]');
    if (!link) return;
    var embedUrl = toEmbedUrl(link.href);
    if (!embedUrl) return;
    event.preventDefault();
    openVideo(link);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeVideo();
    if (!modal || !modal.classList.contains("is-open")) return;
    if (event.key === "ArrowLeft") cycleVideo(-1);
    if (event.key === "ArrowRight") cycleVideo(1);
  });
})();
