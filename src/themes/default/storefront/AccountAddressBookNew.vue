<script setup>
import AddressForm from '@theme/storefront/components/account/AddressForm.vue'
</script>

<template>
    <div>
        <div class="border border-[#e0d8c8] rounded-lg">
            <div class="px-6 py-6">
                <h2 class="text-lg font-[var(--font-display)] uppercase tracking-wide text-[var(--ds-text)] !mb-0">{{ $t("Add a new address") }}</h2>
                <p class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ $t('Fill in your address details below') }}</p>
                <div class="mt-6">
                    <AddressForm />
                </div>
            </div>
        </div>
    </div>
</template>
