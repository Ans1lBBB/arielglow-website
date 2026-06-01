const PERLER_MATERIAL = "拼豆";

const products = [
  { name: "賽道上的小閃光", size: "40 × 50 cm", price: "NT$ 880", img: "https://picsum.photos/id/104/400/400" },
  { name: "粉粉的傍晚", size: "35 × 45 cm", price: "NT$ 780", img: "https://picsum.photos/id/106/400/400" },
  { name: "我愛跑步那種", size: "45 × 55 cm", price: "NT$ 920", img: "https://picsum.photos/id/20/400/400" },
  { name: "貓咪打瞌睡", size: "30 × 30 cm", price: "NT$ 650", img: "https://picsum.photos/id/141/400/400" },
  { name: "星星與運動鞋", size: "42 × 52 cm", price: "NT$ 990", img: "https://picsum.photos/id/29/400/400" },
  { name: "櫻花小掛飾", size: "18 × 22 cm", price: "NT$ 560", img: "https://picsum.photos/id/96/400/400" },
  { name: "彩虹幾何", size: "38 × 38 cm", price: "NT$ 720", img: "https://picsum.photos/id/119/400/400" },
  { name: "森林小狐狸", size: "32 × 40 cm", price: "NT$ 680", img: "https://picsum.photos/id/108/400/400" },
  { name: "兔子在衝刺", size: "36 × 44 cm", price: "NT$ 830", img: "https://picsum.photos/id/28/400/400" },
  { name: "雙魚座的貝殼", size: "28 × 34 cm", price: "NT$ 590", img: "https://picsum.photos/id/128/400/400" },
  { name: "復古小遊戲機", size: "34 × 42 cm", price: "NT$ 750", img: "https://picsum.photos/id/0/400/400" },
  { name: "亮亮小胸針", size: "12 × 14 cm", price: "NT$ 480", img: "https://picsum.photos/id/36/400/400" },
];

const container = document.getElementById("pixelGrid");

function renderProducts() {
  if (!container) return;
  container.innerHTML = "";
  products.forEach((item) => {
    const card = document.createElement("div");
    card.className = "product-card fade-up";
    card.innerHTML = `
      <img class="product-img" src="${item.img}" alt="${item.name}（示意圖）" loading="lazy">
      <div class="product-name">${item.name}</div>
      <dl class="product-specs">
        <div class="product-spec-row">
          <dt>尺寸</dt>
          <dd>${item.size}</dd>
        </div>
        <div class="product-spec-row">
          <dt>材質</dt>
          <dd>${item.material || PERLER_MATERIAL}</dd>
        </div>
        <div class="product-spec-row product-spec-price">
          <dt>價格</dt>
          <dd>${item.price}</dd>
        </div>
      </dl>
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
