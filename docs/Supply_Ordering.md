# Supply Ordering — Functional Specification

## Purpose

A supply ordering capability lets field workers browse a product catalogue, build a cart, and submit order requests for back-office fulfilment. It is not self-checkout: requests are reviewed, payment is handled offline, and staff update order status through fulfilment.

The catalogue is synchronised from an external store at [cleanersgallery.com.au](https://cleanersgallery.com.au). That store is the source of truth for product listings, variants, and pricing.

## User Roles

| Role | Who they are | Access to supply ordering |
| --- | --- | --- |
| Cleaner | Approved field worker using the worker portal | Browse catalogue, manage cart, submit requests, and view own order history |
| Supply manager | Staff responsible for catalogue and fulfilment | Full catalogue management and all order requests in a supply-focused admin view |
| Administrator | Platform admin | Same supply capabilities as a supply manager, within the broader admin area |
| Manager | Operations staff for bookings and jobs | No access to supply ordering |
| Customer | End customer | No access |

The two primary audiences for this specification are **Cleaner** and **Supply manager**. The Administrator shares the Supply manager's supply views and permissions.

## Role-Based Views

### Cleaner View (Worker Portal)

| Screen | What they see | What they can do |
| --- | --- | --- |
| Supplies home | Their own order requests, newest first | Open any request; start a new order |
| Product catalogue | Active products only, grouped by category | Search; filter by category; open product detail |
| Product detail | Image, name, variant, category, description, price, and link to external store | Add to cart |
| Cart | Line items, quantities, line totals, and estimated total | Change quantities; remove items; submit request |
| Order detail | Order number, status, items with locked prices, and status history | View only; cannot edit status or notes |

Cleaners cannot:

- See inactive products
- See other workers' orders
- Edit catalogue data
- Pay in-app
- Change an order's status

### Supply Manager View (Admin Area — Supply Scope)

Supply managers land in a supply-only admin experience containing order requests, the product catalogue, and account settings. They do not see bookings, customers, payouts, or other platform admin areas.

| Screen | What they see | What they can do |
| --- | --- | --- |
| Order requests list | All workers' requests | Search, filter, and sort; open any request |
| Order detail | Worker name, email, phone, items, totals, status, history, and internal notes | Update status; add notes |
| Product catalogue list | Active and inactive products | Search, filter (including by active state), and sort |
| Product create/edit | Full product fields, including active flag | Create, edit, activate, and deactivate |
| Catalogue import history | Record of catalogue refreshes via audit | View import outcomes |

### Administrator View (Admin Area — Includes Supply)

Administrators see the same supply screens as Supply managers—order requests and the product catalogue—plus the rest of platform admin. For supply ordering behaviour, treat Administrator and Supply manager as equivalent unless a test explicitly needs broader admin context.

## External Catalogue (Cleaners Gallery)

Products are pulled from [cleanersgallery.com.au](https://cleanersgallery.com.au).

| Aspect | Behaviour |
| --- | --- |
| Scope | Full product catalogue from the store |
| Variants | Each variant is a separate catalogue line |
| Fields synced | Name, variant, category, description, image, price (AUD), SKU/reference, unit size, product page URL, and active state |
| Refresh | New items are added; existing items are updated; items missing from the latest pull are marked inactive rather than deleted |
| Order integrity | Submitted orders keep snapshots of the name, variant, and price at submission time |
| Price history | Catalogue price changes are recorded over time |

Staff may also create or edit products manually in the admin catalogue.

## Order Request Flow

```text
Cleaner browses catalogue → Adds items to cart → Submits request
                                                     ↓
                                          Team notified by email
                                                     ↓
                              Supply manager or Administrator updates status
                                                     ↓
                      Delivered / Collected, Cancelled, or Issue / On hold
```

When a Cleaner submits a request:

- A unique order number is assigned, for example `OR-00001`.
- The status is set to **Submitted**.
- Line items and the total are frozen at current catalogue prices.
- A confirmation explains that the operations team will make contact to confirm the order and take payment.
- Payment is handled outside the app by staff.

## Order Statuses

| Status | Typical meaning |
| --- | --- |
| Submitted | Request received; awaiting staff action |
| Contacted | Staff have reached the worker |
| Awaiting payment | Order confirmed; waiting for payment |
| Paid | Payment received |
| Ordered from supplier | Items ordered from the external store |
| Ready for collection | Ready for pickup |
| Delivered / collected | Complete |
| Cancelled | Request cancelled |
| Issue / on hold | Problem or pause |

Staff may set any status. The typical progression follows the table from top to bottom, although **Cancelled** and **Issue / on hold** are alternate outcomes.

## Business Rules

- Only active products appear to Cleaners and can be submitted.
- Disabled worker accounts cannot submit requests.
- Workers can see only their own orders.
- Products are deactivated, never deleted.
- Prices and totals are in AUD and use two decimal places.
- Duplicate product lines are not allowed in one submission.

## Feature Toggle

Supply ordering can be enabled or disabled globally. When disabled:

- Cleaners do not see **Supplies**.
- Staff do not see order or catalogue admin screens.

## Out of Scope

- In-app payment
- Automatic ordering at the external store
- Live inventory or stock counts
- Customer (non-worker) ordering
- Recurring or subscription orders

## Test Scenarios by Role

### Cleaner

| ID | Scenario | Expected result |
| --- | --- | --- |
| C-01 | Log in as a Cleaner with the feature enabled | Supplies appears in navigation |
| C-02 | Log in as a Cleaner with the feature disabled | Supplies is not shown |
| C-03 | Open the product catalogue | Only active products are listed; the Cleaner can search and filter by category |
| C-04 | Open product detail | Price, description, and image are shown; the link opens the product page on cleanersgallery.com.au |
| C-05 | Add products to the cart and submit | An order is created with status **Submitted**; a confirmation message is shown |
| C-06 | Submit a cart containing an inactive product | Submission is rejected; the user must remove invalid items |
| C-07 | View the order list | Only the Cleaner's own orders are visible |
| C-08 | Open order detail | Items show snapshot prices and status history; the Cleaner cannot edit status |
| C-09 | Log in as a disabled Cleaner | The Cleaner cannot submit new requests |
| C-10 | Navigate through the catalogue after adding items to the cart | Quantities are retained until submission or the cart is cleared |

### Supply Manager

| ID | Scenario | Expected result |
| --- | --- | --- |
| SM-01 | Log in as a Supply manager with the feature enabled | **Order requests** and **Product catalogue** appear in admin navigation |
| SM-02 | Log in as a Supply manager | Bookings, customers, jobs, payouts, and audit logs are not shown |
| SM-03 | Open the order requests list | All workers' requests are shown; filters and search work |
| SM-04 | Open order detail | Worker contact details and line items are shown |
| SM-05 | Update order status with a note | The status and note are saved and appear in order history |
| SM-06 | A Cleaner submits a new order | An email notification containing the order summary is received |
| SM-07 | Open the admin product catalogue | Active and inactive products are shown |
| SM-08 | Create a product manually | The product appears in the catalogue; an audit entry is recorded |
| SM-09 | Edit a product, such as its price or active state | Changes are saved; an audit entry is recorded |
| SM-10 | Deactivate a product | The product is hidden from the Cleaner catalogue but remains visible to Supply managers |
| SM-11 | A catalogue refresh removes a product | The product is marked inactive; past orders remain unchanged |

### Administrator

| ID | Scenario | Expected result |
| --- | --- | --- |
| A-01 | Log in as an Administrator with the feature enabled | The same supply screens as a Supply manager are shown: **Order requests** and **Product catalogue** |
| A-02 | Perform SM-03 through SM-11 as an Administrator | Outcomes are the same as for a Supply manager |
| A-03 | Access non-supply admin areas | Access is allowed, unlike for a Supply manager |

### Manager (Negative Access)

| ID | Scenario | Expected result |
| --- | --- | --- |
| M-01 | Log in as a Manager with the feature enabled | No order requests or product catalogue appear in navigation |
| M-02 | Navigate directly to supply admin URLs | Access is denied or the Manager is redirected |

### Customer (Negative Access)

| ID | Scenario | Expected result |
| --- | --- | --- |
| U-01 | Log in as a Customer | Supply ordering does not appear in navigation |

### Catalogue Sync (Cross-Role)

| ID | Scenario | Expected result |
| --- | --- | --- |
| S-01 | Pull the catalogue from cleanersgallery.com.au | Products and variants are imported with the correct fields |
| S-02 | A product price changes on the external store, then the catalogue is refreshed | The catalogue price is updated; existing orders keep their old prices |
| S-03 | A product is removed from the external store, then the catalogue is refreshed | The product becomes inactive for Cleaners but remains in admin and order history |
| S-04 | A product returns to the external store, then the catalogue is refreshed | The product is updated and reactivated according to store data |

## View Matrix

| Capability | Cleaner | Supply manager | Administrator | Manager |
| --- | :---: | :---: | :---: | :---: |
| Browse active catalogue | ✓ | ✓ | ✓ | — |
| See inactive products | — | ✓ | ✓ | — |
| Submit order request | ✓ | — | — | — |
| View own orders | ✓ | — | — | — |
| View all orders | — | ✓ | ✓ | — |
| Update order status | — | ✓ | ✓ | — |
| Manage catalogue | — | ✓ | ✓ | — |
| Receive new-order email | — | ✓[^1] | ✓[^1] | — |
| Full platform admin | — | — | ✓ | Partial[^2] |

[^1]: Email is sent through the configured team inbox; it is not a role-specific in-app notification.
[^2]: Managers have booking operations admin access, but no supply access.
