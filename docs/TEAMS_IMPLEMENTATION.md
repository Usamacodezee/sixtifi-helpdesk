# Helpdesk Teams — Implementation Guide

This document describes the **Teams** module in Sixtifi Helpdesk: how support teams are organized per company, how the list table presents members (avatar + name) and team lead, and how teams connect to categories and ticket routing.

**Source files in this repo:**

| Area | Path |
|------|------|
| Main view | `src/views/TeamsView.tsx` |
| Styles | `src/views/TeamsView.css` |
| Handling-team names (categories) | `src/data/helpdeskTeams.ts` |
| Employee directory | `src/data/directory.ts` |
| Companies | `src/data/companies.ts` |
| App integration | `src/App.tsx` |
| Sidebar nav | `src/components/shell/Sidebar.tsx` |

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [View Modes](#2-view-modes)
3. [Teams List Table](#3-teams-list-table)
4. [TypeScript Types](#4-typescript-types)
5. [Data Model](#5-data-model)
6. [User Flows](#6-user-flows)
7. [Category & Routing Integration](#7-category--routing-integration)
8. [Styling Reference](#8-styling-reference)
9. [Implementation Checklist](#9-implementation-checklist)

---

## 1. High-Level Overview

The Teams page lets admins **create, edit, deactivate, and inspect** helpdesk support teams scoped to the **currently selected company** (company switcher in the header).

Each team has:

- Name, description, status (Active / Inactive)
- **Team lead** — primary supervisor for SLA escalation and workload oversight
- **Members** — specialists assigned to the team (each with avatar initials and full name)
- **Categories** — read-only on this page; assigned from the Categories module
- Open ticket count, SLA attention metrics, last updated

**Key design decisions:**

- Teams are **company-scoped** (`companyId` on each team).
- Category assignment is **not** done on the Teams page — teams are linked as handling teams from **Categories → Add/Edit**.
- Inactive teams do not receive new auto-assigned tickets.
- Demo data lives in component state; production would use API + persistence while keeping the same types and UI.

---

## 2. View Modes

`TeamsView` uses a single component with four modes via `viewMode` state:

| Mode | Purpose |
|------|---------|
| `list` | Default — searchable/filterable teams table |
| `create` | Full-page form to add a team |
| `edit` | Full-page form to update an existing team |
| `detail` | Team detail with KPI cards and tabs (Overview, Members, Category, Tickets, Activity) |

Navigation:

- List → Detail: click team name or row, or row menu **View Team**
- List → Create: **+ Add Team** in page header
- Detail / List → Edit: **Edit Team** action or row menu
- Any form/detail → List: breadcrumbs, **Back to Teams**, or Cancel

---

## 3. Teams List Table

The default **Teams List** is an enterprise table with search, status filter, and category filter.

### Columns

| Column | Sortable | Content |
|--------|----------|---------|
| **Team Name** | Yes | Name (link to detail) + description subtitle |
| **Members** | Yes | Member avatars, member names, and total count |
| **Categories** | No | Category pills, or “Not assigned” |
| **Open Tickets** | Yes | Count (link to All Tickets filtered by team) |
| **Team Lead** | Yes | Lead name with avatar |
| **Status** | Yes | Active / Inactive badge |
| **Last Updated** | Yes | Relative or date string |
| **Actions** | No | Row menu: View, Edit, Deactivate / Activate |

### Members column — avatar + names

Each row’s **Members** cell must show **who** is on the team, not only a count.

**Required layout:**

```
┌─────────────────────────────────────────────┐
│  [PS] Priya Shah                            │
│  [RS] Rahul Sharma                          │
│  [ER] Elena Rostova                         │
│  + 3 more members                           │
└─────────────────────────────────────────────┘
```

**Rules:**

1. **Avatar** — circular initials badge (26×26px), primary tint background, same as `avatar-stack-circle` / `cat-assignee-avatar`.
2. **Name** — full employee name beside each avatar (`font-size: 13px`, `font-weight: 600`).
3. **Preview limit** — show up to **3 members** inline (avatar + name per row or stacked list).
4. **Overflow** — if `membersCount > 3`, show a muted line: `+ N more members` (or `N members` total badge).
5. **Data source** — resolve member IDs against `DirectoryPerson` from `src/data/directory.ts` for `initials` and `name`.

**Suggested data shape for list rendering** (extend `HelpdeskTeam`):

```typescript
interface TeamMemberRef {
  id: string;
  name: string;
  initials: string;
}

interface HelpdeskTeam {
  // ...existing fields...
  memberIds: string[];       // directory employee ids
  membersPreview?: TeamMemberRef[]; // optional denormalized for list
  teamLeadId: string;
  teamLeadName: string;      // display name (current: teamLead string)
  teamLeadInitials: string;
}
```

**Current demo state:** `memberAvatars` (initials only) + `membersCount` without names. Migrate to `memberIds` + directory lookup so the list shows avatar + name as specified above.

### Team Lead column — avatar + name

The **Team Lead** cell should mirror the member row pattern: **avatar initials + full name**, not plain text only.

```
[PS] Priya Shah
```

- Avatar: same circle style as members.
- Name: `font-weight: 600`, `font-size: 13px`.
- Team lead is always one person; no stack or overflow.

### Filters & search

- **Search** — team name, description, team lead name
- **Status** — All / Active / Inactive
- **Category** — All / Attendance / Leave / Payroll / HR / IT / Administration
- **Clear Filters** — visible when any filter is active

### Row interactions

- Row click → team detail
- Team name click → team detail
- Open tickets click → `onNavigateToAllTicketsWithFilter(teamName)`
- Actions menu → View / Edit / Deactivate / Activate

---

## 4. TypeScript Types

Defined in `TeamsView.tsx` (move to `src/data/helpdeskTeams.ts` or `teamTypes.ts` when persisting):

```typescript
export interface HelpdeskTeam {
  id: string;
  companyId: string;
  name: string;
  description: string;
  membersCount: number;
  memberAvatars: string[];   // legacy — replace with memberIds + directory
  memberIds?: string[];
  categories: string[];
  openTickets: number;
  teamLead: string;
  teamLeadId?: string;
  teamLeadInitials?: string;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  slaAtRisk?: number;
  slaBreached?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  initials?: string;
  role: string;
  assignedTickets: number;
  openCount: number;
  slaRiskCount: number;
  status: 'Active' | 'On Leave';
}

export interface TeamsViewProps {
  companyId: string;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, desc?: string) => void;
  onNavigateToAllTicketsWithFilter: (teamName: string) => void;
}
```

**Directory person** (for avatars and names):

```typescript
interface DirectoryPerson {
  id: string;
  name: string;
  initials: string;
  department: string;
  companyId: string;
}
```

---

## 5. Data Model

### Seed teams (demo)

Twelve teams across three companies (`co-acme`, `co-northwind`, `co-contoso`). Examples:

| Team | Company | Team Lead | Members (count) |
|------|---------|-----------|-----------------|
| HR Support | Acme | Priya Shah | 6 |
| Attendance Desk | Acme | Rahul Sharma | 3 |
| IT Support | Acme | David Miller | 5 |
| Northwind Ops Desk | Northwind | Rahul Sharma | 4 |
| Contoso Retail HR | Contoso | Mia Chen | 2 |

Full seed data: `teams` state in `TeamsView.tsx`.

### Handling team names for categories

`HANDLING_TEAMS_BY_COMPANY` in `helpdeskTeams.ts` lists team **names** per company for category form dropdowns. Keep this in sync when adding/removing teams.

```typescript
export const HANDLING_TEAMS_BY_COMPANY: Record<string, string[]> = {
  'co-acme': ['HR Support', 'Attendance Desk', ...],
  'co-northwind': ['Northwind Ops Desk', 'Northwind Fleet Desk'],
  'co-contoso': ['Contoso People Ops', 'Contoso Retail HR']
};
```

### Persistence (production)

| Endpoint (example) | Action |
|--------------------|--------|
| `GET /companies/{id}/teams` | List teams for company |
| `POST /companies/{id}/teams` | Create team |
| `PATCH /teams/{id}` | Update team |
| `POST /teams/{id}/deactivate` | Set status Inactive |
| `GET /teams/{id}/members` | Members with workload stats |

Response should include `members[]` with `id`, `name`, `initials` for list rendering.

---

## 6. User Flows

### Browse teams (list)

1. Open **Helpdesk → Teams**
2. Table shows teams for current company
3. Each row: team info, **members (avatar + names)**, categories, tickets, **team lead (avatar + name)**, status
4. Search or filter as needed
5. Click row or name for detail

### Create team

1. Click **+ Add Team**
2. Fill: Company, Team Name, Description, Team Lead, Team Members (checkboxes), Status
3. Submit → toast “Team Created” → return to list
4. Assign categories from **Categories** module

### Edit team

1. Row menu **Edit Team** or detail **Edit Team**
2. Update fields → **Save Changes** → toast → list

### Deactivate team

1. Row menu or detail **Deactivate Team**
2. Confirm modal → status Inactive, no new auto-routing
3. Existing tickets remain for staff review

### Team detail

- **KPI cards:** Team Lead, Members count, Open Tickets, SLA Attention
- **Tabs:** Overview, Members (table), Category (pills), Tickets (navigate out), Activity History

**Members tab table columns:** Member Name, Role, Assigned Tickets, Open, SLA At Risk, Status

---

## 7. Category & Routing Integration

- **Category assignment:** On category create/edit, select a **handling team** from `handlingTeamsForCompany(companyId)`.
- **Auto routing:** New tickets in a category route to that category’s handling team.
- **Teams page:** Categories column is read-only; empty shows “Not assigned”.
- **Inactive teams:** Excluded from new auto-assignment.

Sidebar route: `teams` (see `Sidebar.tsx` and `App.tsx`).

---

## 8. Styling Reference

| Class | Usage |
|-------|--------|
| `.teams-container` | Page wrapper |
| `.members-avatar-stack` | Members column flex row |
| `.avatar-stack-group` / `.avatar-stack-circle` | Overlapping avatar stack (legacy) |
| `.more-members-badge` | “N members” / “+ N more” text |
| `.member-list-row` | **New** — single member: avatar + name in list cell |
| `.team-lead-cell` | **New** — team lead avatar + name |
| `.category-tag-pill` | Category badges |
| `.teams-kpi-grid` / `.teams-kpi-card` | Detail KPI cards |
| `.team-detail-tabs-bar` / `.team-tab-btn` | Detail tabs |
| `.members-checkbox-grid` | Create/edit member picker |

**Member / lead avatar** — align with Categories assignee chips:

```css
.cat-assignee-avatar {
  /* 22–26px circle, primary-100 bg, primary-700 text, font-weight 700 */
}
```

List cell member names: `font-size: 13px`, `font-weight: 600`, `color: var(--text-primary)`.

---

## 9. Implementation Checklist

- [ ] **List — Members column:** avatar + full name for up to 3 members; overflow count for rest
- [ ] **List — Team Lead column:** avatar + full name (not text-only)
- [ ] Resolve members via `DirectoryPerson` (`memberIds` → `DIRECTORY_EMPLOYEES`)
- [ ] Extend `HelpdeskTeam` with `memberIds`, `teamLeadId`, initials fields
- [ ] Create/edit form: persist selected member IDs, not just names
- [ ] Keep `HANDLING_TEAMS_BY_COMPANY` synced on create/delete
- [ ] Detail Members tab: add avatar column beside member name
- [ ] API layer replacing in-component `useState` teams array
- [ ] Deactivate blocks new routing; existing tickets unchanged

---

## Related docs

- [SETTINGS_IMPLEMENTATION.md](./SETTINGS_IMPLEMENTATION.md) — general helpdesk settings
- [SLA_ESCALATION_IMPLEMENTATION.md](./SLA_ESCALATION_IMPLEMENTATION.md) — per-category SLA (team lead is escalation target in category SLA config)
