const products = [
  { name: "極速幻影·拼豆畫", price: "NT$ 880", img: "https://picsum.photos/id/104/400/400" },
  { name: "玫瑰金時光", price: "NT$ 780", img: "https://picsum.photos/id/106/400/400" },
  { name: "賽道之心", price: "NT$ 920", img: "https://picsum.photos/id/20/400/400" },
  { name: "像素貓咪午後", price: "NT$ 650", img: "https://picsum.photos/id/141/400/400" },
  { name: "星辰競走者", price: "NT$ 990", img: "https://picsum.photos/id/29/400/400" },
  { name: "櫻花拼豆掛飾", price: "NT$ 560", img: "https://picsum.photos/id/96/400/400" },
  { name: "幾何動態", price: "NT$ 720", img: "https://picsum.photos/id/119/400/400" },
  { name: "小狐狸森林", price: "NT$ 680", img: "https://picsum.photos/id/108/400/400" },
  { name: "破風兔", price: "NT$ 830", img: "https://picsum.photos/id/28/400/400" },
  { name: "貝殼之夢", price: "NT$ 590", img: "https://picsum.photos/id/128/400/400" },
  { name: "復古遊戲機", price: "NT$ 750", img: "https://picsum.photos/id/0/400/400" },
  { name: "水晶拼豆胸針", price: "NT$ 480", img: "https://picsum.photos/id/36/400/400" },
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
      <div class="product-price">${item.price}</div>
      <button class="btn-order" data-name="${item.name}" data-price="${item.price}">🛒 7-11 預購收藏</button>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll(".btn-order").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const productName = btn.getAttribute("data-name") || "拼豆作品";
      alert(`已將「${productName}」加入預購清單，將引導至 7-11 交貨便頁面。（展示功能，正式連結待上架）`);
    });
  });
}

renderProducts();

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

observeFadeElements();
setTimeout(observeFadeElements, 100);

window.addEventListener("load", () => {
  const heroTitle = document.querySelector(".hero-content");
  if (heroTitle) heroTitle.classList.add("visible");

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
  nav.classList.toggle("scrolled", window.scrollY > 20);
});
