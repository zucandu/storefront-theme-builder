<script setup>
import {
    Dialog, DialogPanel,
    TransitionChild, TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useAuthCustomerStore } from '@/stores/auth/customer'
import { useHelpers } from '@/composables/useHelpers'
import { useRedirect } from '@/composables/useRedirect'

const { t, locale } = useI18n()
const router = useRouter()

const settingsStore = useSettingsStore()
const authCustomerStore = useAuthCustomerStore()
const { translateItemField, parseMenuLink } = useHelpers()
const { redirectTo } = useRedirect()

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    primaryMenu: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

// --- Currency ---
const selectedCurrency = ref(settingsStore.selectedCurrency)
watch(selectedCurrency, (newCurrency) => {
    settingsStore.setSelectedCurrency(newCurrency)
})
const setCurrency = (code) => {
    selectedCurrency.value = code
}

// --- Language ---
const selectedLanguage = ref(settingsStore.selectedLanguage)
const setLanguage = (iso) => {
    if (iso === selectedLanguage.value) return
    selectedLanguage.value = iso
    const currentPath = router.currentRoute.value.path.replace(/^\/|\/$/g, '')
    settingsStore.changeLanguage(currentPath, iso, settingsStore.selectedLanguage)
}

// --- Search ---
const keyword = ref(null)
const searchNow = () => {
    if (keyword.value?.trim()) {
        router.push({ path: '/search/result', query: { keyword: keyword.value.trim() } })
    }
}

// --- Navigation helpers ---
function navigateTo(item) {
    if (item.link === 'readonly') return
    redirectTo(parseMenuLink(item, 'url', locale.value))
}

function navigateToElement(el) {
    if (el.block_type === 'link') {
        redirectTo(parseMenuLink(el, 'url', locale.value))
    }
}

// --- Drill-down panels ---
const drillPanels = ref([])
const drillActiveIndex = ref(0)

function buildDrillRoot() {
    if (!props.primaryMenu?.items) return []
    return props.primaryMenu.items.map(item => {
        const label = translateItemField(item, 'title', locale.value)
        if (item.submenu === 'nosub') {
            return { label, menuItem: item, children: null }
        }
        const elements = item.blocks?.flatMap(b => b.elements) || []
        return {
            label,
            menuItem: item,
            children: elements.map(el => buildDrillElement(el)),
        }
    })
}

function buildDrillElement(el) {
    const label = translateItemField(el, 'title', locale.value)
    const hasChildren = el.children?.length > 0
    return {
        label,
        element: el,
        children: hasChildren ? el.children.map(c => buildDrillElement(c)) : null,
    }
}

function initDrillPanels() {
    drillPanels.value = [{ title: null, items: buildDrillRoot() }]
    drillActiveIndex.value = 0
}

function drillInto(drillItem) {
    if (!drillItem.children?.length) return
    drillPanels.value = drillPanels.value.slice(0, drillActiveIndex.value + 1)
    drillPanels.value.push({
        title: drillItem.label,
        items: drillItem.children,
    })
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            drillActiveIndex.value++
        })
    })
}

function drillBack() {
    if (drillActiveIndex.value > 0) {
        drillActiveIndex.value--
        setTimeout(() => {
            drillPanels.value = drillPanels.value.slice(0, drillActiveIndex.value + 1)
        }, 320)
    }
}

function drillNavigate(drillItem) {
    if (drillItem.menuItem) {
        navigateTo(drillItem.menuItem)
    } else if (drillItem.element) {
        navigateToElement(drillItem.element)
    }
    closeDrawer()
}

function openDrawer() {
    initDrillPanels()
}

function closeDrawer() {
    emit('update:modelValue', false)
    setTimeout(() => initDrillPanels(), 350)
}

// Init panels when opened
watch(() => props.modelValue, (open) => {
    if (open) openDrawer()
})
</script>

<template>
    <TransitionRoot as="template" :show="modelValue">
        <Dialog as="div" class="relative z-50 lg:hidden" @close="closeDrawer()">
            <!-- Backdrop -->
            <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-300"
                leave-from="opacity-100"
                leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
            </TransitionChild>

            <div class="fixed inset-0 flex">
                <TransitionChild
                    as="template"
                    enter="transform transition ease-in-out duration-300"
                    enter-from="-translate-x-full"
                    enter-to="translate-x-0"
                    leave="transform transition ease-in-out duration-300"
                    leave-from="translate-x-0"
                    leave-to="-translate-x-full"
                >
                    <DialogPanel class="relative flex w-full max-w-xs flex-col bg-[#1a1a1a] shadow-xl">
                        <!-- Close button -->
                        <div class="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                            <span class="text-sm font-semibold text-[#c8a45c] uppercase tracking-wider" style="font-family: var(--font-label)">{{ t('Menu') }}</span>
                            <button
                                type="button"
                                class="rounded-md p-1 text-gray-500 hover:text-white"
                                @click="closeDrawer()"
                            >
                                <XMarkIcon class="size-5" />
                            </button>
                        </div>

                        <!-- Search -->
                        <div class="px-4 py-3 border-b border-white/10 shrink-0">
                            <form @submit.prevent="searchNow(); closeDrawer()">
                                <div class="relative">
                                    <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <MagnifyingGlassIcon class="size-4 text-gray-500" />
                                    </div>
                                    <input
                                        v-model="keyword"
                                        type="search"
                                        :placeholder="t('Search products...')"
                                        class="block w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:bg-white/15 focus:ring-2 focus:ring-[#c8a45c]/20 focus:border-[#c8a45c]/50 focus:outline-hidden"
                                    />
                                </div>
                            </form>
                        </div>

                        <!-- Drill-Down Panels -->
                        <div class="relative flex-1 overflow-hidden">
                            <div
                                v-for="(level, index) in drillPanels"
                                :key="index"
                                class="absolute inset-0 flex flex-col bg-[#1a1a1a] transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
                                :style="{
                                    zIndex: index + 1,
                                    transform: index <= drillActiveIndex
                                        ? 'translateX(0)'
                                        : 'translateX(100%)'
                                }"
                            >
                                <!-- Back button -->
                                <button
                                    v-if="index > 0"
                                    @click="drillBack()"
                                    class="flex items-center gap-2 px-5 py-3 bg-white/5 border-b border-white/10 text-sm font-medium text-[#c8a45c] shrink-0 cursor-pointer hover:bg-white/10 transition-colors"
                                    style="font-family: var(--font-label); letter-spacing: 0.05em; text-transform: uppercase"
                                >
                                    <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                                    {{ level.title }}
                                </button>

                                <!-- Items -->
                                <div class="flex-1 overflow-y-auto">
                                    <button
                                        v-for="(drillItem, i) in level.items"
                                        :key="i"
                                        @click="drillItem.children?.length ? drillInto(drillItem) : drillNavigate(drillItem)"
                                        class="flex w-full items-center justify-between px-5 py-3.5 text-sm font-normal text-gray-300 border-b border-white/5 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                                    >
                                        <span>{{ drillItem.label }}</span>
                                        <svg
                                            v-if="drillItem.children?.length"
                                            class="size-4 text-gray-600 shrink-0"
                                            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                                        ><polyline points="9 18 15 12 9 6" /></svg>
                                    </button>

                                    <!-- Wishlist, Auth, Currency, Language — root panel only -->
                                    <template v-if="index === 0">
                                        <div class="border-t border-white/10 mt-2 pt-2">
                                            <LocalizedLink
                                                to="/account/wishlist"
                                                @click="closeDrawer()"
                                                class="flex w-full items-center px-5 py-3 text-sm font-normal text-gray-400 hover:text-white hover:bg-white/5"
                                            >
                                                {{ t('Wishlist') }}
                                            </LocalizedLink>
                                            <template v-if="!authCustomerStore.isLoggedIn">
                                                <LocalizedLink
                                                    to="/login"
                                                    @click="closeDrawer()"
                                                    class="flex w-full items-center px-5 py-3 text-sm font-normal text-gray-400 hover:text-white hover:bg-white/5"
                                                >
                                                    {{ t('Sign in') }}
                                                </LocalizedLink>
                                                <LocalizedLink
                                                    to="/register"
                                                    @click="closeDrawer()"
                                                    class="flex w-full items-center px-5 py-3 text-sm font-normal text-gray-400 hover:text-white hover:bg-white/5"
                                                >
                                                    {{ t('Create account') }}
                                                </LocalizedLink>
                                            </template>
                                            <template v-else>
                                                <LocalizedLink
                                                    to="/account"
                                                    @click="closeDrawer()"
                                                    class="flex w-full items-center px-5 py-3 text-sm font-normal text-gray-400 hover:text-white hover:bg-white/5"
                                                >
                                                    {{ t('My account') }}
                                                </LocalizedLink>
                                                <LocalizedLink
                                                    to="/logout"
                                                    @click="closeDrawer()"
                                                    class="flex w-full items-center px-5 py-3 text-sm font-normal text-gray-400 hover:text-white hover:bg-white/5"
                                                >
                                                    {{ t('Sign out') }}
                                                </LocalizedLink>
                                            </template>
                                        </div>

                                        <div v-if="settingsStore.currencies.length > 1 || settingsStore.languages.length > 1" class="border-t border-white/10 px-5 py-3 space-y-3">
                                            <div v-if="settingsStore.currencies.length > 1">
                                                <p class="text-xs font-medium text-gray-600 uppercase mb-1.5" style="font-family: var(--font-label); letter-spacing: 0.1em">{{ t('Currency') }}</p>
                                                <div class="flex flex-wrap gap-1.5">
                                                    <button
                                                        v-for="currency in settingsStore.currencies"
                                                        :key="currency.code"
                                                        @click="setCurrency(currency.code)"
                                                        :class="[
                                                            selectedCurrency === currency.code
                                                                ? 'bg-[#c8a45c] text-[#1a1a1a]'
                                                                : 'bg-white/10 text-gray-400 hover:bg-white/20',
                                                            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer'
                                                        ]"
                                                    >
                                                        {{ currency.symbol }} {{ currency.code }}
                                                    </button>
                                                </div>
                                            </div>
                                            <div v-if="settingsStore.languages.length > 1">
                                                <p class="text-xs font-medium text-gray-600 uppercase mb-1.5" style="font-family: var(--font-label); letter-spacing: 0.1em">{{ t('Language') }}</p>
                                                <div class="flex flex-wrap gap-1.5">
                                                    <button
                                                        v-for="language in settingsStore.languages"
                                                        :key="language.iso_code"
                                                        @click="setLanguage(language.iso_code); closeDrawer()"
                                                        :class="[
                                                            selectedLanguage === language.iso_code
                                                                ? 'bg-[#c8a45c] text-[#1a1a1a]'
                                                                : 'bg-white/10 text-gray-400 hover:bg-white/20',
                                                            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer'
                                                        ]"
                                                    >
                                                        <img
                                                            v-if="language.iso_code"
                                                            :src="`/storage/flags/${language.iso_code}.webp`"
                                                            :alt="language.name"
                                                            class="size-3.5 rounded-sm object-cover"
                                                        />
                                                        {{ language.name }}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </TransitionChild>
            </div>
        </Dialog>
    </TransitionRoot>
</template>
