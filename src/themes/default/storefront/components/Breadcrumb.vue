<script setup>
import { computed, onBeforeUnmount } from 'vue';
import { ChevronRightIcon } from '@heroicons/vue/24/outline';

/**
 * items: Array<{ name: string, url?: string }>
 * Items with url render as links, the last item (no url) renders as plain text.
 */
const props = defineProps({
    items: {
        type: Array,
        required: true,
    },
});

// JSON-LD BreadcrumbList
const SCRIPT_ID = 'breadcrumb-jsonld';

const jsonLd = computed(() => {
    const list = props.items;
    if (!list?.length) return null;
    const baseUrl = window.location.origin;
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: list.map((item, idx) => {
            const entry = { '@type': 'ListItem', position: idx + 1, name: item.name };
            if (item.url) entry.item = `${baseUrl}${item.url}`;
            return entry;
        }),
    });
});

const injectSchema = () => {
    if (!jsonLd.value) return;
    let el = document.getElementById(SCRIPT_ID);
    if (!el) {
        el = document.createElement('script');
        el.type = 'application/ld+json';
        el.id = SCRIPT_ID;
        document.head.appendChild(el);
    }
    el.textContent = jsonLd.value;
};

// Inject on first render — parent calls after data is loaded
injectSchema();

onBeforeUnmount(() => {
    document.getElementById(SCRIPT_ID)?.remove();
});
</script>

<template>
    <nav class="flex items-center gap-1.5 text-sm mb-8" style="font-family: var(--font-label)">
        <template v-for="(item, idx) in items" :key="idx">
            <ChevronRightIcon v-if="idx > 0" class="size-3.5 text-[#c8a45c] shrink-0" />
            <LocalizedLink
                v-if="item.url"
                :to="item.url"
                class="text-[#8a8274] hover:text-[#2d2d2d] transition-colors"
            >
                {{ item.name }}
            </LocalizedLink>
            <span v-else class="text-[#2d2d2d] line-clamp-1">
                {{ item.name }}
            </span>
        </template>
    </nav>
</template>
