<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useOrderStore } from '@/stores/order';
import DropzoneUploader from '@theme/storefront/components/widgets/DropzoneUploader.vue'

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const orderStore = useOrderStore();

const formdata = ref({
    id: undefined,
    order_ref: undefined,
    resolution: {},
    qty: {},
    reason: {},
    additional: undefined,
    attachments: []
});
const loaded = ref(false);
const reasonItems = ref([]);
const resolutionItems = ref([]);
const order = ref({});
const returnStatus = ref(null);
const isReturnClosed = ref(false);

const statusColorMap = {
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    red: 'bg-red-50 text-red-700 border-red-100',
};

onMounted(async () => {

    // Mock return reasons and resolutions
    reasonItems.value = [
        { id: 1, translations: [{ locale: 'en', name: 'Defective / Damaged' }] },
        { id: 2, translations: [{ locale: 'en', name: 'Wrong item received' }] },
        { id: 3, translations: [{ locale: 'en', name: 'Changed my mind' }] },
        { id: 4, translations: [{ locale: 'en', name: 'Item not as described' }] },
    ];
    resolutionItems.value = [
        { id: 1, translations: [{ locale: 'en', name: 'Refund' }] },
        { id: 2, translations: [{ locale: 'en', name: 'Exchange' }] },
        { id: 3, translations: [{ locale: 'en', name: 'Store credit' }] },
    ];

    // Fetch order details
    await orderStore.fetchOrderDetailsByRef(route.params.ref);
    order.value = orderStore.retrieveOrder;

    // Check if a return already exists and its status
    if (order.value.return_status) {
        returnStatus.value = order.value.return_status;
        isReturnClosed.value = !!order.value.return_status.is_final;
    }

    // Set formdata — auto-select if only one resolution
    const defaultResolution = resolutionItems.value.length === 1 ? resolutionItems.value[0].id : undefined;
    order.value.items.map(item => {
        formdata.value.resolution[item.product_id] = defaultResolution
        formdata.value.qty[item.product_id] = 1
        formdata.value.reason[item.product_id] = undefined
        formdata.value.order_ref = order.value.reference
    })

    loaded.value = true;

});

const submitRequest = async() => {
    await orderStore.processReturn(formdata.value)
        .catch(error => {
            toast.error(t(error.response.data.message));
        });

    await orderStore.fetchOrderDetailsByRef(route.params.ref);
    order.value = orderStore.retrieveOrder;

    toast.success(t(`We have received your request and we will contact you as soon as possible.`));
}

function updateContent(v)
{
    switch(v.type) {
        case 'add':
            formdata.value.attachments.push(v.content)
        break;
        case 'remove':
            const index = formdata.value.attachments.indexOf(v.content)
            if (index !== -1) {
                formdata.value.attachments.splice(index, 1)
            }
        break;
    }
}
</script>

<template>
    <div>
        <div v-if="loaded" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <!-- Return Status Banner -->
            <div v-if="returnStatus" class="border rounded-xl p-4 mb-6" :class="statusColorMap[returnStatus.color] || statusColorMap.gray">
                <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">{{ $t('Return Status') }}:</span>
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/60">
                        {{ $t(returnStatus.name) }}
                    </span>
                </div>
                <p v-if="isReturnClosed" class="mt-2 text-sm opacity-80 !mb-0">
                    {{ $t('This return request has been closed.') }}
                </p>
            </div>

            <div v-if="!isReturnClosed" class="border border-gray-200 rounded-xl p-6">
                <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t('Start a Return For Order') }} #{{ order.id }}</h1>

                <form @submit.prevent="submitRequest" class="mt-6">
                    <!-- Items Table -->
                    <div class="border border-gray-200 rounded-xl overflow-hidden">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Name') }}</th>
                                    <th v-if="resolutionItems.length > 1" class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Resolution') }}</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Quantity') }}</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Reason') }}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                <tr v-for="item in order.items" :key="item.product_id" class="hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3 w-24">
                                        <img v-if="item.images && item.images.length > 0" :src="`/storage/${zucConfig.small_image_size}/${item.images[0].src}`" class="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                                        <img v-else :src="`/storage/store/no-image.png`" :width="zucConfig.small_image_size" :alt="item.product_id" class="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                                    </td>
                                    <td class="px-4 py-3 text-sm text-gray-900">
                                        <div>
                                            <span>{{ item.name }}</span>
                                            <span v-if="item.sku" class="ml-2 text-gray-400">#{{ item.sku }}</span>
                                        </div>

                                    </td>
                                    <td v-if="resolutionItems.length > 1" class="px-4 py-3">
                                        <div class="flex flex-col gap-2">
                                            <label v-for="res in resolutionItems" :key="res.id" class="flex items-center gap-2 cursor-pointer">
                                                <input v-model="formdata.resolution[item.product_id]"
                                                       :value="res.id" type="radio"
                                                       class="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900/10" />
                                                <span class="text-sm text-gray-700">{{ $t(res.name) }}</span>
                                            </label>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <template v-if="(item.qty - item.qty_returned)">
                                            <select v-model="formdata.qty[item.product_id]" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors">
                                                <option v-for="i in (item.qty - item.qty_returned)" :value="i" :key="i">{{ i }}</option>
                                            </select>
                                        </template>
                                        <template v-else>
                                            <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">{{ $t('Returned all') }}</span>
                                        </template>
                                    </td>
                                    <td class="px-4 py-3">
                                        <select :disabled="!(item.qty - item.qty_returned) || (item.returnable == 0)" v-model="formdata.reason[item.product_id]" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <option :value="undefined">{{ $t('-Please select-') }}</option>
                                            <option v-for="reason in reasonItems" :value="reason.id" :key="reason.id">{{ $t(reason.name) }}</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Dropzone -->
                    <div class="mt-6">
                        <DropzoneUploader @updateContent="updateContent" />
                    </div>

                    <!-- Additional -->
                    <div class="mt-6">
                        <label class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Additional') }} ({{ $t('Optional') }})</label>
                        <div class="mt-1.5">
                            <textarea v-model="formdata.additional" rows="3" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors resize-none" :placeholder="$t('Write something...(optional)')"></textarea>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center justify-between mt-6">
                        <LocalizedLink to="/account/order/list" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">{{ $t('Back to my account') }}</LocalizedLink>
                        <button type="submit" class="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors">{{ $t('Submit Request') }}</button>
                    </div>
                </form>
            </div>

            <!-- Return History -->
            <div v-if="order.returns && order.returns.length > 0" class="border border-gray-200 rounded-xl p-6 mt-8">
                <p class="text-lg font-semibold text-gray-900 !mb-0">{{ $t('Returned Item History') }}</p>
                <div class="mt-4 overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Date') }}</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Type') }}</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Item') }}</th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ $t('Reason') }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            <tr v-for="item in order.returns" :key="item.product_id" class="hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-3 text-sm text-gray-600">{{ item.created_at }}</td>
                                <td class="px-4 py-3 text-sm text-gray-600 capitalize">{{ item.resolution }}</td>
                                <td class="px-4 py-3 text-sm text-gray-900"><span class="font-medium">{{ item.qty }}</span> x {{ item.name }}</td>
                                <td class="px-4 py-3 text-sm text-gray-600">{{ item.reason }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div v-else class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        </div>
    </div>
</template>
