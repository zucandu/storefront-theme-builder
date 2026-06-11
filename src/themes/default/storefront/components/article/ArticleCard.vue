<script setup>
import { useHelpers } from '@/composables/useHelpers';
const { translateItemField } = useHelpers();

defineProps({
    article: {
        type: Object,
        required: true,
    },
});

const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '') : '';
const hasImage = (article) => (article.images && article.images.length > 0) || (article.image && article.image.trim() !== '');
const getImageSrc = (article) => {
    const path = article.images?.length > 0 ? article.images[0] : article.image;
    return `${zucConfig.store_url}/storage/${path}`;
};
</script>

<template>
    <article class="group flex flex-col bg-white rounded-lg shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md">
        <!-- Image -->
        <LocalizedLink
            :to="`/article/${translateItemField(article, 'slug', $i18n.locale)}`"
            class="relative aspect-[3/2] overflow-hidden bg-white"
        >
            <img
                v-if="hasImage(article)"
                :src="getImageSrc(article)"
                :alt="translateItemField(article, 'title', $i18n.locale)"
                @error.once="e => e.target.src = '/images/placeholder.webp'"
                class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
            />
            <div v-else class="absolute inset-0 flex items-center justify-center bg-white">
                <svg class="size-10 text-[#ddd5c5]" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
            </div>
        </LocalizedLink>

        <!-- Content -->
        <div class="flex flex-col flex-1 p-4">
            <!-- Category pills -->
            <div v-if="article.categories && article.categories.length > 0" class="flex flex-wrap gap-1.5 mb-2">
                <LocalizedLink
                    v-for="(category, index) in article.categories"
                    :key="index"
                    :to="`/blog/category/${translateItemField(category, 'slug', $i18n.locale)}`"
                    class="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#c8a45c] hover:text-[#b8943c] transition-colors"
                    style="font-family: var(--font-label)"
                >
                    {{ translateItemField(category, 'name', $i18n.locale) }}
                </LocalizedLink>
            </div>

            <!-- Title -->
            <h2 class="text-[15px] font-semibold leading-snug text-[#2d2d2d] line-clamp-2 !mb-0">
                <LocalizedLink
                    :to="`/article/${translateItemField(article, 'slug', $i18n.locale)}`"
                    class="group-hover:text-[#c8a45c] transition-colors duration-300"
                >
                    {{ translateItemField(article, 'title', $i18n.locale) }}
                </LocalizedLink>
            </h2>

            <!-- Summary -->
            <p
                v-if="translateItemField(article, 'summary', $i18n.locale)"
                class="!mb-0 mt-2 text-sm leading-relaxed text-[#8a8274] line-clamp-2"
                v-text="stripHtml(translateItemField(article, 'summary', $i18n.locale))"
            />

            <!-- Author + Date -->
            <div class="flex items-center gap-2 mt-3">
                <LocalizedLink
                    :to="`/blog/author/${article.author.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`"
                    class="text-xs text-[#8a8274] hover:text-[#c8a45c] transition-colors"
                    style="font-family: var(--font-label)"
                >
                    {{ article.author }}
                </LocalizedLink>
                <span class="text-[#ddd5c5]">&middot;</span>
                <span class="text-xs text-[#8a8274]" style="font-family: var(--font-label)">{{ article.date_added }}</span>
            </div>
        </div>
    </article>
</template>
