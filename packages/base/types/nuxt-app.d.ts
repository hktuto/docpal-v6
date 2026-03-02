/**
 * 扩展 NuxtApp，供 v-form 延迟加载使用
 */
declare module '#app' {
    interface NuxtApp {
        $vFormReady: () => Promise<void>;
    }
}
