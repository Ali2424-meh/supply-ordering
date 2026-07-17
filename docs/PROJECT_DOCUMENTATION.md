# SupplyHub — Simple Project Guide

## 1. What is SupplyHub?

SupplyHub is a supply-request website for cleaners and operations staff.

- Cleaners browse supplies, choose product variations, manage a cart, and send
  an order request.
- Supply managers and administrators review every request, update its status,
  and manage the product catalogue.
- Payment is arranged outside the website.
- Products come from [Cleaners Gallery](https://cleanersgallery.com.au).

**Live website:** [supply-ordering-jade.vercel.app](https://supply-ordering-jade.vercel.app)

## 2. Demo accounts

### Passwords

- **Local development password:** `password123`
- **Live website password:** the shared production password provided privately
  by the project owner

The live password is intentionally not written in this public repository. This
protects the administrator and supply-manager accounts.

### All accounts

| Email | Name | Role | Main access |
| --- | --- | --- | --- |
| `cleaner@example.com` | Cara Cleaner | Cleaner | Catalogue, cart, and own orders |
| `cleaner2@example.com` | Wendy Worker | Cleaner | Second cleaner account for privacy testing |
| `disabled@example.com` | Drew Disabled | Disabled cleaner | Sign-in and ordering are blocked |
| `supply@example.com` | Sam Supply | Supply manager | All supply orders and catalogue management |
| `admin@example.com` | Ada Admin | Administrator | Supply tools, settings, and wider admin navigation |
| `manager@example.com` | Mia Manager | Manager | No supply-ordering access |
| `customer@example.com` | Casey Customer | Customer | No supply-ordering access |

## 3. What is inside each page?

### Public page

#### Sign in — `/login`

Who can use it: everyone.

What is on the page:

- SupplyHub introduction and animated workflow preview
- Email and password fields
- Sign-in button
- Clear invalid-login message
- Responsive phone, tablet, and desktop presentation

After signing in, each account is sent to the correct page for its role.

## 4. Cleaner pages

### Supplies home — `/supplies`

What is on the page:

- Personal greeting
- Animated main banner and **Browse catalogue** button
- Number of orders, cart items, and available products
- Resume-cart message when the cart is not empty
- Popular product categories
- Cleaner’s own orders, newest first
- **Reorder** action for previous orders
- Three-step explanation of the request process

Important rule: a cleaner sees only their own orders.

### Product catalogue — `/supplies/catalogue`

What is on the page:

- Active products only
- Search by product, variant, or SKU
- Category filter
- Products grouped by category
- Product image, name, selected variation, price, and quantity control
- Quick **Add** button
- Pagination for the large live catalogue

Products with several sizes are displayed as one product with a variation
picker. Each variation is still stored as its own catalogue record.

### Product detail — `/supplies/catalogue/[id]`

What is on the page:

- Large product image
- Product name and variation
- Variation picker when alternatives exist
- Category, description, SKU, unit size, and AUD price
- Link to the product on Cleaners Gallery
- Quantity control and **Add to cart** button
- Related products

### Cart — `/supplies/cart`

What is on the page:

- Product image, name, variation, and unit price
- Quantity decrease/increase controls
- Remove button
- Line totals and estimated total
- **Submit request** button
- Reminder that payment is not taken through the website
- Sticky mobile total and submit bar

Submitting creates one order, clears the cart, and freezes the product names,
variations, quantities, and prices.

### Submission confirmation — `/supplies/cart/submitted`

What is on the page:

- Successful-request message
- New order number, such as `OR-00001`
- Explanation that operations will contact the cleaner and arrange payment
- Links back to supplies and order details

### Cleaner order detail — `/supplies/orders/[orderNumber]`

What is on the page:

- Order number, date, status, and total
- Frozen order items and prices
- Public status history
- **Reorder** option

The cleaner cannot change the status and cannot see staff-only notes.

## 5. Supply manager and administrator pages

### Order requests — `/admin/orders`

What is on the page:

- Total number of worker requests
- Status summary and status counts
- Search by order number, worker, or email
- Status filter and newest/oldest sorting
- Order number, worker, status, date, and total
- Pagination

Phone view uses a simple divided list. Tablet uses a compact table. Desktop
shows the complete table and status summary without a horizontal scrollbar.

### Admin order detail — `/admin/orders/[orderNumber]`

What is on the page:

- Order number, date, total, and current status
- Cleaner name, email, and phone
- Frozen order items and prices
- Complete status history
- Status update controls
- Optional internal note field

Internal notes are visible to supply managers and administrators only.

### Product catalogue management — `/admin/catalogue`

What is on the page:

- Active and inactive products
- Search, category, source, and active-state filters
- Sorting controls
- Product name, variation, price, source, and status
- **Create product** button
- **Refresh catalogue** action
- Links to edit products and view import history

### Create product — `/admin/catalogue/new`

What is on the page:

- Product name and variation
- Category and description
- Price, SKU, and unit size
- Product and image URLs
- Active/inactive setting
- Validation messages and save action

Creating a product also creates an audit record and its initial price history.

### Edit product — `/admin/catalogue/[id]/edit`

What is on the page:

- Existing product information
- Editable product fields
- Activate/deactivate setting
- Save and cancel actions

Important changes create audit records. Price changes add price-history records.

### Import history — `/admin/imports`

What is on the page:

- Date and result of every catalogue refresh
- Running, successful, or failed status
- Number of products added, updated, and deactivated
- Short failure message when an import fails

### Account settings — `/admin/account`

Who can use it: supply managers and administrators.

What is on the page:

- Editable name and phone number
- Read-only login email
- Save confirmation or validation error

### Supply settings — `/admin/settings`

Who can use it: administrators only.

What is on the page:

- Current supply-ordering state
- Global enable/disable control
- Explanation of what the setting changes

When disabled, supply links disappear and protected supply actions are rejected.

### Wider administrator pages

Administrators also see these platform pages:

- `/admin/bookings`
- `/admin/customers`
- `/admin/payouts`

They are polished placeholders because bookings, customer management, and
payouts are outside the Supply Ordering requirements.

## 6. Manager and customer page

### Role landing — `/`

Who sees it: Manager and Customer accounts.

What is on the page:

- Account-role explanation
- Clear message that supply ordering is unavailable for the role
- Sign-out option

Entering a supply URL directly does not give these roles access.

## 7. Main required features

- Secure sign-in and role-based page protection
- Cleaner-only active catalogue
- Live product search and category filtering
- Product details and external supplier link
- Variation selection
- Cart quantity controls and removal
- Unique order numbers
- Frozen order prices and product snapshots
- Cleaner-only order privacy
- All-worker order management for authorised staff
- Nine fulfilment statuses
- Staff-only internal notes
- Manual product create/edit/activate/deactivate
- Catalogue refresh from Cleaners Gallery
- Product price history and audit history
- Missing product deactivation instead of deletion
- Global supply-ordering feature toggle
- New-order email notification
- Offline-payment confirmation
- Phone, tablet, and desktop layouts

## 8. Added features and improvements

These improvements go beyond the basic functional requirements.

| Added feature | Benefit |
| --- | --- |
| Animated sign-in showcase | Creates a stronger first impression for demonstrations |
| Animated cleaner dashboard | Draws attention to the catalogue and ordering flow |
| Scroll progress and section reveals | Makes long pages feel more polished |
| Reduced-motion support | Keeps animations accessible |
| Product variation grouping | Prevents repeated cards for different sizes of one product |
| Quick add from catalogue | Reduces the steps needed to build a cart |
| Cart flight animation | Gives visual feedback after adding an item |
| Remove with Undo | Helps recover from accidental cart removal |
| Reorder previous request | Quickly adds available historical items back to the cart |
| Popular-category shortcuts | Makes a large catalogue easier to browse |
| Responsive admin layouts | Gives phone, tablet, and desktop their own usable arrangement |
| Mobile admin dialog menu | Replaces an overflowing horizontal navigation bar |
| Tablet icon rail | Preserves working space on medium screens |
| Status summary dashboard | Shows fulfilment workload at a glance |
| Account profile editing | Lets authorised staff maintain contact information |
| Pagination and limited queries | Keeps thousands of catalogue records fast |
| Bulk catalogue import | Imports thousands of products efficiently into Neon |
| Image fallback handling | Prevents broken product-image layouts |
| Toast notifications | Gives clear success, error, and Undo feedback |
| Concurrency protection | Prevents duplicate submissions and lost cart updates |
| Professional empty states | Avoids unfinished-looking blank areas |

## 9. Order statuses

1. Submitted
2. Contacted
3. Awaiting payment
4. Paid
5. Ordered from supplier
6. Ready for collection
7. Delivered / collected
8. Cancelled
9. Issue / on hold

## 10. Catalogue behaviour

- The live catalogue contains more than 4,000 product variations.
- New products are added during refresh.
- Existing products are updated only when their details change.
- Price changes are recorded.
- Missing products become inactive instead of being deleted.
- Returning products can be reactivated.
- Manual products are not removed by catalogue refresh.
- A failed refresh rolls back safely instead of leaving partial data.

## 11. Email note

New order requests use Resend for email notification. While using Resend’s
onboarding sender, messages can be delivered only to the email address belonging
to the Resend account. Sending to a general operations inbox requires a verified
domain and a sender address on that domain.

## 12. Suggested demonstration

1. Sign in as `cleaner@example.com`.
2. Show the animated Supplies home page.
3. Search the catalogue and select a product variation.
4. Add the item to the cart and submit a request.
5. Open the new order and show its frozen price and status.
6. Sign in as `supply@example.com`.
7. Find the submitted request and update its status with a note.
8. Show catalogue management and import history.
9. Sign in as `admin@example.com` and show Settings.
10. Sign in as Manager or Customer to demonstrate restricted supply access.

## 13. Technology used

- Next.js 16 and React 19
- TypeScript
- Tailwind CSS 4
- Motion for React
- Auth.js
- Prisma 6
- PostgreSQL and Neon
- Resend and React Email
- Vitest and Playwright
- Vercel

## 14. Quality checks

- ESLint passes
- TypeScript checking passes
- 24 unit tests pass
- 44 database integration tests pass
- 23 browser scenarios pass
- Optimised production build passes
- Phone, tablet, and desktop layouts have automated overflow checks
