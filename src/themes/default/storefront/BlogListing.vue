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
    getPaginatedArticles({ sort: 'new' });
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

const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '') : '';
const hasImage = (article) => (article.images && article.images.length > 0) || (article.image && article.image.trim() !== '');
const getImageSrc = (article) => {
    const path = article.images?.length > 0 ? article.images[0] : article.image;
    return `${zucConfig.store_url}/storage/${path}`;
};
</script>

<template>
    <div class="bg-[#f5f0e8]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

            <!-- Page Header -->
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-14">
                <div>
                    <h1 class="text-3xl sm:text-4xl tracking-tight text-[#2d2d2d] uppercase !mb-0" style="font-family: var(--font-display)">
                        {{ $t('Blog') }}
                    </h1>
                    <p class="!mb-0 mt-2 text-sm text-[#8a8274]" v-if="paginationInfo.total">
                        {{ $t('listing.paginationArticle', { from: paginationInfo.from, to: paginationInfo.to, total: paginationInfo.total }) }}
                    </p>
                    <div class="mt-3 h-0.5 w-16 bg-[#c8a45c]" />
                </div>
                <div class="w-full sm:w-72">
                    <SearchForm />
                </div>
            </div>

            <!-- Skeleton Loading -->
            <div v-if="!loaded" class="space-y-10">
                <!-- Hero skeleton -->
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-pulse">
                    <div class="lg:col-span-3 aspect-[16/10] bg-white rounded-lg"></div>
                    <div class="lg:col-span-2 flex flex-col justify-center space-y-4 py-4">
                        <div class="h-3 w-20 bg-white/60 rounded-full"></div>
                        <div class="h-7 w-3/4 bg-white/60 rounded"></div>
                        <div class="h-4 w-full bg-white/60 rounded"></div>
                        <div class="h-4 w-2/3 bg-white/60 rounded"></div>
                        <div class="h-3 w-32 bg-white/60 rounded mt-2"></div>
                    </div>
                </div>
                <!-- Grid skeleton -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-x-8">
                    <div v-for="n in 4" :key="n" class="animate-pulse space-y-3">
                        <div class="aspect-[3/2] bg-white rounded-lg"></div>
                        <div class="h-3 w-16 bg-white/60 rounded-full"></div>
                        <div class="h-5 w-3/4 bg-white/60 rounded"></div>
                        <div class="h-3 w-full bg-white/60 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Featured Hero Card (first article) -->
            <div v-if="loaded && articles.length > 0" class="mb-10 sm:mb-14">
                <LocalizedLink
                    :to="`/article/${translateItemField(articles[0], 'slug', $i18n.locale)}`"
                    class="group grid grid-cols-1 lg:grid-cols-5 gap-0 items-stretch bg-white rounded-lg shadow-sm overflow-hidden transition-shadow duration-300 hover:shadow-md"
                >
                    <!-- Hero Image -->
                    <div class="lg:col-span-3 relative aspect-[16/10] overflow-hidden bg-white">
                        <img
                            v-if="hasImage(articles[0])"
                            :src="getImageSrc(articles[0])"
                            :alt="translateItemField(articles[0], 'title', $i18n.locale)"
                            @error.once="e => e.target.src = '/images/placeholder.webp'"
                            class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                        <div v-else class="absolute inset-0 flex items-center justify-center bg-white">
                            <svg class="size-14 text-[#ddd5c5]" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                            </svg>
                        </div>
                    </div>

                    <!-- Hero Content -->
                    <div class="lg:col-span-2 flex flex-col p-6">
                        <div v-if="articles[0].categories && articles[0].categories.length > 0" class="flex flex-wrap gap-2 mb-3">
                            <span
                                v-for="(category, index) in articles[0].categories"
                                :key="index"
                                class="text-[11px] font-semibold tracking-[0.1em] uppercase text-[#c8a45c]"
                                style="font-family: var(--font-label)"
                            >
                                {{ translateItemField(category, 'name', $i18n.locale) }}
                            </span>
                        </div>
                        <h2 class="text-xl sm:text-2xl font-semibold text-[#2d2d2d] group-hover:text-[#c8a45c] transition-colors duration-300 line-clamp-3 !mb-0" style="font-family: var(--font-body)">
                            {{ translateItemField(articles[0], 'title', $i18n.locale) }}
                        </h2>
                        <p
                            v-if="translateItemField(articles[0], 'summary', $i18n.locale)"
                            class="!mb-0 mt-3 text-sm leading-relaxed text-[#8a8274] line-clamp-3"
                            v-text="stripHtml(translateItemField(articles[0], 'summary', $i18n.locale))"
                        />
                        <div class="flex items-center gap-2 mt-4">
                            <span class="text-xs text-[#8a8274]" style="font-family: var(--font-label)">{{ articles[0].author }}</span>
                            <span class="text-[#ddd5c5]">&middot;</span>
                            <span class="text-xs text-[#8a8274]" style="font-family: var(--font-label)">{{ articles[0].date_added }}</span>
                        </div>
                        <span class="mt-4 inline-flex items-center gap-1 text-xs font-semibold tracking-[0.15em] uppercase text-[#8a8274] group-hover:text-[#c8a45c] transition-colors duration-300"
                            style="font-family: var(--font-label)">
                            {{ $t('Read more') }}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3 transition-transform duration-300 group-hover:translate-x-0.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </div>
                </LocalizedLink>
            </div>

            <!-- Separator -->
            <div v-if="loaded && articles.length > 1" class="border-t border-[#e0d8c8] mb-10 sm:mb-14" />

            <!-- Article Grid (remaining articles) -->
            <div v-if="loaded && articles.length > 1" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-x-8 mb-10">
                <ArticleCard
                    v-for="article in articles.slice(1)"
                    :key="article.id"
                    :article="article"
                />
            </div>

            <!-- Empty State -->
            <div v-if="loaded && articles.length === 0" class="flex flex-col items-center justify-center py-20">
                <svg class="size-16 text-[#ddd5c5] mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <p class="text-[#8a8274] text-lg font-medium !mb-0">{{ $t('No articles found') }}</p>
            </div>

            <!-- Pagination -->
            <div v-if="pageLinks.length > 0" class="flex justify-center items-center gap-1.5 mt-8">
                <template v-for="(link, index) in pageLinks" :key="index">
                    <LocalizedLink
                        :to="{
                            path: `/article/listing`,
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
