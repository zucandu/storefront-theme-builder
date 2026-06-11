<script setup>
import { useCheckoutCoupon } from '@/composables/useCheckoutCoupon';

const {
    couponCode,
    couponError,
    couponLoading,
    hasCouponModule,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
} = useCheckoutCoupon();

defineExpose({ hasCouponModule });
</script>

<template>
    <div v-if="hasCouponModule">
        <label class="block text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] mb-2">{{ $t('Coupon Code') }}</label>

        <!-- Applied state -->
        <div v-if="appliedCoupon" class="flex items-center justify-between gap-3 px-4 py-3 rounded-md bg-[var(--ds-neutral)]/60 border border-[#e0d8c8]">
            <div class="flex items-center gap-2 text-sm text-[var(--ds-text)]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-emerald-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>{{ appliedCoupon.module }}</span>
            </div>
            <button type="button" @click="removeCoupon" :disabled="couponLoading"
                class="text-xs text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] underline disabled:opacity-50 disabled:cursor-not-allowed">
                {{ $t('Remove') }}
            </button>
        </div>

        <!-- Input state -->
        <div v-else>
            <div class="flex gap-2">
                <input v-model="couponCode" type="text" :placeholder="$t('Enter coupon code')"
                    @keydown.enter.prevent="applyCoupon"
                    :disabled="couponLoading"
                    class="flex-1 px-3 py-2 text-sm border border-[#e0d8c8] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[var(--ds-primary)]/30 focus:border-[var(--ds-primary)] disabled:opacity-50" />
                <button type="button" @click="applyCoupon" :disabled="!couponCode.trim() || couponLoading"
                    class="px-4 py-2 text-sm font-medium rounded-md bg-[var(--ds-primary)] text-[var(--ds-white)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                    {{ couponLoading ? $t('Applying...') : $t('Apply') }}
                </button>
            </div>
            <p v-if="couponError" class="mt-2 text-xs text-red-600">{{ couponError }}</p>
        </div>
    </div>
</template>
