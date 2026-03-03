<script lang="ts" setup></script>

<template>
  <div class="page-container">
    <ScanProjectList />
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  height: 100%;
  width: 100%;
  padding: var(--app-space-s);
}

.page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--app-space-m);

  h1 {
    font-size: 24px;
    font-weight: 600;
    color: var(--app-text-color);
  }

  p {
    color: var(--app-text-color-secondary);
  }
}
</style>
