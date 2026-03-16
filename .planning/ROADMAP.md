# Roadmap: spec-search v1.1

## Overview

**Milestone:** v1.1 — Mobile UX + System Comparison
**Phases:** 6
**Requirements:** 15 (RESP-01..06, COMP-01..06, SAFE-01..03)

## Phases

### Phase 1: Responsive CSS Foundation
**Goal:** Make existing UI usable on mobile with pure CSS changes.
**Requirements:** RESP-01, RESP-02, RESP-03
**Success Criteria:**
1. Filter bar stacks vertically on viewports < 768px
2. All buttons and inputs have 44px touch targets on mobile
3. App padding and header adapt to mobile viewports

### Phase 2: Mobile Card Layout
**Goal:** Show results as cards on mobile instead of horizontal-scroll table.
**Requirements:** RESP-04, RESP-05
**Success Criteria:**
1. Results render as cards on viewports < 768px
2. Sort dropdown available on mobile replaces table header clicks
3. Desktop table layout unchanged

### Phase 3: Collapsible Filters on Mobile
**Goal:** Collapse filter bar behind a toggle on mobile to save screen space.
**Requirements:** RESP-06
**Success Criteria:**
1. Filters collapsed by default on mobile
2. Toggle button shows active filter count
3. Smooth expand/collapse animation

### Phase 4: Comparison Selection
**Goal:** Let users select 2 same-benchmark systems for comparison.
**Requirements:** COMP-01, COMP-02, COMP-03
**Success Criteria:**
1. Checkbox column in table, tap-to-select in cards
2. Only same-benchmark selections allowed
3. Floating tray shows selected systems with Compare button

### Phase 5: Comparison View
**Goal:** Display side-by-side comparison with highlighted differences.
**Requirements:** COMP-04, COMP-05, COMP-06
**Success Criteria:**
1. Desktop: 3-column grid (label, system A, system B)
2. Numeric deltas shown with color coding (green = higher)
3. URL param ?compare=id1,id2 enables shareable links

### Phase 6: Polish and Verification
**Goal:** Ensure backward compatibility, accessibility, and test coverage.
**Requirements:** SAFE-01, SAFE-02, SAFE-03
**Success Criteria:**
1. make ci passes (all existing + new tests)
2. processors/*.json output unchanged
3. New components have test coverage

---
*Roadmap created: 2026-03-16*
