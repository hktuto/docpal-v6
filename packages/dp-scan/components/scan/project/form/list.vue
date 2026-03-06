<script lang="ts" setup>
const props = defineProps<{
  forms: []
}>()
const newFormDialogEl = ref()
const newButtonEl = ref()
function CreateNewForm() {}
</script>

<template>
  <div class="formListContainer">
    <div class="listHeader">
      <div class="title">Title</div>
      <div class="actions">
        <ElButton ref="newButtonEl" type="primary">New Form</ElButton>
      </div>
    </div>
    <div class="listBody">
      <div class="formItem" v-for="form in forms" :key="form.id"></div>
    </div>
  </div>
  <ScanPropjectFormNewDialog ref="newFormDialog" :buttonEl="newButtonEl"></ScanPropjectFormNewDialog>
</template>
