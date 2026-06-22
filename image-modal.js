(function () {
  function isEligibleImage(image) {
    if (!image || !image.currentSrc && !image.src) return false;
    if (image.closest("a")) return false;
    if (image.closest(".video-modal, .image-modal")) return false;
    return true;
  }

  function buildModal() {
    var modal = document.createElement("div");
    modal.className = "image-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="image-modal__backdrop" data-image-close></div>',
      '<div class="image-modal__dialog" role="dialog" aria-modal="true" aria-label="Image viewer">',
      '  <button class="image-modal__close" type="button" data-image-close aria-label="Close image">Close</button>',
      '  <img alt="">',
      '  <p class="image-modal__caption"></p>',
      "</div>"
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
