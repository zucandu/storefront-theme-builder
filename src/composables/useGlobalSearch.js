import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/catalog/product';

const DEBOUNCE_MS = 300;

export function useGlobalSearch() {
    const router = useRouter();
    const query = ref('');
    const isLoading = ref(false);
    const suggestions = ref([]);
    let debounceTimer = null;

    const searchProducts = (keyword) => {
        clearTimeout(debounceTimer);
        if (!keyword || keyword.length < 2) {
            suggestions.value = [];
            isLoading.value = false;
            return;
        }
        isLoading.value = true;
        debounceTimer = setTimeout(async () => {
            try {
                const productStore = useProductStore();
                suggestions.value = await productStore.getSuggestions(keyword);
            } catch {
                suggestions.value = [];
            } finally {
                isLoading.value = false;
            }
        }, DEBOUNCE_MS);
    };

    const goToSearch = () => {
        const trimmed = query.value.trim();
        if (trimmed) {
            router.push({ name: 'search', query: { keyword: trimmed } });
            query.value = '';
            suggestions.value = [];
        }
    };

    return {
        query,
        isLoading,
        suggestions,
        searchProducts,
        goToSearch,
    };
}
