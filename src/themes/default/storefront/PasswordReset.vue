<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';

const toast = useToast();
const { t } = useI18n();
const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();
const route = useRoute();

const formdata = ref({
    password: undefined,
    password_confirmation: undefined,
    token: undefined
});

// Reactive state to check if passwords match
const isPasswordMismatch = computed(() =>
    formdata.value.password &&
    formdata.value.password_confirmation &&
    formdata.value.password !== formdata.value.password_confirmation
);

const updatePassword = async() => {
    await authCustomerStore.updateCustomerPassword({ ...formdata.value, token: route.params.token})
        .then(() => {
            toast.success(t("Your password has been reset. Please login and happy shopping!"));
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
                    <h1 class="font-[var(--font-display)] text-2xl uppercase tracking-wide text-[var(--ds-text)] text-center !mb-0">{{ $t('Updated Your Password') }}</h1>
                    <p class="text-sm text-[var(--ds-text-secondary)] font-[var(--font-body)] mt-1.5 !mb-0">{{ $t('Choose a new password for your account.') }}</p>
                </div>
                <div class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-8 shadow-sm">
                    <form @submit.prevent="updatePassword" class="space-y-5">
                        <div>
                            <label for="password" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Password') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.password" id="password" type="password" required="" class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>
                        <div>
                            <div class="flex items-center justify-between">
                                <label for="password-confirm" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Confirmation') }}</label>
                                <span v-if="isPasswordMismatch" class="text-xs text-[var(--ds-sale)]">{{ $t('Passwords do not match!') }}</span>
                            </div>
                            <div class="mt-1.5">
                                <input v-model="formdata.password_confirmation" id="password-confirm" type="password" required="" class="w-full px-3.5 py-2.5 border border-[#e0d8c8] rounded-lg text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors placeholder:text-[var(--ds-text-secondary)] font-[var(--font-body)]" />
                            </div>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <LocalizedLink to="/login" class="text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] font-[var(--font-body)] text-sm transition-colors">{{ $t('Back to login') }}</LocalizedLink>
                            <button type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] px-6 py-3 rounded-lg font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors cursor-pointer">{{ $t('Update') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
