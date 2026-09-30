# Supabase SQL — run separately, in order

`schema.sql` (repo root of this folder's parent) is the full script.
The `tables/` files below are the **same statements split per table** —
run each one alone in Supabase → SQL Editor → New query → Run.

## Run order (names sort correctly)

| # | File | What it creates | Needs first |
|---|---|---|---|
| 0 | `00_helpers.sql` | `updated_at` trigger function | — |
| 1 | `01_staff.sql` | `staff` table | 00 |
| 2 | `02_customers.sql` | `customers` table | 00 |
| 3 | `03_vehicles.sql` | `vehicles` table | 00, 02 |
| 4 | `04_complaints.sql` | `complaints` table (+ upgrades old installs) | 00, 01, 02, 03 |
| 5 | `05_spare_parts.sql` | `spare_parts` table | 00 |
| 6 | `06_spare_orders.sql` | `spare_orders` table | 00, 02 |
| 7 | `07_announcements.sql` | `announcements` table | 00, 01 |
| 8 | `08_password_resets.sql` | `password_resets` table | 00, 01, 02 |
| 9 | `09_demo_seed.sql` | demo staff + customer + vehicle | 01, 02, 03 |

Every file is idempotent — safe to re-run if one fails halfway.
Just need logins working? Run **00 → 01 → 02 → 09** and stop.
