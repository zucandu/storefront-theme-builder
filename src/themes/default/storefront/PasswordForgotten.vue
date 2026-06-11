<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';

const toast = useToast();
const { t } = useI18n();
const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();

const formdata = ref({
    email: undefined,
    grecaptcha_token: undefined
});

// Form submitted
const resetPassword = async () => {

    if(zucConfig.recaptcha_site_key) {
        grecaptcha.ready(function() {
            grecaptcha.execute(zucConfig.recaptcha_site_key, { action: 'submit' }).then(function(token) {
                formdata.grecaptcha_token = token
            })
        })
        while(formdata.grecaptcha_token === undefined) {
            await new Promise(r => setTimeout(r, 100))
        }
    }

    await authCustomerStore.resetCustomerPassword(formdata.value)
        .then(() => {
            toast.success(t("We have e-mailed your password reset link!"));
            redirectTo('/login');

        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        })

}


</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="max-w-md mx-auto">
                <div class="text-center mb-6">
                    <h1 class="font-[var(--font-display)] text-2xl uppercase tracking-wide text-[var(--ds-text)] text-center !mb-0">{{ $t('Password Forgotten') }}</h1>
                    <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-1.5 !mb-0">{{ $t('Enter your email and we will send you a reset link.') }}</p>
                </div>
                <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-8 shadow-sm">
                    <form @submit.prevent="resetPassword" class="space-y-5">
                        <div>
                            <label for="email" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Email address') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.email" id="email" name="email" type="email" autocomplete="email" required="" class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] w-full py-3 rounded-lg font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors cursor-pointer">{{ $t('Reset') }}</button>
                        </div>
                    </form>
                </div>
                <p class="text-center text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-6 !mb-0">
                    <LocalizedLink to="/login" class="text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] font-[var(--font-body)] text-sm transition-colors">{{ $t('Back to login') }}</LocalizedLink>
                </p>
            </div>
        </div>
    </div>
</template>
