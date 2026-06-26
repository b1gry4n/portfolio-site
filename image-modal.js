(function () {
  function isEligibleImage(image) {
    if (!image || !image.currentSrc && !image.src) return false;
    if (image.matches("[data-no-lightbox], [data-jar-club-trigger]")) return false;
    if (image.closest("a")) return false;
    if (image.closest(".video-modal, .image-modal")) return false;
    return true;
  }

  function isVideoPanel(panel) {
    return !!(panel && panel.querySelector && panel.querySelector('a[href*="youtube.com/watch"], a[href*="youtu.be/"], a[href$=".mp4"], a[href*=".mp4?"], a[href*=".mp4#"]'));
  }

  function isInteractiveTarget(target) {
    return !!(target && target.closest && target.closest("a, button, input, textarea, select, summary, [data-jar-club-trigger]"));
  }

  function closestImagePanel(image) {
    return image.closest(".media-card") || image.closest(".case-study") || image.closest(".aoeo-gallery article") || image.closest(".ai-prototype-row");
  }

  function primaryImage(panel) {
    if (!panel || isVideoPanel(panel)) return null;
    var images = Array.prototype.slice.call(panel.querySelectorAll("img"));
    for (var i = 0; i < images.length; i += 1) {
      if (isEligibleImage(images[i])) return images[i];
    }
    return null;
  }

  function buildModal() {
    var modal = document.createElement("div");
    modal.className = "image-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="image-modal__backdrop" data-image-close></div>',
      '<div class="image-modal__dialog" role="dialog" aria-modal="true" aria-label="Image viewer">',
      '  <button class="image-modal__close" type="button" data-image-close aria-label="Close image">X</button>',
      '  <img alt="">',
      "</div>",
      '<p class="image-modal__caption"></p>'
    ].join("");
    document.body.appendChild(modal);
    return modal;
  }

  var modal;
  var modalImage;
  var caption;
  var lastTrigger;

  function prepareImages() {
    document.querySelectorAll("img").forEach(function (image) {
      if (!isEligibleImage(image)) return;
      image.classList.add("image-lightbox-trigger");
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      if (!image.getAttribute("aria-label")) {
        image.setAttribute("aria-label", "Open image: " + (image.alt || "Image preview"));
      }

      var panel = closestImagePanel(image);
      if (panel && !isVideoPanel(panel) && !panel.dataset.wholeCardImageReady) {
        panel.dataset.wholeCardImageReady = "true";
        panel.classList.add("whole-card-image-trigger");
        if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "0");
        if (!panel.hasAttribute("role")) panel.setAttribute("role", "button");
        if (!panel.getAttribute("aria-label")) panel.setAttribute("aria-label", "Open image: " + (image.alt || "Image preview"));
      }
    });
  }

  function openImage(image) {
    if (!isEligibleImage(image)) return;

    if (!modal) {
      modal = buildModal();
      modalImage = modal.querySelector("img");
      caption = modal.querySelector(".image-modal__caption");
      modal.addEventListener("click", function (event) {
        if (event.target.matches("[data-image-close]")) closeImage();
      });
    }

    lastTrigger = image;
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt || "";
    caption.textContent = image.alt || "";
    caption.hidden = !image.alt;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("image-modal-open");
    modal.querySelector(".image-modal__dialog").scrollTo(0, 0);
    modal.querySelector("[data-image-close]").focus();
  }

  function closeImage() {
    if (!modal) return;
    modalImage.src = "";
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("image-modal-open");
    if (lastTrigger) lastTrigger.focus();
  }

  document.addEventListener("click", function (event) {
    var image = event.target.closest("img");
    if ((!image || !isEligibleImage(image)) && !isInteractiveTarget(event.target)) {
      image = primaryImage(event.target.closest(".whole-card-image-trigger"));
    }
    if (!image || !isEligibleImage(image)) return;
    event.preventDefault();
    openImage(image);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeImage();
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    var image = event.target instanceof Element ? event.target.closest("img") : null;
    if ((!image || !isEligibleImage(image)) && event.target instanceof Element && event.target.classList.contains("whole-card-image-trigger")) {
      image = primaryImage(event.target);
    }
    if (!image || !isEligibleImage(image)) return;
    event.preventDefault();
    openImage(image);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepareImages);
  } else {
    prepareImages();
  }
})();
