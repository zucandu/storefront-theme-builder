<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import { useCartStore } from '@/stores/cart';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useProductStore } from '@/stores/catalog/product';
import { ChevronDownIcon } from '@heroicons/vue/24/outline';

const settingsStore = useSettingsStore();
const cartStore = useCartStore();
const authCustomerStore = useAuthCustomerStore();
const productStore = useProductStore();

const props = defineProps({
    subtotal: {
        type: Number,
        required: true
    }
});

const isExpanded = ref(false);

const picked = ref({});
const formdata = ref({
    country_code: 'US',
    zone_code: 'AL',
    zone_name: undefined,
    postcode: undefined
});

const loadedCountry = ref(false);
onMounted(async () => {
    await settingsStore.fetchCountries();
    loadedCountry.value = true;
});

// Computed property for regions
const regions = computed(() => {
    const country = settingsStore.countries.find(country => country.iso_code_2 === formdata.value.country_code);
    return country?.zones || [];
});

const shippingMethods = ref([]);
const calculating = ref(false);
const calculateShippingEstimate = async () => {

    // Start the calculation process
    calculating.value = true;

    const shippingData = {
        customer: {
            addresses: [
                {
                    country_code: formdata.value.country_code,
                    zone_code: formdata.value.zone_code,
                    zone_name: formdata.value.zone_name,
                    postcode: formdata.value.postcode
                }
            ],
            group_pricing_id: authCustomerStore.customerInfo?.group_pricing_id
        },
        products: cartStore.items,
        subtotal: cartStore.subtotal
    };
    shippingMethods.value = await cartStore.calculateShippingEstimate(shippingData)
        .finally(() => calculating.value = false);
}

watch(
    () => picked.value,
    (v) => {
        if (v) {
            formdata.value = {
                country_code: v.country_code,
                zone_code: v.zone_code,
                zone_name: v.zone_name,
                postcode: v.postcode
            }
            calculateShippingEstimate();
        }
    }
);

</script>

<template>
    <div>
        <!-- Toggle Header -->
        <button
            @click="isExpanded = !isExpanded"
            class="flex w-full items-center justify-between py-3 cursor-pointer"
        >
            <span class="font-[var(--font-label)] text-sm uppercase tracking-wider text-[var(--ds-text)]">{{ $t('Estimate Shipping') }}</span>
            <ChevronDownIcon
                class="size-4 text-[var(--ds-text-secondary)] transition-transform duration-200"
                :class="{ 'rotate-180': isExpanded }"
            />
        </button>

        <!-- Collapsible Content -->
        <div
            v-show="isExpanded"
            class="pb-4"
        >
            <!-- Saved Addresses -->
            <div v-if="authCustomerStore.customerAddressTotal > 0" class="mb-5 space-y-2.5">
                <div v-for="address in authCustomerStore.customerAddresses" :key="address.id" class="flex items-center gap-2.5">
                    <input
                        v-model="picked"
                        :value="address"
                        type="radio"
                        :id="`radio-address-${address.id}`"
                        class="size-4 text-[var(--ds-accent)] border-[#e0d8c8] focus:ring-[var(--ds-accent)]/30"
                    />
                    <label
                        :for="`radio-address-${address.id}`"
                        class="text-sm text-[var(--ds-text)] cursor-pointer font-[var(--font-body)]"
                    >
                        {{ address.country_name }}, {{ address.zone_name }}, {{ address.postcode }}
                    </label>
                </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="calculateShippingEstimate">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <!-- Country -->
                    <div>
                        <label for="country" class="block text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] mb-1.5">{{ $t('Country') }}</label>
                        <select
                            name="country"
                            id="country"
                            class="w-full px-3 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-hidden focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]"
                            v-model="formdata.country_code"
                        >
                            <option v-for="(country, index) in settingsStore.countries" :value="country.iso_code_2" :key="index">{{ country.name }}</option>
                        </select>
                    </div>

                    <!-- Region -->
                    <div>
                        <label for="region" class="block text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] mb-1.5">{{ $t('Region') }}</label>
                        <template v-if="regions && regions.length > 0">
                            <select
                                name="region"
                                id="region"
                                class="w-full px-3 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-hidden focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]"
                                v-model="formdata.zone_code"
                            >
                                <option v-for="(region, index) in regions" :value="region.code" :key="index">{{ region.name }}</option>
                            </select>
                        </template>
                        <template v-else>
                            <input
                                v-model="formdata.zone_name"
                                class="w-full px-3 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-hidden focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]"
                                id="region"
                                :placeholder="$t('Enter your region')"
                                required
                            />
                        </template>
                    </div>

                    <!-- Postcode -->
                    <div>
                        <label for="postcode" class="block text-xs font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text-secondary)] mb-1.5">{{ $t('Postcode') }}</label>
                        <input
                            v-model="formdata.postcode"
                            class="w-full px-3 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-hidden focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]"
                            id="postcode"
                            :placeholder="$t('Enter your zip code')"
                            required
                        />
                    </div>
                </div>

                <!-- Calculate Button -->
                <div class="flex justify-end mt-4">
                    <button
                        :disabled="calculating"
                        class="text-sm bg-[var(--ds-primary)] text-[var(--ds-white)] hover:bg-[#2d2d2d] border border-[var(--ds-primary)] rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-[var(--font-label)] uppercase tracking-wider"
                        type="submit"
                    >
                        <template v-if="calculating">
                            <span class="inline-flex items-center gap-2">
                                <svg class="size-4 animate-spin text-[var(--ds-white)]/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {{ $t('Calculating...') }}
                            </span>
                        </template>
                        <template v-else>
                            {{ $t('Calculate') }}
                        </template>
                    </button>
                </div>
            </form>

            <!-- Shipping Methods Results -->
            <div v-if="shippingMethods.length > 0" class="mt-5 space-y-4">
                <div v-for="shipping in shippingMethods" :key="shipping.code">
                    <!-- Carrier Header -->
                    <div class="flex items-center justify-between mb-2">
                        <p class="font-[var(--font-label)] text-sm uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ shipping.name }}</p>
                        <img
                            v-if="shipping.image"
                            :src="`/storage/shippings/${shipping.image}`"
                            :alt="shipping.name"
                            class="h-6 w-auto"
                        />
                    </div>

                    <!-- Methods List -->
                    <template v-if="shipping.methods.length > 0">
                        <div
                            v-for="(method, index) in shipping.methods"
                            :key="method.id"
                            class="flex items-center justify-between py-2 text-sm"
                            :class="{ 'border-b border-[#e0d8c8]': index < shipping.methods.length - 1 }"
                        >
                            <span class="text-[var(--ds-text)] font-[var(--font-body)]">{{ method.title }}</span>
                            <span class="font-[var(--font-display)] text-[var(--ds-text)]">
                                <template v-if="+method.cost > 0">
                                    <PriceDisplay :price="+productStore.priceFormat(method.cost)" />
                                </template>
                                <template v-else>{{ $t("N/A") }}</template>
                            </span>
                        </div>
                    </template>

                    <!-- No Methods -->
                    <p v-else class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] !mb-0">{{ $t('No available shipping methods.') }}</p>
                </div>
            </div>
        </div>
    </div>
</template>
