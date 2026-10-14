<template>
<ElDropdownItem @click="goToWH">
   Warehouse
</ElDropdownItem>
</template>

<script lang="ts" setup>
function goToWH() {
  const token = localStorage.getItem('access_token')
  const redirectUrl = `https://wclwms-hk.docpal.com.hk/login-token#token=${token}`
  window.location.href = redirectUrl
}
</script>
