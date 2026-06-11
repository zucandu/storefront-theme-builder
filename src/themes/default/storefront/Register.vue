<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

const { t } = useI18n();
const toast = useToast();
const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();

// App hooks injected into the register form (e.g. an SMS opt-in checkbox that
// writes meta.twilio_sms via the zuc:set-meta protocol).
const { hooks: registerFormHooks, fetchHooks: fetchRegisterFormHooks } = useStorefrontIframeHooks('storefront_register_form');

// Redirect when customer logged
onMounted(() => {
    if(authCustomerStore.isLoggedIn) {
        redirectTo('/account');
    }
    fetchRegisterFormHooks();
});

const formdata = ref({
    firstname: undefined,
    lastname: undefined,
    email: undefined,
    password: undefined,
    is_guest: 0,
    grecaptcha_token: undefined,
    newsletter: true,
    meta: null
});

const handleRegister = async () => {
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
    await authCustomerStore.registerCustomer(formdata.value)
        .then(async () => {
            await authCustomerStore.fetchCustomerInfo();
            redirectTo('/account');
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });
}

function updateMetaForm(obj) {
    formdata.value.meta = { ...formdata.value.meta, ...obj }
}

// An app iframe asked to set a meta key (zuc:set-meta), forwarded by
// StorefrontIframeHook. Persisted with the customer on register.
function handleSetMeta({ key, value }) {
    updateMetaForm({ [key]: value });
}
</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="max-w-md mx-auto">
                <div class="text-center mb-6">
                    <h1 class="font-[var(--font-display)] text-2xl uppercase tracking-wide text-[var(--ds-text)] text-center !mb-0">{{ $t('Create a new account') }}</h1>
                    <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-1.5 !mb-0">{{ $t('Join us and start shopping today.') }}</p>
                </div>
                <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-8 shadow-sm">
                    <form @submit.prevent="handleRegister" class="space-y-5">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label for="firstname" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('First name') }}</label>
                                <div class="mt-1.5">
                                    <input v-model="formdata.firstname" id="firstname" type="text" required class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                                </div>
                            </div>
                            <div>
                                <label for="lastname" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Last name') }}</label>
                                <div class="mt-1.5">
                                    <input v-model="formdata.lastname" id="lastname" type="text" required class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Email address') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.email" id="email" type="email" autocomplete="email" required class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Password') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.password" id="password" type="password" autocomplete="current-password" required class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>


                        <div class="flex items-center gap-2.5">
                            <input v-model="formdata.newsletter" id="newsletter" type="checkbox" class="h-4 w-4 rounded text-[var(--ds-accent)] border-[#e0d8c8] focus:ring-[var(--ds-accent)]" />
                            <label for="newsletter" class="text-sm text-[var(--ds-text)] font-[var(--font-body)] cursor-pointer !mb-0">{{ $t('Subscribe to Newsletter?') }}</label>
                        </div>

                        <!-- App-injected hooks (e.g. SMS opt-in checkbox) write into formdata.meta via zuc:set-meta -->
                        <StorefrontIframeHook
                            v-for="hook in registerFormHooks"
                            :key="hook.id"
                            :hook="hook"
                            hook-point="storefront_register_form"
                            @set-meta="handleSetMeta"
                        />

                        <div>
                            <button type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] w-full py-3 rounded-lg font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors cursor-pointer">
                                {{ $t('Create my account') }}
                            </button>
                        </div>
                    </form>
                </div>
                <p class="text-center text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-6 !mb-0">
                    {{ $t('Already have an account?') }}
                    <LocalizedLink to="/login" class="text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] font-[var(--font-body)] text-sm transition-colors">{{ $t('Sign in') }}</LocalizedLink>
                </p>
            </div>
        </div>
    </div>
</template>
