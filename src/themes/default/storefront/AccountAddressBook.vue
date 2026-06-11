<script setup>
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import { useAuthCustomerStore } from '@/stores/auth/customer';

const toast = useToast();
const { t } = useI18n();
const authCustomerStore = useAuthCustomerStore();

const deleteAddress = async (id) => {
    let isConfirm = confirm("Are you sure you want to delete this address?");
    if(isConfirm) {
        await authCustomerStore.deleteCustomerAddress(id)
            .then(() => {
                toast.success(t("Your address has been deleted!"));
            })
            .catch(error => {
                toast.error(t(error.response.data.message));
            });
    }
}

</script>

<template>
    <div>
        <div class="space-y-6">

            <!-- Current addresses -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-[var(--ds-neutral)] rounded-lg border border-[#e0d8c8] p-4 px-5">
                    <div class="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-[var(--ds-text-secondary)]">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        <h3 class="font-[var(--font-label)] text-xs uppercase tracking-wider text-[var(--ds-accent)] !mb-0">{{ $t('Default Shipping') }}</h3>
                    </div>
                    <DisplayAddress :address="authCustomerStore.customerShippingAddress" />
                </div>
                <div class="bg-[var(--ds-neutral)] rounded-lg border border-[#e0d8c8] p-4 px-5">
                    <div class="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-[var(--ds-text-secondary)]">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                        </svg>
                        <h3 class="font-[var(--font-label)] text-xs uppercase tracking-wider text-[var(--ds-accent)] !mb-0">{{ $t('Default Billing') }}</h3>
                    </div>
                    <DisplayAddress :address="authCustomerStore.customerBillingAddress" />
                </div>
            </div>

            <!-- All addresses -->
            <div class="border border-[#e0d8c8] rounded-lg px-6 py-5">
                <h3 class="text-lg font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t('All addresses') }}</h3>

                <div v-if="authCustomerStore.customerAddressTotal > 0" class="mt-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Address cards -->
                        <div v-for="address in authCustomerStore.customerAddresses" :key="address.id" class="border border-[#e0d8c8] rounded-lg p-4 hover:border-[var(--ds-accent)] transition-colors">
                            <DisplayAddress :address="address" />
                            <div class="mt-3 pt-3 border-t border-[#e0d8c8] flex items-center gap-3">
                                <LocalizedLink :to="`/account/address-book/${address.id}`" class="text-sm text-[var(--ds-accent)] hover:text-[var(--ds-accent-hover)] transition-colors">{{ $t('Edit') }}</LocalizedLink>
                                <span class="text-[#e0d8c8]">|</span>
                                <button @click.stop="deleteAddress(address.id)" class="text-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-sale)] transition-colors" type="button">{{ $t('Delete') }}</button>
                            </div>
                        </div>

                        <!-- Add new address card -->
                        <LocalizedLink to="/account/address-book/new" class="border-2 border-dashed border-[#e0d8c8] rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:border-[var(--ds-accent)] hover:bg-[var(--ds-neutral)] transition-colors min-h-[120px] group">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-8 text-[#d0c8b8] group-hover:text-[var(--ds-accent)] transition-colors">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span class="text-sm text-[var(--ds-text-secondary)] group-hover:text-[var(--ds-accent)] font-[var(--font-label)] uppercase tracking-wider transition-colors">{{ $t('Add new address') }}</span>
                        </LocalizedLink>
                    </div>
                </div>

                <!-- Empty state -->
                <div v-else class="mt-4">
                    <p class="text-sm text-[var(--ds-text-secondary)] !mb-0">{{ $t('You have no additional address entries in your address book.') }}</p>
                    <LocalizedLink to="/account/address-book/new" class="mt-3 inline-flex items-center gap-2 bg-[var(--ds-accent)] hover:bg-[var(--ds-accent-hover)] text-[var(--ds-white)] rounded-lg px-5 py-2.5 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {{ $t('Add a new address') }}
                    </LocalizedLink>
                </div>
            </div>
        </div>
    </div>
</template>
