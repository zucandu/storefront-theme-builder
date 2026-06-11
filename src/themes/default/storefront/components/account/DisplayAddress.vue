<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    address: {
        type: Object,
        required: true
    }
});
</script>

<template>
    <div v-if="address" class="font-[var(--font-body)]">
        <p v-if="address.name" class="text-sm font-medium text-[var(--ds-text)] !mb-0">{{ address.name }}</p>
        <p v-if="address.address_line_1" class="text-sm text-[var(--ds-text)] mt-0.5 !mb-0">{{ address.address_line_1 }}</p>
        <p v-if="address.address_line_2" class="text-sm text-[var(--ds-text)] !mb-0">{{ address.address_line_2 }}</p>
        <p class="text-sm text-[var(--ds-text)] !mb-0">{{ address.city }}, {{ address.zone_name }} {{ address.postcode }}</p>
        <p class="text-sm text-[var(--ds-text)] !mb-0">{{ address.country_name }}</p>
        <p v-if="address.phone" class="text-sm text-[var(--ds-text-secondary)] mt-1 !mb-0">{{ address.phone }}</p>
    </div>
</template>
