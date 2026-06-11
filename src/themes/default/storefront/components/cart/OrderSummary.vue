<script setup>
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
</script>

<template>
    <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-6">
        <h2 class="font-[var(--font-display)] text-xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Order Summary') }}</h2>

        <div class="mt-6 space-y-3">
            <div class="flex items-center justify-between text-sm">
                <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Subtotal') }}</span>
                <span class="font-[var(--font-display)] text-lg text-[var(--ds-text)]"><PriceDisplay :price="cartStore.subtotal" /></span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Shipping') }}</span>
                <span class="text-[var(--ds-text-secondary)] text-xs font-[var(--font-label)]">{{ $t('Calculated at checkout') }}</span>
            </div>
        </div>

        <div class="mt-6 pt-4 border-t border-[#e0d8c8]">
            <div class="flex items-center justify-between">
                <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)]">{{ $t('Total') }}</span>
                <span class="font-[var(--font-display)] text-xl text-[var(--ds-text)]"><PriceDisplay :price="cartStore.subtotal" /></span>
            </div>
        </div>

        <LocalizedLink to="/checkout"
            class="mt-6 w-full inline-flex items-center justify-center bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-white rounded py-4 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors">
            {{ $t('Go to the checkout') }}
        </LocalizedLink>

        <div class="mt-3 text-center">
            <LocalizedLink to="/"
                class="text-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors font-[var(--font-body)]">
                {{ $t('Continue Shopping') }}
            </LocalizedLink>
        </div>
    </div>
</template>
