// Central place for store-wide settings that are not secrets.
// Change values here instead of hunting through the code.

export const STORE_NAME = "PrimeLane";

// Currency used for display. Prices in Firestore are plain numbers in this currency.
export const CURRENCY = "NGN";
export const LOCALE = "en-NG";

// Default delivery fee, used until an admin saves store settings (Admin → Settings).
export const DEFAULT_DELIVERY_FEE = 2500;

// A product with this many units or fewer counts as "low stock".
export const LOW_STOCK_THRESHOLD = 5;

// Cart / order limits. MAX_CART_LINES must match `maxOrderLines()` in firestore.rules.
export const MAX_CART_LINES = 8;
export const MAX_QTY_PER_LINE = 20;

// Shop page size.
export const PRODUCTS_PER_PAGE = 12;

// Image uploads through Firebase Storage need the Blaze (pay-as-you-go) plan.
// Leave this false to add product images by URL. Set it to true after enabling
// Storage in the Firebase console and deploying storage.rules.
export const ENABLE_IMAGE_UPLOADS = false;

// Order lifecycle. The order of this array is the tracking timeline.
export const ORDER_FLOW = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];
export const ORDER_END_STATES = ["cancelled", "failed"];
export const ORDER_STATUSES = [...ORDER_FLOW, ...ORDER_END_STATES];

export const STATUS_META = {
  placed: { label: "Order placed", short: "Placed", tone: "blue" },
  confirmed: { label: "Order confirmed", short: "Confirmed", tone: "indigo" },
  processing: { label: "Processing", short: "Processing", tone: "amber" },
  shipped: { label: "Shipped", short: "Shipped", tone: "purple" },
  out_for_delivery: { label: "Out for delivery", short: "Out for delivery", tone: "purple" },
  delivered: { label: "Delivered", short: "Delivered", tone: "green" },
  cancelled: { label: "Cancelled", short: "Cancelled", tone: "gray" },
  failed: { label: "Failed", short: "Failed", tone: "red" },
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];
