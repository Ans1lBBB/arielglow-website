/**
 * Canonical host + language detection for homepage.
 * English browsers land on /en/; Chinese/default stays on /.
 */
const TRADITIONAL_REGIONS = new Set(["TW", "HK", "MO"]);

function parseAcceptLanguage(header) {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [langRaw, ...params] = part.trim().split(";");
      const lang = langRaw.trim().toLowerCase();
      let q = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q" && value) q = parseFloat(value) || 0;
      }
      return { lang, q };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);
}

function prefersEnglish(request) {
  const country = request.cf?.country || "";
  if (TRADITIONAL_REGIONS.has(country) || country === "CN") return false;

  const preferences = parseAcceptLanguage(request.headers.get("Accept-Language"));
  let sawChinese = false;
  let sawEnglish = false;

  for (const { lang } of preferences) {
    if (lang === "zh" || lang.startsWith("zh-")) {
      sawChinese = true;
      break;
    }
    if (lang === "en" || lang.startsWith("en-")) {
      sawEnglish = true;
      break;
    }
  }

  if (sawChinese) return false;
  if (sawEnglish) return true;
  return country === "US" || country === "GB" || country === "AU" || country === "CA";
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === "arielglow.com") {
    url.hostname = "www.arielglow.com";
    return Response.redirect(url.toString(), 301);
  }

  if (
    (url.pathname === "/" || url.pathname === "/index.html") &&
    prefersEnglish(context.request)
  ) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url.origin}/en/`,
        "Cache-Control": "private, no-cache",
        Vary: "Accept-Language",
      },
    });
  }

  return context.next();
}
