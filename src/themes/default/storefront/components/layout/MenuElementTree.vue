<script setup>
import { useHelpers } from '@/composables/useHelpers'
import { useI18n } from 'vue-i18n'

const { translateItemField } = useHelpers()
const { locale } = useI18n()

defineProps({
    elements: { type: Array, required: true },
    depth: { type: Number, default: 0 },
})

const emit = defineEmits(['navigate'])
</script>

<template>
    <template v-for="el in elements" :key="el.id">
        <!-- Heading element -->
        <h3
            v-if="+el.heading === 1 && depth === 0"
            class="text-sm font-semibold text-gray-900 mb-2"
        >
            <button
                @click="emit('navigate', el)"
                class="hover:text-gray-600 transition-colors cursor-pointer"
            >
                {{ translateItemField(el, 'title', locale) }}
            </button>
        </h3>

        <!-- Regular element -->
        <div v-else>
            <button
                @click="emit('navigate', el)"
                :class="[
                    'text-sm transition-colors cursor-pointer block',
                    depth === 0 ? 'text-gray-500 hover:text-gray-900 py-1' : 'text-gray-400 hover:text-gray-700 py-0.5',
                ]"
            >
                {{ translateItemField(el, 'title', locale) }}
            </button>
        </div>

        <!-- Recursive children -->
        <div v-if="el.children?.length" class="pl-3 mt-0.5">
            <MenuElementTree
                :elements="el.children"
                :depth="depth + 1"
                @navigate="(child) => emit('navigate', child)"
            />
        </div>
    </template>
</template>

<script>
export default { name: 'MenuElementTree' }
</script>
