<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRedirect } from '@/composables/useRedirect';

const props = defineProps({
    initialKeyword: {
        type: String,
        default: ''
    }
});

const { redirectTo } = useRedirect();
const searchQuery = ref(props.initialKeyword);
const onSearch = () => {
    if (searchQuery.value && searchQuery.value.trim()) {
        redirectTo('/blog/search', { query: { keyword: searchQuery.value.trim() } });
    }
}
</script>

<template>
    <form @submit.prevent="onSearch" class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <svg class="h-4 w-4 text-[#8a8274]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
        </div>
        <input
            v-model="searchQuery"
            type="search"
            :placeholder="$t('Search articles...')"
            class="w-full rounded-lg border border-[#e0d8c8] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2d2d2d] placeholder:text-[#b5ad9e] focus:outline-hidden focus:ring-2 focus:ring-[#c8a45c]/20 focus:border-[#c8a45c] transition-colors"
        />
    </form>
</template>
