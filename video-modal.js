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
      var start = parsed.searchParams.get("start") || parsed.searchParams.get("t") || "";
      var seconds = 0;
      var timeMatch = String(start).match(/^(?:(\d+)h)?(?:(\d+)m)?(\d+)s?$/i);
      if (timeMatch) {
        seconds = (Number(timeMatch[1]) || 0) * 3600 + (Number(timeMatch[2]) || 0) * 60 + (Number(timeMatch[3]) || 0);
      } else {
        seconds = Math.max(0, Math.floor(Number(start) || 0));
      }
      return "https://www.youtube.com/embed/" + videoId + "?autoplay=1&rel=0" + (seconds ? "&start=" + seconds : "");
    } catch (error) {
      return "";
    }
  }

  function isLocalVideoUrl(url) {
    try {
      var parsed = new URL(url, window.location.href);
      return /\.mp4($|[?#])/i.test(parsed.pathname);
    } catch (error) {
      return false;
    }
  }

  function isPlayableUrl(url) {
    return !!toEmbedUrl(url) || isLocalVideoUrl(url);
  }

  function isInteractiveTarget(target) {
    return !!(target && target.closest && target.closest("a, button, input, textarea, select, summary, [data-jar-club-trigger]"));
  }

  function closestVideoPanel(link) {
    return link.closest(".case-study") || link.closest(".media-card") || link.closest(".ai-prototype-row") || link.closest(".project-card");
  }

  function primaryVideoLink(panel) {
    if (!panel) return null;
    var links = Array.prototype.slice.call(panel.querySelectorAll('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href$=".mp4"], a[href*=".mp4?"], a[href*=".mp4#"]'));
    for (var i = 0; i < links.length; i += 1) {
      if (isPlayableUrl(links[i].href)) return links[i];
    }
    return null;
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
      '  <video controls autoplay playsinline></video>',
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
  var localVideo;
  var controls;
  var counter;
  var lastTrigger;
  var playlist = [];
  var playlistIndex = 0;

  function triggerTitle(trigger) {
    var scope = trigger.closest("article") || trigger.closest("section") || trigger;
    var heading = scope.querySelector("h2, h3");
    return heading ? heading.textContent.trim() : "video";
  }

  function videoLinksFor(trigger) {
    var scope = trigger.closest(".case-study");
    if (!scope) return [trigger.href];

    var links = Array.prototype.slice.call(scope.querySelectorAll('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href$=".mp4"], a[href*=".mp4?"], a[href*=".mp4#"]'));
    var urls = [];
    links.forEach(function (link) {
      if (!isPlayableUrl(link.href)) return;
      if (urls.indexOf(link.href) === -1) urls.push(link.href);
    });
    return urls.length ? urls : [trigger.href];
  }

  function prepareVideoCards() {
    var cards = Array.prototype.slice.call(document.querySelectorAll("a.video-card, a.case-video-card, a.hero-video-card"));
    cards.forEach(function (card) {
      if (!isPlayableUrl(card.href)) return;
      var count = videoLinksFor(card).length;

      card.classList.add("video-modal-trigger");
      card.setAttribute("title", count > 1 ? count + " clips" : "Open demo");
      card.setAttribute("aria-label", "Open video modal: " + triggerTitle(card));
      card.dataset.videoCount = String(count);

      var panel = closestVideoPanel(card);
      if (panel && !panel.dataset.wholeCardVideoReady) {
        panel.dataset.wholeCardVideoReady = "true";
        panel.classList.add("whole-card-video-trigger");
        if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "0");
        if (!panel.hasAttribute("role")) panel.setAttribute("role", "button");
        if (!panel.getAttribute("aria-label")) panel.setAttribute("aria-label", "Open video modal: " + triggerTitle(card));
      }

      var existingCue = card.querySelector(".video-card__cue");
      if (count < 2) {
        if (existingCue) existingCue.remove();
        return;
      }

      var label = count + " clips";
      if (!existingCue) {
        var cue = document.createElement("span");
        cue.className = "video-card__cue";
        cue.textContent = label;
        card.appendChild(cue);
      } else {
        existingCue.textContent = label;
      }
    });
  }

  function renderCurrentVideo() {
    var currentUrl = playlist[playlistIndex] || "";
    var embedUrl = toEmbedUrl(currentUrl);

    iframe.src = "";
    iframe.hidden = true;
    localVideo.pause();
    localVideo.removeAttribute("src");
    localVideo.hidden = true;

    if (embedUrl) {
      iframe.src = embedUrl;
      iframe.hidden = false;
    } else if (isLocalVideoUrl(currentUrl)) {
      localVideo.src = currentUrl;
      localVideo.hidden = false;
      localVideo.play().catch(function () {});
    } else {
      return;
    }

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
    if (!isPlayableUrl(trigger.href)) return;

    if (!modal) {
      modal = buildModal();
      iframe = modal.querySelector("iframe");
      localVideo = modal.querySelector("video");
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
    if (localVideo) {
      localVideo.pause();
      localVideo.removeAttribute("src");
    }
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
    var link = event.target.closest('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href$=".mp4"], a[href*=".mp4?"], a[href*=".mp4#"]');
    if (!link && !isInteractiveTarget(event.target)) {
      var panel = event.target.closest(".whole-card-video-trigger");
      link = primaryVideoLink(panel);
    }
    if (!link || !isPlayableUrl(link.href)) return;
    event.preventDefault();
    openVideo(link);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeVideo();
    if ((event.key === "Enter" || event.key === " ") && event.target && event.target.classList && event.target.classList.contains("whole-card-video-trigger")) {
      var link = primaryVideoLink(event.target);
      if (link) {
        event.preventDefault();
        openVideo(link);
      }
      return;
    }
    if (!modal || !modal.classList.contains("is-open")) return;
    if (event.key === "ArrowLeft") cycleVideo(-1);
    if (event.key === "ArrowRight") cycleVideo(1);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepareVideoCards);
  } else {
    prepareVideoCards();
  }
})();
