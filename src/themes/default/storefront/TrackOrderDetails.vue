<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useOrderStore } from '@/stores/order';

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const orderStore = useOrderStore();

// Make `loaded` reactive
const order = ref({});
const orderTrackingInfo = ref({});
const shippingAddress = ref({});
const billingAddress = ref({});
const loaded = ref(false);
onMounted(async () => {
    await orderStore.fetchOrderDetailsByRef(route.params.ref)

    // Set order
    order.value = orderStore.retrieveOrder

    // Set shipping and billing address
    shippingAddress.value = order.value.addresses.find(addr => addr.address_type === `shipping`)
    billingAddress.value = order.value.addresses.find(addr => addr.address_type === `billing`) || shippingAddress.value

    // Get the tracking information
    orderTrackingInfo.value = await orderStore.fetchTrackingDetailsByRef(route.params.ref)

    // Update loaded
    loaded.value = true
})

function printInvoice() {
    window.print();
}
</script>

<template>
    <div>
        <div v-if="loaded" class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <!-- Order Header -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t('Order ID') }}# {{ order.id }}</h1>
                </div>
                <div class="flex items-center gap-3">
                    <LocalizedLink to="/track-order/form" class="border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        {{ $t('Back to Track Order Form') }}
                    </LocalizedLink>
                    <a href="#" @click.stop="printInvoice" class="border border-gray-200 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                        {{ $t('Print Invoice') }}
                    </a>
                </div>
            </div>

            <!-- Tracking Timeline -->
            <div class="border border-gray-200 rounded-xl p-5 mb-8">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="size-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                    <p class="text-lg font-semibold text-gray-900 !mb-0">{{ $t('Shipment Tracking') }}</p>
                    <template v-if="orderTrackingInfo?.courier">
                        <span class="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5">{{ orderTrackingInfo.courier }}</span>
                        <span v-if="orderTrackingInfo.tracking_number" class="text-xs text-gray-500">{{ orderTrackingInfo.tracking_number }}</span>
                    </template>
                </div>

                <!-- Timeline events -->
                <div v-if="orderTrackingInfo?.tracking_events?.length" class="relative ml-3">
                    <div class="absolute left-1 top-2 bottom-2 w-px bg-gray-200"></div>
                    <div v-for="(event, index) in orderTrackingInfo.tracking_events" :key="index" class="relative flex gap-4 pb-5 last:pb-0">
                        <!-- Dot -->
                        <div class="relative z-10 shrink-0">
                            <div v-if="index === 0 && orderTrackingInfo.delivered" class="flex items-center justify-center size-6 -ml-1.5 rounded-full bg-green-100 ring-2 ring-white">
                                <svg class="size-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <div v-else-if="index === 0" class="size-2.5 rounded-full bg-blue-600 ring-2 ring-white"></div>
                            <div v-else class="size-2.5 rounded-full bg-gray-300 ring-2 ring-white"></div>
                        </div>
                        <!-- Content -->
                        <div class="-mt-0.5 min-w-0">
                            <p class="text-sm font-medium !mb-0" :class="index === 0 ? 'text-gray-900' : 'text-gray-600'">{{ event.message }}</p>
                            <p class="text-xs text-gray-400 mt-0.5 !mb-0">
                                <span v-if="event.date">{{ new Date(event.date).toLocaleString() }}</span>
                                <span v-if="event.date && event.location"> &middot; </span>
                                <span v-if="event.location">{{ event.location }}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- No events fallback -->
                <div v-else class="rounded-lg bg-gray-50 px-4 py-3">
                    <p class="text-sm text-gray-500 !mb-0" v-if="orderTrackingInfo?.step >= 3">{{ $t('Your order has shipped! Tracking details will appear here once the courier provides updates.') }}</p>
                    <p class="text-sm text-gray-500 !mb-0" v-else>{{ $t('Your order is being processed, we will send the tracking info once it has shipped.') }}</p>
                </div>
            </div>

            <!-- Items Table -->
            <div class="border border-gray-200 rounded-xl overflow-hidden mb-8">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Name') }}</th>
                            <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Quantity') }}</th>
                            <th class="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Unit') }}</th>
                            <th class="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Total') }}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        <tr v-for="item in order.items" :key="item.id" class="hover:bg-gray-50 transition-colors">
                            <td class="px-5 py-4 text-sm text-gray-900">
                                <div>
                                    <span>{{ item.name }}</span>
                                    <span v-if="item.sku" class="ml-2 text-gray-400">#{{ item.sku }}</span>
                                </div>

                            </td>
                            <td class="px-5 py-4 text-sm text-gray-600 text-center">{{ item.qty }}</td>
                            <td class="px-5 py-4 text-sm text-gray-600 text-center">
                                <PriceByCurrencyCode :price="+item.price" :currency-code="order.currency" />
                            </td>
                            <td class="px-5 py-4 text-sm text-gray-900 text-right font-medium">
                                <PriceByCurrencyCode :price="+(item.price*item.qty)" :currency-code="order.currency" />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- Totals Summary -->
                <div class="border-t border-gray-200 bg-gray-50 px-5 py-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">{{ $t('Subtotal:') }}</span>
                        <span class="text-gray-900 font-medium"><PriceByCurrencyCode :price="+order.subtotal" :currency-code="order.currency" /></span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">{{ $t('Shipping') }} ({{ order.shipping_method }}):</span>
                        <span class="text-gray-900 font-medium"><PriceByCurrencyCode :price="+order.shipping_amount" :currency-code="order.currency" /></span>
                    </div>
                    <div v-if="zucConfig.product_price_with_tax === 'n' && order.order_tax > 0" class="flex justify-between text-sm">
                        <span class="text-gray-600">{{ $t('Tax:') }}</span>
                        <span class="text-gray-900 font-medium"><PriceByCurrencyCode :price="+order.order_tax" :currency-code="order.currency" /></span>
                    </div>
                    <template v-if="order.discounts && order.discounts.length > 0">
                        <div v-for="discount in order.discounts" :key="discount.id" class="flex justify-between text-sm">
                            <span class="text-gray-600">{{ $t(discount.name) }}</span>
                            <span class="text-red-600 font-medium">-<PriceByCurrencyCode :price="+discount.amount" :currency-code="order.currency" /></span>
                        </div>
                    </template>
                    <div class="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                        <span class="text-gray-900">{{ $t('Total:') }}</span>
                        <span class="text-gray-900"><PriceByCurrencyCode :price="+order.order_total" :currency-code="order.currency" /></span>
                    </div>
                </div>
            </div>

            <!-- Delivery & Shipping -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div class="border border-gray-200 rounded-xl p-5">
                    <p class="text-lg font-semibold text-gray-900 !mb-0">{{ $t('Delivery Address') }}</p>
                    <div class="mt-3 text-sm text-gray-600">
                        <DisplayAddress :address="shippingAddress" />
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-sm font-medium text-gray-700 !mb-0">{{ $t('Shipping Method') }}</p>
                        <p class="text-sm text-gray-600 mt-1 !mb-0">{{ order.shipping_method }}</p>
                    </div>
                </div>
                <div class="border border-gray-200 rounded-xl p-5">
                    <p class="text-lg font-semibold text-gray-900 !mb-0">{{ $t('Billing Address') }}</p>
                    <div class="mt-3 text-sm text-gray-600">
                        <DisplayAddress :address="billingAddress" />
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-sm font-medium text-gray-700 !mb-0">{{ $t('Payment Method') }}</p>
                        <p class="text-sm text-gray-600 mt-1 !mb-0">{{ order.payment_method }}</p>
                    </div>
                </div>
            </div>

            <!-- Status History -->
            <div class="border border-gray-200 rounded-xl p-5">
                <p class="text-lg font-semibold text-gray-900 !mb-0">{{ $t('Status History & Comments') }}</p>
                <div v-if="order.comments && order.comments.length > 0" class="mt-4 overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Date') }}</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Status') }}</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Note') }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="comment in order.comments" :key="comment.id" :class="`${comment.admin !== `customer` ? `no-print` : `printable`}`" class="hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-3 text-sm text-gray-600">{{ comment.created_at }}</td>
                                <td class="px-4 py-3 text-sm">
                                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">{{ comment.status_text }}</span>
                                </td>
                                <td class="px-4 py-3 text-sm text-gray-600">{{ comment.note }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p v-else class="text-sm text-gray-500 mt-3 !mb-0">{{ $t('There is no any comment at this time') }}</p>
            </div>
        </div>
        <div v-else class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        </div>
    </div>
</template>
