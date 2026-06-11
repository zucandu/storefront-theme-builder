<script setup>
import { ref, onMounted } from 'vue'
import { useMenuStore } from '@/stores/utils/menu'
import { useHelpers } from '@/composables/useHelpers'
import { TruckIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, GiftIcon } from '@heroicons/vue/24/outline'

const menuStore = useMenuStore()
const { translateItemField } = useHelpers()

const menuItems = ref([])

const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '') : ''

// Map icon by index position — admin can reorder items
const icons = [TruckIcon, ShieldCheckIcon, ChatBubbleLeftRightIcon, GiftIcon]

onMounted(async () => {
    const menu = await menuStore.fetchMenuByType('home-top')
    if (menu?.items?.[0]?.blocks) {
        menuItems.value = menu.items[0].blocks.flatMap(b => b.elements) || []
    }
})
</script>

<template>
    <section v-if="menuItems.length > 0" class="bg-[#f5f0e8] border-b border-[#e8e0d0]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 lg:grid-cols-4">
                <div
                    v-for="(item, index) in menuItems"
                    :key="item.id"
                    :class="[
                        'flex items-center gap-3 px-5 py-4',
                        index % 2 !== 0 ? 'border-l border-[#e0d8c8]' : '',
                        index >= 2 ? 'border-t border-[#e0d8c8] lg:border-t-0' : '',
                        index >= 1 ? 'lg:border-l lg:border-[#e0d8c8]' : '',
                    ]"
                >
                    <!-- Icon -->
                    <div class="flex items-center justify-center size-9 shrink-0 rounded-full bg-[#c8a45c]/15">
                        <component
                            :is="icons[index] || icons[0]"
                            class="size-5 text-[#c8a45c]"
                        />
                    </div>

                    <!-- Text -->
                    <div class="min-w-0">
                        <p class="!mb-0 text-xs font-semibold text-[#2d2d2d] uppercase tracking-[0.15em]"
                            style="font-family: var(--font-label)">
                            {{ translateItemField(item, 'title', $i18n.locale) }}
                        </p>
                        <p
                            v-if="translateItemField(item, 'content', $i18n.locale)"
                            class="!mb-0 text-xs text-[#8a8274] mt-0.5"
                        >
                            {{ stripHtml(translateItemField(item, 'content', $i18n.locale)) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
