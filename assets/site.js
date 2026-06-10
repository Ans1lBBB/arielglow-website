const PRODUCT_PRICE = "NT$ 270";
const MYSHIP_STORE =
  "https://myship.7-11.com.tw/general/detail/GM2606030400230";

const UI = {
  "zh-TW": {
    orderHint: (spec) => `在賣場選這個規格就好：${spec}`,
    buyBtn: "🛒 到 7-11 帶它回家",
  },
  en: {
    orderHint: (spec) => `Pick this spec in the shop: ${spec}`,
    buyBtn: "🛒 Get it via 7-11",
  },
};

const products = [
  {
    name: { "zh-TW": "可達鴨（無孔）", en: "Psyduck (no hole)" },
    size: "10.5×9.5 cm",
    img: "/images/products/07-psyduck-a.jpg",
    myshipSpec: "可達鴨(無孔) 10.5×9.5 cm",
  },
  {
    name: { "zh-TW": "草莓冰棒", en: "Strawberry Popsicle" },
    size: "5.5×4 cm",
    img: "/images/products/12-popsicle.jpg",
    myshipSpec: "草莓冰棒 5.5×4 cm",
  },
  {
    name: { "zh-TW": "卡波", en: "Capybara" },
    size: "10.5×8 cm",
    img: "/images/products/08-mang.jpg",
    myshipSpec: "卡波 10.5×8 cm",
  },
  {
    name: { "zh-TW": "外星豬", en: "Alien Pig" },
    size: "8×10 cm",
    img: "/images/products/05-capoo.jpg",
    myshipSpec: "外星豬 8×10 cm",
  },
  {
    name: { "zh-TW": "漢堡堡", en: "Burger Buddy" },
    size: "8×8.5 cm",
    img: "/images/products/09-burger.jpg",
    myshipSpec: "漢堡堡 8×8.5 cm",
  },
  {
    name: { "zh-TW": "貓貓咖啡杯", en: "Cat Coffee Cup" },
    size: "8.5×10.5 cm",
    img: "/images/products/06-cat-cup.jpg",
    myshipSpec: "貓貓咖啡杯 8.5×10.5 cm",
  },
  {
    name: { "zh-TW": "可達鴨（有孔）", en: "Psyduck (with hole)" },
    size: "10.5×9.5 cm",
    img: "/images/products/10-psyduck-b.jpg",
    myshipSpec: "可達鴨(有孔) 10.5×9.5 cm",
  },
  {
    name: { "zh-TW": "火星人", en: "Little Martian" },
    size: "11.5×10 cm",
    img: "/images/products/11-stripe.jpg",
    myshipSpec: "火星人 11.5×10 cm",
  },
  {
    name: { "zh-TW": "布丁狗", en: "Pompompurin" },
    size: "10.5×11 cm",
    img: "/images/products/02-pompompurin.jpg",
    myshipSpec: "布丁狗 10.5×11 cm",
  },
  {
    name: { "zh-TW": "鋼琴", en: "Piano" },
    size: "2.5×5.5 cm",
    img: "/images/products/04-piano.jpg",
    myshipSpec: "鋼琴 2.5×5.5 cm",
  },
  {
    name: { "zh-TW": "被氣球帶走的企鵝", en: "Penguin with Balloons" },
    size: "10.5×9 cm",
    img: "/images/products/03-penguin.jpg",
    myshipSpec: "被氣球帶走的企鵝 10.5×9 cm",
  },
  {
    name: { "zh-TW": "豆豆種子", en: "Totoro Seed" },
    size: "13×9.5 cm",
    img: "/images/products/01-totoro.jpg",
    myshipSpec: "豆豆種子 13×9.5 cm",
  },
];

const pageLang = document.documentElement.lang?.startsWith("en") ? "en" : "zh-TW";
const strings = UI[pageLang];
const container = document.getElementById("pixelGrid");

function renderProducts() {
  if (!container) return;
  container.innerHTML = "";
  products.forEach((item) => {
    const displayName = item.name[pageLang] || item.name["zh-TW"];
    const card = document.createElement("div");
    card.className = "product-card fade-up";
    card.innerHTML = `
      <img class="product-img" src="${item.img}" alt="${displayName}" loading="lazy">
      <div class="product-name">${displayName}</div>
      <div class="product-size">${item.size}</div>
      <div class="product-price">${PRODUCT_PRICE}</div>
      <p class="product-order-hint">${strings.orderHint(item.myshipSpec)}</p>
      <a class="btn-order" href="${MYSHIP_STORE}" target="_blank" rel="noopener noreferrer">${strings.buyBtn}</a>
    `;
    container.appendChild(card);
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
