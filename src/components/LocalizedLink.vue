<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
    to: { type: [String, Object], required: true },
})

const settingsStore = useSettingsStore()

const href = computed(() => {
    if (typeof props.to !== 'string') return props.to
    const prefix = settingsStore.languagePrefix
    if (!prefix) return props.to
    return `/${prefix}${props.to.startsWith('/') ? props.to : '/' + props.to}`
})
</script>

<template>
    <RouterLink :to="href" v-bind="$attrs"><slot /></RouterLink>
</template>
