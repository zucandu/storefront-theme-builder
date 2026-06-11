<script setup>
import CheckoutAddress from '@theme/storefront/components/checkout/Address.vue'
import CheckoutCoupon from '@theme/storefront/components/checkout/CheckoutCoupon.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'
import { ref, reactive, onMounted, watch } from 'vue';

import { useOrderStore } from '@/stores/order';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useProductStore } from '@/stores/catalog/product';
import { useSettingsStore } from '@/stores/settings'
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';
import { useCheckoutCoupon } from '@/composables/useCheckoutCoupon';

const orderStore = useOrderStore();
const customerStore = useAuthCustomerStore();
const productStore = useProductStore();
const settingsStore = useSettingsStore();

const { hooks: afterPromotionHooks, fetchHooks: fetchAfterPromotionHooks } = useStorefrontIframeHooks('storefront_checkout_after_promotion');

const isCheckoutReady = ref(false);
onMounted(async () => {
    await orderStore.initializeCheckout(orderStore.checkoutParams);
    formdata.value = { ...formdata.value, ...orderStore.checkoutSelections }
    isCheckoutReady.value = true;
    fetchAfterPromotionHooks();
});

// Set formdata
const formdata = ref({
    shipping: {},
    payment: {},
    comments: {}
});

// Collapse state — all expanded by default
const sections = reactive({
    address: true,
    shipping: true,
    promotions: true,
    payment: true,
    comments: false,
});

// Emit function for emitting events
const emit = defineEmits(["updateCheckoutStep"]);

function editAddress(address, addressType) {
    emit('updateCheckoutStep', { step: CheckoutAddress, params: { ...address, edit_address_type: addressType }})
}

// Checkout selections for shipping/payment
watch(
    () => formdata.value,
    ({ payment, shipping, comment }) => {
        if (payment) orderStore.setCheckoutSelections({ payment: payment });
        if (shipping) orderStore.setCheckoutSelections({ shipping: shipping });
        if (comment) orderStore.setCheckoutSelections({ comments: comment });
        orderStore.connectPaymentGateway();
    },
    { deep: true }
);

// Coupon visibility check (used for section v-if; CheckoutCoupon owns its own state)
const { hasCouponModule } = useCheckoutCoupon();

</script>

<template>
    <div class="space-y-4">

        <!-- Shipping & Billing Addresses -->
        <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
            <button
                @click="sections.address = !sections.address"
                class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--ds-neutral)]/50 transition-colors"
            >
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ds-primary)] text-[var(--ds-white)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z" />
                        </svg>
                    </div>
                    <h2 class="text-base font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Shipping & Payment Address') }}</h2>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                    class="size-5 text-[var(--ds-text-secondary)] transition-transform duration-200"
                    :class="{ 'rotate-180': sections.address }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                class="overflow-hidden transition-all duration-300 ease-in-out"
                :class="sections.address ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'"
            >
                <div class="px-5 pb-5">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <!-- Shipping address card -->
                        <div class="bg-[var(--ds-neutral)] rounded-lg p-5">
                            <p class="text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] !mb-0">{{ $t('Shipping Address') }}</p>
                            <div class="mt-2">
                                <DisplayAddress :address="orderStore.checkoutParams.shipping" />
                            </div>
                            <button v-if="customerStore.customerAddressTotal > 1"
                                class="mt-3 text-sm text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors cursor-pointer"
                                @click.stop="editAddress(orderStore.checkoutParams.shipping, 'shipping')">
                                {{ $t('Edit Address') }}
                            </button>
                        </div>
                        <!-- Billing address card -->
                        <div class="bg-[var(--ds-neutral)] rounded-lg p-5">
                            <p class="text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] !mb-0">{{ $t('Billing Address') }}</p>
                            <div class="mt-2">
                                <DisplayAddress :address="orderStore.checkoutParams.billing" />
                            </div>
                            <button v-if="customerStore.customerAddressTotal > 1"
                                class="mt-3 text-sm text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors cursor-pointer"
                                @click.stop="editAddress(orderStore.checkoutParams.billing, 'billing')">
                                {{ $t('Edit Address') }}
                            </button>
                        </div>
                    </div>
                    <button v-if="customerStore.customerAddressTotal === 1"
                        class="mt-3 text-sm text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors cursor-pointer"
                        @click.stop="editAddress(orderStore.checkoutParams.shipping)">
                        {{ $t('Edit your current address or add a new?') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Shipping Methods -->
        <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
            <button
                @click="sections.shipping = !sections.shipping"
                class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--ds-neutral)]/50 transition-colors"
            >
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ds-primary)] text-[var(--ds-white)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H6.375m11.25-4.5V6.75a1.125 1.125 0 0 0-1.125-1.125H3.375a1.125 1.125 0 0 0-1.125 1.125v11.25M16.5 13.5h3.375a1.125 1.125 0 0 1 1.125 1.125v1.5" />
                        </svg>
                    </div>
                    <h2 class="text-base font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Shipping Methods') }}</h2>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                    class="size-5 text-[var(--ds-text-secondary)] transition-transform duration-200"
                    :class="{ 'rotate-180': sections.shipping }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                class="overflow-hidden transition-all duration-300 ease-in-out"
                :class="sections.shipping ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'"
            >
                <div class="px-5 pb-5">
                    <div v-if="isCheckoutReady" class="space-y-3">
                        <div v-for="shipping in orderStore.checkoutShippingMethods" :key="shipping.code"
                            class="border border-[#e0d8c8] rounded-lg p-4">
                            <div class="flex justify-between items-center">
                                <p class="text-sm font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t(shipping.name) }}</p>
                                <img v-if="shipping.image" :src="`/storage/shippings/${shipping.image}`" :alt="shipping.name" class="w-10 h-auto">
                            </div>
                            <template v-if="shipping.methods.length > 0">
                                <div v-for="method in shipping.methods" :key="method.id" class="mt-3">
                                    <template v-if="method.error !== true">
                                        <label :for="`shipping-method-${method.id}`"
                                            class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                                            :class="formdata.shipping?.id === method.id
                                                ? 'bg-[var(--ds-neutral)] ring-1 ring-[var(--ds-accent)]'
                                                : 'hover:bg-[var(--ds-neutral)]'">
                                            <div class="flex items-center gap-3">
                                                <input v-model="formdata.shipping"
                                                    type="radio"
                                                    :value="method"
                                                    :id="`shipping-method-${method.id}`"
                                                    class="h-4 w-4 text-[var(--ds-accent)] border-[#e0d8c8] focus:ring-[var(--ds-accent)] focus:ring-offset-0">
                                                <span class="text-sm text-[var(--ds-text)]">{{ $t(method.title) }}</span>
                                            </div>
                                            <span class="text-sm font-medium font-[var(--font-display)] text-[var(--ds-text)]">
                                                <PriceDisplay :price="+productStore.priceFormat(method.cost)" />
                                            </span>
                                        </label>
                                    </template>
                                    <template v-else>
                                        <p class="text-sm text-red-600 px-3 !mb-0">{{ $t(method.title) }}</p>
                                    </template>
                                </div>
                            </template>
                            <p v-else class="mt-3 text-sm text-red-600 !mb-0">
                                {{ $t("This shipping method is not currently available for your order.") }}
                            </p>
                        </div>
                    </div>
                    <!-- Loading skeleton -->
                    <div v-else class="space-y-3">
                        <div v-for="i in 2" :key="i" class="border border-[#e0d8c8] rounded-lg p-4 animate-pulse">
                            <div class="h-4 bg-[#e0d8c8] rounded w-1/3"></div>
                            <div class="mt-3 h-10 bg-[var(--ds-neutral)] rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Payment Methods -->
        <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
            <button
                @click="sections.payment = !sections.payment"
                class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--ds-neutral)]/50 transition-colors"
            >
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ds-primary)] text-[var(--ds-white)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                        </svg>
                    </div>
                    <h2 class="text-base font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Payment Methods') }}</h2>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                    class="size-5 text-[var(--ds-text-secondary)] transition-transform duration-200"
                    :class="{ 'rotate-180': sections.payment }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                class="overflow-hidden transition-all duration-300 ease-in-out"
                :class="sections.payment ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'"
            >
                <div class="px-5 pb-5">
                    <div v-if="isCheckoutReady" class="space-y-3">
                        <div v-for="payment in orderStore.checkoutPaymentMethods" :key="payment.id">
                            <label :for="`payment-method-${payment.id}`"
                                class="flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors"
                                :class="formdata.payment?.id === payment.id
                                    ? 'border-[var(--ds-accent)] bg-[var(--ds-neutral)]'
                                    : 'border-[#e0d8c8] hover:bg-[var(--ds-neutral)]'">
                                <div class="flex items-center gap-3">
                                    <input v-model="formdata.payment"
                                        type="radio"
                                        :value="payment"
                                        :id="`payment-method-${payment.id}`"
                                        class="h-4 w-4 text-[var(--ds-accent)] border-[#e0d8c8] focus:ring-[var(--ds-accent)] focus:ring-offset-0">
                                    <span class="text-sm font-medium text-[var(--ds-text)]">{{ $t(payment.module) }}</span>
                                </div>
                                <img v-if="payment.image" :src="`/storage/payments/${payment.image}`" :alt="payment.module" class="h-8">
                            </label>
                        </div>
                    </div>
                    <!-- Loading skeleton -->
                    <div v-else class="space-y-3">
                        <div v-for="i in 2" :key="i" class="border border-[#e0d8c8] rounded-lg p-4 animate-pulse">
                            <div class="flex items-center gap-3">
                                <div class="h-4 w-4 bg-[#e0d8c8] rounded-full"></div>
                                <div class="h-4 bg-[#e0d8c8] rounded w-1/4"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Promotions -->
        <div v-if="hasCouponModule || (orderStore.checkoutDiscountModules && orderStore.checkoutDiscountModules.length > 0) || afterPromotionHooks.length > 0" class="border border-[#e0d8c8] rounded-lg overflow-hidden">
            <button
                @click="sections.promotions = !sections.promotions"
                class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--ds-neutral)]/50 transition-colors"
            >
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ds-primary)] text-[var(--ds-white)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                    </div>
                    <h2 class="text-base font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Savings') }}</h2>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                    class="size-5 text-[var(--ds-text-secondary)] transition-transform duration-200"
                    :class="{ 'rotate-180': sections.promotions }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                class="overflow-hidden transition-all duration-300 ease-in-out"
                :class="sections.promotions ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'"
            >
                <div v-if="isCheckoutReady" class="px-5 pb-5 space-y-4">
                    <!-- Coupon code (core CouponModule) -->
                    <CheckoutCoupon />

                    <!-- Storefront hook: checkout after promotion -->
                    <StorefrontIframeHook
                        v-for="hook in afterPromotionHooks" :key="hook.id"
                        :hook="hook" hook-point="storefront_checkout_after_promotion"
                        :query-params="{ customer_id: customerStore.profile?.id }"
                    />
                </div>
            </div>
        </div>

        <!-- Comments -->
        <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
            <button
                @click="sections.comments = !sections.comments"
                class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--ds-neutral)]/50 transition-colors"
            >
                <div class="flex items-center gap-3">
                    <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ds-primary)] text-[var(--ds-white)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                    </div>
                    <h2 class="text-base font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Special Instructions') }}</h2>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                    class="size-5 text-[var(--ds-text-secondary)] transition-transform duration-200"
                    :class="{ 'rotate-180': sections.comments }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div
                class="overflow-hidden transition-all duration-300 ease-in-out"
                :class="sections.comments ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'"
            >
                <div class="px-5 pb-5">
                    <textarea v-model="formdata.comments.customer_note"
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)] resize-none"
                        rows="3"
                        :placeholder="$t('Write something...')">
                    </textarea>
                </div>
            </div>
        </div>
    </div>
</template>
