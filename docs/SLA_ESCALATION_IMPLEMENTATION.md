# Category configuration & SLA — Implementation Guide

Full category configuration (audience, notifications, handling team, business hours, SLA, escalation) is **versioned per category** inside the Categories module. SLA is one section of the published snapshot — not a separate standalone page or storage layer.

**Source files:**

| Area | Path |
|------|------|
| Category form & detail | `src/views/CategoriesView.tsx` |
| Version bar (publish / history) | `src/components/categories/CategoryVersionBar.tsx` |
| SLA panel (controlled) | `src/components/categories/CategorySlaEscalationPanel.tsx` |
| Versioned config data | `src/data/categoryConfig.ts` |
| Category shell types | `src/data/categoryTypes.ts` |
| Shared SLA styles | `src/views/SlaEscalationView.css` |

---

## Overview

Each category has:

- **Shell record** (`HelpdeskCategory`) — id, company, name, description, team, ticket counts, status (synced from published snapshot for display)
- **Versioned config** (`CategoryConfigSnapshot`) — audience, notifications, business hours, reopen rules, priority permissions, SLA & escalation
- **Draft → publish workflow** — open tickets keep the version they were created under until closed

Storage key: `sixtifi-helpdesk-category-config-by-id` → `Record<categoryId, CategoryVersionState>`

Legacy SLA-only storage (`sixtifi-helpdesk-category-sla-by-id`) is migrated on first load when present.

---

## Key Types

```typescript
interface CategoryConfigSnapshot {
  name: string;
  description: string;
  assignedTeam: string;
  audience: CategoryAudienceConfig;
  businessHours: CategoryBusinessHoursMode;
  allowEmployeeReopen: boolean;
  priorityChangeBy: { assignee: boolean; employee: boolean };
  notifications: CategoryNotificationRules;
  sla: CategorySlaSettings;
}

interface CategoryVersionState {
  categoryId: string;
  companyId: string;
  activeVersionId: string;
  draft: CategoryConfigSnapshot;
  versions: CategoryVersion[];
  configChangeLog: CategoryConfigChange[];
}
```

---

## Data API (`categoryConfig.ts`)

| Function | Purpose |
|----------|---------|
| `getCategoryConfigState(categoryId, companyId?, people?)` | Load or seed state |
| `initCategoryConfigState(categoryId, companyId, people?)` | Create empty state for new category |
| `saveCategoryDraft(categoryId, draft)` | Auto-save working draft |
| `publishCategoryVersion(categoryId, actor, note?)` | Publish new active version |
| `getActiveCategoryVersion(categoryId)` | Active published version |
| `getSlaSummaryLabel(sla)` | Display label for SLA summary |
| `shellFieldsFromSnapshot(snapshot)` | Map snapshot → list/detail shell fields |
| `snapshotsEqual(a, b)` | Compare drafts vs published |

Event: `sixtifi-category-config-updated`

---

## User Flows

### Configure category (create/edit)

1. Open **Categories → Add/Edit**
2. Edit audience, notifications, team, SLA, etc. — draft auto-saves
3. Click **Save draft** to update the category shell in the list
4. Click **Publish version** when ready — new tickets use the published config

### View published config

1. Open **Categories → [category] → Overview / SLA / Notifications**
2. Values read from `getActiveCategoryVersion(id)?.snapshot` (or draft if never published)

### On hold

The on-hold flow has been removed. Agents cannot pause SLA clocks via an on-hold status on categories.

---

## SLA panel behaviour

`CategorySlaEscalationPanel` is a **controlled** component:

- Props: `sla`, `onChange`, `companyId`, `onShowToast`
- No internal versioning — parent form owns draft + publish via `CategoryVersionBar`
