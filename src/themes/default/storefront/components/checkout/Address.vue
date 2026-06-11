<script setup>
import CheckoutForm from '@theme/storefront/components/checkout/Form.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'
import { ref, onMounted, computed, defineProps, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useSettingsStore } from '@/stores/settings';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useOrderStore } from '@/stores/order';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

const { t } = useI18n();
const toast = useToast();
const settingsStore = useSettingsStore();
const authCustomerStore = useAuthCustomerStore();
const orderStore = useOrderStore();

// App-injected iframe hooks at three positions around the address block:
//  - before_address: top of the form (reserved / generic apps)
//  - address_middle: inside the block, just above the address lines — where an
//    address-autocomplete app (e.g. Radar) belongs so the chosen address fills
//    the fields right below it (pushed via the zuc:fill-address protocol)
//  - after_address: bottom of the block (SMS opt-in + generic apps)
const { hooks: beforeAddressHooks, fetchHooks: fetchBeforeAddressHooks } = useStorefrontIframeHooks('storefront_checkout_before_address');
const { hooks: addressMiddleHooks, fetchHooks: fetchAddressMiddleHooks } = useStorefrontIframeHooks('storefront_checkout_address_middle');
const { hooks: afterAddressHooks, fetchHooks: fetchAfterAddressHooks } = useStorefrontIframeHooks('storefront_checkout_after_address');

const props = defineProps({
    params: {
        type: Object,
        required: true
    }
});

// Emit function for emitting events
const emit = defineEmits(["updateCheckoutStep"]);
const updateCheckoutComponent = () => {
    emit('updateCheckoutStep', { step: CheckoutForm });
}


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
    default_billing_address_id: undefined,
    edit_address_type: undefined,
});
const isNewAddress = ref(false);
const editAddressType = ref();

const loadedCountry = ref(false);
onMounted(async () => {

    // Get countries
    await settingsStore.fetchCountries();
    loadedCountry.value = true;

    // Fill address edit data
    if(props.params) {
        Object.keys(props.params).map(k => formdata.value[k] = props.params[k])
        editAddressType.value = formdata.value.edit_address_type;
    }

    // Set default country when empty
    if(!formdata.value.country_id) {
        formdata.value.country_id = settingsStore.countries.find(country => country.id > 0).id;
    }

    // Add new address
    if(authCustomerStore.customerAddressTotal === 0) {
        isNewAddress.value = true;
    }

    fetchBeforeAddressHooks();
    fetchAddressMiddleHooks();
    fetchAfterAddressHooks();
});

// An app iframe (e.g. Radar) pushed an address via zuc:fill-address → the order
// store holds it → map it into the form here. Prefill only; the customer still
// reviews + submits. Mirrors the country/zone resolution used by editAddress and
// the heads22v3 onAddressSelected mapping.
watch(() => orderStore.prefilledAddress, (addr) => {
    if (!addr) return;

    if (addr.address_line_1 !== undefined) formdata.value.address_line_1 = addr.address_line_1;
    if (addr.address_line_2 !== undefined) formdata.value.address_line_2 = addr.address_line_2;
    if (addr.city !== undefined) formdata.value.city = addr.city;
    if (addr.postalCode !== undefined) formdata.value.postcode = addr.postalCode;

    // Country: map ISO-2 countryCode -> country_id via settings.
    const country = addr.countryCode ? settingsStore.countries.find(c => c.iso_code_2 === addr.countryCode) : null;
    if (country) {
        formdata.value.country_id = country.id;
        formdata.value.country_code = country.iso_code_2;
        formdata.value.country_name = country.name;

        // Zone: match stateCode (then state name) against the country's zones.
        const zones = country.zones || [];
        const zone = zones.find(z => z.code === addr.stateCode)
            || zones.find(z => (z.name || '').toLowerCase() === (addr.state || '').toLowerCase());
        if (zone) {
            formdata.value.zone_id = zone.id;
            formdata.value.zone_code = zone.code;
            formdata.value.zone_name = zone.name;
        } else if (addr.state) {
            // Free-text region (country has no predefined zones)
            formdata.value.zone_name = addr.state;
        }
    }
}, { deep: true });

const editAddress = (address) => {

    // Uncheck the new address checkbox
    if(isNewAddress.value)  isNewAddress.value = false

    Object.keys(address).map(k => formdata.value[k] = address[k])

    // Assign country id
    const country = settingsStore.getCountryByCode(formdata.value.country_code)
    if(country) {
        formdata.value = { ...formdata.value, country_id: country.id }

        // Assign zone id
        if(country.zones.length > 0) {
            const zone = country.zones.find(z => z.code === formdata.value.zone_code);
            formdata.value = { ...formdata.value, zone_id: zone.id };
        }
    }
}

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
     // set country name
    const country = settingsStore.getCountryById(formdata.value.country_id);
    formdata.value = { ...formdata.value, ...{
        country_code: country.iso_code_2,
        country_name: country.name
    }};

    if(country.zones.length > 0) {
        const zone = country.zones.find(z => z.id === formdata.value.zone_id);
        if(zone) {
            formdata.value = { ...formdata.value, ...{
                zone_code: zone.code,
                zone_name: zone.name
            }}
        } else {
            formdata.value = { ...formdata.value, ...{
                zone_code: undefined,
                zone_id: undefined
            }}
        }
    }

    // Assign default address
    if(editAddressType.value === 'shipping') {
        formdata.value.default_shipping_address_id = 1
    } else if(editAddressType.value === 'billing') {
        formdata.value.default_billing_address_id = 1
    }

    // Create or update
    if(!isNewAddress.value) {
        formdata.value = { ...formdata.value, id: formdata.value.id}
        await authCustomerStore.updateCustomerAddress(formdata.value)
            .then(() => {
                toast.success(t("Updated address!"));
            })
            .catch(error => {
                toast.error(t(error.response.data.message));
            })
    } else {
        await authCustomerStore.createCustomerAddress(formdata.value)
            .then(() => {
                toast.success(t("Your new address has been added."));
            })
            .catch(error => {
                toast.error(t(error.response.data.message));
            })
    }

    // Turn on the checkout form
    emit('updateCheckoutStep', { step: CheckoutForm });
}

watch(
    () => isNewAddress.value,
    (v) => {
        if (v) {
            Object.keys(formdata.value).map(k => formdata.value[k] = undefined)
            if(!formdata.value.country_id) {
                formdata.value.country_id = settingsStore.countries.find(country => country.id > 0).id;
            }
        }
    }
);

</script>

<template>
    <div class="space-y-8">

        <!-- Existing addresses -->
        <div v-if="authCustomerStore.customerAddressTotal > 0">
            <h2 class="font-[var(--font-display)] text-xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('Your Addresses') }}</h2>
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="address in authCustomerStore.customerAddresses" :key="address.id"
                    class="bg-[var(--ds-neutral)] rounded-lg p-5 flex flex-col">
                    <DisplayAddress :address="address" class="flex-1" />
                    <button @click.stop="editAddress(address)"
                        class="mt-4 w-full inline-flex items-center justify-center border border-[#e0d8c8] rounded-lg px-4 py-2 text-sm text-[var(--ds-accent)] hover:bg-[var(--ds-white)] hover:border-[var(--ds-accent)] font-[var(--font-label)] uppercase tracking-wider transition-colors cursor-pointer">
                        {{ $t('Use this address') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Divider -->
        <div v-if="authCustomerStore.customerAddressTotal > 0" class="border-t border-[#e0d8c8]"></div>

        <!-- Section title -->
        <div>
            <h2 v-if="!editAddressType" class="font-[var(--font-display)] text-xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">
                {{ $t('Create or update address') }}
            </h2>
            <h2 v-else class="font-[var(--font-display)] text-xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">
                {{ $t('Create or update') }} {{ editAddressType }} {{ $t('address') }}
            </h2>
        </div>

        <!-- Address form -->
        <form @submit.prevent="handleAddress()" class="space-y-6">

            <!-- App hook slot: before the address block (top of the form) -->
            <StorefrontIframeHook
                v-for="hook in beforeAddressHooks"
                :key="hook.id"
                :hook="hook"
                hook-point="storefront_checkout_before_address"
            />

            <!-- New address toggle -->
            <div v-if="authCustomerStore.customerAddressTotal > 0">
                <label for="cb-create-new-address" class="flex items-center gap-2 cursor-pointer">
                    <input
                        v-model="isNewAddress"
                        id="cb-create-new-address"
                        type="checkbox"
                        :value="false"
                        class="h-4 w-4 text-[var(--ds-accent)] border-[#e0d8c8] rounded focus:ring-[var(--ds-accent)] focus:ring-offset-0"
                    />
                    <span class="text-sm text-[var(--ds-text)] font-[var(--font-body)]">{{ $t('Check the box if you want to create a new address for your account') }}</span>
                </label>
            </div>

            <!-- Name & Company -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div class="sm:col-span-7">
                    <label for="name" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Full Name') }}</label>
                    <input
                        v-model="formdata.name"
                        id="name"
                        type="text"
                        :placeholder="$t('Enter your name')"
                        required
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
                <div class="sm:col-span-5">
                    <label for="company" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Company') }} <span class="text-[var(--ds-text-secondary)] font-normal">{{ $t('(Optional)') }}</span></label>
                    <input
                        v-model="formdata.company"
                        id="company"
                        type="text"
                        :placeholder="$t('Optional')"
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
            </div>

            <!-- App hook slot: middle of the address block — address-autocomplete
                 apps (e.g. Radar) mount here so a picked address fills the lines below.
                 No style-ref: the embedded widget keeps its own standalone design
                 instead of copying this form's input style (zuc:hook-style). -->
            <StorefrontIframeHook
                v-for="hook in addressMiddleHooks"
                :key="hook.id"
                :hook="hook"
                hook-point="storefront_checkout_address_middle"
            />

            <!-- Address lines -->
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div class="sm:col-span-7">
                    <label for="address-line-1" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Address line 1') }}</label>
                    <input
                        v-model="formdata.address_line_1"
                        id="address-line-1"
                        type="text"
                        :placeholder="$t('Enter your street address')"
                        required
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
                <div class="sm:col-span-5">
                    <label for="address-line-2" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Address line 2') }} <span class="text-[var(--ds-text-secondary)] font-normal">{{ $t('(Optional)') }}</span></label>
                    <input
                        v-model="formdata.address_line_2"
                        id="address-line-2"
                        type="text"
                        :placeholder="$t('Optional')"
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
            </div>

            <!-- City & Phone -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label for="city" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('City') }}</label>
                    <input
                        v-model="formdata.city"
                        id="city"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
                <div>
                    <label for="phone" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Phone') }}</label>
                    <input
                        v-model="formdata.phone"
                        id="phone"
                        type="text"
                        required
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
            </div>

            <!-- Country, Region, Postcode -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label for="country" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Country') }}</label>
                    <select
                        v-model="formdata.country_id"
                        id="country"
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]"
                    >
                        <option v-for="(country, index) in settingsStore.countries" :key="index" :value="country.id">{{ country.name }}</option>
                    </select>
                </div>
                <div>
                    <template v-if="regions && regions.length > 0">
                        <label for="region" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Region') }}</label>
                        <select
                            v-model="formdata.zone_id"
                            id="region"
                            class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]"
                        >
                            <option v-for="(region, index) in regions" :key="index" :value="region.id">{{ region.name }}</option>
                        </select>
                    </template>
                    <template v-else>
                        <label for="region" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Region') }}</label>
                        <input
                            v-model="formdata.zone_name"
                            id="region"
                            type="text"
                            :placeholder="$t('Enter your region')"
                            required
                            class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                        />
                    </template>
                </div>
                <div>
                    <label for="postcode" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ $t('Postcode') }}</label>
                    <input
                        v-model="formdata.postcode"
                        id="postcode"
                        type="text"
                        :placeholder="$t('Enter your zip code')"
                        required
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]"
                    />
                </div>
            </div>

            <!-- Default address checkboxes -->
            <div v-if="isNewAddress && !editAddressType" class="space-y-3">
                <label for="cb-default-shipping-address" class="flex items-center gap-2 cursor-pointer">
                    <input
                        v-model="formdata.default_shipping_address_id"
                        id="cb-default-shipping-address"
                        type="checkbox"
                        class="h-4 w-4 text-[var(--ds-accent)] border-[#e0d8c8] rounded focus:ring-[var(--ds-accent)] focus:ring-offset-0"
                    />
                    <span class="text-sm text-[var(--ds-text)] font-[var(--font-body)]">{{ $t('Set as default shipping address ') }}</span>
                </label>
                <label for="cb-default-billing-address" class="flex items-center gap-2 cursor-pointer">
                    <input
                        v-model="formdata.default_billing_address_id"
                        id="cb-default-billing-address"
                        type="checkbox"
                        class="h-4 w-4 text-[var(--ds-accent)] border-[#e0d8c8] rounded focus:ring-[var(--ds-accent)] focus:ring-offset-0"
                    />
                    <span class="text-sm text-[var(--ds-text)] font-[var(--font-body)]">{{ $t('Set as default billing address ') }}</span>
                </label>
            </div>

            <!-- App hook slot: after the address block (SMS opt-in + generic apps) -->
            <StorefrontIframeHook
                v-for="hook in afterAddressHooks"
                :key="hook.id"
                :hook="hook"
                hook-point="storefront_checkout_after_address"
            />

            <!-- Actions -->
            <div class="flex items-center justify-between pt-2">
                <button
                    v-if="authCustomerStore.customerAddressTotal > 0"
                    type="button"
                    @click.stop="updateCheckoutComponent"
                    class="text-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)] transition-colors cursor-pointer">
                    {{ $t('Ignore and continue to checkout') }}
                </button>
                <div v-else></div>
                <button
                    type="submit"
                    class="inline-flex items-center justify-center bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] rounded-lg px-6 py-3 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors cursor-pointer">
                    {{ $t('Save') }}
                    <svg class="ml-2 size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>
        </form>
    </div>
</template>
