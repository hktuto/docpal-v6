<script setup lang="ts">
  const createTablePopover = ref()
  const context = useSingleWorkspaceContext()
  const createTableForm = ref({
    name: '',
    description: '',
    icon: '',
  })

  const handleCreateTable = () => {
    console.log('handleCreateTable', createTableForm.value)
    //TODO create table
  }
</script>

<template>
  <UiPopoverDialog
      ref="createTablePopover"
      placement="right-start"
      :width="400"
      title="Create New Table"
    >
    <el-form label-position="top" class="create-table-form">
        <el-form-item label="Table Name" required>
          <el-input
            v-model="createTableForm.name"
            placeholder="e.g. Projects, Customers, Tasks"
            maxlength="100"
            @keyup.enter="handleCreateTable"
          />
        </el-form-item>

        <el-form-item label="Description">
          <el-input
            v-model="createTableForm.description"
            type="textarea"
            :rows="3"
            placeholder="Optional description for this table"
            maxlength="500"
          />
        </el-form-item>

        <el-form-item label="Icon">
          <UiIconPicker v-model="createTableForm.icon" />
        </el-form-item>

        <div class="form-actions">
          <el-button @click="createTablePopover?.close()">Cancel</el-button>
          <el-button type="primary" @click="handleCreateTable">
            Create Table
          </el-button>
        </div>
      </el-form>
    </UiPopoverDialog>
</template>
