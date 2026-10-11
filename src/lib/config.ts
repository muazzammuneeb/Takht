export const MIN_BID = 100;

export const CATEGORIES = [
  "Food",
  "Fashion",
  "Tech",
  "Startups",
  "Services",
  "Health & Fitness",
  "Education",
  "Ecommerce",
  "Local",
  "Other",
] as const;

export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Hyderabad",
  "Overseas",
] as const;

export type CardStyle = "truck" | "minimal" | "darbar";
export const CARD_STYLES: CardStyle[] = ["darbar", "truck", "minimal"];
export const CARD_STYLE_LABELS: Record<CardStyle, string> = {
  darbar: "Darbar",
  truck: "Truck Art",
  minimal: "Minimal",
};

export function defaultCardStyle(category: string): CardStyle {
  if (category === "Food" || category === "Fashion" || category === "Local") return "truck";
  if (category === "Tech" || category === "Startups") return "minimal";
  return "darbar";
}

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://takht.pk";
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@takht.pk";
