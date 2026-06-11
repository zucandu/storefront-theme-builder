<script setup>
import AvatarUploader from '@theme/storefront/components/account/AvatarUploader.vue'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

const { t } = useI18n();
const toast = useToast();
const authCustomerStore = useAuthCustomerStore();

const { hooks: profileHooks, fetchHooks: fetchProfileHooks } = useStorefrontIframeHooks('storefront_account_profile');

const formdata = ref({
    firstname: undefined,
    lastname: undefined,
    email: undefined,
    avatar: undefined,
    newsletter: 0,
    meta: null
});

onMounted(() => {
    formdata.value = {
        ...authCustomerStore.profile,
        newsletter: !!+authCustomerStore.profile.newsletter,
    };
    fetchProfileHooks();
});

const updateProfile = async () => {
    await authCustomerStore.updateCustomerProfile(formdata.value)
        .then(() => {
            toast.success(t('Updated!'));
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });
}

function updateContent(v) {
    formdata.value[v.field] = v.content
}
</script>


<template>
    <div>
        <div class="border border-[#e0d8c8] rounded-lg">
            <div class="px-6 py-6">
                <h2 class="text-lg font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t("Profile") }}</h2>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ $t('Update your personal information and email preferences') }}</p>

                <form @submit.prevent="updateProfile()" class="mt-6 space-y-6">
                    <!-- Avatar -->
                    <div class="w-64">
                        <AvatarUploader type="single" :current-images="[authCustomerStore.profile.avatar]" @updateContent="updateContent" />
                    </div>

                    <!-- Name + Email fields -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="firstname" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('First name') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.firstname" id="firstname" name="firstname" type="text" required class="w-full border border-[#e0d8c8] rounded-lg px-4 py-2.5 text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)] placeholder:text-[var(--ds-text-secondary)]" />
                            </div>
                        </div>
                        <div>
                            <label for="lastname" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Last name') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.lastname" id="lastname" name="lastname" type="text" required class="w-full border border-[#e0d8c8] rounded-lg px-4 py-2.5 text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)] placeholder:text-[var(--ds-text-secondary)]" />
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label for="email" class="block text-sm font-[var(--font-label)] uppercase tracking-wider text-[var(--ds-text)] !mb-0">{{ $t('Email address') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.email" id="email" name="email" type="email" autocomplete="email" required class="w-full border border-[#e0d8c8] rounded-lg px-4 py-2.5 text-sm text-[var(--ds-text)] bg-[var(--ds-white)] focus:outline-none focus:ring-1 focus:ring-[var(--ds-accent)]/30 focus:border-[var(--ds-accent)] transition-colors font-[var(--font-body)] placeholder:text-[var(--ds-text-secondary)]" />
                            </div>
                        </div>
                    </div>

                    <!-- Storefront hook: account profile -->
                    <StorefrontIframeHook
                        v-for="hook in profileHooks" :key="hook.id"
                        :hook="hook" hook-point="storefront_account_profile"
                        :query-params="{ customer_id: authCustomerStore.profile?.id }"
                    />

                    <!-- Newsletter -->
                    <label for="newsletter" class="flex items-center gap-3 cursor-pointer">
                        <input v-model="formdata.newsletter" :value="1" id="newsletter" name="newsletter" type="checkbox" class="h-4 w-4 rounded border-[#e0d8c8] text-[var(--ds-accent)] focus:ring-[var(--ds-accent)]" />
                        <span class="text-sm text-[var(--ds-text)]">{{ $t('Subscribe me to newsletter.') }}</span>
                    </label>

                    <!-- Submit -->
                    <div class="flex justify-end pt-2">
                        <button type="submit" class="bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] rounded-lg px-6 py-2.5 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors">
                            {{ $t('Update') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>
