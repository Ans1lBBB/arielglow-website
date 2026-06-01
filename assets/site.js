const PRODUCT_PRICE = "NT$ 270";

const products = [
  { name: "可達鴨（無孔）", size: "10.5×9.5 cm", img: "/images/products/07-psyduck-a.jpg" },
  { name: "草莓冰棒", size: "5.5×4 cm", img: "/images/products/12-popsicle.jpg" },
  { name: "卡波", size: "10.5×8 cm", img: "/images/products/08-mang.jpg" },
  { name: "外星豬", size: "8×10 cm", img: "/images/products/05-capoo.jpg" },
  { name: "漢堡堡", size: "8×8.5 cm", img: "/images/products/09-burger.jpg" },
  { name: "貓貓咖啡杯", size: "8.5×10.5 cm", img: "/images/products/06-cat-cup.jpg" },
  { name: "可達鴨（有孔）", size: "10.5×9.5 cm", img: "/images/products/10-psyduck-b.jpg" },
  { name: "火星人", size: "11.5×10 cm", img: "/images/products/11-stripe.jpg" },
  { name: "布丁狗", size: "10.5×11 cm", img: "/images/products/02-pompompurin.jpg" },
  { name: "鋼琴", size: "2.5×5.5 cm", img: "/images/products/04-piano.jpg" },
  { name: "被氣球帶走的企鵝", size: "10.5×9 cm", img: "/images/products/03-penguin.jpg" },
  { name: "豆豆種子", size: "13×9.5 cm", img: "/images/products/01-totoro.jpg" },
];

const container = document.getElementById("pixelGrid");

function renderProducts() {
  if (!container) return;
  container.innerHTML = "";
  products.forEach((item) => {
    const card = document.createElement("div");
    card.className = "product-card fade-up";
    card.innerHTML = `
      <img class="product-img" src="${item.img}" alt="${item.name}" loading="lazy">
      <div class="product-name">${item.name}</div>
      <div class="product-size">${item.size}</div>
      <div class="product-price">${PRODUCT_PRICE}</div>
      <button class="btn-order" data-name="${item.name}">🛒 想預購這個</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll(".btn-order").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const productName = btn.getAttribute("data-name") || "拼豆作品";
      alert(`「${productName}」我先記下來囉～（網站還在蓋，真正的 7-11 連結之後會放）`);
    });
  });

  observeFadeElements();
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -20px 0px" }
);

function observeFadeElements() {
  document.querySelectorAll(".fade-up").forEach((el) => {
    if (!el.dataset.observed) {
      observer.observe(el);
      el.dataset.observed = "true";
    }
  });
}

renderProducts();
observeFadeElements();
setTimeout(observeFadeElements, 100);

window.addEventListener("load", () => {
  document.querySelector(".hero-copy")?.classList.add("visible");

  document.querySelectorAll(".fade-up").forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80) {
      el.classList.add("visible");
      observer.unobserve(el);
    }
  });
});

document.querySelectorAll(".nav-links a, .logo").forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const targetId = this.getAttribute("href");
    if (targetId && targetId !== "#" && targetId.startsWith("#")) {
      e.preventDefault();
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const offset = 70;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    } else if (targetId === "#") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
});

window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  if (window.scrollY > 20) {
    nav.style.background = "rgba(249, 249, 247, 0.85)";
    nav.style.borderBottomColor = "rgba(142, 142, 147, 0.3)";
  } else {
    nav.style.background = "rgba(249, 249, 247, 0.72)";
    nav.style.borderBottomColor = "rgba(142, 142, 147, 0.2)";
  }
});
