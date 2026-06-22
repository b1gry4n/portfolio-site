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
      "</div>"
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  var modal;
  var iframe;
  var lastTrigger;

  function openVideo(trigger) {
    var embedUrl = toEmbedUrl(trigger.href);
    if (!embedUrl) return;

    if (!modal) {
      modal = buildModal();
      iframe = modal.querySelector("iframe");
      modal.addEventListener("click", function (event) {
        if (event.target.matches("[data-video-close]")) closeVideo();
      });
    }

    lastTrigger = trigger;
    iframe.src = embedUrl;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("video-modal-open");
    modal.querySelector("[data-video-close]").focus();
  }

  function closeVideo() {
    if (!modal) return;
    iframe.src = "";
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
  });
})();
