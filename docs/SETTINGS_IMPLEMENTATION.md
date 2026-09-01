# Helpdesk Settings — Implementation Guide

This document describes the full **Settings** module from the Sixtifi Helpdesk project so you can replicate the same behavior, types, data shapes, and flows in another project.

**Source files in this repo:**

| Area | Path |
|------|------|
| Main view | `src/views/SettingsView.tsx` |
| Styles | `src/views/SettingsView.css` |
| General settings data | `src/data/generalSettings.ts` |
| SLA hours helpers | `src/data/slaHoursSettings.ts` |
| Quick replies data | `src/data/quickReplies.ts` |
| Closing reasons data | `src/data/closingReasons.ts` |
| Companies | `src/data/companies.ts` |
| Quick reply consumer | `src/components/helpdesk/QuickReplyPicker.tsx` |
| Closing reason consumer | `src/components/helpdesk/ClosingReasonFields.tsx` |
| App integration | `src/App.tsx` |

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Architecture & Data Flow](#2-architecture--data-flow)
3. [Component API](#3-component-api)
4. [Tabs & UI Structure](#4-tabs--ui-structure)
5. [TypeScript Types](#5-typescript-types)
6. [Data Layer & Storage](#6-data-layer--storage)
7. [API-Style Request/Response Shapes](#7-api-style-requestresponse-shapes)
8. [Events & Cross-Module Sync](#8-events--cross-module-sync)
9. [User Flows](#9-user-flows)
10. [Downstream Consumers](#10-downstream-consumers)
11. [Validation Rules](#11-validation-rules)
12. [Styling Reference](#12-styling-reference)
13. [Implementation Checklist for a New Project](#13-implementation-checklist-for-a-new-project)

---

## 1. High-Level Overview

The Settings page is a **multi-tab admin screen** scoped per company/workspace. It manages four areas:

| Tab | ID | Editable | Scope |
|-----|-----|----------|-------|
| General Settings | `general` | Yes (Save button) | Per company |
| Quick Replies | `quick-replies` | Yes (immediate save) | Global (not per company) |
| Closing Reasons | `closing-reasons` | Yes (immediate save) | Global |
| Role Permissions | `permissions` | Read-only matrix | Static preview |

**Key design decisions:**

- **General settings** are company-scoped and use a dirty-state pattern with an explicit **Save Settings** button.
- **Quick replies** and **closing reasons** save immediately on each CRUD action (no dirty tracking).
- **Permissions** tab is a static read-only matrix (no persistence).
- Storage in this demo uses **localStorage**; in production you would replace the data layer with REST/GraphQL APIs while keeping the same types and UI flows.

---

## 2. Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  companyId (state) ────────────────────────────────────────────► │
│  onShowToast (toast system)                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SettingsView.tsx                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ General Tab  │  │ Quick Replies │  │ Closing Reasons   │  │
│  │ (dirty save) │  │ (instant save)   │  │ (instant save)    │  │
│  └──────┬───────┘  └────────┬─────────┘  └─────────┬─────────┘  │
│         │                   │                      │             │
│         ▼                   ▼                      ▼             │
│  generalSettings.ts   quickReplies.ts   closingReasons.ts   │
│         │                   │                      │             │
│         ▼                   ▼                      ▼             │
│     localStorage          localStorage           localStorage    │
│         │                   │                      │             │
│         ▼                   ▼                      ▼             │
│  CustomEvent dispatch  CustomEvent dispatch  CustomEvent dispatch│
└─────────────────────────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  SlaEscalationView   QuickReplyPicker   ClosingReasonFields
  (SLA hours mode)    (ticket reply UI)      (resolve/close modals)
```

### State ownership

| State | Owner | Persisted |
|-------|-------|-----------|
| `activeTab` | SettingsView local state | No |
| General form fields | SettingsView local state | On Save → `saveGeneralSettings()` |
| `isDirty`, unsaved modal | SettingsView local state | No |
| `quickReplies` | SettingsView local state | On each CRUD → `saveQuickReplys()` |
| `closingReasons` | SettingsView local state | On each CRUD → `saveClosingReasons()` |
| `companyId` | Parent (`App.tsx`) | Parent responsibility |

---

## 3. Component API

### `SettingsViewProps`

```typescript
export interface SettingsViewProps {
  /** Currently selected company/workspace ID */
  companyId: string;

  /** Called when user switches company (after unsaved-changes check) */
  onCompanyChange: (companyId: string) => void;

  /** Toast notification callback */
  onShowToast: (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    desc?: string
  ) => void;
}
```

### Parent integration example

```typescript
// App.tsx
const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);

case 'settings':
  return (
    <SettingsView
      companyId={companyId}
      onCompanyChange={setCompanyId}
      onShowToast={addToast}
    />
  );
```

### Internal tab type

```typescript
type SettingsTab = 'general' | 'permissions' | 'quick-replies' | 'closing-reasons';
```

---

## 4. Tabs & UI Structure

### Page header

- **Breadcrumbs:** `Sixtifi WFM` → `Helpdesk` → `Settings`
- **Title:** `Helpdesk Settings`
- **Subtitle:** `General rules for {company.name}. Switch company to edit another workspace.`
- **Actions:**
  - Company `<SelectInput>` dropdown (`HELPDESK_COMPANIES`)
  - **Save Settings** button (saves General tab only)

### Tab bar

Uses shared `queue-tabs-bar` / `queue-tab-btn` classes (same pattern as other views).

| Tab | Icon (lucide-react) | Behavior |
|-----|---------------------|----------|
| General Settings | `Sliders` | Form with dirty tracking |
| Quick Replies | `MessageSquareQuote` | Table + modal CRUD |
| Closing Reasons | `Tag` | Table + modal CRUD |
| Role Permissions | `ShieldCheck` | Static table |

### Tab 1: General Settings

**Form fields (2-column grid):**

| Field | Type | Required | Options / Notes |
|-------|------|----------|-----------------|
| Ticket ID prefix | Text | Yes | e.g. `TKT-`, `NW-` |
| Auto-close resolved tickets after | Select | No | `3`, `7`, `14` days |
| Employees can reopen for | Select | No | `7`, `14`, `30` days |
| How SLA time is counted | Select | Yes | `24-hour`, `shift-hours` |
| How to auto-assign | Select | Conditional | Shown only when auto-assign is ON |
| Auto-assign agents when a ticket is created | Toggle | No | Shows/hides assignment algorithm |

**Assignment algorithm options:**

- `Round Robin (Load Balanced)` → UI label: "Evenly (round robin)"
- `Lowest Active Workload` → UI label: "Least busy agent"
- `Team Lead Preferred` → UI label: "Team lead"

**Info box:** Dynamic SLA description from `getSlaHoursModeDescription(slaHoursMode)`.

### Tab 2: Quick Replies

- Table columns: Title (with body preview), Category, Scope, Status, Actions
- **Add Template** opens modal
- Row actions: Edit, Delete
- Status pill is clickable → toggles Active/Inactive

**Modal fields:**

| Field | Type | Required |
|-------|------|----------|
| Template Title | Text | Yes |
| Category | Select | No |
| Reply Scope | Select | No |
| Status | Select | No |
| Message Body | Textarea | Yes |

**Placeholders supported in body:** `{{requester}}`, `{{ticketId}}`, `{{agent}}`

### Tab 3: Closing Reasons

- Table columns: Label (with description), Context, Comment, Status, Actions
- **Add Reason** opens modal
- Same CRUD pattern as quick replies

**Modal fields:**

| Field | Type | Required |
|-------|------|----------|
| Reason Label | Text | Yes |
| Description | Text | No |
| Context | Select | No |
| Comment Field | Select (`required` / `optional`) | No |
| Status | Select | No |

### Tab 4: Role Permissions (read-only)

Static matrix with roles as columns:

- Employee
- Support Agent
- Team Lead
- HR / Admin
- Super Admin

**Capabilities rows:**

| Capability | Employee | Agent | Lead | HR/Admin | Super Admin |
|------------|----------|-------|------|----------|-------------|
| Raise Request | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Own Requests | ✓ | ✓ | ✓ | ✓ | ✓ |
| View & Work Assigned Queue | — | ✓ | ✓ | ✓ | ✓ |
| Post Internal Agent Notes | — | ✓ | ✓ | ✓ | ✓ |
| Reassign Ticket / Change Priority | — | ✓ | ✓ | ✓ | ✓ |
| Manage Teams & Categories | — | — | — | ✓ | ✓ |
| Configure SLA & System Settings | — | — | — | — | ✓ |

---

## 5. TypeScript Types

### Company

```typescript
export interface HelpdeskCompany {
  id: string;        // e.g. 'co-acme'
  name: string;      // e.g. 'Acme Corp (HQ)'
  shortName: string; // e.g. 'Acme'
}
```

### General settings

```typescript
export type SlaHoursMode = '24-hour' | 'shift-hours' | 'custom-hours';

export interface CompanyGeneralSettings {
  ticketPrefix: string;
  autoCloseDays: string;       // stored as string: '3' | '7' | '14'
  allowReopenDays: string;   // stored as string: '7' | '14' | '30'
  slaHoursMode: SlaHoursMode;
  enableAutoAssignment: boolean;
  assignmentAlgorithm: string;
}
```

> **Note:** `custom-hours` exists in the type but is not exposed in the UI dropdown. Only `24-hour` and `shift-hours` are selectable.

### SLA hours options

```typescript
export const SLA_HOURS_MODE_OPTIONS: Array<{
  value: SlaHoursMode;
  label: string;
  description: string;
}> = [
  {
    value: '24-hour',
    label: '24 hour (all day)',
    description: 'The clock runs every minute, including nights and weekends.'
  },
  {
    value: 'shift-hours',
    label: 'Shift hours only',
    description: 'The clock pauses when the assigned agent is off shift. Time is based on the agent's working hours.'
  }
];
```

### Quick reply

```typescript
export type QuickReplyScope = 'public' | 'internal' | 'both';

export type QuickReplyCategory =
  | 'General'
  | 'Attendance'
  | 'Payroll'
  | 'Leave'
  | 'HR'
  | 'IT'
  | 'Administration';

export interface QuickReply {
  id: string;
  title: string;
  body: string;
  category: QuickReplyCategory;
  scope: QuickReplyScope;
  status: 'Active' | 'Inactive';
}
```

### Closing reason

```typescript
export type ClosingReasonContext = 'resolve' | 'close';

export interface ClosingReason {
  id: string;
  label: string;
  description?: string;
  context: ClosingReasonContext;
  requiresComment: boolean;
  status: 'Active' | 'Inactive';
}
```

---

## 6. Data Layer & Storage

### Storage keys (localStorage)

| Key | Content |
|-----|---------|
| `sixtifi-helpdesk-general-settings-by-company` | `Record<companyId, CompanyGeneralSettings>` |
| `sixtifi-helpdesk-quick-replies` | `QuickReply[]` |
| `sixtifi-helpdesk-closing-reasons` | `ClosingReason[]` |

### General settings — read merge order

When calling `getGeneralSettings(companyId)`:

1. Start with **global defaults**
2. Merge **per-company seed** (demo data)
3. Merge **stored user overrides** from localStorage

```typescript
const DEFAULTS: CompanyGeneralSettings = {
  ticketPrefix: 'TKT-',
  autoCloseDays: '7',
  allowReopenDays: '14',
  slaHoursMode: 'shift-hours',
  enableAutoAssignment: true,
  assignmentAlgorithm: 'Round Robin (Load Balanced)'
};

const SEED: Record<string, Partial<CompanyGeneralSettings>> = {
  'co-acme': { ticketPrefix: 'TKT-', assignmentAlgorithm: 'Round Robin (Load Balanced)' },
  'co-northwind': { ticketPrefix: 'NW-', assignmentAlgorithm: 'Lowest Active Workload' },
  'co-contoso': { ticketPrefix: 'CT-', assignmentAlgorithm: 'Team Lead Preferred' }
};
```

**Migration note:** Legacy value `'Category Specialist Preferred'` is remapped to `'Team Lead Preferred'` on read.

### Quick replies & closing reasons

- If localStorage is empty or invalid → return **default seed arrays**
- Saves always write the full array (replace-all pattern)

### Data layer functions

#### General settings

```typescript
getGeneralSettings(companyId?: string): CompanyGeneralSettings
saveGeneralSettings(companyId: string, settings: CompanyGeneralSettings): void
```

#### SLA hours (derived from general settings)

```typescript
getSlaHoursMode(companyId?: string): SlaHoursMode
getSlaHoursModeLabel(mode?: SlaHoursMode): string
getSlaHoursModeDescription(mode?: SlaHoursMode): string
```

#### Quick replies

```typescript
getQuickReplys(): QuickReply[]
saveQuickReplys(responses: QuickReply[]): void
notifyQuickReplysUpdated(): void
applyQuickReplyVariables(body: string, variables: Record<string, string>): string
filterQuickReplys(
  responses: QuickReply[],
  replyScope: 'public' | 'internal',
  searchQuery?: string
): QuickReply[]
```

#### Closing reasons

```typescript
getClosingReasons(): ClosingReason[]
saveClosingReasons(reasons: ClosingReason[]): void
getClosingReasonById(id: string): ClosingReason | undefined
getClosingReasonsByContext(context: ClosingReasonContext): ClosingReason[]
getDefaultClosingReasonId(context: ClosingReasonContext): string
isClosingCommentRequired(reasonId: string): boolean
```

---

## 7. API-Style Request/Response Shapes

Use these shapes if you replace localStorage with a backend API.

### GET `/api/companies/:companyId/settings`

**Response `200`:**

```json
{
  "companyId": "co-acme",
  "settings": {
    "ticketPrefix": "TKT-",
    "autoCloseDays": "7",
    "allowReopenDays": "14",
    "slaHoursMode": "shift-hours",
    "enableAutoAssignment": true,
    "assignmentAlgorithm": "Round Robin (Load Balanced)"
  }
}
```

### PUT `/api/companies/:companyId/settings`

**Request body:**

```json
{
  "ticketPrefix": "TKT-",
  "autoCloseDays": "7",
  "allowReopenDays": "14",
  "slaHoursMode": "shift-hours",
  "enableAutoAssignment": true,
  "assignmentAlgorithm": "Round Robin (Load Balanced)"
}
```

**Response `200`:**

```json
{
  "success": true,
  "companyId": "co-acme",
  "settings": { /* same as request */ },
  "updatedAt": "2026-08-31T10:00:00.000Z"
}
```

### GET `/api/quick-replies`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "cr-1",
      "title": "Acknowledge receipt",
      "body": "Hi {{requester}}, thank you for raising this request...",
      "category": "General",
      "scope": "public",
      "status": "Active"
    }
  ],
  "total": 7
}
```

### POST `/api/quick-replies`

**Request:**

```json
{
  "title": "Acknowledge receipt",
  "body": "Hi {{requester}}, we received ticket {{ticketId}}...",
  "category": "General",
  "scope": "public",
  "status": "Active"
}
```

**Response `201`:**

```json
{
  "id": "cr-1725091200000",
  "title": "Acknowledge receipt",
  "body": "Hi {{requester}}, we received ticket {{ticketId}}...",
  "category": "General",
  "scope": "public",
  "status": "Active",
  "createdAt": "2026-08-31T10:00:00.000Z"
}
```

### PATCH `/api/quick-replies/:id`

Toggle status or update fields. Same item shape in response.

### DELETE `/api/quick-replies/:id`

**Response `204`** (no body)

### GET `/api/closing-reasons`

**Query params (optional):**

- `context` — filter by `resolve | close`
- `status` — filter by `Active | Inactive`

**Response `200`:**

```json
{
  "items": [
    {
      "id": "cr-resolve-fixed",
      "label": "Fixed / Issue corrected",
      "description": "Issue was corrected and verified.",
      "context": "resolve",
      "requiresComment": true,
      "status": "Active"
    }
  ],
  "total": 9
}
```

### POST `/api/closing-reasons`

**Request:**

```json
{
  "label": "Fixed / Issue corrected",
  "description": "Issue was corrected and verified.",
  "context": "resolve",
  "requiresComment": true,
  "status": "Active"
}
```

**Response `201`:** Full `ClosingReason` object with server-generated `id`.

### Toast messages emitted by SettingsView

| Action | Type | Title | Description |
|--------|------|-------|-------------|
| Save general settings | `success` | Settings Saved | `General settings updated for {company.name}.` |
| Add quick reply | `success` | Template Added | `"{title}" is now available to agents.` |
| Edit quick reply | `success` | Template Updated | `"{title}" is now available to agents.` |
| Delete quick reply | `info` | Template Removed | Quick reply deleted. |
| Add closing reason | `success` | Closing Reason Added | `"{label}" is now available when closing tickets.` |
| Edit closing reason | `success` | Closing Reason Updated | `"{label}" is now available when closing tickets.` |
| Delete closing reason | `info` | Reason Removed | Closing reason deleted. |

---

## 8. Events & Cross-Module Sync

Settings changes broadcast via `window.CustomEvent` so other views update without a global state manager.

| Event constant | Fired when | Detail payload |
|----------------|------------|----------------|
| `sixtifi-general-settings-updated` | `saveGeneralSettings()` | `{ companyId: string }` |
| `sixtifi-sla-hours-mode-updated` | `saveGeneralSettings()` | `{ companyId: string, mode: SlaHoursMode }` |
| `sixtifi-quick-replies-updated` | `saveQuickReplys()` | none |
| `sixtifi-closing-reasons-updated` | `saveClosingReasons()` | none |

### Listeners in this project

| Consumer | Event listened |
|----------|----------------|
| `SlaEscalationView` | `sixtifi-sla-hours-mode-updated` |
| `QuickReplyPicker` | `sixtifi-quick-replies-updated` |
| `ClosingReasonFields` | `sixtifi-closing-reasons-updated` |

**Pattern for consumers:**

```typescript
useEffect(() => {
  const refresh = () => setData(getData());
  refresh();
  window.addEventListener(UPDATED_EVENT, refresh);
  return () => window.removeEventListener(UPDATED_EVENT, refresh);
}, []);
```

In a new project with React Query / Zustand / Redux, replace CustomEvents with cache invalidation or store updates.

---

## 9. User Flows

### Flow A: Load settings on company change

```
User selects company in header dropdown
        │
        ▼
requestCompanyChange(nextId)
        │
        ├─ isDirty? ──YES──► Show "Unsaved Changes" modal
        │                         │
        │                         ├─ Leave Without Saving → onCompanyChange(nextId)
        │                         └─ Save Changes → handleSaveSettings() → onCompanyChange(nextId)
        │
        └─ NO ──► onCompanyChange(nextId)
                        │
                        ▼
              useEffect([companyId]) → loadCompanySettings(companyId)
                        │
                        ▼
              getGeneralSettings(id) → populate form state → isDirty = false
```

### Flow B: Edit general settings

```
User edits any general field
        │
        ▼
handleFieldChange(setter, value) → setter(value) + isDirty = true
        │
        ▼
User clicks "Save Settings"
        │
        ▼
saveGeneralSettings(companyId, { ...fields })
        │
        ├─ Write to storage
        ├─ Dispatch GENERAL_SETTINGS_UPDATED_EVENT
        ├─ Dispatch SLA_HOURS_UPDATED_EVENT
        ├─ isDirty = false
        └─ onShowToast('success', 'Settings Saved', ...)
```

### Flow C: Tab switch with unsaved general changes

```
User clicks tab (general or permissions only — NOT quick-replies/closing)
        │
        ▼
handleTabClick(tab)
        │
        ├─ isDirty AND tab is 'general' or 'permissions'?
        │       YES → pendingTabSwitch = tab → open unsaved modal
        │       NO  → setActiveTab(tab) directly
        │
        ▼
Modal actions:
  - Cancel → clear pending state
  - Leave Without Saving → discard dirty, switch tab/company
  - Save Changes → save general settings, then switch tab/company
```

> **Important:** Quick replies and closing reasons tabs bypass dirty checking because they auto-save per action.

### Flow D: Quick reply CRUD

```
Add/Edit → open modal → fill form → Save
        │
        ├─ Validate: title AND body must be non-empty (trimmed)
        ├─ Build payload with id = existing OR `qr-${Date.now()}`
        ├─ Update local state array
        ├─ saveQuickReplys(next) → localStorage + event
        ├─ Close modal
        └─ Success toast

Toggle status → map array, flip Active/Inactive → saveQuickReplys

Delete → filter by id → saveQuickReplys → info toast
```

### Flow E: Closing reason CRUD

Same as quick replies except:

- Only `label` is required (not body)
- ID format: `cr-custom-${Date.now()}` for new items
- `description` stored as `undefined` if empty string

### Flow F: Agent uses quick reply in ticket reply

```
Agent opens QuickReplyPicker (replyScope: 'public' | 'internal')
        │
        ▼
filterQuickReplys(responses, replyScope, searchQuery)
  - status === 'Active'
  - scope matches replyScope OR scope === 'both'
  - optional text search on title/body/category
        │
        ▼
Agent selects template
        │
        ▼
applyQuickReplyVariables(body, { requester, ticketId, agent })
        │
        ▼
onInsert(resolvedText) → inserted into reply composer
```

### Flow G: Agent resolves/closes ticket

```
ClosingReasonFields rendered with context ('resolve' | 'close')
        │
        ▼
getClosingReasonsByContext(context) → Active reasons only
        │
        ▼
Agent selects reason + optional/required comment
        │
        ▼
canSubmitClosingReason(reasonId, comment)
  - reasonId required
  - if requiresComment → comment must be non-empty trim
```

---

## 10. Downstream Consumers

### `QuickReplyPicker`

**Props:**

```typescript
interface QuickReplyPickerProps {
  replyScope: 'public' | 'internal';
  onInsert: (text: string) => void;
  variables?: Record<string, string>;  // {{requester}}, {{ticketId}}, {{agent}}
  disabled?: boolean;
}
```

**Variable substitution regex:**

```typescript
body.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
```

Unknown placeholders are left as-is.

### `ClosingReasonFields`

**Props:**

```typescript
interface ClosingReasonFieldsProps {
  context: ClosingReasonContext;
  selectedReasonId: string;
  onReasonChange: (reasonId: string) => void;
  comment: string;
  onCommentChange: (comment: string) => void;
  commentLabel?: string;           // default: 'Closing note'
  commentPlaceholder?: string;
}
```

Auto-selects first available reason if current selection becomes invalid.

### `SlaEscalationView`

Reads `getSlaHoursMode(companyId)` and listens for `SLA_HOURS_UPDATED_EVENT` to refresh when settings change.

---

## 11. Validation Rules

### General settings

| Rule | Implementation |
|------|----------------|
| Ticket prefix required | UI `required` on FormField (no server validation in demo) |
| SLA mode required | UI `required` on FormField |
| Auto-assign algorithm | Only shown when `enableAutoAssignment === true` |

### Quick reply modal

| Rule | Blocks save |
|------|-------------|
| `quickReplyFormTitle.trim()` empty | Yes — Save button `disabled` |
| `quickReplyFormBody.trim()` empty | Yes — Save button `disabled` |

### Closing reason modal

| Rule | Blocks save |
|------|-------------|
| `closingFormLabel.trim()` empty | Yes — Save button `disabled` |
| Description | Optional — empty → stored as `undefined` |

### Closing reason submit (ticket workflow)

```typescript
function canSubmitClosingReason(reasonId: string, comment: string): boolean {
  if (!reasonId) return false;
  if (isClosingCommentRequired(reasonId) && !comment.trim()) return false;
  return true;
}
```

---

## 12. Styling Reference

Import `SettingsView.css`. Key classes:

| Class | Purpose |
|-------|---------|
| `.settings-container` | Page wrapper, flex column, gap |
| `.settings-card` | White card with border, padding, shadow |
| `.settings-card-header` | Title row with optional action button |
| `.settings-card-title` | Bold section title |
| `.settings-card-subtitle` | Muted helper text |
| `.settings-form-grid` | 2-column responsive grid (1 col below 900px) |
| `.permissions-matrix-table` | Shared table for permissions + CRUD lists |
| `.quick-replies-table` | Left-align cells, right-align actions column |
| `.quick-reply-status-pill` | Clickable Active/Inactive badge |
| `.quick-reply-status-pill.is-active` | Green active state |

**CSS variables used:** `--space-*`, `--bg-surface`, `--bg-subtle`, `--border-default`, `--border-subtle`, `--text-primary`, `--text-secondary`, `--text-muted`, `--radius-md`, `--radius-sm`, `--radius-full`, `--shadow-xs`, `--font-weight-bold`.

**Shared tab classes** (from global/other views): `.queue-tabs-bar`, `.queue-tab-btn`, `.queue-tab-btn.is-active`.

**UI components required:**

- `PageHeader`
- `Button`, `IconButton`
- `TextInput`, `SelectInput`, `TextareaInput`, `FormField`, `ToggleSwitch`
- `Modal`

**Icons (lucide-react):** `Save`, `Sliders`, `ShieldCheck`, `CheckCircle2`, `MessageSquareQuote`, `Tag`, `Plus`, `Edit`, `Trash2`

---

## 13. Implementation Checklist for a New Project

### Phase 1 — Types & data layer

- [ ] Copy/adapt all interfaces from Section 5
- [ ] Implement `getGeneralSettings` / `saveGeneralSettings` (API or storage)
- [ ] Implement quick reply CRUD functions + defaults
- [ ] Implement closing reason CRUD functions + defaults
- [ ] Implement company list + `getCompanyById`
- [ ] Add event constants or cache invalidation strategy

### Phase 2 — Settings view shell

- [ ] Create `SettingsView` with props: `companyId`, `onCompanyChange`, `onShowToast`
- [ ] Page header with company selector + Save button
- [ ] Tab navigation (4 tabs)
- [ ] Import/copy `SettingsView.css`

### Phase 3 — General tab

- [ ] Form state for all `CompanyGeneralSettings` fields
- [ ] `loadCompanySettings` on `companyId` change
- [ ] `handleFieldChange` + `isDirty` tracking
- [ ] `handleSaveSettings` + success toast
- [ ] Unsaved changes modal for tab/company navigation
- [ ] SLA info box with dynamic description

### Phase 4 — Quick replies tab

- [ ] Table listing with preview truncation (90 chars)
- [ ] Add/Edit modal with validation
- [ ] Toggle status, delete actions
- [ ] Immediate persist on each action

### Phase 5 — Closing reasons tab

- [ ] Same CRUD pattern as quick replies
- [ ] Context filter values: resolve, close
- [ ] Comment required/optional field

### Phase 6 — Permissions tab

- [ ] Static read-only matrix (or wire to real RBAC later)

### Phase 7 — Consumers

- [ ] `QuickReplyPicker` in ticket reply composer
- [ ] `ClosingReasonFields` in resolve/close modals
- [ ] SLA view listens for hours mode changes

### Phase 8 — Parent wiring

- [ ] Route/nav entry for `settings`
- [ ] Shared `companyId` state at app level
- [ ] Toast system connected

---

## Default Seed Data Reference

### Default quick replies (7 items)

See `DEFAULT_QUICK_REPLIES` in `src/data/quickReplies.ts` for full list. Categories covered: General, Attendance, Payroll. Scopes: public and internal.

### Default closing reasons (7 items)

| Context | Count | Examples |
|---------|-------|----------|
| `resolve` | 4 | Fixed / Issue corrected, Information provided, Policy clarified, Request completed |
| `close` | 3 | Closed — no action required, Cancelled by requester, No response from employee |

---

## ID Generation Conventions (client-side demo)

| Entity | New ID pattern |
|--------|----------------|
| Quick reply | `qr-${Date.now()}` |
| Closing reason | `cr-custom-${Date.now()}` |

Replace with server-generated UUIDs in production.

---

## Notes for Backend Migration

1. **Company scope:** Only general settings are per-company. Quick replies and closing reasons are global in the current demo — decide if your product needs company-scoped templates/reasons.
2. **Optimistic UI:** Quick replies/closing tabs update state immediately; consider optimistic updates + rollback on API failure.
3. **Permissions tab:** Currently static. A real implementation would fetch role-capability mappings from an auth/RBAC service.
4. **SLA `custom-hours`:** Type exists but UI does not expose it yet — reserve for future shift-calendar integration.
5. **Assignment algorithm:** Stored as display string, not enum — consider normalizing to enum values in API (`round_robin`, `lowest_workload`, `team_lead`).

---

*Generated from Sixtifi Helpdesk `SettingsView` implementation. Last synced with source: August 2026.*
