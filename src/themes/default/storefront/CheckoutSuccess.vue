<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/order';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useCartStore } from '@/stores/cart';
import { useRedirect } from '@/composables/useRedirect';

const route = useRoute();
const orderStore = useOrderStore();
const authCustomerStore = useAuthCustomerStore();
const cartStore = useCartStore();
const { redirectTo } = useRedirect();

const loaded = ref(false);
const order = ref({});
const shippingAddress = ref({});
const billingAddress = ref({});
onMounted(async () => {

    // Get order details
    await orderStore.fetchOrderDetailsByRef(route.params.ref);
    order.value = orderStore.retrieveOrder;

    // Set shipping and billing address
    shippingAddress.value = order.value.addresses.find(addr => addr.address_type === `shipping`)
    billingAddress.value = order.value.addresses.find(addr => addr.address_type === `billing`) || shippingAddress.value

    // Reset cart items
    cartStore.reset();

    loaded.value = true;
});

const upgrading = ref(false);
const upgradeGuestToAccount = async () => {
    upgrading.value = true;
    await authCustomerStore.upgradeGuestToAccount();
}

</script>

<template>
    <div>
        <div v-if="loaded" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <!-- Success Header -->
            <div class="text-center mb-10">
                <div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-[var(--ds-neutral)] mb-4">
                    <svg class="w-8 h-8 text-[var(--ds-accent)]" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h1 class="text-2xl sm:text-3xl font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Thank you for your order!') }}</h1>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-1.5 !mb-0">{{ $t('The order confirmation email with details of your order and a link to track its progress has been sent to your email address.') }}</p>
                <p class="mt-3 !mb-0">
                    <span class="inline-flex items-center rounded-full px-3 py-1 font-[var(--font-display)] text-xl text-[var(--ds-accent)]">{{ $t('YOUR ORDER # IS:') }} {{ order.id }}</span>
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column: Addresses & Methods -->
                <div class="space-y-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div class="bg-[var(--ds-neutral)] border border-[#e0d8c8] rounded-lg p-5">
                            <p class="font-[var(--font-display)] text-lg uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Shipping Address') }}</p>
                            <div class="mt-3 text-sm text-[var(--ds-text)]">
                                <DisplayAddress :address="shippingAddress" />
                            </div>
                            <div class="mt-4 pt-4 border-t border-[#e0d8c8]">
                                <p class="text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] !mb-0">{{ $t('Shipping Method') }}</p>
                                <p class="text-sm text-[var(--ds-text)] mt-1 !mb-0">{{ $t(order.shipping_method) }}</p>
                            </div>
                        </div>
                        <div class="bg-[var(--ds-neutral)] border border-[#e0d8c8] rounded-lg p-5">
                            <p class="font-[var(--font-display)] text-lg uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Billing Address') }}</p>
                            <div class="mt-3 text-sm text-[var(--ds-text)]">
                                <DisplayAddress :address="billingAddress" />
                            </div>
                            <div class="mt-4 pt-4 border-t border-[#e0d8c8]">
                                <p class="text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] !mb-0">{{ $t('Payment Method') }}</p>
                                <p class="text-sm text-[var(--ds-text)] mt-1 !mb-0">{{ $t(order.payment_method) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Status History -->
                    <div class="border border-[#e0d8c8] rounded-lg p-5">
                        <p class="font-[var(--font-display)] text-lg uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Status History & Comments') }}</p>
                        <div v-if="order.comments && order.comments.length > 0" class="mt-4 overflow-x-auto">
                            <table class="min-w-full divide-y divide-[#e0d8c8]">
                                <thead class="bg-[var(--ds-neutral)]">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Date') }}</th>
                                        <th class="px-4 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Status') }}</th>
                                        <th class="px-4 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Note') }}</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-[#e0d8c8]">
                                    <tr v-for="comment in order.comments" :key="comment.id" :class="`${comment.admin !== `customer` ? `no-print` : `printable`}`" class="hover:bg-[var(--ds-neutral)] transition-colors">
                                        <td class="px-4 py-3 font-[var(--font-label)] text-xs text-[var(--ds-text-secondary)]">{{ comment.created_at }}</td>
                                        <td class="px-4 py-3 text-sm">
                                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-[var(--font-label)] uppercase tracking-wider bg-[var(--ds-neutral)] text-[var(--ds-text)]">{{ comment.status_text }}</span>
                                        </td>
                                        <td class="px-4 py-3 text-sm text-[var(--ds-text)]">{{ comment.note }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <p v-else class="text-sm text-[var(--ds-text-secondary)] mt-3 !mb-0">{{ $t('There is no any comment at this time') }}</p>
                    </div>
                </div>

                <!-- Right Column: Items & Totals -->
                <div>
                    <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
                        <table class="min-w-full divide-y divide-[#e0d8c8]">
                            <thead class="bg-[var(--ds-neutral)]">
                                <tr>
                                    <th class="px-5 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Name') }}</th>
                                    <th class="px-5 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Quantity') }}</th>
                                    <th class="px-5 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Unit') }}</th>
                                    <th class="px-5 py-3 text-right text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Total') }}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#e0d8c8]">
                                <tr v-for="item in order.items" :key="item.id" class="hover:bg-[var(--ds-neutral)] transition-colors">
                                    <td class="px-5 py-4 text-sm text-[var(--ds-text)]">
                                        <div>
                                            <span>{{ item.name }}</span>
                                            <span v-if="item.sku" class="ml-2 text-[var(--ds-text-secondary)]">#{{ item.sku }}</span>
                                        </div>

                                    </td>
                                    <td class="px-5 py-4 text-sm text-[var(--ds-text)] text-center">{{ item.qty }}</td>
                                    <td class="px-5 py-4 text-sm text-[var(--ds-text)] text-center font-[var(--font-display)]">
                                        <PriceByCurrencyCode :price="+item.price" :currency-code="order.currency" />
                                    </td>
                                    <td class="px-5 py-4 text-sm text-[var(--ds-text)] text-right font-[var(--font-display)]">
                                        <PriceByCurrencyCode :price="+(item.price*item.qty)" :currency-code="order.currency" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <!-- Totals Summary -->
                        <div class="border-t border-[#e0d8c8] bg-[var(--ds-neutral)] px-5 py-4 space-y-2">
                            <div class="flex justify-between text-sm">
                                <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Subtotal:') }}</span>
                                <span class="text-[var(--ds-text)] font-[var(--font-display)]"><PriceByCurrencyCode :price="+order.subtotal" :currency-code="order.currency" /></span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Shipping') }} ({{ order.shipping_method }}):</span>
                                <span class="text-[var(--ds-text)] font-[var(--font-display)]"><PriceByCurrencyCode :price="+order.shipping_amount" :currency-code="order.currency" /></span>
                            </div>
                            <div v-if="zucConfig.product_price_with_tax === 'n' && order.order_tax > 0" class="flex justify-between text-sm">
                                <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Tax:') }}</span>
                                <span class="text-[var(--ds-text)] font-[var(--font-display)]"><PriceByCurrencyCode :price="+order.order_tax" :currency-code="order.currency" /></span>
                            </div>
                            <template v-if="order.discounts && order.discounts.length > 0">
                                <div v-for="discount in order.discounts" :key="discount.id" class="flex justify-between text-sm">
                                    <span class="font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t(discount.name) }}</span>
                                    <span class="text-[var(--ds-sale)] font-[var(--font-display)]">-<PriceByCurrencyCode :price="+discount.amount" :currency-code="order.currency" /></span>
                                </div>
                            </template>
                            <div class="flex justify-between pt-2 border-t border-[#e0d8c8]">
                                <span class="font-[var(--font-display)] text-xl text-[var(--ds-text)]">{{ $t('Total:') }}</span>
                                <span class="font-[var(--font-display)] text-xl text-[var(--ds-text)]"><PriceByCurrencyCode :price="+order.order_total" :currency-code="order.currency" /></span>
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex flex-wrap items-center gap-3 mt-6">
                        <LocalizedLink to="/" class="bg-[var(--ds-neutral)] text-[var(--ds-text)] border border-[#e0d8c8] hover:bg-[#e0d8c8] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-5 py-2.5 text-sm transition-colors">
                            {{ $t('Continue Shopping') }}
                        </LocalizedLink>
                        <LocalizedLink to="/account/order/list" class="bg-[var(--ds-neutral)] text-[var(--ds-text)] border border-[#e0d8c8] hover:bg-[#e0d8c8] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-5 py-2.5 text-sm transition-colors">
                            {{ $t('My Account') }}
                        </LocalizedLink>
                        <LocalizedLink to="/logout" class="text-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors">
                            {{ $t('Logout') }}
                        </LocalizedLink>
                    </div>
                </div>
            </div>

            <!-- Guest Upgrade Section -->
            <div v-if="!authCustomerStore.isRegisteredCustomer" class="mt-10">
                <div class="bg-[var(--ds-neutral)] border border-[var(--ds-accent)]/20 rounded-lg p-6 text-center max-w-2xl mx-auto">
                    <p class="text-sm text-[var(--ds-text)] !mb-0">{{ $t('To receive more offers and promotional emails, we suggest you create an account by clicking the "Create an account" button below. You will receive an email containing the password.') }}</p>
                    <div class="mt-4">
                        <button :disabled="upgrading" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" @click.stop="upgradeGuestToAccount">
                            <svg v-if="upgrading" class="animate-spin -ml-1 mr-2 size-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ upgrading ? $t('Creating...') : $t('Create an account') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#e0d8c8] border-t-[var(--ds-accent)]"></div>
        </div>
    </div>
</template>
