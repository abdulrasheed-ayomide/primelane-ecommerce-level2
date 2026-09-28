# PrimeLane: E-Commerce Store

A responsive e-commerce web app built with **vanilla JavaScript (ES modules)**, **Tailwind CSS v4** and **Firebase** (Authentication + Cloud Firestore).
Customers can browse, search and filter products, manage a cart, check out and track their orders. Admins get a dashboard to manage products, stock, orders, customers and store settings.

> Level 2 project. The original version was upgraded in place: same stack, same pages, with the missing features, security and responsive design added.

## Features

**Customers**
- Home page with categories, featured products, the biggest current deal and top-rated products (all computed from the catalog)
- Shop: debounced search, category / price / availability / on-sale filters, sorting, pagination, loading skeletons, empty and error states; filters are kept in the URL
- Product detail page with stock status, quantity selector, features and related products; quick-view dialog on product cards
- Cart saved in the browser (works for guests), quantity limits based on stock, prices re-checked against the database
- Checkout with validation (name, email, phone, address, city, state, country), delivery fee and order summary
- Account area: profile and saved address, order history, order detail with a tracking timeline
- Email/password sign up, log in, password reset, dark mode, contact form

**Admins** (`/pages/admin.html`)
- Overview: total sales, orders, pending and completed orders, products, customers, low stock, average order, a 14-day sales chart, orders by status
- Products: search, filter by category or stock, add / edit / delete with validation, inline stock editing, one-click import of the starter catalog
- Orders: search, filter by status, full order detail, status updates with an optional note (customers see them on their order page); cancelling an order puts its items back in stock
- Customers: order count and total spent, order history, suspend or reactivate accounts
- Messages from the contact form; delivery-fee settings
- Fully usable on phones: off-canvas sidebar, cards instead of tables, full-screen sheets

## Tech stack

| Area | Choice |
|---|---|
| UI | HTML + vanilla JS modules (no framework, no bundler) |
| Styling | Tailwind CSS v4 via the Tailwind CLI (`src/styles.css` → `css/styles.css`) |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore, protected by `firestore.rules` |
| Hosting | Vercel (current) or Firebase Hosting |

## Project structure

```
index.html                 Home page
404.html                   Not-found page
pages/
  shop.html  product.html  cartpage.html  checkout.html
  login.html signup.html   account.html   order.html   admin.html
js/
  firebase.js              Firebase setup; the only place the SDK is imported
  config.js                Store settings: currency, limits, order statuses
  utils.js  ui.js  toast.js           Formatting, escaping, dialogs, form validation, toasts
  auth.js  cart.js  header.js         Session + profile, cart state, shared header/footer/dark mode
  renderProducts.js  productModal.js  orderView.js   Shared UI components
  home.js shop.js productPage.js cartpage.js checkout.js login.js signup.js account.js order.js
  admin.js + admin/*.js    Admin shell and its sections
  services/                All Firestore reads and writes (products, orders, users, settings, messages, storage)
  data/products.seed.js    The original 100-product catalog, imported once from the admin dashboard
src/styles.css             Tailwind source (theme + reusable component classes)
css/styles.css             Built CSS (committed so the site works without a build step)
firestore.rules            Firestore security rules
storage.rules              Storage rules (paste into the console if image uploads are enabled)
tests/rules-check.html     Developer page that checks the LIVE security rules (Web SDK, not deployed)
```

## Data model (Firestore)

| Collection | Contents | Who can access |
|---|---|---|
| `users/{uid}` | `email, fullName, phone, address, city, state, country, role ("customer" \| "admin"), status ("active" \| "suspended"), createdAt` | the user themselves, and admins. Nobody can promote themselves to admin. |
| `products/{id}` | `title, price, originalPrice, category, subCategory, brand, description, image, stock, rating, reviews, badge, features[], colors[], featured` | everyone can read; admins write |
| `orders/{id}` | `userId, customer{fullName,email,phone}, shipping{address,city,state,country}, items[{productId,title,image,price,quantity,lineTotal}], subtotal, shippingFee, total, currency, status, statusHistory[{status,at,by,note}], createdAt, updatedAt` | the customer who placed it, and admins. Only admins change the status. |
| `settings/store` | `deliveryFee, freeDeliveryThreshold` | everyone reads; admins write |
| `messages/{id}` | contact form: `name, email, subject, message, read, createdAt` | anyone can create; admins read and manage |

Orders save a **copy of each product's name, image and price at the time of purchase**, so later price changes never alter past orders.

### How checkout stays secure without a server
The order and the stock update are written in **one Firestore transaction**. `firestore.rules` then checks, on Google's servers:
- each line's price and name match the product document
- line totals, subtotal, delivery fee (from `settings/store`) and total add up
- each product's stock went down by exactly the ordered quantity, in the same transaction
- the order belongs to the signed-in user, whose account isn't suspended

Editing prices in the browser, skipping the stock update or ordering on someone else's behalf is rejected. An order can have up to 8 different products (`MAX_CART_LINES`), which keeps the rules within Firestore's limit on document lookups.

## Setup (Firebase console only, no command-line tools)

The website talks to Firebase only through the **Firebase Web SDK** (`js/firebase.js`). Nothing below needs the Firebase CLI.

### 1. Authentication
1. **Authentication → Sign-in method:** enable **Email/Password**.
2. **Authentication → Settings → Authorized domains:** make sure every address you open the site on is listed, e.g. `localhost`, `127.0.0.1` and your Vercel domain. The "email verified" and "reset password" emails link back to these.
3. *(Optional)* **Authentication → Templates:** adjust the wording and sender name of the verification and password-reset emails.
4. *(Optional)* **Authentication → Settings → Password policy:** enforce the same rule the sign-up form uses (8+ characters with letters and numbers) on Firebase's side too.

### 2. Firestore security rules
Rules live on Firebase's servers. The Web SDK cannot publish them, so publish them in the console:
1. Open **Firestore Database → Rules**.
2. Replace everything with the contents of `firestore.rules`.
3. Click **Publish**. The editor highlights any mistake before publishing.

Publish the rules **together with** the new code: the old code (which stored passwords and wrote incomplete orders) is blocked by them. If you ever enable Storage, publish `storage.rules` the same way under **Storage → Rules**.

**Check the rules are live:** run the rules checker (see [Testing the security rules](#testing-the-security-rules)). Quick check: open this URL in a private window:
`https://firestore.googleapis.com/v1/projects/e-commerce-website-proje-9af1a/databases/(default)/documents/categories/probe`
`PERMISSION_DENIED` (403) means the new rules are live. `NOT_FOUND` (404) means the old open rules are still active.

### 3. Make yourself an admin
1. Sign up on the site with your own email and **click the link in the verification email**. Unverified accounts cannot log in or use admin features.
2. Copy your **User UID** from **Authentication → Users**.
3. In **Firestore → users → (that UID)**, change `role` from `customer` to `admin`.
4. Log in again. "Admin dashboard" now appears in your account menu.

Roles can only be changed in the console, never from the website.

### 4. Stock the store
In **Admin → Products**, click **Import starter catalog** to load the 100 original products, then open **Admin → Settings** and **Save** the delivery fee. Checkout needs this settings document to exist.

## How sign-in works

- **Sign up:** name, email, password (8+ characters, letters and numbers) and a confirm-password field. Firebase creates the account and sends a **verification email**.
- **Unverified accounts** are treated as signed out everywhere on the site. Logging in with the right password shows "Please verify your email address before logging in" with **Resend verification email** (limited to one email a minute) and **I've verified my email** (reloads the account from Firebase).
- **Server-side:** there is no separate backend. Firestore checks the Firebase ID token on every request, and the rules require `email_verified == true` for placing orders, changing stock at checkout, and every admin action.
- **Forgot password:** uses Firebase's own reset email. The message is the same whether or not an account exists, so nobody can check which emails are registered.

## Run locally

```bash
npm install          # Tailwind CLI only
npm run dev          # rebuilds css/styles.css whenever you edit HTML/JS/CSS
```
Then serve the project folder: VS Code **Live Server** (port 5501 is already set in `.vscode/settings.json`), or `npm run serve`.
Open `http://127.0.0.1:5501`. Pages use absolute paths (`/js/...`), so serve from the project root.

`npm run build` makes the minified production CSS. Commit `css/styles.css` after changing styles.

## Testing the security rules

Open **`http://127.0.0.1:5501/tests/rules-check.html`** (with Live Server running) and click **Run checks**. It sends real requests to the live project with the Web SDK and shows PASS/FAIL for each permission:
- **Signed out:** can read products; cannot create, edit or delete products, read users, orders or messages, change settings, or create an admin profile.
- **Logged in as a verified customer:** cannot make themselves admin, list other users or all orders, or edit products; can read their own profile and orders.
- **Logged in as a verified admin:** can create, edit and delete a test product, and list orders, customers and messages; cannot delete orders.

The probes are harmless: blocked writes change nothing, and if a write that should be blocked goes through, the page undoes it and reports FAIL. The page isn't linked from the site and isn't deployed (see `.vercelignore`).

For extra checks, the console's **Firestore Database → Rules → Rules Playground** simulates any request.

## Deploy

**Vercel (current setup):** connect the GitHub repo to Vercel. `vercel.json` serves the folder as a plain static site with no install or build step on Vercel. The built `css/styles.css` is committed, so **run `npm run build` before you commit** style changes. Pushing to `main` redeploys.

Firestore rules are **not** deployed by Vercel. Publish them in the Firebase console (step 2 above).

## Configuration

`js/config.js` contains the currency (NGN), the default delivery fee, the low-stock threshold, cart limits, page size and the order statuses.
Firebase web config values in `js/firebase.js` are safe to publish: they identify the project, while the security rules protect the data.
No `.env` file is needed. **Never** commit service-account keys; `.gitignore` already excludes them.

### Optional: image uploads
Products use image URLs by default. Uploading to Firebase Storage is built in but disabled because Storage requires the Blaze plan. To enable it: upgrade the plan, enable Storage, publish `storage.rules` in **Storage → Rules**, and set `ENABLE_IMAGE_UPLOADS = true` in `js/config.js`.

## Known limitations
- No online payment: orders are recorded as "pay on delivery".
- Filtering and sorting happen in the browser, which is fine for hundreds of products. For thousands, move to Firestore queries with pagination (`limit` / `startAfter`).
- Product ratings come from the catalog data; customers can't write reviews yet.
- Without Cloud Functions there are no order-confirmation emails.
