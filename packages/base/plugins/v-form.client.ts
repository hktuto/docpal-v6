import { clientApi, adminApi } from 'api';
import dayjs from 'dayjs';

/** 延迟加载 v-form-designer，避免打包后与主 chunk 的循环依赖导致 "Cannot access 'Ve' before initialization" */
let vFormReadyPromise: Promise<void> | null = null;

// @ts-ignore
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.$vFormReady = (): Promise<void> => {
    if (!vFormReadyPromise) {
      vFormReadyPromise = (async () => {
        // @ts-expect-error - v-form doesn't have type declarations
        const VForm3Module = await import('v-form-designer');
        await import('v-form-designer/dist/designer.style.css');
        const VForm3 = VForm3Module.default;
        nuxtApp.vueApp.use(VForm3);
      })();
    }
    return vFormReadyPromise;
  };

  if (typeof window !== 'undefined') {
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

