<script setup>
import CheckoutCreateAccount from '@theme/storefront/components/checkout/CreateAccount.vue'
import CheckoutForm from '@theme/storefront/components/checkout/Form.vue'
import CheckoutAddress from '@theme/storefront/components/checkout/Address.vue'
import CheckoutOrderSummary from '@theme/storefront/components/checkout/CheckoutOrderSummary.vue'
import { ref, onMounted, markRaw, computed } from 'vue';
import { useRedirect } from '@/composables/useRedirect';
import { useHelpers } from '@/composables/useHelpers';

import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useCartStore } from '@/stores/cart';
import { useOrderStore } from '@/stores/order';

const { redirectTo } = useRedirect();
const { translateItemField } = useHelpers();

const authCustomerStore = useAuthCustomerStore();
const cartStore = useCartStore();
const orderStore = useOrderStore();

// Collapsible order summary at top
const orderSummaryExpanded = ref(false);

// Dynamic checkout step
const checkoutComponent = ref(null);
const checkoutParams = ref({});

const retrieveCheckoutStep = () => {
    if (authCustomerStore.isLoggedIn) {
        if (authCustomerStore.customerAddressTotal === 0) {
            checkoutComponent.value = markRaw(CheckoutAddress);
        } else {
            checkoutComponent.value = markRaw(CheckoutForm);
        }
    } else {
        checkoutComponent.value = markRaw(CheckoutCreateAccount);
    }

    // Redirect home if order is not ready
    if (!orderStore.readyToCheckout) {
        redirectTo("/");
    }
};

const updateCheckoutStep = (obj) => {
    checkoutComponent.value = markRaw(obj.step);
    checkoutParams.value = { ...checkoutParams.value, ...obj.params };
};

// Step indicator logic
const currentStepIndex = computed(() => {
    if (!checkoutComponent.value) return 0;
    if (checkoutComponent.value === CheckoutCreateAccount) return 0;
    if (checkoutComponent.value === CheckoutAddress) return 1;
    if (checkoutComponent.value === CheckoutForm) return 2;
    return 0;
});

const steps = computed(() => [
    { label: 'Account', completed: authCustomerStore.isLoggedIn },
    { label: 'Address', completed: authCustomerStore.isLoggedIn && authCustomerStore.customerAddressTotal > 0 && currentStepIndex.value > 1 },
    { label: 'Shipping & Payment', completed: false },
]);

onMounted(() => {
    retrieveCheckoutStep();
});
</script>

<template>
    <div>
        <div v-if="orderStore.readyToCheckout" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

            <!-- Page header -->
            <div class="mb-8">
                <h1 class="font-[var(--font-display)] text-3xl sm:text-4xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Checkout') }}</h1>
                <p v-if="!authCustomerStore.isLoggedIn" class="text-sm text-[var(--ds-text-secondary)] mt-1.5 !mb-0">
                    {{ $t('Already have an account?') }}
                    <LocalizedLink to="/login?redirect=/checkout" class="text-[var(--ds-accent)] font-medium hover:text-[var(--ds-accent-hover)] transition-colors underline underline-offset-2">{{ $t('Log in') }}</LocalizedLink>
                </p>
            </div>

            <!-- Step indicator -->
            <div class="mb-10 hidden sm:block">
                <div class="flex items-center">
                    <template v-for="(step, index) in steps" :key="index">
                        <!-- Step node -->
                        <div class="flex items-center gap-2.5">
                            <div
                                class="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-200"
                                :class="{
                                    'bg-[var(--ds-accent)] text-[var(--ds-white)]': index === currentStepIndex,
                                    'bg-[var(--ds-primary)] text-[var(--ds-white)]': step.completed && index < currentStepIndex,
                                    'bg-[#e0d8c8] text-[var(--ds-text-secondary)]': !step.completed && index !== currentStepIndex
                                }"
                            >
                                <!-- Checkmark for completed steps -->
                                <svg v-if="step.completed && index < currentStepIndex" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                <span v-else>{{ index + 1 }}</span>
                            </div>
                            <span
                                class="text-sm font-medium transition-colors"
                                :class="{
                                    'text-[var(--ds-text)]': index === currentStepIndex,
                                    'text-[var(--ds-accent)]': step.completed && index < currentStepIndex,
                                    'text-[var(--ds-text-secondary)]': !step.completed && index !== currentStepIndex
                                }"
                            >{{ $t(step.label) }}</span>
                        </div>

                        <!-- Connector line between steps -->
                        <div
                            v-if="index < steps.length - 1"
                            class="flex-1 mx-4 h-px transition-colors"
                            :class="step.completed && index < currentStepIndex ? 'bg-[var(--ds-accent)]' : 'bg-[#e0d8c8]'"
                        ></div>
                    </template>
                </div>
            </div>

            <!-- Two-column layout -->
            <div class="lg:grid lg:grid-cols-12 lg:gap-12">

                <!-- Left column: Checkout steps -->
                <div class="lg:col-span-7">

                    <!-- 1. Collapsible order summary (mobile/tablet only, above form sections) -->
                    <div class="lg:hidden border border-[#e0d8c8] rounded-lg overflow-hidden mb-4">
                        <button
                            @click="orderSummaryExpanded = !orderSummaryExpanded"
                            class="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-[var(--ds-neutral)]/50 transition-colors"
                        >
                            <div class="flex items-center gap-3">
                                <div class="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ds-accent)] text-[var(--ds-white)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                    </svg>
                                </div>
                                <h2 class="font-[var(--font-display)] text-lg uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Order Summary') }}</h2>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-[var(--ds-text-secondary)]">{{ cartStore.numberOfItems }} {{ cartStore.numberOfItems === 1 ? $t('item') : $t('items') }} &mdash; <span class="font-[var(--font-display)] text-[var(--ds-text)]"><PriceDisplay :price="orderStore.checkoutParams.total" /></span></span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
                                    class="size-5 text-[var(--ds-text-secondary)] transition-transform duration-200"
                                    :class="{ 'rotate-180': orderSummaryExpanded }">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </button>
                        <div
                            class="overflow-hidden transition-all duration-300 ease-in-out"
                            :class="orderSummaryExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'"
                        >
                            <div class="px-5 pb-5">
                                <!-- Cart items -->
                                <div class="divide-y divide-[#e0d8c8] pt-2">
                                    <div v-for="item in cartStore.items" :key="item.id" class="flex gap-3 py-3 first:pt-0">
                                        <div class="w-14 h-14 bg-white rounded-lg border border-[#e0d8c8] p-1 shrink-0 relative">
                                            <img
                                                v-if="item.images && item.images.length > 0"
                                                :src="`/storage/${zucConfig.small_image_size}/${item.images[0].src}`"
                                                :alt="translateItemField(item, 'name', $i18n.locale)"
                                                @error.once="e => e.target.src = '/images/placeholder.webp'"
                                                class="w-full h-full object-contain"
                                            >
                                            <span class="absolute -top-1.5 -right-1.5 bg-[var(--ds-accent)] text-white text-[10px] font-semibold leading-none w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                                                {{ item.qty }}
                                            </span>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-[var(--ds-text)] line-clamp-1 !mb-0" v-html="translateItemField(item, 'name', $i18n.locale)"></p>
                                        </div>
                                        <div class="shrink-0 text-sm font-[var(--font-display)] text-[var(--ds-text)]">
                                            <PriceConverter :product="item" :qty="item.qty" />
                                        </div>
                                    </div>
                                </div>

                                <!-- Totals -->
                                <div class="mt-3 pt-3 border-t border-[#e0d8c8] space-y-2">
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
                                            <span class="font-medium text-[var(--ds-accent)]">-<PriceDisplay :price="discount.details.amount" class="inline" /></span>
                                        </div>
                                    </template>
                                </div>
                                <div class="mt-2 pt-2 border-t border-[#e0d8c8]">
                                    <div class="flex items-center justify-between">
                                        <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)]">{{ $t('Total') }}</span>
                                        <span class="font-[var(--font-display)] text-xl text-[var(--ds-text)]"><PriceDisplay :price="orderStore.checkoutParams.total" /></span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    <!-- 2. Dynamic checkout step component (form sections) -->
                    <component
                        :is="checkoutComponent"
                        @updateCheckoutStep="updateCheckoutStep"
                        :params="checkoutParams"
                    ></component>
                </div>

                <!-- Right column: Full order summary (sticky sidebar on desktop, below form on mobile) -->
                <div class="mt-8 lg:mt-0 lg:col-span-5">
                    <div class="lg:sticky lg:top-24">
                        <CheckoutOrderSummary />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
