<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();

const formdata = ref({
    password: undefined,
    passwordconfirm: undefined,
});

// Reactive state to check if passwords match
const isPasswordMismatch = computed(() =>
    formdata.value.password &&
    formdata.value.passwordconfirm &&
    formdata.value.password !== formdata.value.passwordconfirm
);

const updatePassword = async () => {
    await authCustomerStore.updateAccountPassword(formdata.value)
        .then(() => {
            toast.success(t('Updated!'));

            // Reset the outer formdata
            formdata.value = {
                password: undefined,
                passwordconfirm: undefined,
            };
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });

}

</script>

<template>
    <div>
        <div class="border border-[#e0d8c8] rounded-lg">
            <div class="px-6 py-6">
                <h2 class="text-lg font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t("Update Password") }}</h2>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ $t('Choose a strong password with at least 8 characters') }}</p>

                <form @submit.prevent="updatePassword()" class="mt-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="password" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('New Password') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.password" id="password" type="password" autocomplete="new-password" required class="w-full border border-[#e0d8c8] rounded-lg px-4 py-2.5 text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)] placeholder:text-[var(--ds-text-secondary)]" />
                            </div>
                        </div>
                        <div>
                            <label for="passwordconfirm" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Confirm Password') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.passwordconfirm" id="passwordconfirm" type="password" autocomplete="new-password" required class="w-full border border-[#e0d8c8] rounded-lg px-4 py-2.5 text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)] placeholder:text-[var(--ds-text-secondary)]" />
                            </div>
                            <p v-if="isPasswordMismatch" class="mt-1.5 text-xs text-[var(--ds-sale)] !mb-0">{{ $t('Passwords do not match!') }}</p>
                        </div>
                    </div>
                    <div class="flex justify-end mt-6">
                        <button :disabled="isPasswordMismatch" type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] rounded-lg px-6 py-2.5 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ $t('Update Password') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
