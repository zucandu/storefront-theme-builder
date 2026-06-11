<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/order';
import { useRedirect } from '@/composables/useRedirect';

const route = useRoute();
const orderStore = useOrderStore();
const { redirectTo } = useRedirect();

const loaded = ref(false);
const order = ref({});
const orderTrackingInfo = ref({});
const shippingAddress = ref({});
const billingAddress = ref({});
onMounted(async () => {

    // Get order details
    await orderStore.fetchOrderDetailsByRef(route.params.ref);
    order.value = orderStore.retrieveOrder;

    // Set shipping and billing address
    shippingAddress.value = order.value.addresses.find(addr => addr.address_type === `shipping`)
    billingAddress.value = order.value.addresses.find(addr => addr.address_type === `billing`) || shippingAddress.value

    // Get the tracking information
    orderTrackingInfo.value = await orderStore.fetchTrackingDetailsByRef(route.params.ref)

    loaded.value = true;
});

function printInvoice() {
    window.print();
}

</script>

<template>
    <div>
        <div class="space-y-6">

            <!-- Back link -->
            <LocalizedLink to="/account/order/list" class="inline-flex items-center gap-1.5 text-sm text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                {{ $t('Back to orders') }}
            </LocalizedLink>

            <!-- Loading -->
            <div v-if="!loaded" class="flex justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#e0d8c8] border-t-[var(--ds-accent)]"></div>
            </div>

            <template v-else>
                <!-- Order header -->
                <div class="border border-[#e0d8c8] rounded-lg px-6 py-5">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 class="text-lg font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t("Order") }} #{{ order.id }}</h2>
                            <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ order.purchased_at }}</p>
                        </div>
                        <span class="inline-flex items-center rounded-full bg-[var(--ds-neutral)] px-3 py-1 text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)]">{{ order.status_text }}</span>
                    </div>
                </div>

                <!-- Tracking Timeline -->
                <div v-if="orderTrackingInfo?.tracking_events !== undefined" class="border border-[#e0d8c8] rounded-lg px-6 py-5">
                    <div class="flex items-center gap-2 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-[var(--ds-text)]">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        <h3 class="text-sm font-[var(--font-display)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Shipment Tracking') }}</h3>
                        <template v-if="orderTrackingInfo?.courier">
                            <span class="text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)] rounded-full px-2.5 py-0.5">{{ orderTrackingInfo.courier }}</span>
                            <span v-if="orderTrackingInfo.tracking_number" class="text-xs text-[var(--ds-text-secondary)]">{{ orderTrackingInfo.tracking_number }}</span>
                        </template>
                    </div>

                    <!-- Timeline events -->
                    <div v-if="orderTrackingInfo.tracking_events?.length" class="relative ml-3">
                        <div class="absolute left-1 top-2 bottom-2 w-px bg-[#e0d8c8]"></div>
                        <div v-for="(event, index) in orderTrackingInfo.tracking_events" :key="index" class="relative flex gap-4 pb-5 last:pb-0">
                            <!-- Dot -->
                            <div class="relative z-10 shrink-0">
                                <div v-if="index === 0 && orderTrackingInfo.delivered" class="flex items-center justify-center size-6 -ml-1.5 rounded-full bg-[var(--ds-neutral)] ring-2 ring-white">
                                    <svg class="size-3.5 text-[var(--ds-accent)]" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <div v-else-if="index === 0" class="size-2.5 rounded-full bg-[var(--ds-accent)] ring-2 ring-white"></div>
                                <div v-else class="size-2.5 rounded-full bg-[#e0d8c8] ring-2 ring-white"></div>
                            </div>
                            <!-- Content -->
                            <div class="-mt-0.5 min-w-0">
                                <p class="text-sm !mb-0" :class="index === 0 ? 'text-[var(--ds-text)] font-medium' : 'text-[var(--ds-text-secondary)]'">{{ event.message }}</p>
                                <p class="font-[var(--font-label)] text-xs text-[var(--ds-text-secondary)] mt-0.5 !mb-0">
                                    <span v-if="event.date">{{ new Date(event.date).toLocaleString() }}</span>
                                    <span v-if="event.date && event.location"> &middot; </span>
                                    <span v-if="event.location">{{ event.location }}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- No events fallback -->
                    <div v-else class="rounded-lg bg-[var(--ds-neutral)] px-4 py-3">
                        <p class="text-sm text-[var(--ds-text-secondary)] !mb-0" v-if="orderTrackingInfo?.step >= 3">{{ $t('Your order has shipped! Tracking details will appear here once the courier provides updates.') }}</p>
                        <p class="text-sm text-[var(--ds-text-secondary)] !mb-0" v-else>{{ $t('Your order is being processed, we will send the tracking info once it has shipped.') }}</p>
                    </div>
                </div>

                <!-- Order items -->
                <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-[#e0d8c8]">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Product') }}</th>
                                <th class="px-6 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Qty') }}</th>
                                <th class="px-6 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Unit Price') }}</th>
                                <th class="px-6 py-3 text-right text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Total') }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[#e0d8c8]">
                            <tr v-for="item in order.items" :key="item.id">
                                <td class="px-6 py-4 text-sm">
                                    <span class="font-medium text-[var(--ds-text)]">{{ item.name }}</span>
                                    <span v-if="item.sku" class="ml-2 text-[var(--ds-text-secondary)] text-xs">#{{ item.sku }}</span>

                                </td>
                                <td class="px-6 py-4 text-sm text-[var(--ds-text-secondary)] text-center">{{ item.qty }}</td>
                                <td class="px-6 py-4 text-sm text-[var(--ds-text-secondary)] text-center">
                                    <PriceByCurrencyCode :price="+item.price" :currency-code="order.currency" />
                                </td>
                                <td class="px-6 py-4 text-sm text-[var(--ds-text)] font-[var(--font-display)] text-right">
                                    <PriceByCurrencyCode :price="+(item.price*item.qty)" :currency-code="order.currency" />
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Order totals -->
                    <div class="border-t border-[#e0d8c8] bg-[var(--ds-neutral)] px-6 py-4">
                        <div class="flex flex-col items-end gap-2">
                            <div class="flex justify-between w-full max-w-xs text-sm">
                                <span class="text-[var(--ds-text-secondary)]">{{ $t('Subtotal') }}</span>
                                <span class="text-[var(--ds-text)] font-medium">
                                    <PriceByCurrencyCode :price="+order.subtotal" :currency-code="order.currency" />
                                </span>
                            </div>
                            <div class="flex justify-between w-full max-w-xs text-sm">
                                <span class="text-[var(--ds-text-secondary)]">{{ $t('Shipping') }} ({{ order.shipping_method }})</span>
                                <span class="text-[var(--ds-text)]">
                                    <PriceByCurrencyCode :price="+order.shipping_amount" :currency-code="order.currency" />
                                </span>
                            </div>
                            <div v-if="zucConfig.product_price_with_tax === 'n' && order.order_tax > 0" class="flex justify-between w-full max-w-xs text-sm">
                                <span class="text-[var(--ds-text-secondary)]">{{ $t('Tax') }}</span>
                                <span class="text-[var(--ds-text)]">
                                    <PriceByCurrencyCode :price="+order.order_tax" :currency-code="order.currency" />
                                </span>
                            </div>
                            <template v-if="order.discounts && order.discounts.length > 0">
                                <div v-for="discount in order.discounts" :key="discount.id" class="flex justify-between w-full max-w-xs text-sm">
                                    <span class="text-[var(--ds-text-secondary)]">{{ $t(discount.name) }}</span>
                                    <span class="text-[var(--ds-sale)]">-<PriceByCurrencyCode :price="+discount.amount" :currency-code="order.currency" /></span>
                                </div>
                            </template>
                            <div class="flex justify-between w-full max-w-xs text-sm border-t border-[#e0d8c8] pt-2 mt-1">
                                <span class="font-[var(--font-display)] uppercase text-[var(--ds-text)]">{{ $t('Total') }}</span>
                                <span class="font-[var(--font-display)] text-[var(--ds-text)]">
                                    <PriceByCurrencyCode :price="+order.order_total" :currency-code="order.currency" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Returns notice -->
                <div v-if="order.returns && order.returns.length > 0" class="rounded-lg bg-amber-50 border border-amber-100 px-5 py-4 no-print">
                    <ul class="list-none m-0 space-y-1">
                        <li v-for="item in order.returns" :key="item.product_id" class="text-sm text-amber-800 capitalize">
                            {{ item.resolution }} <strong>{{ item.qty }}x {{ item.name }}</strong> {{ $t('with reason') }} {{ item.reason }} #{{ item.id }}
                        </li>
                    </ul>
                </div>


                <!-- Delivery & Billing addresses -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="border border-[#e0d8c8] rounded-lg px-6 py-5">
                        <h3 class="text-sm font-[var(--font-display)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Delivery Address') }}</h3>
                        <div class="mt-3">
                            <DisplayAddress :address="shippingAddress" />
                        </div>
                        <div class="mt-4 pt-4 border-t border-[#e0d8c8]">
                            <p class="text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] !mb-0">{{ $t('Shipping Method') }}</p>
                            <p class="text-sm text-[var(--ds-text)] mt-1 !mb-0">{{ order.shipping_method }}</p>
                        </div>
                    </div>
                    <div class="border border-[#e0d8c8] rounded-lg px-6 py-5">
                        <h3 class="text-sm font-[var(--font-display)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Billing Address') }}</h3>
                        <div class="mt-3">
                            <DisplayAddress :address="billingAddress" />
                        </div>
                        <div class="mt-4 pt-4 border-t border-[#e0d8c8]">
                            <p class="text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] !mb-0">{{ $t('Payment Method') }}</p>
                            <p class="text-sm text-[var(--ds-text)] mt-1 !mb-0">{{ order.payment_method }}</p>
                        </div>
                    </div>
                </div>

                <!-- Status History -->
                <div class="border border-[#e0d8c8] rounded-lg overflow-hidden">
                    <div class="px-6 py-4 bg-[var(--ds-neutral)]">
                        <h3 class="text-sm font-[var(--font-display)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Status History & Comments') }}</h3>
                    </div>
                    <div v-if="order.comments && order.comments.length > 0">
                        <table class="min-w-full divide-y divide-[#e0d8c8]">
                            <thead>
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Date') }}</th>
                                    <th class="px-6 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Status') }}</th>
                                    <th class="px-6 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)]">{{ $t('Note') }}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#e0d8c8]">
                                <tr v-for="comment in order.comments" :key="comment.id" :class="`${comment.admin !== `customer` ? `no-print` : `printable`}`">
                                    <td class="px-6 py-3 text-sm font-[var(--font-label)] text-[var(--ds-text-secondary)]">{{ comment.created_at }}</td>
                                    <td class="px-6 py-3 text-sm">
                                        <span class="inline-flex items-center rounded-full bg-[var(--ds-neutral)] px-2 py-0.5 text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)]">{{ comment.status_text }}</span>
                                    </td>
                                    <td class="px-6 py-3 text-sm text-[var(--ds-text-secondary)]">{{ comment.note }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div v-else class="px-6 py-8 text-center">
                        <p class="text-sm text-[var(--ds-text-secondary)] !mb-0">{{ $t('There is no any comment at this time') }}</p>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <LocalizedLink to="/account/order/list" class="bg-[var(--ds-neutral)] text-[var(--ds-text)] border border-[#e0d8c8] hover:bg-[#e0d8c8] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-4 py-2 text-sm transition-colors inline-flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        {{ $t('Back to Order List') }}
                    </LocalizedLink>
                    <div class="flex flex-wrap items-center gap-3">
                        <LocalizedLink :to="`/return-exchange/${order.reference}`" class="bg-[var(--ds-neutral)] text-[var(--ds-text)] border border-[#e0d8c8] hover:bg-[#e0d8c8] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-4 py-2 text-sm transition-colors">
                            {{ $t('Need return or exchange?') }}
                        </LocalizedLink>
                        <button @click.stop="printInvoice" class="bg-[var(--ds-neutral)] text-[var(--ds-text)] border border-[#e0d8c8] hover:bg-[#e0d8c8] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-4 py-2 text-sm transition-colors inline-flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M9.75 21h4.5" />
                            </svg>
                            {{ $t('Print Invoice') }}
                        </button>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
