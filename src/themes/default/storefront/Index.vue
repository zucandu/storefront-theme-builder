<script setup>
import { ref, onMounted } from 'vue'
import { useBannerStore } from '@/stores/utils/banner'
import { usePostStore } from '@/stores/utils/post'
import { useProductStore } from '@/stores/catalog/product'
import { useRestockModal } from '@/composables/useRestockModal'

import HomeSkeleton from './components/home/HomeSkeleton.vue'
import HeroSlideshow from './components/home/HeroSlideshow.vue'
import ServiceBar from './components/home/ServiceBar.vue'
import FeaturedProducts from './components/home/FeaturedProducts.vue'
import BlogPreview from './components/home/BlogPreview.vue'
import RestockModal from './components/RestockModal.vue'

const bannerStore = useBannerStore()
const postStore = usePostStore()
const productStore = useProductStore()
const { isRestockModalOpen, restockForm, submitting, openRestockModal, closeRestockModal, restockNotify, selectedProductName } = useRestockModal()

const loading = ref(true)
const slideshow = ref([])
const spotlight = ref({ new: [], sale: [], featured: [] })
const latestPosts = ref([])

onMounted(async () => {
    const [, spotlightData, postsData] = await Promise.all([
        bannerStore.fetchBanners(),
        productStore.fetchSpotlightProducts(),
        postStore.fetchPosts({ sort: 'new', limit: 9 }),
    ])

    slideshow.value = bannerStore.banners.filter(b => b.group === 'slideshow')
    spotlight.value = spotlightData || { new: [], sale: [], featured: [] }
    latestPosts.value = postsData?.paginator?.data || []
    loading.value = false
})

</script>

<template>
    <div>

        <!-- Skeleton while loading -->
        <HomeSkeleton v-if="loading" />

        <!-- Actual content -->
        <template v-else>
            <!-- 1. Hero Slideshow -->
            <HeroSlideshow :banners="slideshow" />

            <!-- 2. Service Bar -->
            <ServiceBar />

            <!-- 3. New Arrivals -->
            <FeaturedProducts
                :title="$t('New Arrivals')"
                :subtitle="$t('Fresh additions to our collection')"
                :products="spotlight.new?.slice(0, 5)"
                badge="new"
                @open-restock-modal="openRestockModal"
            />

            <!-- 4. Blog Preview -->
            <BlogPreview :posts="latestPosts" />

            <!-- Restock Notification Modal -->
            <RestockModal
                :show="isRestockModalOpen"
                :product-name="selectedProductName()"
                :form="restockForm"
                :submitting="submitting"
                @close="closeRestockModal"
                @submit="restockNotify"
            />

        </template>
    </div>
</template>
