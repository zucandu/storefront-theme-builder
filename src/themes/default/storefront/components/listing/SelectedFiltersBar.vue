<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { XMarkIcon } from '@heroicons/vue/20/solid'

import { useHelpers } from '@/composables/useHelpers';

const { t, locale } = useI18n();
const { translateItemField } = useHelpers();

const props = defineProps({
    filters: {
        type: Object,
        required: true
    },
    selectedFilters: {
        type: Array,
        required: true
    }
});

const displaySelectedFilters = computed(() => {
    let temp = []
    if(props.filters && props.filters.base && props.selectedFilters.length > 0) {
        Object.keys(props.filters).forEach(k => {
            Object.keys(props.filters[k]).forEach(k2 => {
                if(Array.isArray(props.filters[k][k2])) {
                    props.filters[k][k2].filter(item => {
                        if(props.selectedFilters.includes(item.id)) {
                            temp.push(item)
                        }
                    })
                } else {

                    // Attributes
                    if(Array.isArray(props.filters[k][k2]['values'])) {
                        props.filters[k][k2]['values'].filter(item => {
                            if(props.selectedFilters.includes(item.id)) {
                                temp.push(item)
                            }
                        })
                    } else {
                        Object.keys(props.filters[k][k2]['values']).forEach(oid => {
                            if(props.selectedFilters.includes(props.filters[k][k2]['values'][oid]['id'])) {
                                temp.push(props.filters[k][k2]['values'][oid])
                            }
                        })
                    }

                }
            })
        })
    }
    return temp
});

const uncheckOption = (id) => {
    document.getElementById(`cb-option${id}`).click();
}

const uncheckAllOptions = () => {
    document.getElementById(`clear-all-btn`).click();
}

</script>

<template>
    <div v-if="displaySelectedFilters.length > 0" class="flex flex-wrap items-center gap-2">
        <!-- Individual filter chips -->
        <button
            v-for="item in displaySelectedFilters"
            :key="item.id"
            type="button"
            @click.stop="uncheckOption(item.id)"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#c8a45c] bg-[#c8a45c]/10 rounded-full hover:bg-[#c8a45c]/20 transition-colors group"
        >
            <template v-if="item.translations">
                {{ translateItemField(item, 'name', $i18n.locale) }}
            </template>
            <template v-else>
                {{ item.name }}
            </template>
            <XMarkIcon class="size-3.5 text-[#c8a45c]/60 group-hover:text-[#c8a45c] transition-colors" />
        </button>

        <!-- Clear all -->
        <button
            type="button"
            @click.stop="uncheckAllOptions"
            class="text-sm text-[#8a8274] hover:text-[#c8a45c] transition-colors pl-1"
        >
            {{ t("Clear All") }}
        </button>
    </div>
</template>
