<script setup>
import {
    Popover, PopoverButton, PopoverPanel,
    Menu, MenuButton, MenuItems, MenuItem,
} from '@headlessui/vue'
import {
    Bars3Icon, MagnifyingGlassIcon,
    ShoppingBagIcon, HeartIcon, UserIcon,
    ChevronDownIcon, GlobeAltIcon, CurrencyDollarIcon,
} from '@heroicons/vue/24/outline'

import MenuElementTree from './MenuElementTree.vue'
import MultiLevelDropdownMenu from './MultiLevelDropdownMenu.vue'
import MobileDrillMenu from './MobileDrillMenu.vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthCustomerStore } from '@/stores/auth/customer'
import { useMenuStore } from '@/stores/utils/menu'
import { useHelpers } from '@/composables/useHelpers'
import { useRedirect } from '@/composables/useRedirect'

const { t, locale } = useI18n()
const router = useRouter()

const settingsStore = useSettingsStore()
const menuStore = useMenuStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authCustomerStore = useAuthCustomerStore()

const { translateItemField, parseMenuLink, formatCurrency } = useHelpers()
const { redirectTo } = useRedirect()

// --- Scroll detection ---
const isScrolled = ref(false)
const HEADER_COLLAPSE_SCROLL_Y = 120
const HEADER_EXPAND_SCROLL_Y = 20

let scrollFrameId = null

const updateScrolledState = () => {
    const scrollY = window.scrollY || window.pageYOffset || 0

    if (!isScrolled.value && scrollY > HEADER_COLLAPSE_SCROLL_Y) {
        isScrolled.value = true
    } else if (isScrolled.value && scrollY < HEADER_EXPAND_SCROLL_Y) {
        isScrolled.value = false
    }

    scrollFrameId = null
}

const onScroll = () => {
    if (scrollFrameId !== null) return
    scrollFrameId = window.requestAnimationFrame(updateScrolledState)
}

onMounted(() => {
    updateScrolledState()
    window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    if (scrollFrameId !== null) {
        window.cancelAnimationFrame(scrollFrameId)
    }
})

// --- Menus ---
const primaryMenu = ref(null)
const topMenu = ref(null)
onMounted(async () => {
    primaryMenu.value = await menuStore.fetchMenuByType('primary')
    topMenu.value = await menuStore.fetchMenuByType('tertiary')
})

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

// --- Navigation ---
function navigateTo(item) {
    if (item.link === 'readonly') return
    const parsedLink = parseMenuLink(item, 'url', locale.value)
    redirectTo(parsedLink)
}

function navigateToElement(el) {
    if (el.block_type === 'link') {
        redirectTo(parseMenuLink(el, 'url', locale.value))
    }
}

const activeDesktopMenuId = ref(null)
const activeCompactMenuId = ref(null)

let desktopCloseTimer = null
let compactCloseTimer = null

const clearDesktopCloseTimer = () => {
    if (desktopCloseTimer) {
        window.clearTimeout(desktopCloseTimer)
        desktopCloseTimer = null
    }
}

const clearCompactCloseTimer = () => {
    if (compactCloseTimer) {
        window.clearTimeout(compactCloseTimer)
        compactCloseTimer = null
    }
}

const openDesktopMenu = (item) => {
    clearDesktopCloseTimer()
    if (item.submenu === 'nosub') {
        activeDesktopMenuId.value = null
        return
    }
    activeDesktopMenuId.value = item.id
}

const openCompactMenu = (item) => {
    clearCompactCloseTimer()
    if (item.submenu === 'nosub') {
        activeCompactMenuId.value = null
        return
    }
    activeCompactMenuId.value = item.id
}

const scheduleDesktopMenuClose = () => {
    clearDesktopCloseTimer()
    desktopCloseTimer = window.setTimeout(() => {
        activeDesktopMenuId.value = null
    }, 140)
}

const scheduleCompactMenuClose = () => {
    clearCompactCloseTimer()
    compactCloseTimer = window.setTimeout(() => {
        activeCompactMenuId.value = null
    }, 140)
}

watch(isScrolled, (scrolled) => {
    if (scrolled) {
        activeDesktopMenuId.value = null
        clearDesktopCloseTimer()
        return
    }

    activeCompactMenuId.value = null
    clearCompactCloseTimer()
})

onUnmounted(() => {
    clearDesktopCloseTimer()
    clearCompactCloseTimer()
})

// --- Search ---
const keyword = ref(null)
const searchNow = () => {
    if (keyword.value?.trim()) {
        router.push({ path: '/search/result', query: { keyword: keyword.value.trim() } })
    }
}

// --- Mobile drawer ---
const mobileOpen = ref(false)

// --- Logo ---
const logoSrc = zucConfig.fileuploader_store_logo
    ? `${zucConfig.store_url}/storage/${zucConfig.fileuploader_store_logo}`
    : null
const storeName = zucConfig.store_name || 'Store'
</script>

<template>
    <div :class="['sticky top-0 z-40 transition-shadow duration-300', isScrolled ? 'shadow-lg shadow-black/30' : '']">
        <header>
            <!-- ========== TIER 1: Top Bar (dark with gold accent line) ========== -->
            <div
                :class="[
                    'bg-[#111111] transition-all duration-300 overflow-hidden hidden sm:block',
                    isScrolled ? 'h-0 opacity-0 pointer-events-none' : 'h-8 opacity-100 border-b border-[#c8a45c]/30'
                ]"
            >
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex h-8 items-center justify-between text-[11px]">
                        <!-- Left: Announcement (gold text) -->
                        <div class="hidden sm:flex items-center">
                            <p v-if="topMenu?.items?.length > 0"
                                class="!mb-0 truncate text-[#c8a45c] font-semibold tracking-[0.12em] uppercase"
                                style="font-family: var(--font-label)">
                                {{ translateItemField(topMenu.items[0].blocks?.[0]?.elements?.[0], 'title', $i18n.locale) }}
                            </p>
                        </div>

                        <!-- Right: Quick links + Currency/Language -->
                        <div class="flex items-center gap-1 ml-auto text-[#8a8274]">
                            <LocalizedLink to="/blog" class="hidden sm:block px-2 py-1 hover:text-white transition-colors font-medium">{{ t('Our Blog') }}</LocalizedLink>
                            <span class="hidden sm:inline text-white/20">|</span>
                            <LocalizedLink to="/contact-us" class="hidden sm:block px-2 py-1 hover:text-white transition-colors font-medium">{{ t('Contact Us') }}</LocalizedLink>
                            <span class="hidden sm:inline text-white/20">|</span>
                            <template v-if="!authCustomerStore.isLoggedIn">
                                <LocalizedLink to="/login" class="hidden sm:block px-2 py-1 hover:text-white transition-colors font-medium">{{ t('Sign in') }}</LocalizedLink>
                                <span class="hidden sm:inline text-white/20">|</span>
                                <LocalizedLink to="/register" class="hidden sm:block px-2 py-1 hover:text-white transition-colors font-medium">{{ t('Create account') }}</LocalizedLink>
                            </template>
                            <template v-else>
                                <LocalizedLink to="/account" class="hidden sm:block px-2 py-1 hover:text-white transition-colors font-medium">{{ t('My account') }}</LocalizedLink>
                                <span class="hidden sm:inline text-white/20">|</span>
                                <LocalizedLink to="/logout" class="hidden sm:block px-2 py-1 hover:text-white transition-colors font-medium">{{ t('Sign out') }}</LocalizedLink>
                            </template>

                            <!-- Currency & Language (desktop only) -->
                            <div class="hidden lg:flex items-center gap-1 ml-1">
                                <span class="h-3 w-px bg-white/20 ml-1" aria-hidden="true" />

                                <!-- Currency -->
                                <Menu v-if="settingsStore.currencies.length > 1" as="div" class="relative">
                                    <MenuButton class="flex items-center gap-1 text-[#8a8274] hover:text-white transition-colors cursor-pointer font-medium">
                                        <CurrencyDollarIcon class="size-3.5" />
                                        <span>{{ settingsStore.selectedCurrencyObject?.code }}</span>
                                        <ChevronDownIcon class="size-3" />
                                    </MenuButton>
                                    <transition
                                        enter-active-class="transition ease-out duration-100"
                                        enter-from-class="opacity-0 scale-95"
                                        enter-to-class="opacity-100 scale-100"
                                        leave-active-class="transition ease-in duration-75"
                                        leave-from-class="opacity-100 scale-100"
                                        leave-to-class="opacity-0 scale-95"
                                    >
                                        <MenuItems class="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-md bg-[#2a2a2a] shadow-lg ring-1 ring-white/10 focus:outline-hidden">
                                            <div class="py-1">
                                                <MenuItem
                                                    v-for="currency in settingsStore.currencies"
                                                    :key="currency.code"
                                                    v-slot="{ active }"
                                                >
                                                    <button
                                                        @click="setCurrency(currency.code)"
                                                        :class="[
                                                            active ? 'bg-white/10' : '',
                                                            selectedCurrency === currency.code ? 'font-medium text-[#c8a45c]' : 'text-gray-300',
                                                            'flex w-full items-center gap-2 px-3 py-1.5 text-sm'
                                                        ]"
                                                    >
                                                        <span class="w-5 text-center">{{ currency.symbol }}</span>
                                                        {{ currency.code }}
                                                    </button>
                                                </MenuItem>
                                            </div>
                                        </MenuItems>
                                    </transition>
                                </Menu>

                                <!-- Divider -->
                                <span v-if="settingsStore.currencies.length > 1 && settingsStore.languages.length > 1" class="h-3 w-px bg-white/20" aria-hidden="true" />

                                <!-- Language -->
                                <Menu v-if="settingsStore.languages.length > 1" as="div" class="relative">
                                    <MenuButton class="flex items-center gap-1 text-[#8a8274] hover:text-white transition-colors cursor-pointer font-medium">
                                        <GlobeAltIcon class="size-3.5" />
                                        <span>{{ settingsStore.activeLanguage?.name }}</span>
                                        <ChevronDownIcon class="size-3" />
                                    </MenuButton>
                                    <transition
                                        enter-active-class="transition ease-out duration-100"
                                        enter-from-class="opacity-0 scale-95"
                                        enter-to-class="opacity-100 scale-100"
                                        leave-active-class="transition ease-in duration-75"
                                        leave-from-class="opacity-100 scale-100"
                                        leave-to-class="opacity-0 scale-95"
                                    >
                                        <MenuItems class="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-md bg-[#2a2a2a] shadow-lg ring-1 ring-white/10 focus:outline-hidden">
                                            <div class="py-1">
                                                <MenuItem
                                                    v-for="language in settingsStore.languages"
                                                    :key="language.iso_code"
                                                    v-slot="{ active }"
                                                >
                                                    <button
                                                        @click="setLanguage(language.iso_code)"
                                                        :class="[
                                                            active ? 'bg-white/10' : '',
                                                            selectedLanguage === language.iso_code ? 'font-medium text-[#c8a45c]' : 'text-gray-300',
                                                            'flex w-full items-center gap-2 px-3 py-1.5 text-sm'
                                                        ]"
                                                    >
                                                        <img
                                                            v-if="language.iso_code"
                                                            :src="`/storage/flags/${language.iso_code}.webp`"
                                                            :alt="language.name"
                                                            class="size-4 rounded-sm object-cover"
                                                        />
                                                        {{ language.name }}
                                                    </button>
                                                </MenuItem>
                                            </div>
                                        </MenuItems>
                                    </transition>
                                </Menu>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ========== TIER 2: Main Bar (dark primary) ========== -->
            <div
                :class="[
                    'bg-[#1a1a1a] transition-all duration-300',
                    isScrolled ? 'bg-[#1a1a1a]/95 backdrop-blur-sm' : ''
                ]"
            >
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center gap-5 h-[4.5rem]">

                        <!-- Mobile: Hamburger -->
                        <button
                            type="button"
                            class="lg:hidden -ml-1 rounded p-2 text-gray-400 hover:text-[#c8a45c] hover:bg-white/5 transition-colors"
                            @click="mobileOpen = true"
                        >
                            <span class="sr-only">{{ t('Open menu') }}</span>
                            <Bars3Icon class="size-6" aria-hidden="true" />
                        </button>

                        <!-- Logo + Tagline -->
                        <LocalizedLink to="/" class="logo-link shrink-0 flex items-center gap-3">
                            <img
                                v-if="logoSrc"
                                :src="logoSrc"
                                :alt="storeName"
                                :class="['w-auto transition-all duration-300', isScrolled ? 'h-7' : 'h-9']"
                            />
                            <div v-else class="flex flex-col">
                                <span class="text-2xl text-white leading-none tracking-wider" style="font-family: var(--font-display)">{{ storeName }}</span>
                                <span class="text-[9px] text-[#c8a45c]/70 font-medium tracking-[0.25em] uppercase mt-0.5 hidden sm:block" style="font-family: var(--font-label)">Pro Drum Gear</span>
                            </div>
                        </LocalizedLink>

                        <!-- Search (desktop — angular/industrial style) -->
                        <form
                            @submit.prevent="searchNow"
                            class="hidden md:flex flex-1 max-w-xl mx-auto"
                        >
                            <div class="relative w-full group">
                                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                    <MagnifyingGlassIcon class="size-4 text-gray-500 group-focus-within:text-[#c8a45c] transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    v-model="keyword"
                                    type="search"
                                    :placeholder="t('Search products...')"
                                    class="block w-full rounded-sm border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:bg-white/10 focus:border-[#c8a45c] focus:ring-1 focus:ring-[#c8a45c]/40 focus:outline-hidden transition-all"
                                />
                            </div>
                        </form>

                        <!-- Right actions (with labels on desktop) -->
                        <div class="flex items-center gap-1 ml-auto md:ml-0">
                            <!-- Account (desktop/tablet dropdown) -->
                            <Menu as="div" class="relative hidden md:block">
                                <MenuButton class="flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-[#c8a45c] transition-colors cursor-pointer rounded hover:bg-white/5">
                                    <UserIcon class="size-5" aria-hidden="true" />
                                    <span class="hidden lg:inline text-xs font-medium" style="font-family: var(--font-label); letter-spacing: 0.05em">{{ t('Account') }}</span>
                                </MenuButton>
                                <transition
                                    enter-active-class="transition ease-out duration-100"
                                    enter-from-class="opacity-0 scale-95"
                                    enter-to-class="opacity-100 scale-100"
                                    leave-active-class="transition ease-in duration-75"
                                    leave-from-class="opacity-100 scale-100"
                                    leave-to-class="opacity-0 scale-95"
                                >
                                    <MenuItems class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-[#2a2a2a] shadow-lg ring-1 ring-white/10 focus:outline-hidden">
                                        <div class="py-1">
                                            <template v-if="!authCustomerStore.isLoggedIn">
                                                <MenuItem v-slot="{ active }">
                                                    <LocalizedLink to="/login" :class="[active ? 'bg-white/10' : '', 'block px-4 py-2 text-sm text-gray-300']">
                                                        {{ t('Sign in') }}
                                                    </LocalizedLink>
                                                </MenuItem>
                                                <MenuItem v-slot="{ active }">
                                                    <LocalizedLink to="/register" :class="[active ? 'bg-white/10' : '', 'block px-4 py-2 text-sm text-gray-300']">
                                                        {{ t('Create account') }}
                                                    </LocalizedLink>
                                                </MenuItem>
                                            </template>
                                            <template v-else>
                                                <MenuItem v-slot="{ active }">
                                                    <LocalizedLink to="/account" :class="[active ? 'bg-white/10' : '', 'block px-4 py-2 text-sm text-gray-300']">
                                                        {{ t('My account') }}
                                                    </LocalizedLink>
                                                </MenuItem>
                                                <MenuItem v-slot="{ active }">
                                                    <LocalizedLink to="/logout" :class="[active ? 'bg-white/10' : '', 'block px-4 py-2 text-sm text-gray-300']">
                                                        {{ t('Sign out') }}
                                                    </LocalizedLink>
                                                </MenuItem>
                                            </template>
                                        </div>
                                    </MenuItems>
                                </transition>
                            </Menu>

                            <!-- Divider -->
                            <span class="hidden lg:block h-5 w-px bg-white/10 mx-1" aria-hidden="true" />

                            <!-- Wishlist (hidden on mobile — shown in drawer instead) -->
                            <LocalizedLink to="/account/wishlist" class="relative hidden md:flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-[#c8a45c] transition-colors disabled-active rounded hover:bg-white/5">
                                <HeartIcon class="size-5" aria-hidden="true" />
                                <span class="hidden lg:inline text-xs font-medium" style="font-family: var(--font-label); letter-spacing: 0.05em">{{ t('Wishlist') }}</span>
                                <span
                                    v-if="wishlistStore.count > 0"
                                    class="absolute -top-0.5 left-5 lg:static lg:ml-0 flex items-center justify-center size-4 rounded-full bg-[#c8a45c] text-[10px] font-bold text-[#1a1a1a]"
                                >
                                    {{ wishlistStore.count }}
                                </span>
                            </LocalizedLink>

                            <!-- Cart with mini dropdown (desktop, with label) -->
                            <Popover as="div" class="relative hidden lg:block">
                                <PopoverButton class="relative flex items-center gap-1.5 px-3 py-2 text-gray-400 hover:text-[#c8a45c] transition-colors cursor-pointer outline-hidden rounded hover:bg-white/5">
                                    <ShoppingBagIcon class="size-5" aria-hidden="true" />
                                    <span class="text-xs font-medium" style="font-family: var(--font-label); letter-spacing: 0.05em">{{ t('Cart') }}</span>
                                    <span
                                        v-if="cartStore.numberOfItems > 0"
                                        class="flex items-center justify-center size-4 rounded-full bg-[#c8a45c] text-[10px] font-bold text-[#1a1a1a]"
                                    >
                                        {{ cartStore.numberOfItems }}
                                    </span>
                                </PopoverButton>
                                <transition
                                    enter-active-class="transition ease-out duration-200"
                                    enter-from-class="opacity-0 -translate-y-1"
                                    enter-to-class="opacity-100 translate-y-0"
                                    leave-active-class="transition ease-in duration-150"
                                    leave-from-class="opacity-100 translate-y-0"
                                    leave-to-class="opacity-0 -translate-y-1"
                                >
                                    <PopoverPanel v-slot="{ close }" class="absolute right-0 z-50 mt-2 w-80 origin-top-right">
                                        <div class="overflow-hidden rounded-xl border border-white/10 bg-[#2a2a2a] shadow-[0_24px_80px_-36px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
                                            <!-- Empty cart -->
                                            <div v-if="cartStore.numberOfItems === 0" class="px-6 py-10 text-center">
                                                <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-white/5">
                                                    <ShoppingBagIcon class="size-8 text-gray-500" />
                                                </div>
                                                <p class="mt-4 text-sm font-semibold text-white">{{ t('Your cart is empty') }}</p>
                                                <p class="mt-1 text-xs text-gray-500">{{ t('Add something nice and it will show up here.') }}</p>
                                            </div>

                                            <!-- Cart items -->
                                            <template v-else>
                                                <div class="border-b border-white/10 bg-white/5 px-4 py-3">
                                                    <div class="flex items-center justify-between gap-3">
                                                        <div>
                                                            <p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400" style="font-family: var(--font-label)">{{ t('Cart summary') }}</p>
                                                            <p class="mt-1 text-sm font-semibold text-white">
                                                                {{ cartStore.numberOfItems }} {{ cartStore.numberOfItems === 1 ? t('item') : t('items') }}
                                                            </p>
                                                        </div>
                                                        <div class="rounded-full bg-[#c8a45c] px-3 py-1 text-xs font-semibold text-[#1a1a1a]">
                                                            {{ formatCurrency(cartStore.subtotal, settingsStore.selectedCurrencyObject?.decimal_digits, settingsStore.selectedCurrencyObject?.code) }}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="max-h-80 space-y-3 overflow-y-auto p-4">
                                                    <div
                                                        v-for="item in cartStore.items"
                                                        :key="item.id"
                                                        class="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/20"
                                                    >
                                                        <img
                                                            v-if="item.images?.length"
                                                            :src="`${zucConfig.store_url}/storage/${item.images[0].src}`"
                                                            :alt="translateItemField(item, 'name', $i18n.locale)"
                                                            class="size-16 rounded-lg border border-white/10 object-cover shrink-0"
                                                        />
                                                        <div class="size-16 rounded-lg bg-white/5 shrink-0" v-else />
                                                        <div class="flex-1 min-w-0">
                                                            <p class="text-sm font-semibold text-white">
                                                                <span class="text-gray-400 font-normal">{{ item.qty }}x</span> {{ translateItemField(item, 'name', $i18n.locale) }}
                                                            </p>
                                                            <p class="mt-1 text-sm font-semibold text-[#c8a45c]">
                                                                <PriceConverter :product="item" :qty="item.qty" />
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Subtotal + buttons -->
                                                <div class="border-t border-white/10 bg-white/5 p-4">
                                                    <div class="mb-4 rounded-lg border border-white/10 bg-[#1a1a1a] px-4 py-3">
                                                        <div class="flex items-center justify-between gap-3">
                                                            <div class="min-w-0">
                                                                <p class="text-xs font-medium uppercase tracking-[0.18em] text-gray-400" style="font-family: var(--font-label)">{{ t('Subtotal') }}</p>
                                                                <p class="mt-1 text-sm text-gray-400">{{ t('Taxes and shipping calculated at checkout') }}</p>
                                                            </div>
                                                            <span class="shrink-0 text-base font-semibold text-white" style="font-family: var(--font-display); font-size: 1.25rem">
                                                                {{ formatCurrency(cartStore.subtotal, settingsStore.selectedCurrencyObject?.decimal_digits, settingsStore.selectedCurrencyObject?.code) }}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div class="grid grid-cols-2 gap-2">
                                                        <LocalizedLink
                                                            to="/cart"
                                                            @click="close()"
                                                            class="disabled-active flex items-center justify-center rounded-md border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                                                        >
                                                            {{ t('View cart') }}
                                                        </LocalizedLink>
                                                        <LocalizedLink
                                                            to="/checkout"
                                                            @click="close()"
                                                            class="disabled-active flex items-center justify-center rounded-md bg-[#c8a45c] px-4 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#b8943c] transition-colors"
                                                        >
                                                            {{ t('Checkout') }}
                                                        </LocalizedLink>
                                                    </div>

                                                    <p class="mt-3 text-center text-[11px] text-gray-400">
                                                        {{ t('Secure checkout with your selected currency and shipping method.') }}
                                                    </p>
                                                </div>
                                            </template>
                                        </div>
                                    </PopoverPanel>
                                </transition>
                            </Popover>

                            <!-- Cart icon (mobile only) -->
                            <LocalizedLink to="/cart" class="relative lg:hidden flex items-center gap-1 p-2 text-gray-400 hover:text-[#c8a45c] transition-colors disabled-active rounded hover:bg-white/5">
                                <ShoppingBagIcon class="size-5" aria-hidden="true" />
                                <span
                                    v-if="cartStore.numberOfItems > 0"
                                    class="flex items-center justify-center size-4 rounded-full bg-[#c8a45c] text-[10px] font-bold text-[#1a1a1a]"
                                >
                                    {{ cartStore.numberOfItems }}
                                </span>
                                <span class="sr-only">{{ t('Cart') }}</span>
                            </LocalizedLink>
                        </div>
                    </div>
                </div>

                <!-- ========== TIER 3: Navigation (desktop — separate bg) ========== -->
                <nav
                    aria-label="Main navigation"
                    :class="[
                        'hidden lg:block bg-[#1a1a1a] border-t border-white/5 h-11'
                    ]"
                >
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div class="flex h-11 items-center gap-0.5">
                            <div
                                v-for="item in primaryMenu?.items"
                                :key="item.id"
                                class="relative flex h-full items-center"
                                @mouseenter="openDesktopMenu(item)"
                                @focusin="openDesktopMenu(item)"
                                @mouseleave="scheduleDesktopMenuClose"
                            >
                                <button
                                    v-if="item.submenu !== 'nosub'"
                                    :class="[
                                        activeDesktopMenuId === item.id
                                            ? 'text-[#1a1a1a] bg-[#c8a45c]'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10',
                                        'group relative inline-flex items-center gap-1 px-4 py-1.5 text-[13px] font-semibold transition-all duration-200 outline-hidden cursor-pointer rounded-sm'
                                    ]"
                                    style="font-family: var(--font-label); letter-spacing: 0.08em; text-transform: uppercase"
                                >
                                    {{ translateItemField(item, 'title', $i18n.locale) }}
                                    <ChevronDownIcon :class="['size-3 transition-transform', activeDesktopMenuId === item.id ? 'rotate-180' : '']" />
                                </button>

                                <transition
                                    v-if="item.submenu !== 'nosub'"
                                    enter-active-class="transition duration-200 ease-out"
                                    enter-from-class="opacity-0 translate-y-2"
                                    enter-to-class="opacity-100 translate-y-0"
                                    leave-active-class="transition duration-150 ease-in"
                                    leave-from-class="opacity-100 translate-y-0"
                                    leave-to-class="opacity-0 translate-y-2"
                                >
                                    <div
                                        v-if="activeDesktopMenuId === item.id"
                                        :class="[
                                            item.submenu === 'dropdown'
                                                ? 'absolute top-full z-50 mt-1 flex'
                                                : 'absolute top-full z-50 mt-1 flex'
                                        ]"
                                        @mouseenter="clearDesktopCloseTimer"
                                        @mouseleave="scheduleDesktopMenuClose"
                                    >
                                        <div
                                            :class="[
                                                item.submenu === 'megamenu' ? 'min-w-[48rem]' : 'min-w-[17rem]',
                                                'overflow-visible rounded-md border border-gray-200 bg-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.42)]'
                                            ]"
                                        >
                                            <div
                                                v-if="item.submenu === 'megamenu'"
                                                class="grid grid-cols-4 gap-3"
                                            >
                                                <div
                                                    v-for="block in item.blocks"
                                                    :key="block.id"
                                                    class="min-w-0 h-full overflow-hidden"
                                                >
                                                    <MultiLevelDropdownMenu
                                                        :elements="block.elements"
                                                        :panel-padding="12"
                                                        @navigate="navigateToElement"
                                                    />
                                                </div>
                                            </div>

                                            <MultiLevelDropdownMenu
                                                v-else
                                                :elements="item.blocks?.flatMap(block => block.elements) || item.children || []"
                                                :panel-padding="12"
                                                @navigate="navigateToElement"
                                            />
                                        </div>
                                    </div>
                                </transition>

                                <button
                                    v-else
                                    @click="navigateTo(item)"
                                    class="inline-flex items-center px-4 py-1.5 text-[13px] font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer rounded-sm"
                                    style="font-family: var(--font-label); letter-spacing: 0.08em; text-transform: uppercase"
                                >
                                    {{ translateItemField(item, 'title', $i18n.locale) }}
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

            </div>
        </header>

        <!-- Mobile Drill-Down Menu -->
        <MobileDrillMenu v-model="mobileOpen" :primary-menu="primaryMenu" />
    </div>
</template>
