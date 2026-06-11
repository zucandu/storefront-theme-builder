<script setup>
import ShippingEstimator from '@theme/storefront/components/cart/ShippingEstimator.vue'
import OrderSummary from '@theme/storefront/components/cart/OrderSummary.vue'
import ProductCard from '@theme/storefront/components/listing/ProductCard.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useHelpers } from '@/composables/useHelpers'
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/catalog/product'
import { TrashIcon, ShoppingBagIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()
const toast = useToast()
const cartStore = useCartStore()
const productStore = useProductStore()
const { translateItemField } = useHelpers()

const { hooks: cartTopHooks, fetchHooks: fetchCartTopHooks } = useStorefrontIframeHooks('storefront_cart_top');
const { hooks: cartBottomHooks, fetchHooks: fetchCartBottomHooks } = useStorefrontIframeHooks('storefront_cart_bottom');
onMounted(() => { fetchCartTopHooks(); fetchCartBottomHooks(); });

// T33.B.3 — per-row, per-action loading state. Map key = `${itemId}:${action}`.
// Keyed by id (not array index) so the entry survives applyServerSummary's
// items-array replacement after the response lands.
const busy = ref(new Map())
const isBusy = (id, action) => busy.value.get(`${id}:${action}`) === true
const setBusy = (id, action, v) => {
    const k = `${id}:${action}`
    if (v) busy.value.set(k, true)
    else busy.value.delete(k)
}

const updateQty = async (item, newQty) => {
    if (newQty < 1) return
    const action = newQty > item.qty ? 'increment' : 'decrement'
    if (isBusy(item.id, action)) return  // double-click guard
    const formdata = { ...item, id: item.id, cart_quantity: newQty }
    setBusy(item.id, action, true)
    try {
        await cartStore.updateQuantity(formdata)
    } catch (error) {
        toast.error(error.response?.data?.message || t('Failed to update cart'))
    } finally {
        setBusy(item.id, action, false)
    }
}

const removeProduct = async (id) => {
    if (isBusy(id, 'remove')) return
    setBusy(id, 'remove', true)
    try {
        await cartStore.removeProduct(id)
    } catch (error) {
        toast.error(error.response?.data?.message || t('Failed to remove product'))
    } finally {
        setBusy(id, 'remove', false)
    }
}

// Cross-sell products
// Booking cart rows have composite ids `<int>!<hash12>`; the cross-sells
// endpoint expects the real product id, so split on `!` before the call.
// Without this, /product/<composite>/cross-sells 404s and the global axios
// error handler toasts "Resource not found" on every cart-page visit with
// a booking line.
const realProductId = (id) => parseInt(String(id).split('!')[0], 10)
const crossSells = ref([])
const fetchCrossSells = async (items) => {
    if (!items.length) { crossSells.value = []; return }
    const cartIds = new Set(items.map(i => i.id))
    const results = await Promise.all(
        items.map(i => productStore.fetchCrossSells(realProductId(i.id)).catch(() => []))
    )
    const seen = new Set()
    crossSells.value = results.flat().filter(p => {
        if (!p || cartIds.has(p.id) || seen.has(p.id)) return false
        seen.add(p.id)
        return true
    }).slice(0, 8)
}
watch(() => cartStore.items.map(i => i.id).join(','), () => {
    fetchCrossSells(cartStore.items)
}, { immediate: true })
</script>

<template>
    <div>

        <!-- Cart with items -->
        <div v-if="cartStore.numberOfItems > 0" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

            <!-- Page title -->
            <h1 class="font-[var(--font-display)] text-3xl sm:text-4xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Shopping Cart') }}</h1>
            <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-label)] uppercase tracking-wider mt-1 !mb-0">{{ cartStore.numberOfItems }} {{ cartStore.numberOfItems === 1 ? $t('item') : $t('items') }}</p>

            <!-- Storefront hook: cart top -->
            <StorefrontIframeHook
                v-for="hook in cartTopHooks" :key="hook.id"
                :hook="hook" hook-point="storefront_cart_top"
                :query-params="{ lang: locale }"
            />

            <!-- Stock warning -->
            <div v-if="!!cartStore.hasOutOfStock || !!cartStore.hasMaxQty"
                class="mt-6 rounded-lg bg-[var(--ds-sale)]/10 border border-[var(--ds-sale)]/20 px-4 py-3 text-sm text-[var(--ds-sale)] font-[var(--font-body)]">
                {{ $t('Some items in your shopping cart currently do not have enough stock. Please make adjustments before continuing to checkout.') }}
            </div>

            <!-- Two-column layout -->
            <div class="mt-8 lg:grid lg:grid-cols-12 lg:gap-12">

                <!-- Left column: Cart items -->
                <div class="lg:col-span-8">
                    <div class="divide-y divide-[#e0d8c8]">
                        <div v-for="item in cartStore.items" :key="item.id"
                            class="flex gap-4 sm:gap-6 py-6 first:pt-0">

                            <!-- Product image -->
                            <LocalizedLink :to="item.meta?.booking?.fields
                                    ? `/product/${translateItemField(item, 'slug', $i18n.locale)}?cart_row=${encodeURIComponent(item.id)}`
                                    : `/product/${translateItemField(item, 'slug', $i18n.locale)}`"
                                class="shrink-0">
                                <div class="w-24 h-24 sm:w-[120px] sm:h-[120px] bg-[var(--ds-neutral)] rounded-lg p-2 overflow-hidden">
                                    <img
                                        :src="item.images?.[0]?.src
                                            ? `/storage/${zucConfig.medium_image_size}/${item.images[0].src}`
                                            : '/storage/no-image.png'"
                                        :alt="translateItemField(item, 'name', $i18n.locale)"
                                        @error.once="e => e.target.src = '/storage/no-image.png'"
                                        class="w-full h-full object-contain"
                                    >
                                </div>
                            </LocalizedLink>

                            <!-- Item details -->
                            <div class="flex flex-1 flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6 min-w-0">

                                <!-- Name, hooks, remove -->
                                <div class="flex-1 min-w-0">
                                    <LocalizedLink
                                        :to="item.meta?.booking?.fields
                                            ? `/product/${translateItemField(item, 'slug', $i18n.locale)}?cart_row=${encodeURIComponent(item.id)}`
                                            : `/product/${translateItemField(item, 'slug', $i18n.locale)}`"
                                        class="text-sm sm:text-base font-medium text-[var(--ds-text)] hover:text-[var(--ds-accent)] transition-colors line-clamp-2 font-[var(--font-body)]">
                                        {{ translateItemField(item, 'name', $i18n.locale) }}
                                    </LocalizedLink>

                                    <!-- Unit price (mobile: show below name) -->
                                    <p class="mt-1 text-sm text-[var(--ds-text-secondary)] font-[var(--font-display)] !mb-0">
                                        <PriceConverter :product="item" />
                                    </p>

                                    <!-- Booking fields (TB.8.6.3) — server-resolved labels for the customer's picks -->
                                    <ul v-if="item.meta?.booking?.price_breakdown?.length"
                                        class="mt-2 space-y-0.5 text-xs text-[var(--ds-text-secondary)] !mb-0">
                                        <li v-for="row in item.meta.booking.price_breakdown"
                                            :key="row.attribute_option_id">
                                            <span class="font-medium">{{ row.attribute_option_label }}:</span>
                                            {{ row.attribute_option_value_label }}
                                        </li>
                                    </ul>

                                    <!-- Remove button -->
                                    <button @click="removeProduct(item.id)"
                                        :disabled="isBusy(item.id, 'remove')"
                                        class="mt-2 inline-flex items-center gap-1 text-xs text-[var(--ds-text-secondary)] hover:text-[var(--ds-sale)] transition-colors cursor-pointer font-[var(--font-label)] uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed">
                                        <svg v-if="isBusy(item.id, 'remove')" class="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <TrashIcon v-else class="size-3.5" />
                                        {{ $t('Remove') }}
                                    </button>
                                </div>

                                <!-- Quantity + line total -->
                                <div class="flex items-center sm:items-end sm:flex-col gap-4 sm:gap-2 shrink-0">
                                    <!-- Quantity control -->
                                    <div class="inline-flex items-center border border-[#e0d8c8] rounded-lg h-10 overflow-hidden">
                                        <button
                                            @click="updateQty(item, item.qty - 1)"
                                            :disabled="item.qty <= 1 || isBusy(item.id, 'decrement')"
                                            class="w-9 h-full flex items-center justify-center text-[var(--ds-text-secondary)] hover:bg-[var(--ds-neutral)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                                            <svg v-if="isBusy(item.id, 'decrement')" class="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <svg v-else class="size-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>
                                        </button>
                                        <input
                                            type="number"
                                            :value="item.qty"
                                            @change="updateQty(item, +$event.target.value)"
                                            class="w-10 h-full text-center text-sm font-medium text-[var(--ds-text)] border-x border-y-0 border-[#e0d8c8] focus:outline-hidden focus:ring-0 bg-transparent appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] font-[var(--font-body)]"
                                            min="1"
                                        >
                                        <button
                                            @click="updateQty(item, item.qty + 1)"
                                            :disabled="isBusy(item.id, 'increment')"
                                            class="w-9 h-full flex items-center justify-center text-[var(--ds-text-secondary)] hover:bg-[var(--ds-neutral)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                                            <svg v-if="isBusy(item.id, 'increment')" class="animate-spin size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <svg v-else class="size-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        </button>
                                    </div>

                                    <!-- Stock warnings -->
                                    <div>
                                        <p v-if="item.qty > item.inventory" class="text-xs text-[var(--ds-sale)] font-[var(--font-label)] !mb-0">
                                            {{ $t('Current inventory in stock:') }} {{ item.inventory }}
                                        </p>
                                        <p v-if="item.max_qty > 0 && item.qty > item.max_qty" class="text-xs text-[var(--ds-sale)] font-[var(--font-label)] !mb-0">
                                            {{ $t('Max quantity:') }} {{ item.max_qty }}
                                        </p>
                                    </div>

                                    <!-- Line total -->
                                    <p class="text-sm font-[var(--font-display)] text-lg text-[var(--ds-text)] !mb-0 sm:text-right">
                                        <PriceConverter :product="item" :qty="item.qty" />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Order summary: mobile/tablet only (right after cart items) -->
                    <div class="lg:hidden mt-8 pt-8 border-t border-[#e0d8c8]">
                        <OrderSummary />
                    </div>

                    <!-- Shipping estimator -->
                    <div class="mt-8 pt-8 border-t border-[#e0d8c8]">
                        <ShippingEstimator :subtotal="cartStore.subtotal" />
                    </div>

                    <!-- Cross-sell products -->
                    <div v-if="crossSells.length > 0" class="mt-10 pt-8 border-t border-[#e0d8c8]">
                        <h2 class="font-[var(--font-display)] text-2xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('You might also like') }}</h2>
                        <div class="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            <ProductCard
                                v-for="product in crossSells"
                                :key="product.id"
                                :product="product"
                                size="compact"
                            />
                        </div>
                    </div>
                </div>

                <!-- Right column: Order summary — desktop only (sticky sidebar) -->
                <div class="hidden lg:block lg:col-span-4">
                    <div class="lg:sticky lg:top-24">
                        <OrderSummary />
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty cart -->
        <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center justify-center py-24">
                <ShoppingBagIcon class="size-16 text-[#d0c8b8] mb-4" />
                <h2 class="font-[var(--font-display)] text-2xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Your cart is empty') }}</h2>
                <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-2 !mb-0">{{ $t('Looks like you haven\'t added anything yet') }}</p>
                <LocalizedLink to="/"
                    class="mt-8 inline-flex items-center justify-center bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-white rounded px-8 py-3 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors">
                    {{ $t('Continue Shopping') }}
                </LocalizedLink>
            </div>
        </div>

        <!-- Storefront hook: cart bottom -->
        <StorefrontIframeHook
            v-for="hook in cartBottomHooks" :key="hook.id"
            :hook="hook" hook-point="storefront_cart_bottom"
            :query-params="{ lang: locale }"
        />
    </div>
</template>
