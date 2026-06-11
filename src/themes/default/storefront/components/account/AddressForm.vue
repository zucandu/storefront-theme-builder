<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useSettingsStore } from '@/stores/settings';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';

const route = useRoute();
const { t } = useI18n();
const toast = useToast();
const settingsStore = useSettingsStore();
const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();

// Set variables
const formdata = ref({
    id: undefined,
    company: undefined,
    name: undefined,
    country_id: undefined,
    country_code: undefined,
    country_name: undefined,
    zone_id: undefined,
    zone_code: undefined,
    zone_name: undefined,
    postcode: undefined,
    address_line_1: undefined,
    address_line_2: undefined,
    city: undefined,
    phone: undefined,
    default_shipping_address_id: undefined,
    default_billing_address_id: undefined
});
const isShippingAddress = ref(false);
const isBillingAddress = ref(false);
const loadedCountry = ref(false);
onMounted(async () => {

    // Get countries
    await settingsStore.fetchCountries();
    loadedCountry.value = true;

    const currentAddress = authCustomerStore.customerInfo.addresses?.find(addr => +addr.id === +route.params.id)

    if (currentAddress) {
        for (const [k, v] of Object.entries(currentAddress)) {
            if (k in formdata.value) {
                formdata.value[k] = v
            }
        }

        // Set billing/shipping
        isShippingAddress.value = +authCustomerStore.customerInfo.default_shipping_address_id === +route.params.id;
        isBillingAddress.value = +authCustomerStore.customerInfo.default_billing_address_id === +route.params.id;

        // Set country and zone from customer info
        const country = settingsStore.getCountryByCode(formdata.value.country_code);
        formdata.value = { ...formdata.value, country_id: country.id }
        if(country.zones.length > 0) {
            const zone = country.zones.find(z => z.code === formdata.value.zone_code);
            formdata.value = { ...formdata.value, zone_id: zone.id };
        }
    }

    // Set default country when empty (new address or missing country)
    if(!formdata.value.country_id) {
        formdata.value.country_id = settingsStore.countries.find(country => country.id > 0)?.id
    }
});

// Computed property for regions
const regions = computed(() => {
    const regionsList = settingsStore.getZonesByCountryId(formdata.value.country_id);
    if (regionsList.length > 0 && regionsList.find(r => r.id === formdata.value.zone_id) === undefined) {
        formdata.value.zone_id = regionsList.find(r => r.id > 0)?.id;
        formdata.value.zone_name = undefined;
    }
    return regionsList;
});

const handleAddress = async () => {

    const country = settingsStore.getCountryById(formdata.value.country_id);
    formdata.value = { ...formdata.value, ...{
        country_code: country.iso_code_2,
        country_name: country.name
    }};

    // Get zone id
    if(country.zones.length > 0) {
        const zone = country.zones.find(z => +z.id === +formdata.value.zone_id);
        formdata.value = { ...formdata.value, ...{
            zone_code: zone.code,
            zone_name: zone.name
        }};
    } else {
        // Reset zone id and code
        formdata.value = { ...formdata.value, ...{
            zone_code: undefined,
            zone_id: undefined
        }};
    }

    if(+route.params.id) {
        await authCustomerStore.updateCustomerAddress(formdata.value).then(() => {
            toast.success(t("Address has been updated!"));
            redirectTo('/account/address-book');
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });
    } else {
        await authCustomerStore.createCustomerAddress(formdata.value).then(() => {
            toast.success(t("You have just add a new address!"));
            redirectTo('/account/address-book');
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });
    }
}

</script>

<template>
    <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-6">
        <form @submit.prevent="handleAddress()">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                <!-- Full name -->
                <div class="md:col-span-7">
                    <label for="name" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Full name') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.name" id="name" type="text" :placeholder="$t('Enter your name')" required class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>
                <!-- Company -->
                <div class="md:col-span-5">
                    <label for="company" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Company') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.company" id="company" :placeholder="$t('Optional')" class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>
                <!-- Street address -->
                <div class="md:col-span-7">
                    <label for="street-address" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Street address') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.address_line_1" id="street-address" type="text" :placeholder="$t('Enter your street address')" required class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>
                <!-- Apt/Suite -->
                <div class="md:col-span-5">
                    <label for="address-line-2" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Apt/Suite') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.address_line_2" id="address-line-2" :placeholder="$t('Optional')" class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>
                <!-- City -->
                <div class="md:col-span-7">
                    <label for="city" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('City') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.city" id="city" type="text" :placeholder="$t('Enter your city')" required class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>
                <!-- Phone -->
                <div class="md:col-span-5">
                    <label for="phone" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Phone') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.phone" id="phone" required :placeholder="$t('E.g. 5553332222')" class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>
                <!-- Country -->
                <div class="md:col-span-4">
                    <label for="country" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Country') }}</label>
                    <div class="mt-1.5">
                        <select v-if="loadedCountry" id="country" v-model="formdata.country_id" class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors bg-[var(--ds-white)] font-[var(--font-body)]">
                            <option v-for="(country, index) in settingsStore.countries" :value="country.id" :key="index">{{ country.name }}</option>
                        </select>
                        <div v-else class="flex justify-center py-2">
                            <div class="animate-spin rounded-full h-6 w-6 border-2 border-[#e0d8c8] border-t-[var(--ds-text)]"></div>
                        </div>
                    </div>
                </div>
                <!-- Region -->
                <div class="md:col-span-4">
                    <label for="region" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Region') }}</label>
                    <template v-if="loadedCountry">
                        <div v-if="regions.length > 0" class="mt-1.5">
                            <select id="region" v-model="formdata.zone_id" class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors bg-[var(--ds-white)] font-[var(--font-body)]">
                                <option v-for="(region, index) in regions" :value="region.id" :key="index">{{ region.name }}</option>
                            </select>
                        </div>
                        <div v-else class="mt-1.5">
                            <input v-model="formdata.zone_name" id="region" type="text" :placeholder="$t('Enter your region')" required class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                        </div>
                    </template>
                    <div v-else class="mt-1.5 flex justify-center py-2">
                        <div class="animate-spin rounded-full h-6 w-6 border-2 border-[#e0d8c8] border-t-[var(--ds-text)]"></div>
                    </div>
                </div>
                <!-- Zip/Postcode -->
                <div class="md:col-span-4">
                    <label for="postcode" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Zip/Postcode') }}</label>
                    <div class="mt-1.5">
                        <input v-model="formdata.postcode" id="postcode" type="text" :placeholder="$t('Enter your zip/postcode')" required class="w-full rounded-lg border border-[#e0d8c8] px-4 py-2.5 text-sm text-[var(--ds-text)] placeholder:text-[var(--ds-text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]" />
                    </div>
                </div>

                <!-- Default address checkboxes -->
                <template v-if="+authCustomerStore.customerAddressTotal > 0">
                    <div v-if="!isShippingAddress" class="md:col-span-12">
                        <label for="default-shipping-address-id" class="flex items-center gap-3 cursor-pointer">
                            <input v-model="formdata.default_shipping_address_id" id="default-shipping-address-id" type="checkbox" class="h-4 w-4 rounded border-[#e0d8c8] text-[var(--ds-accent)] focus:ring-[var(--ds-accent)]" />
                            <span class="text-sm text-[var(--ds-text)] font-[var(--font-body)]">{{ $t('Set as default shipping address') }}</span>
                        </label>
                    </div>
                    <div v-if="!isBillingAddress" class="md:col-span-12">
                        <label for="default-billing-address-id" class="flex items-center gap-3 cursor-pointer">
                            <input v-model="formdata.default_billing_address_id" id="default-billing-address-id" type="checkbox" class="h-4 w-4 rounded border-[#e0d8c8] text-[var(--ds-accent)] focus:ring-[var(--ds-accent)]" />
                            <span class="text-sm text-[var(--ds-text)] font-[var(--font-body)]">{{ $t('Set as default billing address') }}</span>
                        </label>
                    </div>
                </template>

                <!-- Actions -->
                <div class="md:col-span-12 flex items-center gap-4 pt-2">
                    <button type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] rounded-lg px-6 py-2.5 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors">
                        <template v-if="route.params.id">{{ $t('Update') }}</template>
                        <template v-else>{{ $t('Add now') }}</template>
                    </button>
                    <LocalizedLink to="/account/address-book" class="text-sm font-medium text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors font-[var(--font-body)]">{{ $t('Back to address book') }}</LocalizedLink>
                </div>
            </div>
        </form>
    </div>
</template>
