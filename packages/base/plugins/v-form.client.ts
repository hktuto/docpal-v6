import { clientApi, adminApi } from 'api';
import dayjs from 'dayjs';

// @ts-ignore
export default defineNuxtPlugin(async nuxtApp => {
  // Dynamically import VForm3 and its styles for code-splitting
  // @ts-expect-error - v-form doesn't have type declarations
  const VForm3Module = await import('v-form-designer');
  await import('v-form-designer/dist/designer.style.css');
  
  // @ts-ignore
  const VForm3 = VForm3Module.default;
  nuxtApp.vueApp.use(VForm3);
  
  if (window) {
    const pathname = window.location.pathname
    // @ts-ignore
    window.$api = pathname.includes('admin') ? adminApi?.instance : clientApi?.instance;
    // @ts-ignore
    window.$i18n = nuxtApp.$i18n;

    // @ts-ignore
    window.$formatDate = (date: string, format: 'YYYY-MM-DD') => {
      return dayjs(date).format(format);
    };
    // @ts-ignore
    window.$t = nuxtApp.$i18n.t;
    // @ts-ignore
    window.$getCookie = (name) => {
      const cookie = useCookie(name);
      return cookie.value || {};
    };
  }
})

