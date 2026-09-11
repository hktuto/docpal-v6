<template>
<ElDropdownItem @click="goToWH">
   Warehouse
</ElDropdownItem>
</template>

<script lang="ts" setup>
function goToWH() {
  const token = localStorage.getItem('access_token')
  const redirectUrl = `https://mobile-wms-admin.wclsolution.com/login-token#token=${token}`
  window.location.href = redirectUrl
}
</script>
