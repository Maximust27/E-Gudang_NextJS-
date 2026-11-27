# E-Gudang — Master Data Management (Phase 5A)

Scope: implement the existing PRD sections 4.2 and 4.7 in two reviewable steps. Phase 5A covers live master-data pages and safe writes. Phase 5B remains Excel import (template, preview, row validation, duplicate handling) and barcode label printing. No feature is declared complete until its acceptance test passes.

## Features

- Data Barang: server-side search by name, SKU or barcode; category, effective method and status filters; sort and 20-row pagination. TanStack Table v9 renders the current page only. Admin can create/edit, Operator can view and open detail. Codes are strings; leading zero is preserved.
- Detail: master info, physical and eligible carton totals, paginated batch list with location/expiry/status, and latest 20 ledger movements. Later reports provide full history.
- Pengaturan: Kategori, Supplier, Lokasi Rak, Pengguna, Umum, Audit Log. Each uses the existing layout/token system. RHF manages dialogs, shared Zod schema validates client and server; no public registration.
- User changes preserve history. Password reset uses bcrypt cost from AUTH.md; password is optional on edit; confirmation in the client. Reset/status/role/email changes increment session version. Admin cannot deactivate or demote their own account. Passwords and hashes never enter list DTOs or audit metadata.
- Thresholds near expiry / dead stock remain positive integers. General form uses the existing seed values, version checks and upserts.

## Server contract

Every page calls requirePermission before querying. Server action validates input, checks role and invokes the domain service; the service locks actor and target users in ascending ID order and re-checks active Admin role. All writes and audit entries share a Prisma interactive transaction. Unique constraints remain the final authority. Version from updatedAt rejects stale edits. No hard delete UI or stock mutation exists.

Category locks precede product locks; category changes lock affected products by ascending ID. Product edits take the target category and product lock before inspecting batches. For future stock posting, master references (supplier/location/category) must be locked/validated before product locks, followed by lot locks and reread. Location deactivation is refused when any physical stock remains there. SKU deactivation is refused when any batch has positive physical balance, including blocked/expired stock. Category deactivation is refused when any active SKU remains. Supplier can be nonactive without deleting references.

FEFO category cannot be overridden to FIFO; FIFO category can be overridden to FEFO. Any historical batch with expiry (even zero balance) requires FEFO, and FEFO requires expiry on all historical lots. This conservative rule protects reversals; reconcile metadata through a later audited stock workflow, never direct DB edits. Eligible quantity is positive, unblocked, active product/location, FIFO without expiry or FEFO with expiry strictly after the Jakarta business day. These are read summaries only; posting must revalidate under locks in Phase 6.

Audit log contains actor, UTC timestamp (shown WIB), action, entity ID and allowlisted change metadata. No password, token or hash. List queries use bounded pagination and literal LIKE search. DB collation controls case/accents. Product stock uses grouped DB aggregation for the current page rather than loading all lots. No schema migration or dependency changes.

## UI refinement

- List filter dropdowns reuse the existing Radix/shadcn Select with padded chevron, themed options, selected checkmark and keyboard navigation. GET form submission and server-side filter semantics are unchanged; the category sentinel `all` means no filter.
- Action columns use content-width sizing with the heading and row buttons centered together. Numeric stock alignment is unchanged. Verify both themes, dropdown keyboard navigation, Apply/Reset and narrow-screen wrapping in the local browser.

## QA

- Run npm run check (Prisma, typecheck, lint, unit tests, build).
- CI runs npm run master:smoke in its isolated _test DB after migration, seed and previous DB smoke. Covers service authorization, uniqueness, stale edit, physical stock deactivation/method rules, eligibility, reset/session version, settings and atomic audit. Never run it against the operational DB. Existing auth HTTP smoke also checks Admin and Operator access to master pages in dev and production.
- Manual review in the local e_gudang development database: seed if reference data missing, create a category, supplier and rack; create/edit a SKU with leading zero barcode; verify search/filter/sort, detail shows zero stock, duplicate error, status, audit. Test Admin/Operator permissions, password reset with a disposable operator, sign-in with changed password, and no self-deactivation. Verify both themes, responsive layout, keyboard, accessibility and error states. Avoid real warehouse data during QA.
- Pending: visual/browser QA, production deployment, full inventory engine, Excel import, label printing and end-to-end concurrency of stock posting. Do not claim these are complete.

Use the existing seven main routes. No new operational menu.
