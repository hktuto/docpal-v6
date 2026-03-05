<script lang="ts" setup></script>

<template>
  <div class="page-container">
    <div class="page-title">
      <div class="title">Batch List</div>
      <ScanProjectNewButton />
    </div>
    <ScanProjectTable />
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  gap: var(--app-space-s);
  justify-content: flex-start;
}
.page-title {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: flex-start;
}
.title {
  flex: 1 0 auto;
  font-size: 2rem;
  font-weight: bold;
}
</style>
