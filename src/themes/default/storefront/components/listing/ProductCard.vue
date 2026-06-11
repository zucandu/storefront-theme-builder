<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useHelpers } from '@/composables/useHelpers'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthCustomerStore } from '@/stores/auth/customer'
import { ShoppingBagIcon } from '@heroicons/vue/24/outline'

const { locale, t } = useI18n()
const toast = useToast()
const { translateItemField } = useHelpers()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authCustomerStore = useAuthCustomerStore()

const emit = defineEmits(['open-restock-modal', 'open-review-modal', 'open-discount-modal'])

const props = defineProps({
    product: { type: Object, required: true },
    badge: { type: String, default: null },
    size: { type: String, default: 'default' }, // 'default' | 'compact'
    variant: { type: String, default: 'default' } // 'default' | 'dark' | 'carousel'
})

const productName = computed(() => translateItemField(props.product, 'name', locale.value))
const productSlug = computed(() => translateItemField(props.product, 'slug', locale.value))
const thumbSize = zucConfig.medium_image_size || 280
const storeUrl = zucConfig.store_url

const imageSrc = computed(() => {
    const src = props.product.images?.[0]?.src
    return src && src !== 'no-image.png'
        ? `${storeUrl}/storage/${thumbSize}/${src}`
        : '/images/placeholder.webp'
})
const secondaryImage = computed(() => {
    const src = props.product.images?.[1]?.src
    return src ? `${storeUrl}/storage/${thumbSize}/${src}` : null
})
const hasSale = computed(() => props.product.sale_price > 0)
const rating = computed(() => Math.round(props.product.rating || 0))
const salePercent = computed(() => {
    if (!hasSale.value || !props.product.price) return 0
    return Math.round((1 - props.product.sale_price / props.product.price) * 100)
})
const manufacturerName = computed(() => {
    if (!props.product.manufacturer) return null
    return translateItemField(props.product.manufacturer, 'name', locale.value)
})
const inStock = computed(() => +props.product.quantity > 0)
const hasQuantityDiscount = computed(() => +props.product.quantity_discount_status === 1)
const qty = ref(1)
const adding = ref(false)  // T33.B.3 — local loading state for the Add button

const addToCart = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation() }
    if (adding.value) return  // double-click guard
    adding.value = true
    try {
        await cartStore.addProduct({ id: props.product.id, cart_quantity: qty.value })
        toast.success(t('Product added to cart'))
    } catch (error) {
        toast.error(error.response?.data?.message || t('Failed to add product to cart'))
    } finally {
        adding.value = false
    }
}

const toggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!authCustomerStore.isLoggedIn) {
        toast.info(t('Please login to add items to your wishlist'))
        return
    }
    try {
        const action = await wishlistStore.toggleProduct(props.product.id)
        toast.success(t(action === 'added' ? 'Added to wishlist' : 'Removed from wishlist'))
    } catch {
        toast.error(t('Failed to update wishlist'))
    }
}
</script>

<template>
    <div class="group relative flex flex-col transition-all duration-300 h-full">
        <!-- Image container -->
        <div class="relative overflow-hidden rounded-lg bg-[#f5f0e8] mb-4 aspect-square">
            <!-- Linked images -->
            <LocalizedLink :to="`/product/${productSlug}`" class="block h-full w-full">
                <img
                    :src="imageSrc"
                    :alt="productName"
                    :class="[
                        'h-full w-full object-contain p-3 transition-transform duration-700 ease-out',
                        secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                    ]"
                    loading="lazy"
                    @error.once="e => e.target.src = '/images/placeholder.webp'"
                />
                <img
                    v-if="secondaryImage"
                    :src="secondaryImage"
                    :alt="productName"
                    class="absolute inset-0 h-full w-full object-contain p-3 opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                    @error="e => e.target.src = imageSrc"
                />
            </LocalizedLink>

            <!-- Wishlist heart (top-right) -->
            <button
                @click="toggleWishlist"
                class="absolute top-3 right-3 z-10 flex items-center justify-center size-8 rounded-full bg-white/80 backdrop-blur-md shadow-sm transition-all hover:scale-110"
                :title="wishlistStore.isInWishlist(product.id) ? $t('Remove from wishlist') : $t('Add to wishlist')"
            >
                <svg v-if="wishlistStore.isInWishlist(product.id)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-4 text-[#b44c3a]">
                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-[#2d2d2d]">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
            </button>

            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-2">
                <span
                    v-if="hasSale && salePercent > 0"
                    class="rounded bg-[#b44c3a] px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider"
                    style="font-family: var(--font-label)"
                >
                    -{{ salePercent }}%
                </span>
                <span
                    v-if="badge === 'new'"
                    class="rounded bg-[#1a1a1a] px-2.5 py-1 text-[11px] font-bold text-[#c8a45c] uppercase tracking-wider"
                    style="font-family: var(--font-label)"
                >
                    {{ $t('New') }}
                </span>
                <span
                    v-if="badge === 'featured'"
                    class="flex items-center gap-1 rounded bg-[#c8a45c] px-2.5 py-1 text-[11px] font-bold text-[#1a1a1a] uppercase tracking-wider"
                    style="font-family: var(--font-label)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-3">
                        <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                    </svg>
                    {{ $t('Featured') }}
                </span>
            </div>

            <!-- Out of stock overlay -->
            <div v-if="!inStock" class="absolute inset-0 flex items-center justify-center bg-white/60 z-10">
                <span
                    class="rounded bg-[#1a1a1a]/80 px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider"
                    style="font-family: var(--font-label)"
                >
                    {{ $t('Out of stock') }}
                </span>
            </div>
        </div>

        <!-- Content -->
        <div class="flex flex-1 flex-col px-1">
            <!-- Manufacturer -->
            <p v-if="manufacturerName" class="!mb-1 text-[10px] font-medium text-[#8a8274] uppercase tracking-widest" style="font-family: var(--font-label)">
                {{ manufacturerName }}
            </p>

            <!-- Name -->
            <h3 :class="[
                'font-medium line-clamp-2 transition-colors',
                variant === 'dark' ? 'text-gray-100 group-hover:text-[#c8a45c]' : 'text-[#2d2d2d] group-hover:text-[#8a8274]',
                size === 'compact' ? 'text-xs sm:text-sm' : 'text-sm'
            ]">
                <LocalizedLink :to="`/product/${productSlug}`">{{ productName }}</LocalizedLink>
            </h3>

            <!-- SKU -->
            <p v-if="product.sku" :class="['!mb-0 text-[11px] mt-1', variant === 'dark' ? 'text-gray-500' : 'text-[#8a8274]']">
                {{ product.sku }}
            </p>

            <!-- Rating with count -->
            <div v-if="rating > 0" class="flex items-center gap-1 mt-1.5">
                <div class="flex items-center gap-0.5">
                    <svg
                        v-for="i in 5"
                        :key="i"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        :class="['size-3', i <= rating ? 'text-[#c8a45c]' : (variant === 'dark' ? 'text-gray-700' : 'text-gray-200')]"
                    >
                        <path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" />
                    </svg>
                </div>
                <span v-if="product.total_reviews > 0" :class="['text-[11px]', variant === 'dark' ? 'text-gray-500' : 'text-[#8a8274]']">
                    ({{ product.total_reviews }})
                </span>
            </div>

            <!-- Buy More Save More -->
            <button
                v-if="hasQuantityDiscount"
                @click.prevent="emit('open-discount-modal', product)"
                :class="[
                    'flex items-center gap-1.5 mt-2 text-[11px] font-medium cursor-pointer',
                    variant === 'dark' ? 'text-[#c8a45c]' : 'text-green-800'
                ]"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3.5 shrink-0"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m15 9-6 6"/><path d="M9 9h.01"/><path d="M15 15h.01"/></svg>
                {{ $t('Buy More Save More') }}
            </button>

            <!-- Availability date -->
            <p v-if="product.availability_date" :class="['!mb-0 flex items-center gap-1.5 mt-2 text-[11px]', variant === 'dark' ? 'text-gray-400' : 'text-[#8a8274]']">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5 shrink-0">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                {{ $t('Restock') }}: {{ product.availability_date }}
            </p>

            <!-- Price -->
            <div class="mt-auto pt-2.5">
                <div :class="[
                    variant === 'dark' ? 'text-white [&_del]:text-gray-500 [&_del]:font-normal' : 'text-[#2d2d2d] [&_del]:text-[#8a8274] [&_del]:font-normal'
                ]" style="font-family: var(--font-display); font-size: 1.25rem">
                    <PriceConverter :product="product" />
                </div>
            </div>

            <!-- Cart actions -->
            <div class="mt-3">
                <template v-if="inStock">
                    <!-- Simple product: qty + add -->
                    <form v-if="product.type === 'simple'" @submit.prevent="addToCart" class="flex items-center gap-2">
                        <input
                            v-model.number="qty"
                            type="number"
                            min="1"
                            class="w-14 h-9 text-center border border-[#e0d8c8] bg-white text-[#2d2d2d] rounded text-sm focus:outline-hidden focus:ring-1 focus:ring-[#c8a45c] focus:border-[#c8a45c]"
                        />
                        <button
                            type="submit"
                            :disabled="adding"
                            class="flex flex-1 items-center justify-center gap-1.5 rounded bg-[var(--ds-accent)] h-9 text-xs font-semibold text-[var(--ds-white)] hover:bg-[var(--ds-accent-hover)] transition-colors uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            style="font-family: var(--font-label)"
                        >
                            <svg v-if="adding" class="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <ShoppingBagIcon v-else class="size-3.5" />
                            {{ $t('Add') }}
                        </button>
                    </form>
                    <!-- Variable product: Options -->
                    <LocalizedLink
                        v-else
                        :to="`/product/${productSlug}`"
                        class="flex w-full items-center justify-center rounded bg-[var(--ds-accent)] h-9 text-xs font-semibold text-[var(--ds-white)] hover:bg-[var(--ds-accent-hover)] transition-colors uppercase tracking-wider"
                        style="font-family: var(--font-label)"
                    >
                        {{ $t('Options') }}
                    </LocalizedLink>
                </template>
                <!-- Out of stock: Get Notified -->
                <button
                    v-else
                    @click.prevent="emit('open-restock-modal', product)"
                    class="flex w-full items-center justify-center gap-1.5 rounded bg-[#c8a45c]/15 h-9 text-[11px] font-semibold text-[#c8a45c] uppercase tracking-wider hover:bg-[#c8a45c]/25 transition-colors cursor-pointer"
                    style="font-family: var(--font-label)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                    {{ $t('Get Notified') }}
                </button>
            </div>
        </div>
    </div>
</template>
