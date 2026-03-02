---
type: feature
module: "[[CORE-003 - Workflow]]"
feature-id: WORKFLOW-003
depends-on: []
---

# WORKFLOW-003: Task Management

## Overview
User task management interfaces for viewing, claiming, and completing workflow tasks. Includes both client-facing task pages and administrative task management tools.

## Description
Task Management provides comprehensive interfaces for end-users to interact with their assigned workflow tasks, view task details, complete forms, and track task progress. It also includes administrative tools for managing tasks across the organization.

## Components

### Client Task Pages
| Component | Path | Description |
|-----------|------|-------------|
| Main Task Page | `pages/client-workflow/components/global/workflow/page.vue` | Main workflow task page with tabs |
| Task Detail | `pages/client-workflow/components/global/workflow/detail.vue` | Task detail view |
| My Tasks | `pages/client-workflow/components/workflow/myTask.vue` | My tasks list |
| All Tasks | `pages/client-workflow/components/workflow/allTask.vue` | All tasks list |
| Active Tasks | `pages/client-workflow/components/workflow/activeTask.vue` | Active tasks view |
| Completed Tasks | `pages/client-workflow/components/workflow/completeTask.vue` | Completed tasks view |
| Ad-hoc Tasks | `pages/client-workflow/components/workflow/adhocTask.vue` | Ad-hoc tasks view |

### Task Detail Components
| Component | Path | Description |
|-----------|------|-------------|
| Info Panel | `pages/client-workflow/components/workflow/Detail/Info.vue` | Task information panel |
| Document Reader | `pages/client-workflow/components/workflow/Detail/Reader.vue` | Document reader in task view |
| Activity Feed | `pages/client-workflow/components/workflow/Detail/activity.vue` | Task activity feed |
| Complete Info | `pages/client-workflow/components/workflow/Detail/completeInfo.vue` | Task completion information |
| Discussion | `pages/client-workflow/components/workflow/Detail/discussionChannel.vue` | Task discussion/chat |
| Process Graph | `pages/client-workflow/components/workflow/Detail/graph.vue` | Task process graph |

### Task Popovers & Dialogs
| Component | Path | Description |
|-----------|------|-------------|
| Personal Filter | `pages/client-workflow/components/workflow/popover/personal.vue` | Personal task filter popover |
| Template | `pages/client-workflow/components/workflow/popover/template.vue` | Task template popover |
| Bulk Import | `pages/client-workflow/components/workflow/popover/bulkImport.vue` | Bulk task import |
| Download | `pages/client-workflow/components/workflow/popover/download.vue` | Task list download |
| Signature Dialog | `pages/client-workflow/components/workflow/signatureDialog.vue` | Signature dialog for tasks |
| Full Page Starter | `pages/client-workflow/components/workflow/startFullPageDead.vue` | Full-page workflow starter |

### Admin Task Management
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Manage | `pages/admin-workflow/components/global/workflowManage/page.vue` | Admin workflow task management page |
| Workflow Retry | `pages/admin-workflow/components/global/workflowRetry/page.vue` | Workflow retry management |
| Reallocate Dialog | `pages/admin-workflow/components/workflow/reallocateDialog.vue` | Task reallocation dialog |

### Dashboard Widgets
| Component | Path | Description |
|-----------|------|-------------|
| Personal Workflow | `packages/dp-dashboard/components/global/personal/workflow/index.vue` | Personal workflow widget |
| My Workflow | `packages/dp-dashboard/components/global/personal/workflow/my.vue` | My workflow tasks |
| Active Workflow | `packages/dp-dashboard/components/global/personal/workflow/active.vue` | Active workflows |
| Available Workflow | `packages/dp-dashboard/components/global/personal/workflow/avalible.vue` | Available workflows |
| Create Workflow | `packages/dp-dashboard/components/global/personal/workflow/create/index.vue` | Create workflow |
| Create Dialog | `packages/dp-dashboard/components/global/personal/workflow/create/dialog.vue` | Create workflow dialog |
| Title Dialog | `packages/dp-dashboard/components/global/personal/workflow/create/titleDialog.vue` | Title input dialog |
| Widget Settings | `packages/dp-dashboard/components/global/personal/workflow/setting.vue` | Workflow widget settings |
| Single Workflow | `packages/dp-dashboard/components/global/personal/workflow/single/index.vue` | Single workflow view |
| Single Settings | `packages/dp-dashboard/components/global/personal/workflow/single/Setting.vue` | Single workflow settings |
| Single Table | `packages/dp-dashboard/components/global/personal/workflow/single/table.vue` | Single workflow table |

### Corporate Dashboard Widgets
| Component | Path | Description |
|-----------|------|-------------|
| Workflow Counts | `packages/dp-dashboard/components/global/workflow/coCount/index.vue` | Corporate workflow counts |
| Active Count | `packages/dp-dashboard/components/global/workflow/coCount/activeCount.vue` | Active workflow count |
| New Count | `packages/dp-dashboard/components/global/workflow/coCount/newCount.vue` | New workflow count |
| Approval Rate | `packages/dp-dashboard/components/global/workflow/coCount/approveRate.vue` | Approval rate widget |
| Time Per Task | `packages/dp-dashboard/components/global/workflow/coCount/timeSpendPerTask.vue` | Time per task |
| Time Per Workflow | `packages/dp-dashboard/components/global/workflow/coCount/timeSpendPerWorkflow.vue` | Time per workflow |
| Count Dialog | `packages/dp-dashboard/components/global/workflow/coCount/dialog.vue` | Count dialog |
| Workflow Group | `packages/dp-dashboard/components/global/workflow/group/index.vue` | Workflow group widget |
| Group Detail | `packages/dp-dashboard/components/global/workflow/group/detail/list.vue` | Group detail list |
| Group Filter | `packages/dp-dashboard/components/global/workflow/group/detail/filter.vue` | Group filter |
| Group Dialog | `packages/dp-dashboard/components/global/workflow/group/dialog/index.vue` | Group dialog |
| Group Card | `packages/dp-dashboard/components/global/workflow/group/dialog/card.vue` | Group card view |
| Group Tags | `packages/dp-dashboard/components/global/workflow/group/dialog/tags.vue` | Group tags |
| New Task Popover | `packages/dp-dashboard/components/global/workflow/popover/newTask.vue` | New task popover |

### Dashboard Composables
| File | Path | Description |
|------|------|-------------|
| useWorkflow | `packages/dp-dashboard/composables/useWorkflow.ts` | Dashboard workflow composable |

## Key Features

### User Features
- **My Tasks**: View tasks assigned to the current user
- **Task Claiming**: Claim tasks from candidate groups
- **Task Completion**: Complete tasks with form data
- **Task Delegation**: Delegate tasks to other users
- **Bulk Operations**: Bulk import and export tasks
- **Task Filters**: Filter by status, type, date, etc.
- **Activity Tracking**: View task history and comments
- **Document Preview**: View related documents within tasks
- **Discussion**: Chat and collaborate on tasks

### Admin Features
- **Task Reallocation**: Reassign tasks between users
- **Retry Management**: Manage failed task retries
- **Process Management**: Monitor and manage process instances
- **Bulk Operations**: Mass task operations

### Dashboard Integration
- **Personal Widget**: Quick access to personal tasks
- **Corporate Metrics**: Organization-wide workflow statistics
- **Workflow Groups**: Group tasks by category
- **Performance Metrics**: Time spent per task/workflow

## File Locations
- **Client Pages**: `pages/client-workflow/`
- **Admin Pages**: `pages/admin-workflow/`
- **Dashboard**: `packages/dp-dashboard/components/global/`

## Related Features
- [[FEAT-003.1 - BPMN Designer]] - Workflow definitions
- [[FEAT-003.2 - Workflow Engine]] - Process execution
- [[FEAT-003.4 - Form Renderer]] - Task forms
- [[FEAT-003.5 - Process History]] - Task history
