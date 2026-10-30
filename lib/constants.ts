export const APP_NAME = "Evently";

export const CATEGORIES = [
  { name: "Music", slug: "music", icon: "Music" },
  { name: "Technology", slug: "technology", icon: "Cpu" },
  { name: "Business", slug: "business", icon: "Briefcase" },
  { name: "Sports", slug: "sports", icon: "Trophy" },
  { name: "Arts & Culture", slug: "arts-culture", icon: "Palette" },
  { name: "Food & Drink", slug: "food-drink", icon: "UtensilsCrossed" },
  { name: "Health & Wellness", slug: "health-wellness", icon: "HeartPulse" },
  { name: "Education", slug: "education", icon: "GraduationCap" },
] as const;

export const CITIES = [
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Kolkata",
  "Goa",
  "Online",
] as const;

/** How long a seat hold lasts before it is released (minutes). */
export const HOLD_TTL_MINUTES = 10;

export const DEFAULT_PAGE_SIZE = 12;

export const SORT_OPTIONS = [
  { value: "date_asc", label: "Date · soonest" },
  { value: "date_desc", label: "Date · latest" },
  { value: "price_asc", label: "Price · low to high" },
  { value: "price_desc", label: "Price · high to low" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];
