<script setup>
import { ChevronRightIcon } from '@heroicons/vue/20/solid'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useHelpers } from '@/composables/useHelpers'
import { useI18n } from 'vue-i18n'

const props = defineProps({
    elements: { type: Array, required: true },
    depth: { type: Number, default: 0 },
    panelHeight: { type: Number, default: null },
    panelPadding: { type: Number, default: 8 },
})

const emit = defineEmits(['navigate'])

const { translateItemField } = useHelpers()
const { locale } = useI18n()

const activeChildId = ref(null)
const menuRoot = ref(null)
const measuredPanelHeight = ref(0)

const hasChildren = (element) => Array.isArray(element.children) && element.children.length > 0

const resolvedPanelHeight = computed(() => props.panelHeight || measuredPanelHeight.value || null)

const panelFrameStyle = computed(() => {
    if (!resolvedPanelHeight.value) {
        return undefined
    }

    return {
        height: `${resolvedPanelHeight.value}px`,
        minHeight: `${resolvedPanelHeight.value}px`,
    }
})

const panelContentStyle = computed(() => ({
    padding: `${props.panelPadding}px`,
}))

const updateMeasuredPanelHeight = async () => {
    await nextTick()

    if (props.panelHeight) {
        measuredPanelHeight.value = props.panelHeight
        return
    }

    measuredPanelHeight.value = menuRoot.value?.offsetHeight || 0
}

const setActiveChild = (element) => {
    activeChildId.value = hasChildren(element) ? element.id : null
}

const clearActiveChild = () => {
    activeChildId.value = null
}

const rowClasses = (element) => {
    const hasNestedItems = hasChildren(element)

    if (+element.heading === 1 && props.depth === 0) {
        return [
            'mb-1 flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors',
            hasNestedItems ? 'bg-gray-50 text-gray-700 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-700',
        ]
    }

    return [
        'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors',
        hasNestedItems ? 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
        props.depth > 0 ? 'text-[13px]' : '',
    ]
}

onMounted(() => {
    updateMeasuredPanelHeight()
})

watch(() => props.panelHeight, () => {
    updateMeasuredPanelHeight()
})

watch(() => props.elements, () => {
    updateMeasuredPanelHeight()
}, { deep: true })

watch(activeChildId, () => {
    updateMeasuredPanelHeight()
})
</script>

<template>
    <div ref="menuRoot" class="relative min-w-[14rem]" :style="panelFrameStyle" @mouseleave="clearActiveChild">
        <div class="flex flex-col" :style="panelContentStyle">
            <template v-for="element in elements" :key="element.id">
                <div
                    @mouseenter="setActiveChild(element)"
                    @focusin="setActiveChild(element)"
                >
                    <button
                        @click="emit('navigate', element)"
                        :class="rowClasses(element)"
                    >
                        <span class="break-words">
                            {{ translateItemField(element, 'title', locale) }}
                        </span>
                        <ChevronRightIcon
                            v-if="hasChildren(element)"
                            class="size-4 shrink-0 text-gray-300 transition-colors"
                        />
                    </button>

                    <transition
                        enter-active-class="transition duration-200 ease-out"
                        enter-from-class="opacity-0 translate-x-2"
                        enter-to-class="opacity-100 translate-x-0"
                        leave-active-class="transition duration-150 ease-in"
                        leave-from-class="opacity-100 translate-x-0"
                        leave-to-class="opacity-0 translate-x-2"
                    >
                        <div
                            v-if="hasChildren(element) && activeChildId === element.id"
                            class="absolute top-0 left-full z-50 flex"
                            :style="panelFrameStyle"
                        >
                            <div class="min-w-[14rem] -translate-x-[10px] rounded-md border border-gray-200 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.38)]" :style="panelFrameStyle">
                                <MultiLevelDropdownMenu
                                    :elements="element.children"
                                    :depth="depth + 1"
                                    :panel-height="resolvedPanelHeight"
                                    :panel-padding="8"
                                    @navigate="(child) => emit('navigate', child)"
                                />
                            </div>
                        </div>
                    </transition>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
export default { name: 'MultiLevelDropdownMenu' }
</script>