export const WHATSAPP_NUMBER = "919845487271";
export const WHATSAPP_DISPLAY = "+91 98454 87271";
export const CONTACT_EMAIL = "hello@omorablooms.com";
export const INSTAGRAM_URL = "https://instagram.com/omorablooms";
export const FACEBOOK_URL = "https://facebook.com/omorablooms";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function orderOnWhatsApp(product?: { name: string; price: number }): string {
  const msg = product
    ? `Hello OMORA BLOOMS! I'd like to order:\n\n${product.name}\n₹${product.price.toLocaleString("en-IN")}\n\nPlease confirm availability.`
    : "Hello OMORA BLOOMS! I'd like to place an order. Please guide me.";
  return whatsappLink(msg);
}
