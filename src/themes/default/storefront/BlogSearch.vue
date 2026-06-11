<script setup>
import SearchForm from '@theme/storefront/components/article/SearchForm.vue'
import ArticleCard from '@theme/storefront/components/article/ArticleCard.vue'
import { ref, onMounted } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useHelpers } from '@/composables/useHelpers';
import { usePostStore } from '@/stores/utils/post';

const route = useRoute();
const { t, locale } = useI18n();
const { translateItemField, getUrlParams, getUrlParam } = useHelpers();
const postStore = usePostStore();
const loaded = ref(false);

const articles = ref([]);
const pageLinks = ref([]);
const paginationInfo = ref({});

onMounted(async () => {
    getPaginatedArticles({ sort: 'new', keyword: route.query.keyword });
});

onBeforeRouteUpdate(async (to, from) => {
    if (to.query.keyword !== from.query.keyword || to.query.page !== from.query.page) {
        getPaginatedArticles(to.query);
    }
});

const getPaginatedArticles = async (obj) => {
    const res = await postStore.fetchPosts(obj);
    articles.value = res.paginator.data;
    pageLinks.value = res.paginator.links;
    paginationInfo.value = { from: res.paginator.from, to: res.paginator.to, total: res.paginator.total };
    loaded.value = true;
}

</script>

<template>
    <div class="bg-[#f5f0e8]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

            <!-- Search Header -->
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14">
                <div>
                    <h1 class="text-3xl sm:text-4xl tracking-tight text-[#2d2d2d] uppercase !mb-0" style="font-family: var(--font-display)">
                        {{ $t('Search results') }}
                    </h1>
                    <p class="!mb-0 mt-2 text-sm text-[#8a8274]">
                        {{ $t('Search results for') }} "<span class="text-[#2d2d2d] font-medium">{{ route.query.keyword }}</span>"
                        <template v-if="paginationInfo.total">
                            &mdash; {{ $t('listing.paginationArticle', { from: paginationInfo.from, to: paginationInfo.to, total: paginationInfo.total }) }}
                        </template>
                    </p>
                    <div class="mt-3 h-0.5 w-16 bg-[#c8a45c]" />
                </div>
                <div class="w-full sm:w-72">
                    <SearchForm :initial-keyword="route.query.keyword || ''" />
                </div>
            </div>

            <!-- Skeleton Loading -->
            <div v-if="!loaded" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-x-8">
                <div v-for="n in 4" :key="n" class="animate-pulse space-y-3">
                    <div class="aspect-[3/2] bg-white rounded-lg"></div>
                    <div class="h-3 w-16 bg-white/60 rounded-full"></div>
                    <div class="h-5 w-3/4 bg-white/60 rounded"></div>
                    <div class="h-3 w-full bg-white/60 rounded"></div>
                </div>
            </div>

            <!-- Article Grid -->
            <div v-if="loaded && articles.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-x-8 mb-10">
                <ArticleCard
                    v-for="article in articles"
                    :key="article.id"
                    :article="article"
                />
            </div>

            <!-- Empty State -->
            <div v-if="loaded && articles.length === 0" class="flex flex-col items-center justify-center py-20">
                <svg class="size-16 text-[#ddd5c5] mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p class="text-[#8a8274] text-lg font-medium !mb-0">{{ $t('No articles found') }}</p>
                <p class="text-[#b5ad9e] text-sm mt-1 !mb-0">{{ $t('Try a different search term') }}</p>
            </div>

            <!-- Pagination -->
            <div v-if="pageLinks.length > 0" class="flex justify-center items-center gap-1.5 mt-8">
                <template v-for="(link, index) in pageLinks" :key="index">
                    <LocalizedLink
                        :to="{
                            path: `/blog/search`,
                            query: { ...getUrlParams(['page']), page: getUrlParam(link.url, 'page') }
                        }"
                        :class="[
                            'disabled-active rounded-lg px-3.5 py-2 text-sm transition-colors',
                            link.active
                                ? 'bg-[#2d2d2d] text-white'
                                : 'text-[#2d2d2d] hover:bg-white/60'
                        ]"
                        style="font-family: var(--font-label)"
                    >
                        <span v-html="link.label"></span>
                    </LocalizedLink>
                </template>
            </div>
        </div>
    </div>
</template>
