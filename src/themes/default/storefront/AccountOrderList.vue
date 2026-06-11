<script setup>
import { ref, onMounted } from 'vue';
import { useOrderStore } from '@/stores/order';
import { useRedirect } from '@/composables/useRedirect';

const orderStore = useOrderStore();
const { redirectTo } = useRedirect();

const orders = ref(null);
const loaded = ref(false);

//
onMounted(async () => {
    const res = await orderStore.retrieveCustomerOrders();
    orders.value = res.orders;
    loaded.value = true;
});

const moveTo = (ref) => {
    redirectTo(`/account/order/${ref}`);
};

</script>

<template>
    <div>
        <div class="border border-[#e0d8c8] rounded-lg">
            <div class="px-6 py-6">
                <h2 class="text-lg font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t("Recent Orders") }}</h2>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ $t('Track and manage your recent purchases') }}</p>

                <!-- Loading -->
                <div v-if="!loaded" class="flex justify-center py-12">
                    <div class="animate-spin rounded-full h-8 w-8 border-2 border-[#e0d8c8] border-t-[var(--ds-accent)]"></div>
                </div>

                <div v-else class="mt-6">
                    <!-- Empty state -->
                    <div v-if="orders.length === 0" class="flex flex-col items-center justify-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-16 text-[#d0c8b8] mb-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                        <p class="font-[var(--font-display)] text-2xl uppercase text-[var(--ds-text)] !mb-0">{{ $t("No orders yet") }}</p>
                        <p class="text-[var(--ds-text-secondary)] text-sm mt-1 !mb-0">{{ $t("You haven't ordered any products yet.") }}</p>
                    </div>

                    <!-- Orders table -->
                    <div v-else class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-[#e0d8c8]">
                            <thead>
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)] first:rounded-tl-lg last:rounded-tr-lg">{{ $t('ID') }}</th>
                                    <th class="px-4 py-3 text-left text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Products') }}</th>
                                    <th class="px-4 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Total') }}</th>
                                    <th class="px-4 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Status') }}</th>
                                    <th class="px-4 py-3 text-center text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)]">{{ $t('Payment/Shipping') }}</th>
                                    <th class="px-4 py-3 text-right text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] bg-[var(--ds-neutral)] first:rounded-tl-lg last:rounded-tr-lg">{{ $t('Date') }}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#e0d8c8]">
                                <tr v-for="order in orders" :key="order.id" @click.stop="moveTo(order.reference)" class="hover:bg-[var(--ds-neutral)] transition-colors cursor-pointer">
                                    <td class="px-4 py-3 text-sm font-[var(--font-display)] text-[var(--ds-accent)]">{{ order.id }}</td>
                                    <td class="px-4 py-3 text-sm text-[var(--ds-text-secondary)]">{{ order.items.length }} {{ order.items.length === 1 ? $t('item') : $t('items') }}</td>
                                    <td class="px-4 py-3 text-sm text-[var(--ds-text)] text-center font-[var(--font-display)]">
                                        <PriceByCurrencyCode :price="+order.order_total" :currency-code="order.currency" />
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <span class="inline-flex items-center rounded-full bg-[var(--ds-neutral)] px-2.5 py-0.5 text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)]">{{ order.status_text }}</span>
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <p class="text-sm text-[var(--ds-text)] !mb-0">{{ $t(order.payment_method) }}</p>
                                        <p class="text-xs text-[var(--ds-text-secondary)] !mb-0">{{ order.shipping_method }}</p>
                                    </td>
                                    <td class="px-4 py-3 text-sm text-[var(--ds-text-secondary)] text-right font-[var(--font-label)]">{{ order.purchased_at }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>
