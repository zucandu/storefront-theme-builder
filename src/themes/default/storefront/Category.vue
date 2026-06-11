<script setup>
import ProductCard from '@theme/storefront/components/listing/ProductCard.vue'
import FilterSidebar from '@theme/storefront/components/listing/FilterSidebar.vue'
import SelectedFiltersBar from '@theme/storefront/components/listing/SelectedFiltersBar.vue'
import Breadcrumb from '@theme/storefront/components/Breadcrumb.vue'
import RestockModal from '@theme/storefront/components/RestockModal.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'

import {
    Dialog, DialogPanel,
    TransitionChild, TransitionRoot,
} from '@headlessui/vue'
import {
    XMarkIcon,
    AdjustmentsHorizontalIcon,
} from '@heroicons/vue/24/outline'

import { ref, onMounted, computed, watch } from 'vue';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import { useHelpers } from '@/composables/useHelpers';
import { useRestockModal } from '@/composables/useRestockModal';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

import { useListingStore } from '@/stores/catalog/listing';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const listingStore = useListingStore();

const { translateItemObj, getUrlParams, getUrlParam } = useHelpers();
const { isRestockModalOpen, restockForm, submitting, openRestockModal, closeRestockModal, restockNotify, selectedProductName } = useRestockModal();

const { hooks: categoryTopHooks, fetchHooks: fetchCategoryTopHooks } = useStorefrontIframeHooks('storefront_category_top');
const { hooks: categoryBottomHooks, fetchHooks: fetchCategoryBottomHooks } = useStorefrontIframeHooks('storefront_category_bottom');

const loaded = ref(false);
const resetFilter = ref(false);
const sortBy = ref(getUrlParam(window.location.href, 'sort') || `sorting`);
const suppressQuerySync = ref(false);
const mobileFiltersOpen = ref(false);

const parseFlt = (v) => {
    if (!v) return [];
    const raw = Array.isArray(v) ? v.join('|') : String(v);
    return decodeURIComponent(raw)
        .split('|')
        .map(s => s.trim())
        .filter(Boolean);
};

const hydrateFromRoute = (r) => {
    selectedFilters.value = parseFlt(r.query.flt);
    sortBy.value = r.query.sort || 'sorting';
};

const sortByItems = ref([
    { field: 'popular', name: 'popular' },
    { field: 'price_asc', name: 'Price: Lowest First' },
    { field: 'price_desc', name: 'Price: Highest First' },
    { field: 'date_asc', name: 'Date Added: Old to New' },
    { field: 'date_desc', name: 'Date Added: New to Old' },
    { field: 'sku', name: 'Model Code: A to Z' },
    { field: 'sorting', name: 'Default Sorting' },
]);
const selectedFilters = ref([]);

onMounted(async () => {
    fetchCategoryTopHooks();
    fetchCategoryBottomHooks();

    suppressQuerySync.value = true;
    hydrateFromRoute(route);

    await listingStore.fetchProductsByCategory(route.params.slug, getUrlParams());

	suppressQuerySync.value = false;
    loaded.value = true;
});

const listingComputed = computed(() => {
    const objectTranslation = translateItemObj(listingStore.object, locale.value);

    // Set meta tags
	document.title = objectTranslation?.meta_title || zucConfig.store_name;
	const metaDesc = document.querySelector('meta[name="description"]');
	if (metaDesc) metaDesc.content = objectTranslation?.meta_description || '';

    return { objectTranslation };
});

// Ancestor breadcrumb chain (root → ... → parent, excluding current category)
const ancestorBreadcrumbs = computed(() => {
    return listingStore.ancestors.map(cat => translateItemObj(cat, locale.value));
});

// Breadcrumb items
const breadcrumbItems = computed(() => {
    const items = [{ name: t('Home'), url: '/' }];
    for (const crumb of ancestorBreadcrumbs.value) {
        items.push({ name: crumb.name, url: `/category/${crumb.slug}` });
    }
    const name = listingComputed.value?.objectTranslation?.name;
    if (name) items.push({ name });
    return items;
});

// Perform actions when the route changes (same-component navigation, back/forward)
onBeforeRouteUpdate(async (to, from, next) => {
    suppressQuerySync.value = true;
    hydrateFromRoute(to);

    await listingStore.fetchProductsByCategory(
        to.params.slug,
        { ...to.query, sort: to.query.sort || 'sorting' }
    );

    next();
    suppressQuerySync.value = false;
});

// Watch filters
watch(
    () => selectedFilters.value,
    (newFilters, oldFilters) => {
        if (suppressQuerySync.value) return;

        const toStr = (arr) => Array.isArray(arr) ? arr.join('|') : '';
        const newStr = toStr(newFilters);
        const oldStr = toStr(oldFilters);
        if (newStr === oldStr) return;

        // Keeps page if filters do not change
        const fltInUrlStr = toStr(parseFlt(route.query.flt));
        if (newStr === fltInUrlStr) return;

        // Filters changed, set new queries
        const queries = { ...route.query };
        if (newFilters && newFilters.length) queries.flt = newStr;
        else delete queries.flt;

        delete queries.page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.replace({ query: queries });
    },
    { immediate: false }
);

// Watch sort
watch(
    () => sortBy.value,
    (newSort, oldSort) => {
        if (suppressQuerySync.value) return;
        if (newSort === oldSort) return;
        if (newSort === route.query.sort) return;

        const queries = { ...route.query };
        if (newSort) queries.sort = newSort; else delete queries.sort;

        delete queries.page;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.replace({ query: queries });
    },
    { immediate: false }
);

const hasFilters = computed(() => {
    if (!listingStore.filters) return false;
    const f = listingStore.filters;
    return (f.base && Object.keys(f.base).length > 0)
        || (f.attribute && Object.keys(f.attribute).length > 0)
        || (f.customize && Object.keys(f.customize).length > 0)
        || (f.price && Object.keys(f.price).length > 0);
});

</script>

<template>
    <div>

        <!-- Skeleton loading state -->
        <template v-if="!loaded">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
                    <!-- Breadcrumb skeleton -->
                    <div class="flex items-center gap-2 mb-8">
                        <div class="h-3 w-10 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-3 w-3 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-3 w-24 bg-[#e0d8c8] rounded animate-pulse"></div>
                    </div>

                    <!-- Title skeleton -->
                    <div class="mb-8">
                        <div class="h-10 w-48 bg-[#e0d8c8] rounded animate-pulse mb-3"></div>
                        <div class="h-4 w-32 bg-[#e0d8c8]/60 rounded animate-pulse"></div>
                    </div>

                    <!-- Toolbar skeleton -->
                    <div class="flex items-center justify-between mb-8 pb-6 border-b border-[#e0d8c8]">
                        <div class="h-4 w-36 bg-[#e0d8c8] rounded animate-pulse"></div>
                        <div class="h-10 w-48 bg-[#e0d8c8] rounded animate-pulse"></div>
                    </div>

                    <!-- Grid skeleton -->
                    <div class="flex gap-8">
                        <!-- Sidebar skeleton (desktop only) -->
                        <div class="hidden lg:block w-64 shrink-0 space-y-8">
                            <div v-for="i in 3" :key="i">
                                <div class="h-5 w-24 bg-[#e0d8c8] rounded animate-pulse mb-4"></div>
                                <div class="space-y-3">
                                    <div v-for="j in 4" :key="j" class="flex items-center gap-2">
                                        <div class="h-4 w-4 bg-[#e0d8c8] rounded animate-pulse"></div>
                                        <div class="h-3 bg-[#e0d8c8] rounded animate-pulse" :style="{ width: (60 + j * 15) + 'px' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Product grid skeleton -->
                        <div class="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                            <div v-for="i in 8" :key="i" class="animate-pulse">
                                <div class="aspect-square bg-[#e0d8c8] rounded-2xl mb-4"></div>
                                <div class="px-1 space-y-2">
                                    <div class="h-3 w-16 bg-[#e0d8c8] rounded"></div>
                                    <div class="h-4 w-full bg-[#e0d8c8] rounded"></div>
                                    <div class="h-4 w-2/3 bg-[#e0d8c8]/60 rounded"></div>
                                    <div class="h-4 w-20 bg-[#e0d8c8] rounded mt-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </template>

        <!-- Loaded content -->
        <template v-else>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

                <!-- Breadcrumb -->
                <Breadcrumb :items="breadcrumbItems" />

                <!-- Storefront hook: category top -->
                <StorefrontIframeHook
                    v-for="hook in categoryTopHooks" :key="hook.id"
                    :hook="hook" hook-point="storefront_category_top"
                    :query-params="{ category_id: listingStore.listingObject?.id, lang: locale }"
                />

                <!-- Category header -->
                <div class="mb-8">
                    <h1 class="text-4xl sm:text-5xl tracking-wide text-[#2d2d2d]" style="font-family: var(--font-display)">
                        {{ listingComputed.objectTranslation?.name }}
                    </h1>
                    <div class="w-12 h-0.5 bg-[#c8a45c] mt-3"></div>
                    <p v-if="listingComputed.objectTranslation?.description"
                       class="!mb-0 mt-4 text-sm text-[#8a8274] max-w-2xl leading-relaxed"
                       v-html="listingComputed.objectTranslation.description"
                    ></p>
                </div>

                <!-- Toolbar -->
                <div class="flex items-center justify-between mb-6 pb-5 border-b border-[#e0d8c8]">
                    <div class="flex items-center gap-4">
                        <!-- Mobile filter toggle -->
                        <button
                            v-if="hasFilters"
                            type="button"
                            class="lg:hidden inline-flex items-center gap-2 text-sm font-medium text-[#2d2d2d] hover:text-[#c8a45c] transition-colors"
                            @click="mobileFiltersOpen = true"
                        >
                            <AdjustmentsHorizontalIcon class="size-5" />
                            {{ $t('Filters') }}
                            <span v-if="selectedFilters.length > 0" class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-[#c8a45c] text-[#1a1a1a] text-xs font-medium">
                                {{ selectedFilters.length }}
                            </span>
                        </button>

                        <!-- Product count -->
                        <p v-if="+listingStore.paginationInfo.total > 0" class="!mb-0 text-sm text-[#8a8274]">
                            {{ $t('listing.paginationProduct', {
                                from: listingStore.paginationInfo.from,
                                to: listingStore.paginationInfo.to,
                                total: listingStore.paginationInfo.total
                            }) }}
                        </p>
                    </div>

                    <!-- Sort dropdown -->
                    <div class="flex items-center gap-2">
                        <label for="sort-by" class="hidden sm:block text-sm text-[#8a8274]">{{ $t('Sort By') }}</label>
                        <select
                            id="sort-by"
                            v-model="sortBy"
                            class="text-sm border-[#e0d8c8] rounded-lg py-2 pl-3 pr-8 bg-white text-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-[#c8a45c]/20 focus:border-[#c8a45c] transition-colors"
                        >
                            <option v-for="item in sortByItems" :key="item.field" :value="item.field">
                                {{ item.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Selected filters bar -->
                <SelectedFiltersBar
                    :filters="listingStore.filters"
                    :selected-filters="selectedFilters"
                    class="mb-6"
                />

                <!-- Main content area -->
                <div class="flex gap-8">
                    <!-- Desktop sidebar -->
                    <aside v-if="hasFilters" class="hidden lg:block w-64 shrink-0">
                        <FilterSidebar
                            v-model:selected="selectedFilters"
                            :filters="listingStore.filters"
                            :reset-filter="resetFilter"
                        />
                    </aside>

                    <!-- Product grid area -->
                    <div class="flex-1 min-w-0">
                        <template v-if="+listingStore.paginationInfo.total > 0">
                            <!-- Product grid -->
                            <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                                <div v-for="product in listingStore.products" :key="product.id">
                                    <ProductCard :product="product" @open-restock-modal="openRestockModal" />
                                </div>
                            </div>

                            <!-- Pagination -->
                            <nav v-if="listingStore.paginationLinks && listingStore.paginationLinks.length > 3"
                                 class="mt-12 flex items-center justify-center gap-1"
                            >
                                <template v-for="(link, index) in listingStore.paginationLinks" :key="index">
                                    <LocalizedLink
                                        v-if="link.url"
                                        :to="{
                                            path: `/category/${$route.params.slug}`,
                                            query: { ...getUrlParams(['page']), page: getUrlParam(link.url, 'page') }
                                        }"
                                        :class="[
                                            'inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-sm rounded-lg transition-colors',
                                            link.active
                                                ? 'bg-[#c8a45c] text-white font-medium'
                                                : 'text-[#8a8274] hover:bg-[#c8a45c]/10'
                                        ]"
                                    >
                                        <span v-html="link.label"></span>
                                    </LocalizedLink>
                                    <span
                                        v-else
                                        :class="[
                                            'inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-sm rounded-lg',
                                            link.active
                                                ? 'bg-[#c8a45c] text-white font-medium'
                                                : 'text-[#e0d8c8] cursor-default'
                                        ]"
                                    >
                                        <span v-html="link.label"></span>
                                    </span>
                                </template>
                            </nav>
                        </template>

                        <!-- Empty state -->
                        <div v-else class="flex flex-col items-center justify-center py-24 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-16 text-[#e0d8c8] mb-6">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                            </svg>
                            <p class="!mb-0 text-lg text-[#2d2d2d]" style="font-family: var(--font-display)">
                                {{ $t('No products found') }}
                            </p>
                            <p class="!mb-0 mt-2 text-sm text-[#8a8274]">
                                {{ $t('Try adjusting your filters or browse other categories.') }}
                            </p>
                            <button
                                v-if="selectedFilters.length > 0"
                                type="button"
                                class="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2d2d2d] bg-white border border-[#e0d8c8] rounded-lg hover:bg-[#f5f0e8] transition-colors"
                                @click="selectedFilters = []"
                            >
                                {{ $t('Clear all filters') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Storefront hook: category bottom -->
            <StorefrontIframeHook
                v-for="hook in categoryBottomHooks" :key="hook.id"
                :hook="hook" hook-point="storefront_category_bottom"
                :query-params="{ category_id: listingStore.listingObject?.id, lang: locale }"
            />
        </template>

        <!-- Restock Notification Modal -->
        <RestockModal
            :show="isRestockModalOpen"
            :product-name="selectedProductName()"
            :form="restockForm"
            :submitting="submitting"
            @close="closeRestockModal"
            @submit="restockNotify"
        />

        <!-- Mobile filter drawer -->
        <TransitionRoot as="template" :show="mobileFiltersOpen">
            <Dialog as="div" class="relative z-50 lg:hidden" @close="mobileFiltersOpen = false">
                <!-- Backdrop -->
                <TransitionChild
                    as="template"
                    enter="transition-opacity ease-linear duration-300"
                    enter-from="opacity-0"
                    enter-to="opacity-100"
                    leave="transition-opacity ease-linear duration-300"
                    leave-from="opacity-100"
                    leave-to="opacity-0"
                >
                    <div class="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                </TransitionChild>

                <div class="fixed inset-0 z-50 flex">
                    <TransitionChild
                        as="template"
                        enter="transition ease-in-out duration-300 transform"
                        enter-from="-translate-x-full"
                        enter-to="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leave-from="translate-x-0"
                        leave-to="-translate-x-full"
                    >
                        <DialogPanel class="relative flex w-full max-w-sm flex-col bg-white shadow-xl">
                            <!-- Drawer header -->
                            <div class="flex items-center justify-between px-5 py-4 border-b border-[#e0d8c8]">
                                <h2 class="text-lg text-[#2d2d2d]" style="font-family: var(--font-label)">{{ $t('Filters') }}</h2>
                                <button
                                    type="button"
                                    class="flex items-center justify-center size-8 rounded-full text-[#8a8274] hover:text-[#2d2d2d] hover:bg-[#f5f0e8] transition-colors"
                                    @click="mobileFiltersOpen = false"
                                >
                                    <XMarkIcon class="size-5" />
                                </button>
                            </div>

                            <!-- Filter content -->
                            <div class="flex-1 overflow-y-auto px-5 py-4">
                                <FilterSidebar
                                    v-model:selected="selectedFilters"
                                    :filters="listingStore.filters"
                                    :reset-filter="resetFilter"
                                />
                            </div>

                            <!-- Drawer footer -->
                            <div class="border-t border-[#e0d8c8] px-5 py-4">
                                <button
                                    type="button"
                                    class="w-full rounded-lg bg-[#1a1a1a] py-3 text-sm font-medium text-white hover:bg-[#333] transition-colors"
                                    @click="mobileFiltersOpen = false"
                                >
                                    {{ $t('Show results') }}
                                </button>
                            </div>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </Dialog>
        </TransitionRoot>
    </div>
</template>