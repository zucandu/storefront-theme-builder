<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useRoute } from "vue-router";

import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';

const { t } = useI18n();
const toast = useToast();
const authCustomerStore = useAuthCustomerStore();
const route = useRoute();
const { redirectTo } = useRedirect();

const formdata = ref({
    email: undefined,
    password: undefined
});

// Redirect when customer logged
onMounted(() => {
    if(authCustomerStore.isLoggedIn) {
        redirectTo('/account');
    }
});

const handleLogin = async () => {
    await authCustomerStore.loginCustomer(formdata.value)
        .then(async (result) => {
            await authCustomerStore.fetchCustomerInfo();
            if (result?.cartRestoreFailed) {
                toast.error(t('Could not restore your cart from previous session'));
            }
            if(route.query?.redirect) {
                 redirectTo(route.query.redirect);
            } else {
                redirectTo('/account');
            }
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
                    <h1 class="font-[var(--font-display)] text-2xl uppercase tracking-wide text-[var(--ds-text)] text-center !mb-0">{{ $t('Sign in to your account') }}</h1>
                    <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-1.5 !mb-0">{{ $t('Welcome back! Please enter your details.') }}</p>
                </div>
                <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-8 shadow-sm">
                    <form @submit.prevent="handleLogin" class="space-y-5">
                        <div>
                            <label for="email" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Email address') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.email" id="email" name="email" type="email" autocomplete="email" required="" class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center justify-between">
                                <label for="password" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Password') }}</label>
                                <LocalizedLink to="/forgot-password" class="text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] font-[var(--font-body)] text-sm transition-colors">{{ $t('Forgot password?') }}</LocalizedLink>
                            </div>
                            <div class="mt-1.5">
                                <input v-model="formdata.password" id="password" name="password" type="password" autocomplete="current-password" required="" class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] w-full py-3 rounded-lg font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors cursor-pointer">{{ $t('Sign in') }}</button>
                        </div>
                    </form>
                </div>
                <p class="text-center text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-6 !mb-0">
                    {{ $t("Don't have an account?") }}
                    <LocalizedLink to="/register" class="text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] font-[var(--font-body)] text-sm transition-colors">{{ $t('Create one') }}</LocalizedLink>
                </p>
            </div>
        </div>
    </div>
</template>
