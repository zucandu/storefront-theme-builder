<script setup>
import { computed } from 'vue'
import { useProductStore } from '@/stores/catalog/product'
import { useSettingsStore } from '@/stores/settings'
import { useHelpers } from '@/composables/useHelpers'

const props = defineProps({
    product: { type: Object, required: true },
    qty:     { type: Number, default: 1 },
})

const productStore  = useProductStore()
const settingsStore = useSettingsStore()
const { formatCurrency } = useHelpers()

const prices = computed(() => productStore.finalizeProductPrice(props.product))

const fmt = (price) => {
    const curr = settingsStore.selectedCurrencyObject
    const converted = productStore.priceFormat(price) * props.qty
    return formatCurrency(converted, curr?.decimal_digits ?? 2, curr?.code ?? null)
}
</script>

<template>
    <span>
        <del v-if="prices.sale > 0" class="mr-1 opacity-60 font-normal text-[0.85em]">{{ fmt(prices.retail) }}</del>
        <span>{{ fmt(prices.final) }}</span>
    </span>
</template>
