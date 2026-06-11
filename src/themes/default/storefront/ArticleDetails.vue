<script setup>
import SearchForm from '@theme/storefront/components/article/SearchForm.vue'
import { ref, onMounted, computed } from 'vue';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useHelpers } from '@/composables/useHelpers';
import { usePostStore } from '@/stores/utils/post';
import Breadcrumb from '@theme/storefront/components/Breadcrumb.vue';

const route = useRoute();
const { t, locale } = useI18n();
const { translateItemField, translateItemObj } = useHelpers();
const postStore = usePostStore();
const loaded = ref(false);
const article = ref({});

const fetchArticle = async (slug) => {
    loaded.value = false;
    article.value = await postStore.retrieveArticleDetails(slug)
        .finally(() => loaded.value = true);
};

onMounted(() => fetchArticle(route.params.slug));

onBeforeRouteUpdate(async (to) => {
    if (to.params.slug !== route.params.slug) {
        await fetchArticle(to.params.slug);
    }
});

const articleComputed = computed(() => {
    if (article.value && Object.keys(article.value).length > 0) {
        const translation = translateItemObj(article.value, locale.value);

        document.title = translation?.meta_title || zucConfig.store_name;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = translation?.meta_description || '';

        return { translation };
    } else {
        return { translation: {} };
    }
});

const articleCategory = computed(() => {
    if (!article.value?.categories?.length) return null;
    return {
        name: translateItemField(article.value.categories[0], 'name', locale.value),
        slug: translateItemField(article.value.categories[0], 'slug', locale.value),
    };
});

const breadcrumbItems = computed(() => {
    const items = [
        { name: t('Home'), url: '/' },
        { name: t('Blog'), url: '/blog' },
    ];
    if (articleCategory.value) {
        items.push({ name: articleCategory.value.name, url: `/blog/category/${articleCategory.value.slug}` });
    }
    const title = articleComputed.value?.translation?.title;
    if (title) items.push({ name: title });
    return items;
});

const hasImage = (post) => (post.images && post.images.length > 0) || (post.image && post.image.trim() !== '');
const getImageSrc = (post) => {
    const path = post.images?.length > 0 ? post.images[0] : post.image;
    return `${zucConfig.store_url}/storage/${path}`;
};
</script>

<template>
    <div>
        <!-- Hero header with warm background -->
        <div class="bg-[#f5f0e8]">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">

                <!-- Skeleton Loading — Header -->
                <div v-if="!loaded" class="animate-pulse pb-10">
                    <div class="flex items-center gap-2 mb-8">
                        <div class="h-3 w-10 bg-white/60 rounded"></div>
                        <div class="h-3 w-3 bg-white/60 rounded"></div>
                        <div class="h-3 w-12 bg-white/60 rounded"></div>
                        <div class="h-3 w-3 bg-white/60 rounded"></div>
                        <div class="h-3 w-32 bg-white/60 rounded"></div>
                    </div>
                    <div class="max-w-3xl">
                        <div class="flex gap-2 mb-4">
                            <div class="h-3 w-16 bg-white/60 rounded-full"></div>
                            <div class="h-3 w-20 bg-white/60 rounded-full"></div>
                        </div>
                        <div class="h-9 w-3/4 bg-white/60 rounded mb-4"></div>
                        <div class="flex items-center gap-3">
                            <div class="h-3 w-16 bg-white/60 rounded"></div>
                            <div class="h-3 w-24 bg-white/60 rounded"></div>
                        </div>
                    </div>
                </div>

                <div v-if="loaded">
                    <!-- Breadcrumb -->
                    <Breadcrumb :items="breadcrumbItems" />

                    <!-- Article Header -->
                    <div class="max-w-3xl pb-10">
                        <!-- Category pills -->
                        <div v-if="article.categories?.length > 0" class="flex flex-wrap gap-3 mb-4">
                            <LocalizedLink
                                v-for="category in article.categories"
                                :key="category.category_id"
                                :to="`/blog/category/${translateItemField(category, 'slug', $i18n.locale)}`"
                                class="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#c8a45c] hover:text-[#b8943c] transition-colors"
                                style="font-family: var(--font-label)"
                            >
                                {{ translateItemField(category, 'name', $i18n.locale) }}
                            </LocalizedLink>
                        </div>

                        <!-- Title -->
                        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#2d2d2d] tracking-tight leading-tight !mb-0">
                            {{ articleComputed.translation.title }}
                        </h1>

                        <!-- Author + Date -->
                        <div class="flex items-center gap-2 mt-4">
                            <LocalizedLink
                                :to="`/blog/author/${article.author?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`"
                                class="text-sm text-[#8a8274] hover:text-[#c8a45c] transition-colors"
                                style="font-family: var(--font-label)"
                            >
                                {{ article.author }}
                            </LocalizedLink>
                            <span class="text-[#ddd5c5]">&middot;</span>
                            <span class="text-sm text-[#8a8274]" style="font-family: var(--font-label)">{{ article.date_added }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Hero Image — full bleed between header and content -->
        <div v-if="loaded && hasImage(article)" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-0">
            <div class="relative overflow-hidden rounded-xl bg-white shadow-sm">
                <img
                    :src="getImageSrc(article)"
                    :alt="articleComputed.translation.title"
                    @error.once="e => e.target.src = '/images/placeholder.webp'"
                    class="w-full object-cover aspect-[2/1]"
                />
            </div>
        </div>

        <!-- Skeleton Loading — Content area -->
        <div v-if="!loaded" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div class="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div class="lg:col-span-8 space-y-4">
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-5/6 bg-gray-100 rounded"></div>
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-4/6 bg-gray-100 rounded"></div>
                    <div class="h-4 w-full bg-gray-100 rounded"></div>
                    <div class="h-4 w-3/4 bg-gray-100 rounded"></div>
                </div>
                <div class="lg:col-span-4 space-y-6">
                    <div class="h-10 w-full bg-gray-100 rounded-lg"></div>
                    <div class="space-y-3">
                        <div class="h-3 w-24 bg-gray-100 rounded"></div>
                        <div class="h-4 w-full bg-gray-100 rounded"></div>
                        <div class="h-4 w-5/6 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Area -->
        <div v-if="loaded" class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

                <!-- Article Content -->
                <div class="lg:col-span-8">
                    <div class="prose prose-gray max-w-none text-[#2d2d2d] leading-relaxed" v-html="articleComputed.translation.content"></div>
                </div>

                <!-- Sidebar -->
                <div class="lg:col-span-4">
                    <div class="lg:sticky lg:top-24 space-y-8">

                        <!-- Search -->
                        <div>
                            <h3 class="text-xs font-semibold tracking-[0.15em] uppercase text-[#8a8274] !mb-3" style="font-family: var(--font-label)">{{ $t('Search') }}</h3>
                            <SearchForm />
                        </div>

                        <!-- Divider -->
                        <div class="border-t border-[#e0d8c8]" />

                        <!-- Related Articles -->
                        <div v-if="article.related_posts && article.related_posts.length > 0">
                            <h3 class="text-xs font-semibold tracking-[0.15em] uppercase text-[#8a8274] !mb-4" style="font-family: var(--font-label)">{{ $t('Related Articles') }}</h3>
                            <div class="space-y-4">
                                <LocalizedLink
                                    v-for="post in article.related_posts"
                                    :key="post.id"
                                    :to="`/article/${translateItemField(post, 'slug', $i18n.locale)}`"
                                    class="group block"
                                >
                                    <p class="text-sm font-medium text-[#2d2d2d] group-hover:text-[#c8a45c] transition-colors duration-300 line-clamp-2 !mb-0">
                                        {{ translateItemField(post, 'title', $i18n.locale) }}
                                    </p>
                                    <p class="text-xs text-[#8a8274] mt-1 !mb-0" style="font-family: var(--font-label)">{{ post.date_added }}</p>
                                </LocalizedLink>
                            </div>
                        </div>

                        <!-- You May Also Like -->
                        <div v-if="article.suggestion_posts && article.suggestion_posts.length > 0">
                            <div class="border-t border-[#e0d8c8] mb-8" />
                            <h3 class="text-xs font-semibold tracking-[0.15em] uppercase text-[#8a8274] !mb-4" style="font-family: var(--font-label)">{{ $t('You May Also Like') }}</h3>
                            <div class="space-y-4">
                                <LocalizedLink
                                    v-for="post in article.suggestion_posts"
                                    :key="post.id"
                                    :to="`/article/${translateItemField(post, 'slug', $i18n.locale)}`"
                                    class="group block"
                                >
                                    <p class="text-sm font-medium text-[#2d2d2d] group-hover:text-[#c8a45c] transition-colors duration-300 line-clamp-2 !mb-0">
                                        {{ translateItemField(post, 'title', $i18n.locale) }}
                                    </p>
                                    <p class="text-xs text-[#8a8274] mt-1 !mb-0" style="font-family: var(--font-label)">{{ post.date_added }}</p>
                                </LocalizedLink>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
