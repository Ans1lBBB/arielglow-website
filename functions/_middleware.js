/**
 * Force canonical host: https://www.arielglow.com
 * _redirects alone does not always apply to apex on custom domains.
 */
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === "arielglow.com") {
    url.hostname = "www.arielglow.com";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
