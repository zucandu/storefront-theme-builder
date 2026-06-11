import { ref } from 'vue';

export function useStorefrontIframeHooks(hookPoint) {
    const hooks = ref([]);
    const loading = ref(false);

    const fetchHooks = async () => {
        hooks.value = [];
    };

    return { hooks, loading, fetchHooks };
}
