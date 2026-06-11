<script setup>
import PriceRange from '@theme/storefront/components/listing/PriceRange.vue'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useHelpers } from '@/composables/useHelpers';

const { t } = useI18n();
const { translateItemField } = useHelpers();

const props = defineProps({
    selected: {
        type: Array,
        default: () => []
    },
    filters: {
        type: Object,
        required: true
    },
    resetFilter: {
        type: Boolean
    }
});

const emit = defineEmits(["update:selected"]);

// Make filters reactive
const filters = computed(() => props.filters);

// Two-way binding: proxy that reads from prop and writes via emit
const selected = computed({
    get: () => props.selected,
    set: (v) => emit("update:selected", v)
});

const hasAnyFilters = computed(() => {
    const f = filters.value;
    if (!f) return false;
    return (f.base && Object.keys(f.base).length > 0)
        || (f.attribute && Object.keys(f.attribute).length > 0)
        || (f.customize && Object.keys(f.customize).length > 0)
        || (f.features && Object.keys(f.features).length > 0)
        || (f.price && Object.keys(f.price).length > 0);
});

</script>

<template>
    <div v-if="hasAnyFilters" class="space-y-1">

        <!-- base -->
        <Disclosure
            v-for="(filterOptions, filterName) in filters.base"
            :key="filterName"
            v-slot="{ open }"
            :default-open="true"
        >
            <div class="border-b border-[#e0d8c8] py-4 first:pt-0">
                <DisclosureButton class="flex w-full items-center justify-between text-left">
                    <span class="text-sm font-semibold text-[#2d2d2d] uppercase tracking-wider" style="font-family: var(--font-label)">{{ t(filterName) }}</span>
                    <ChevronDownIcon
                        :class="[
                            'size-4 text-[#8a8274] transition-transform duration-200',
                            open ? 'rotate-180' : ''
                        ]"
                    />
                </DisclosureButton>
                <DisclosurePanel class="mt-3 max-h-64 overflow-y-auto space-y-2.5">
                    <label
                        v-for="(option, index) in filterOptions"
                        :key="index"
                        :for="`cb-option${option.id}`"
                        :class="[
                            'flex items-center gap-2.5 cursor-pointer group',
                            option.count === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        ]"
                    >
                        <input
                            v-model="selected"
                            :value="option.id"
                            type="checkbox"
                            :id="`cb-option${option.id}`"
                            class="h-4 w-4 rounded border-[#e0d8c8] text-[#c8a45c] focus:ring-[#c8a45c]/20 focus:ring-offset-0"
                            :disabled="option.count === 0"
                        >
                        <span class="flex-1 text-sm text-[#8a8274] group-hover:text-[#2d2d2d] transition-colors">
                            {{ translateItemField(option, 'name', $i18n.locale) }}
                        </span>
                        <span class="text-xs text-[#8a8274] tabular-nums">{{ option.count }}</span>
                    </label>
                </DisclosurePanel>
            </div>
        </Disclosure>

        <!-- attribute -->
        <Disclosure
            v-for="(attOption, aoid) in filters.attribute"
            :key="aoid"
            v-slot="{ open }"
            :default-open="true"
        >
            <div class="border-b border-[#e0d8c8] py-4">
                <DisclosureButton class="flex w-full items-center justify-between text-left">
                    <span class="text-sm font-semibold text-[#2d2d2d] uppercase tracking-wider" style="font-family: var(--font-label)">
                        {{ translateItemField(attOption, 'name', $i18n.locale) }}
                    </span>
                    <ChevronDownIcon
                        :class="[
                            'size-4 text-[#8a8274] transition-transform duration-200',
                            open ? 'rotate-180' : ''
                        ]"
                    />
                </DisclosureButton>
                <DisclosurePanel class="mt-3 max-h-64 overflow-y-auto space-y-2.5">
                    <label
                        v-for="(attOptionValue, aovid) in attOption.values"
                        :key="aovid"
                        :for="`cb-option${attOptionValue.id}`"
                        :class="[
                            'flex items-center gap-2.5 cursor-pointer group',
                            attOptionValue.count === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        ]"
                    >
                        <input
                            v-model="selected"
                            :value="attOptionValue.id"
                            type="checkbox"
                            :id="`cb-option${attOptionValue.id}`"
                            class="h-4 w-4 rounded border-[#e0d8c8] text-[#c8a45c] focus:ring-[#c8a45c]/20 focus:ring-offset-0"
                            :disabled="attOptionValue.count === 0"
                        >
                        <span class="flex-1 text-sm text-[#8a8274] group-hover:text-[#2d2d2d] transition-colors">
                            {{ translateItemField(attOptionValue, 'name', $i18n.locale) }}
                        </span>
                        <span class="text-xs text-[#8a8274] tabular-nums">{{ attOptionValue.count }}</span>
                    </label>
                </DisclosurePanel>
            </div>
        </Disclosure>

        <!-- customize -->
        <Disclosure
            v-for="(filterOptions, filterName) in filters.customize"
            :key="filterName"
            v-slot="{ open }"
            :default-open="true"
        >
            <div class="border-b border-[#e0d8c8] py-4">
                <DisclosureButton class="flex w-full items-center justify-between text-left">
                    <span class="text-sm font-semibold text-[#2d2d2d] uppercase tracking-wider" style="font-family: var(--font-label)">{{ t(filterName) }}</span>
                    <ChevronDownIcon
                        :class="[
                            'size-4 text-[#8a8274] transition-transform duration-200',
                            open ? 'rotate-180' : ''
                        ]"
                    />
                </DisclosureButton>
                <DisclosurePanel class="mt-3 max-h-64 overflow-y-auto space-y-2.5">
                    <label
                        v-for="(option, index) in filterOptions"
                        :key="index"
                        :for="`cb-option${option.id}`"
                        :class="[
                            'flex items-center gap-2.5 cursor-pointer group',
                            option.count === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        ]"
                    >
                        <input
                            v-model="selected"
                            :value="option.id"
                            type="checkbox"
                            :id="`cb-option${option.id}`"
                            class="h-4 w-4 rounded border-[#e0d8c8] text-[#c8a45c] focus:ring-[#c8a45c]/20 focus:ring-offset-0"
                            :disabled="option.count === 0"
                        >
                        <span class="flex-1 text-sm text-[#8a8274] group-hover:text-[#2d2d2d] transition-colors" v-html="t(option.name)"></span>
                        <span class="text-xs text-[#8a8274] tabular-nums">{{ option.count }}</span>
                    </label>
                </DisclosurePanel>
            </div>
        </Disclosure>

        <!-- features (e.g. Availability) -->
        <Disclosure
            v-for="(featureOptions, groupName) in filters.features"
            :key="`feat-${groupName}`"
            v-slot="{ open }"
            :default-open="true"
        >
            <div class="border-b border-[#e0d8c8] py-4">
                <DisclosureButton class="flex w-full items-center justify-between text-left">
                    <span class="text-sm font-semibold text-[#2d2d2d] uppercase tracking-wider" style="font-family: var(--font-label)">{{ t(groupName) }}</span>
                    <ChevronDownIcon
                        :class="[
                            'size-4 text-[#8a8274] transition-transform duration-200',
                            open ? 'rotate-180' : ''
                        ]"
                    />
                </DisclosureButton>
                <DisclosurePanel class="mt-3 space-y-2.5">
                    <label
                        v-for="(option, index) in featureOptions"
                        :key="index"
                        :for="`cb-option${option.id}`"
                        :class="[
                            'flex items-center gap-2.5 cursor-pointer group',
                            option.count === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        ]"
                    >
                        <input
                            v-model="selected"
                            :value="option.id"
                            type="checkbox"
                            :id="`cb-option${option.id}`"
                            class="h-4 w-4 rounded border-[#e0d8c8] text-[#c8a45c] focus:ring-[#c8a45c]/20 focus:ring-offset-0"
                            :disabled="option.count === 0"
                        >
                        <span class="flex-1 text-sm text-[#8a8274] group-hover:text-[#2d2d2d] transition-colors">
                            {{ t(option.name) }}
                        </span>
                        <span class="text-xs text-[#8a8274] tabular-nums">{{ option.count }}</span>
                    </label>
                </DisclosurePanel>
            </div>
        </Disclosure>

        <!-- price -->
        <Disclosure
            v-for="(filterOptions, filterName) in filters.price"
            :key="filterName"
            v-slot="{ open }"
            :default-open="true"
        >
            <div class="border-b border-[#e0d8c8] py-4">
                <DisclosureButton class="flex w-full items-center justify-between text-left">
                    <span class="text-sm font-semibold text-[#2d2d2d] uppercase tracking-wider" style="font-family: var(--font-label)">{{ t('Price Range') }}</span>
                    <ChevronDownIcon
                        :class="[
                            'size-4 text-[#8a8274] transition-transform duration-200',
                            open ? 'rotate-180' : ''
                        ]"
                    />
                </DisclosureButton>
                <DisclosurePanel class="mt-3 max-h-64 overflow-y-auto space-y-2.5">
                    <label
                        v-for="(option, index) in filterOptions"
                        :key="index"
                        :for="`cb-option${option.id}`"
                        :class="[
                            'flex items-center gap-2.5 cursor-pointer group',
                            option.count === 0 ? 'opacity-40 cursor-not-allowed' : ''
                        ]"
                    >
                        <input
                            v-model="selected"
                            :value="option.id"
                            type="checkbox"
                            :id="`cb-option${option.id}`"
                            class="h-4 w-4 rounded border-[#e0d8c8] text-[#c8a45c] focus:ring-[#c8a45c]/20 focus:ring-offset-0"
                            :disabled="option.count === 0"
                        >
                        <span class="flex-1 text-sm text-[#8a8274] group-hover:text-[#2d2d2d] transition-colors">
                            <PriceRange :price-range="option.name" />
                        </span>
                        <span class="text-xs text-[#8a8274] tabular-nums">{{ option.count }}</span>
                    </label>
                </DisclosurePanel>
            </div>
        </Disclosure>

        <!-- Clear all (hidden button for SelectedFiltersBar compat + visible reset) -->
        <button
            v-if="selected.length > 0"
            id="clear-all-btn"
            class="mt-4 w-full text-center text-sm text-[#8a8274] hover:text-[#c8a45c] transition-colors py-2"
            @click="selected = [];"
        >
            {{ t('Reset All') }}
        </button>
    </div>
</template>
