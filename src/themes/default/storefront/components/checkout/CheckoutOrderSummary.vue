<script setup>
import { useHelpers } from '@/composables/useHelpers';
import { useCartStore } from '@/stores/cart';
import { useOrderStore } from '@/stores/order';

const { translateItemField } = useHelpers();
const cartStore = useCartStore();
const orderStore = useOrderStore();

const hasShippingPayment = () => {
    return Object.keys(orderStore.checkoutSelections.payment).length > 0
        && Object.keys(orderStore.checkoutSelections.shipping).length > 0;
};
</script>

<template>
    <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] overflow-hidden">
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 border-b border-[#e0d8c8]">
            <div class="flex items-center justify-between">
                <h2 class="font-[var(--font-display)] text-xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Order Summary') }}</h2>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--ds-accent)]/10 text-[var(--ds-accent)] ring-1 ring-inset ring-[var(--ds-accent)]/20">
                    {{ cartStore.numberOfItems }} {{ cartStore.numberOfItems === 1 ? $t('item') : $t('items') }}
                </span>
            </div>
        </div>

        <div class="px-6 pb-6">
            <!-- Cart items -->
            <div class="mt-4 space-y-3">
                <div v-for="item in cartStore.items" :key="item.id" class="flex gap-3 items-start">
                    <!-- Product thumbnail -->
                    <div class="w-16 h-16 bg-white rounded-lg border border-[#e0d8c8] p-1 shrink-0 relative">
                        <img
                            v-if="item.images && item.images.length > 0"
                            :src="`/storage/${zucConfig.small_image_size}/${item.images[0].src}`"
                            :alt="translateItemField(item, 'name', $i18n.locale)"
                            @error.once="e => e.target.src = '/images/placeholder.webp'"
                            class="w-full h-full object-contain"
                        >
                        <!-- Quantity badge -->
                        <span class="absolute -top-2 -right-2 bg-[var(--ds-accent)] text-white text-[10px] font-semibold leading-none w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                            {{ item.qty }}
                        </span>
                    </div>

                    <!-- Product info -->
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-[var(--ds-text)] font-[var(--font-body)] line-clamp-2 !mb-0" v-html="translateItemField(item, 'name', $i18n.locale)"></p>

                        <!-- Booking fields — server-resolved labels for the customer's picks -->
                        <ul v-if="item.meta?.booking?.price_breakdown?.length"
                            class="mt-1 space-y-0.5 text-xs text-[var(--ds-text-secondary)] !mb-0">
                            <li v-for="row in item.meta.booking.price_breakdown"
                                :key="row.attribute_option_id">
                                <span class="font-medium">{{ row.attribute_option_label }}:</span>
                                {{ row.attribute_option_value_label }}
                            </li>
                        </ul>
                    </div>

                    <!-- Price -->
                    <div class="shrink-0 text-sm font-[var(--font-display)] text-[var(--ds-text)] pt-0.5">
                        <PriceConverter :product="item" :qty="item.qty" />
                    </div>
                </div>
            </div>

            <!-- Totals breakdown -->
            <div class="mt-5 pt-4 border-t border-[#e0d8c8] space-y-2.5">
                <div class="flex items-center justify-between text-sm">
                    <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Subtotal') }}</span>
                    <span class="font-[var(--font-display)] text-[var(--ds-text)]"><PriceDisplay :price="cartStore.subtotal" /></span>
                </div>
                <div v-if="orderStore.checkoutSelections.shipping.id" class="flex items-center justify-between text-sm">
                    <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Shipping') }} ({{ orderStore.checkoutSelections.shipping.title }})</span>
                    <span class="font-[var(--font-display)] text-[var(--ds-text)]"><PriceDisplay :price="orderStore.checkoutShippingCost" /></span>
                </div>
                <div v-if="orderStore.checkoutTaxAmount > 0" class="flex items-center justify-between text-sm">
                    <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Sales Tax') }}</span>
                    <span class="font-[var(--font-display)] text-[var(--ds-text)]"><PriceDisplay :price="+orderStore.checkoutTaxAmount" /></span>
                </div>
                <template v-if="orderStore.checkoutSelections.discounts.length > 0">
                    <div v-for="(discount, index) in orderStore.checkoutSelections.discounts" :key="index" class="flex items-center justify-between text-sm">
                        <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t(discount.module) }}</span>
                        <span class="font-[var(--font-display)] text-[var(--ds-accent)]">-<PriceDisplay :price="discount.details.amount" class="inline" /></span>
                    </div>
                </template>
            </div>

            <!-- Grand total -->
            <div class="mt-3 pt-3 border-t border-[#e0d8c8]">
                <div class="flex items-center justify-between bg-[var(--ds-neutral)] -mx-6 px-6 py-3">
                    <span class="text-base font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)]">{{ $t('Total') }}</span>
                    <span class="font-[var(--font-display)] text-xl text-[var(--ds-text)]"><PriceDisplay :price="orderStore.checkoutParams.total" /></span>
                </div>
            </div>


            <!-- Payment gateway render targets -->
            <div id="render-payment-gateway" class="mt-4"></div>

            <!-- Trust badges -->
            <div class="mt-5 pt-4 border-t border-[#e0d8c8]">
                <div class="flex items-center justify-center gap-5">
                    <div class="flex items-center gap-1.5 bg-[var(--ds-accent)]/10 text-[var(--ds-accent)] rounded-full px-3 py-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <span class="text-xs font-[var(--font-label)] uppercase tracking-wider">{{ $t('Secure checkout') }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 bg-[var(--ds-accent)]/10 text-[var(--ds-accent)] rounded-full px-3 py-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        <span class="text-xs font-[var(--font-label)] uppercase tracking-wider">{{ $t('SSL encrypted') }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
