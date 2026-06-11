<script setup>
import CheckoutForm from '@theme/storefront/components/checkout/Form.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useSettingsStore } from '@/stores/settings';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useOrderStore } from '@/stores/order';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

const toast = useToast();
const { t, locale } = useI18n();

const settingsStore = useSettingsStore();
const authCustomerStore = useAuthCustomerStore();
const orderStore = useOrderStore();

// App hooks injected into the checkout account/guest form (e.g. an SMS opt-in
// checkbox writing meta.twilio_sms via the zuc:set-meta protocol). Shown for
// both guest and account checkout — SMS notifications are about the order, not
// the account.
const { hooks: checkoutRegisterHooks, fetchHooks: fetchCheckoutRegisterHooks } = useStorefrontIframeHooks('storefront_checkout_register_form');

// Address-block app hooks — same three slots as the Address.vue step, so apps
// behave identically whether the address is entered during account creation or
// on the dedicated address step:
//  - before_address: top of the form, above the address block
//  - address_middle: just above the address lines (address-autocomplete mounts
//    here; the picked address arrives via zuc:fill-address → order store → the
//    watcher below maps it into formdata). No style-ref — the widget keeps its
//    own standalone design instead of copying this form's inputs.
//  - after_address: below the address block
const { hooks: beforeAddressHooks, fetchHooks: fetchBeforeAddressHooks } = useStorefrontIframeHooks('storefront_checkout_before_address');
const { hooks: addressMiddleHooks, fetchHooks: fetchAddressMiddleHooks } = useStorefrontIframeHooks('storefront_checkout_address_middle');
const { hooks: afterAddressHooks, fetchHooks: fetchAfterAddressHooks } = useStorefrontIframeHooks('storefront_checkout_after_address');

// Emit function for emitting events
const emit = defineEmits(["updateCheckoutStep"]);

const formdata = ref({
    firstname: undefined,
    lastname: undefined,
    company: undefined,
    address_line_1: undefined,
    address_line_2: undefined,
    city: undefined,
    phone: undefined,
    country_id: undefined,
    zone_id: undefined,
    zone_name: undefined,
    postcode: undefined,
    option: 'guest',
    password: undefined,
    passwordconfirm: undefined,
    grecaptcha_token: undefined,
    newsletter: false,
    meta: {}
});
const loadedCountry = ref(false);
onMounted(async () => {

    // Get countries
    await settingsStore.fetchCountries();
    loadedCountry.value = true;

    // Set default country when empty
    formdata.value.country_id ||= settingsStore.countries.find(country => country.id > 0)?.id;

    fetchCheckoutRegisterHooks();
    fetchBeforeAddressHooks();
    fetchAddressMiddleHooks();
    fetchAfterAddressHooks();
});

// An app iframe asked to set a meta key (zuc:set-meta), forwarded by
// StorefrontIframeHook. Persisted with the customer on register.
function handleSetMeta({ key, value }) {
    formdata.value.meta = { ...formdata.value.meta, [key]: value };
}

// Address-autocomplete app pushed a chosen address (zuc:fill-address) → order
// store → map it into the form here. Prefill only; the customer still reviews +
// submits. Mirrors the country/zone resolution used in Address.vue.
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

        // Zone: match stateCode (then state name) against the country's zones.
        const zones = country.zones || [];
        const zone = zones.find(z => z.code === addr.stateCode)
            || zones.find(z => (z.name || '').toLowerCase() === (addr.state || '').toLowerCase());
        if (zone) {
            formdata.value.zone_id = zone.id;
            formdata.value.zone_name = zone.name;
        } else if (addr.state) {
            // Free-text region (country has no predefined zones)
            formdata.value.zone_name = addr.state;
        }
    }
}, { deep: true });

// Computed property for regions
const regions = computed(() => {
    const regionsList = settingsStore.getZonesByCountryId(formdata.value.country_id);
    if (regionsList.length > 0 && regionsList.find(r => r.id === formdata.value.zone_id) === undefined) {
        formdata.value.zone_id = regionsList.find(r => r.id > 0)?.id;
        formdata.value.zone_name = undefined;
    }
    return regionsList;
});

const handleShippingAddress = async () => {

    if(zucConfig.recaptcha_site_key) {
        grecaptcha.ready(function() {
            grecaptcha.execute(zucConfig.recaptcha_site_key, { action: 'submit' }).then(function(token) {
                formdata.value.grecaptcha_token = token
            })
        })
        while(formdata.value.grecaptcha_token === undefined) {
            await new Promise(r => setTimeout(r, 100))
        }
    }

    // Set guest
    formdata.value = { ...formdata.value, is_guest: formdata.value.option === 'guest' ? 1 : 0 }

    await authCustomerStore.registerCustomer(formdata.value)
        .then(async () => {

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

            //
            // Set full name
            formdata.value = { ...formdata.value, name: `${formdata.value.firstname} ${formdata.value.lastname}` };

            await authCustomerStore.createCustomerAddress(formdata.value)
                .then(async () => {
                    await authCustomerStore.fetchCustomerInfo();
                    emit('updateCheckoutStep', { step: CheckoutForm });
                }).catch(error => {
                    toast.error(t(error.response.data.message));
                })

        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });


}
</script>

<template>
    <form @submit.prevent="handleShippingAddress" class="space-y-6">

        <!-- App hook slot: before the address block (top of the form) -->
        <StorefrontIframeHook
            v-for="hook in beforeAddressHooks"
            :key="hook.id"
            :hook="hook"
            hook-point="storefront_checkout_before_address"
        />

        <!-- Section: Checkout Options -->
        <div>
            <h2 class="font-[var(--font-display)] text-xl uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ t('Shipping Address') }}</h2>
            <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-label)] mt-1 !mb-0">{{ t('Checkout Options') }}</p>
            <div class="mt-3 inline-flex items-center rounded-xl bg-[var(--ds-neutral)] p-1">
                <label :for="'checkout-guest'"
                    class="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    :class="formdata.option === 'guest' ? 'bg-[var(--ds-white)] shadow-sm text-[var(--ds-text)]' : 'text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)]'">
                    <input v-model="formdata.option" value="guest" type="radio" id="checkout-guest" class="sr-only">
                    {{ t('Guest Checkout') }}
                </label>
                <label :for="'checkout-register-account'"
                    class="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    :class="formdata.option === 'account' ? 'bg-[var(--ds-white)] shadow-sm text-[var(--ds-text)]' : 'text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)]'">
                    <input v-model="formdata.option" value="account" type="radio" id="checkout-register-account" class="sr-only">
                    {{ t('Register Account') }}
                </label>
            </div>
        </div>

        <!-- Section: Contact & Name -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label for="firstname" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('First Name') }}</label>
                <input v-model="formdata.firstname" id="firstname" type="text"
                    :placeholder="t('Enter your first name')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
            <div>
                <label for="lastname" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Last Name') }}</label>
                <input v-model="formdata.lastname" id="lastname" type="text"
                    :placeholder="t('Enter your last name')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
            <div>
                <label for="company" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Company') }} <span class="text-[var(--ds-text-secondary)] font-normal">{{ t('(Optional)') }}</span></label>
                <input v-model="formdata.company" id="company" type="text"
                    :placeholder="t('Enter your company')"
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
        </div>

        <!-- Section: Email & Phone -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label for="email" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Email Address') }}</label>
                <input v-model="formdata.email" id="email" type="email"
                    :placeholder="t('E.g. johnwick@gmail.com')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
            <div>
                <label for="phone" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Phone') }}</label>
                <input v-model="formdata.phone" id="phone" type="text"
                    :placeholder="t('E.g. 5534128821')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
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

        <!-- Section: Address -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div class="sm:col-span-4">
                <label for="country" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Country') }}</label>
                <template v-if="loadedCountry">
                    <select v-model="formdata.country_id" id="country"
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]">
                        <option v-for="(country, index) in settingsStore.countries" :value="country.id" :key="index">
                            {{ country.name }}
                        </option>
                    </select>
                </template>
                <template v-else>
                    <div class="w-full h-[42px] bg-[#e0d8c8] rounded-lg animate-pulse"></div>
                </template>
            </div>
            <div class="sm:col-span-5">
                <label for="address-line-1" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Address line 1') }}</label>
                <input v-model="formdata.address_line_1" id="address-line-1" type="text"
                    :placeholder="t('Enter your street address')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
            <div class="sm:col-span-3">
                <label for="address-line-2" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Address line 2') }} <span class="text-[var(--ds-text-secondary)] font-normal">{{ t('(Optional)') }}</span></label>
                <input v-model="formdata.address_line_2" id="address-line-2" type="text"
                    :placeholder="t('Optional')"
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
        </div>

        <!-- Section: City, Region, Postcode -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <template v-if="regions && regions.length > 0">
                    <label for="region" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Region') }}</label>
                    <select v-model="formdata.zone_id" id="region"
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)]">
                        <option v-for="(region, index) in regions" :value="region.id" :key="index">
                            {{ region.name }}
                        </option>
                    </select>
                </template>
                <template v-else>
                    <label for="region" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Region') }}</label>
                    <input v-model="formdata.zone_name" id="region" type="text"
                        :placeholder="t('Enter your region')" required
                        class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                </template>
            </div>
            <div>
                <label for="city" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('City') }}</label>
                <input v-model="formdata.city" id="city" type="text"
                    :placeholder="t('Enter your city')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
            <div>
                <label for="postcode" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Postcode') }}</label>
                <input v-model="formdata.postcode" id="postcode" type="text"
                    :placeholder="t('Enter your zip code')" required
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
        </div>

        <!-- App hook slot: after the address block -->
        <StorefrontIframeHook
            v-for="hook in afterAddressHooks"
            :key="hook.id"
            :hook="hook"
            hook-point="storefront_checkout_after_address"
        />

        <!-- Section: Password (conditional) -->
        <div v-if="formdata.option === 'account'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label for="password" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">{{ t('Password') }}</label>
                <input v-model="formdata.password" type="password" id="password"
                    :placeholder="t('Enter your password')"
                    :required="formdata.option === 'account' ? true : false"
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
            <div>
                <label for="passwordconfirm" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] mb-1">
                    {{ t('Confirm Password') }}
                    <span v-if="formdata.password !== formdata.passwordconfirm && formdata.passwordconfirm !== undefined"
                        class="text-[var(--ds-sale)] text-xs font-normal ml-1">
                        {{ t('Password does not match') }}
                    </span>
                </label>
                <input v-model="formdata.passwordconfirm" type="password" id="passwordconfirm"
                    :placeholder="t('Confirm your password')"
                    class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
            </div>
        </div>


        <!-- Newsletter -->
        <div class="flex items-center gap-2">
            <input v-model="formdata.newsletter" type="checkbox" id="cb-newsletter"
                class="h-4 w-4 text-[var(--ds-accent)] border-[#e0d8c8] rounded focus:ring-[var(--ds-accent)] focus:ring-offset-0" />
            <label for="cb-newsletter" class="text-sm text-[var(--ds-text)] font-[var(--font-body)] cursor-pointer">
                {{ t('Subscribe to Newsletter?') }}
            </label>
        </div>

        <!-- App-injected hooks (e.g. SMS opt-in checkbox) write into formdata.meta via zuc:set-meta -->
        <StorefrontIframeHook
            v-for="hook in checkoutRegisterHooks"
            :key="hook.id"
            :hook="hook"
            hook-point="storefront_checkout_register_form"
            @set-meta="handleSetMeta"
        />

        <!-- Submit -->
        <div class="flex justify-end">
            <button type="submit"
                class="inline-flex items-center justify-center bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] rounded-lg px-6 py-3 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors cursor-pointer">
                {{ t('Go to the shipping and payment methods') }}
                <svg class="ml-2 size-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
            </button>
        </div>

    </form>
</template>
