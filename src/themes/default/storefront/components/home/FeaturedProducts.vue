<script setup>
import ProductCard from '../listing/ProductCard.vue'

defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: null },
    products: { type: Array, default: () => [] },
    badge: { type: String, default: null },
    variant: { type: String, default: 'default' } // 'default' | 'dark' | 'carousel'
})

const emit = defineEmits(['open-restock-modal', 'open-review-modal', 'open-discount-modal'])
</script>

<template>
    <!-- ========== DEFAULT: Standard grid ========== -->
    <section
        v-if="products.length > 0 && variant === 'default'"
        class="py-12 sm:py-20 bg-white"
    >
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="mb-10 sm:mb-12">
                <h2 class="text-3xl sm:text-4xl tracking-tight text-[#2d2d2d] uppercase" style="font-family: var(--font-display)">{{ title }}</h2>
                <p v-if="subtitle" class="mt-2 text-sm text-[#8a8274]">{{ subtitle }}</p>
                <!-- Gold accent line -->
                <div class="mt-3 h-0.5 w-16 bg-[#c8a45c]" />
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
                <ProductCard
                    v-for="product in products"
                    :key="product.id"
                    :product="product"
                    :badge="badge"
                    :variant="variant"
                    @open-restock-modal="emit('open-restock-modal', $event)"
                    @open-review-modal="emit('open-review-modal', $event)"
                    @open-discount-modal="emit('open-discount-modal', $event)"
                />
            </div>
        </div>
    </section>

    <!-- ========== DARK: Contrasting section for sales ========== -->
    <section
        v-else-if="products.length > 0 && variant === 'dark'"
        class="py-12 sm:py-20 bg-[#1a1a1a]"
    >
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="mb-10 sm:mb-12">
                <div class="flex items-center gap-3 mb-3">
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-[#b44c3a]/15 px-3 py-1 text-[11px] font-bold text-[#b44c3a] uppercase tracking-widest" style="font-family: var(--font-label)">
                        <span class="size-1.5 rounded-full bg-[#b44c3a] animate-pulse" />
                        {{ $t('Hot Deals') }}
                    </span>
                </div>
                <h2 class="text-3xl sm:text-4xl tracking-tight text-white uppercase" style="font-family: var(--font-display)">{{ title }}</h2>
                <p v-if="subtitle" class="mt-2 text-sm text-gray-500">{{ subtitle }}</p>
                <div class="mt-3 h-0.5 w-16 bg-[#c8a45c]" />
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12">
                <ProductCard
                    v-for="product in products"
                    :key="product.id"
                    :product="product"
                    :badge="badge"
                    :variant="variant"
                    @open-restock-modal="emit('open-restock-modal', $event)"
                    @open-review-modal="emit('open-review-modal', $event)"
                    @open-discount-modal="emit('open-discount-modal', $event)"
                />
            </div>
        </div>
    </section>

    <!-- ========== CAROUSEL: Horizontal scroll ========== -->
    <section
        v-else-if="products.length > 0 && variant === 'carousel'"
        class="py-12 sm:py-20 overflow-hidden bg-white"
    >
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="mb-8 sm:mb-10">
                <h2 class="text-3xl sm:text-4xl tracking-tight text-[#2d2d2d] uppercase" style="font-family: var(--font-display)">{{ title }}</h2>
                <p v-if="subtitle" class="mt-2 text-sm text-[#8a8274]">{{ subtitle }}</p>
                <div class="mt-3 h-0.5 w-16 bg-[#c8a45c]" />
            </div>
        </div>

        <!-- Scrollable container — bleeds to edges on mobile -->
        <div class="relative mx-auto max-w-[100rem]">
            <div class="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-8 px-4 sm:px-[max(1.5rem,calc((100%-80rem)/2+1.5rem))] scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div
                    v-for="product in products"
                    :key="product.id"
                    class="w-[60%] sm:w-[40%] md:w-[30%] lg:w-[22%] xl:w-[18%] shrink-0 snap-start"
                >
                    <ProductCard
                        :product="product"
                        :badge="badge"
                        size="compact"
                        :variant="variant"
                    />
                </div>
            </div>

            <!-- Fade hints -->
            <div class="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-16 bg-gradient-to-r from-white to-transparent" />
            <div class="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-16 bg-gradient-to-l from-white to-transparent" />
        </div>
    </section>
</template>
