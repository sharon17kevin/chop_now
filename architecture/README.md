# Architecture Documentation - Quick Start Guide

## 📁 Files in This Folder

| File                                 | Purpose                                    | Use Case                                                  |
| ------------------------------------ | ------------------------------------------ | --------------------------------------------------------- |
| **ARCHITECTURE.md**                  | Complete system documentation (700+ lines) | Understand entire codebase, data flows, known issues      |
| **../tasks.md**                      | Architecture cleanup tasks (NEW)           | Code quality, separation of concerns, centralize Supabase |
| **../tasks-feature-improvements.md** | Feature improvement tasks (BACKUP)         | Bug fixes, revenue calculations, escrow deployment        |
| **migrations-list.md**               | All database migrations                    | Reference for schema changes                              |
| **edge-functions-list.md**           | Serverless functions                       | Understand backend APIs                                   |
| **hooks-list.md**                    | React hooks inventory                      | Frontend state management reference                       |
| **components-list.md**               | UI components inventory                    | Frontend component reference                              |

---

## 🤖 Using with Cline (Claude Code)

### Two Task Lists Available

**Choose based on your priority:**

1. **tasks.md** (Architecture Cleanup) - Recommended first
   - Centralize Supabase access
   - Remove duplicate logic
   - Clean up unused files
   - Enforce separation of concerns

2. **tasks-feature-improvements.md** (Feature Fixes)
   - Fix revenue calculations
   - Deploy escrow system
   - Add database indexes
   - Improve analytics UI

### Initial Setup - Architecture Cleanup (Recommended)

1. **Open VS Code** with this workspace (`C:\Resources\app\chow`)

2. **Open Cline** (Claude Code extension in VS Code sidebar)

3. **Start Cline** and give it full context:

```
Read these files to understand the project:
1. architecture/ARCHITECTURE.md - Full system documentation
2. tasks.md - Architecture cleanup tasks

Goal: Centralize Supabase access and enforce separation of concerns.

Let's start with Task 1: Map Current Supabase Usage

Create an audit file listing all 59+ places where Supabase is imported directly.
Categorize by layer (components, hooks, services, stores).
Organize by database table being queried.

Show me the audit structure before creating the file.
```

### Alternative Setup - Feature Improvements

```
Read these files to understand the project:
1. architecture/ARCHITECTURE.md - Full system documentation
2. tasks-feature-improvements.md - Feature improvement tasks

After reading both files, let's start with Task 1: Fix Revenue Calculations.

Files to change:
- mobile-app/hooks/useVendorEarnings.ts (lines 41-42, 53, 69)
- mobile-app/hooks/useVendorStats.ts (lines 73-74)

Change order.total to vendor_payout_amount || total * 0.95

Show me the proposed changes before applying.
```

---

## 🎯 Recommended Workflow

### Phase 1: High Priority Fixes (Day 1)

**Task 1-4 in tasks.md:**

1. **Fix Revenue Calculations** (30 min)
   - Cline command: "Fix Task 1 from tasks.md - revenue calculations"
   - Expected: Analytics shows ₦27,550 instead of ₦29,000

2. **Add Database Indexes** (15 min)
   - Cline command: "Create migration file for Task 2 - performance indexes"
   - Expected: New migration file with 8 indexes

3. **Deploy Escrow System** (45 min)
   - Cline command: "Guide me through Task 3 - deploying escrow system"
   - Expected: Escrow releases funds after 24hrs

4. **Simplify Analytics Display** (30 min)
   - Cline command: "Implement Task 4 - add tooltips to analytics cards"
   - Expected: Clear money explanations on analytics page

### Phase 2: Code Quality (Day 2)

**Task 5-8 in tasks.md:**

- Consolidate duplicate queries
- Generate TypeScript types
- Add error boundaries
- Optimize React Query cache

### Phase 3: Polish (Day 3)

**Task 9-12 in tasks.md:**

- Extract inline styles
- Loading state consistency
- Unit tests
- Developer docs

---

## 💡 Cline Tips & Tricks

### Best Commands for This Project

**1. Focused Task Execution**

```
From tasks.md, complete Task [number]: [task name].
Read the task description, make the changes, and verify the expected outcome.
```

**2. Exploratory Analysis**

```
Analyze the [component/hook/function] in [file path].
Check if it follows the patterns described in ARCHITECTURE.md.
Suggest improvements based on cleanup priorities.
```

**3. Verification & Testing**

```
I've completed Task [number].
Run through the testing steps and verify the expected outcome.
```

**4. Multi-File Refactoring**

```
Consolidate all order queries into a shared hook (Task 5).
Review useVendorEarnings, useVendorStats, and order-detail components.
Create new useOrders.ts hook following the task specification.
```

### How to Give Cline Context

**Option A: Full Context (First Time)**

```
Read architecture/ARCHITECTURE.md and tasks.md.
Understand the system architecture, then let's work through
the high priority tasks one by one.
```

**Option B: Task-Specific Context (Subsequent)**

```
Review Task [number] in tasks.md and implement the changes.
The ARCHITECTURE.md has been read already.
```

**Option C: Problem-Solving Mode**

```
There's an issue with [specific problem].
Check ARCHITECTURE.md section on [relevant topic].
Propose a fix following our existing patterns.
```

---

## 🔍 Quick Reference

### Finding Information

**"Where is the money flow logic?"**
→ ARCHITECTURE.md, Section 7 (Money & Payment System)

**"What database tables exist?"**
→ ARCHITECTURE.md, Section 3 (Database Architecture)
→ migrations-list.md (all migrations)

**"What's wrong with revenue calculations?"**
→ ARCHITECTURE.md, Section 9 (Known Issues #2)
→ tasks.md, Task 1 (Fix with line numbers)

**"What hooks are available?"**
→ hooks-list.md (all hooks)
→ ARCHITECTURE.md, Section 5.3 (Custom Hooks)

**"How does escrow work?"**
→ ARCHITECTURE.md, Section 7.2 (Escrow States)
→ ARCHITECTURE.md, Section 6.2 (Order Fulfillment Flow)

---

## ⚠️ Important Notes

### Before Making Changes

1. **Read ARCHITECTURE.md** - Understand the system
2. **Check tasks.md** - Know what to fix
3. **Review dependencies** - Some tasks depend on others
4. **Test thoroughly** - Follow testing steps in each task

### While Working

- **One task at a time** - Don't mix multiple changes
- **Follow patterns** - Match existing code style
- **Update docs** - If you change architecture, update ARCHITECTURE.md
- **Mark progress** - Update tasks.md completion checklist

### After Changes

- **Test manually** - Follow testing steps
- **Check TypeScript** - No errors
- **Verify expected outcome** - Match task requirements
- **Commit with clear message** - e.g., "Task 1: Fix revenue calculations"

---

## 🚀 Getting Started Now

### Immediate Next Steps:

1. **Open Cline** in VS Code
2. **Give it context** with the command below
3. **Start with Task 1** (safest, high-impact fix)

### Copy-Paste this into Cline:

```
Hello! I need help improving a React Native + Supabase marketplace app.

Context files:
1. Read architecture/ARCHITECTURE.md (complete system documentation)
2. Read tasks.md (prioritized task list)

Goal: Complete all High Priority tasks (Tasks 1-4) to fix critical issues.

Let's start with Task 1: Fix Revenue Calculations
- Files: frontend/hooks/useVendorEarnings.ts and frontend/hooks/useVendorStats.ts
- Change: Replace order.total with vendor_payout_amount || total * 0.95
- Expected: Analytics shows vendor earnings (95%) instead of customer payment (100%)

Please read both files, understand the issue from ARCHITECTURE.md section 9.2,
then show me the proposed changes before applying them.
```

---

## 📞 Need Help?

If Cline gets stuck:

1. **Provide more context**: Point to specific ARCHITECTURE.md sections
2. **Break down the task**: Ask for one file at a time
3. **Show examples**: Reference existing patterns in codebase
4. **Ask for explanation**: "Explain your reasoning before making changes"

---

**You're all set! Start with the command above and work through tasks.md systematically.**

Good luck! 🎉
