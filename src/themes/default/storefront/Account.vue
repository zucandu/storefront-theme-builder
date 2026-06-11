<script setup>
import { ref, onMounted } from 'vue';
import AccountMenu from '@theme/storefront/components/account/Menu.vue';
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks';

const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();

const { hooks: accountMainHooks, fetchHooks: fetchAccountMainHooks } = useStorefrontIframeHooks('storefront_account_main');

onMounted(() => {
    if(!authCustomerStore.isLoggedIn) {
        redirectTo('/login');
    }
    fetchAccountMainHooks();
});

const upgrading = ref(false);
const upgradeGuestToAccount = async () => {
    upgrading.value = true;
    await authCustomerStore.upgradeGuestToAccount();
}
</script>

<template>
    <div v-if="authCustomerStore.isLoggedIn">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

            <div v-if="authCustomerStore.isRegisteredCustomer">
                <!-- Page title -->
                <h1 class="text-2xl sm:text-3xl font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('My Account') }}</h1>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ $t('Manage your orders, profile, and preferences') }}</p>

                <!-- Mobile tabs -->
                <div class="mt-6 lg:hidden">
                    <AccountMenu mode="tabs" />
                </div>

                <!-- Desktop: sidebar + content -->
                <div class="mt-8 flex gap-10">
                    <!-- Sidebar (desktop only) -->
                    <div class="hidden lg:block w-56 shrink-0">
                        <AccountMenu mode="sidebar" />
                    </div>
                    <!-- Content area -->
                    <div class="flex-1 min-w-0">
                        <router-view></router-view>
                        <!-- Storefront hook: account main -->
                        <StorefrontIframeHook
                            v-for="hook in accountMainHooks" :key="hook.id"
                            :hook="hook" hook-point="storefront_account_main"
                            :query-params="{ customer_id: authCustomerStore.profile?.id }"
                        />
                    </div>
                </div>
            </div>

            <!-- Guest upgrade prompt -->
            <div v-else class="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto bg-[var(--ds-neutral)] border border-[var(--ds-accent)]/20 rounded-lg p-8">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-16 text-[var(--ds-accent)] mb-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <h2 class="text-xl font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t("You're viewing the account page as a guest") }}</h2>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-2 !mb-0">{{ $t('To receive more offers and promotional emails, we suggest you create an account by clicking the "Create an account" button below. You will receive an email containing the password.') }}</p>
                <button
                    :disabled="upgrading"
                    class="mt-6 bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] font-[var(--font-label)] uppercase tracking-wider rounded-lg px-6 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    @click.stop="upgradeGuestToAccount"
                >
                    <svg v-if="upgrading" class="animate-spin -ml-1 mr-2 size-4 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ upgrading ? $t('Creating...') : $t('Create an account') }}
                </button>
            </div>

        </div>
    </div>
</template>
