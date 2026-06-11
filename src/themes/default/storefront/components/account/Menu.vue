<script setup>
import { useRoute } from 'vue-router';

defineProps({
    mode: {
        type: String,
        default: 'sidebar',
        validator: (v) => ['sidebar', 'tabs'].includes(v)
    }
});

const route = useRoute();

const menuItems = [
    { to: '/account/order/list', label: 'Orders', icon: 'shopping-bag', matchPrefix: '/account/order' },
    { to: '/account/profile', label: 'Profile', icon: 'user', matchPrefix: '/account/profile' },
    { to: '/account/address-book', label: 'Address Book', icon: 'map-pin', matchPrefix: '/account/address-book' },
    { to: '/account/wishlist', label: 'Wishlist', icon: 'heart', matchPrefix: '/account/wishlist' },
    { to: '/account/password', label: 'Update Password', icon: 'key', matchPrefix: '/account/password' },
    { to: '/logout', label: 'Logout', icon: 'logout', matchPrefix: '/logout' },
];

const isActive = (item) => {
    const path = route.path.replace(/^\/[a-z]{2}(?=\/)/, '');
    return path.startsWith(item.matchPrefix);
};
</script>

<template>
    <!-- Sidebar mode (desktop) -->
    <nav v-if="mode === 'sidebar'" class="bg-[var(--ds-white)] rounded-lg border border-[#e0d8c8] p-4 space-y-1">
        <LocalizedLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            :class="[
                'flex items-center gap-3 rounded px-3 py-2.5 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors',
                item.icon === 'logout'
                    ? 'text-[var(--ds-sale)] hover:bg-[var(--ds-sale)]/10'
                    : isActive(item)
                        ? 'text-[var(--ds-accent)] bg-[var(--ds-accent)]/10 font-medium'
                        : 'text-[var(--ds-text)] hover:text-[var(--ds-accent)] hover:bg-[var(--ds-neutral)]'
            ]"
        >
            <!-- Shopping Bag -->
            <svg v-if="item.icon === 'shopping-bag'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="['size-5', isActive(item) ? 'text-[var(--ds-accent)]' : item.icon === 'logout' ? '' : 'text-[var(--ds-text-secondary)]']">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <!-- User -->
            <svg v-else-if="item.icon === 'user'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="['size-5', isActive(item) ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-text-secondary)]']">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <!-- Map Pin -->
            <svg v-else-if="item.icon === 'map-pin'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="['size-5', isActive(item) ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-text-secondary)]']">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <!-- Heart -->
            <svg v-else-if="item.icon === 'heart'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="['size-5', isActive(item) ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-text-secondary)]']">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <!-- Key -->
            <svg v-else-if="item.icon === 'key'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="['size-5', isActive(item) ? 'text-[var(--ds-accent)]' : 'text-[var(--ds-text-secondary)]']">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            <!-- Logout -->
            <svg v-else-if="item.icon === 'logout'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {{ $t(item.label) }}
        </LocalizedLink>
    </nav>

    <!-- Tabs mode (mobile) -->
    <nav v-else class="flex gap-1 overflow-x-auto pb-1 -mb-px scrollbar-none border-b border-[#e0d8c8]">
        <LocalizedLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            :class="[
                'inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 font-[var(--font-label)] uppercase tracking-wider text-sm transition-colors shrink-0',
                item.icon === 'logout'
                    ? 'text-[var(--ds-sale)] hover:bg-[var(--ds-sale)]/10 rounded'
                    : isActive(item)
                        ? 'border-b-2 border-[var(--ds-accent)] text-[var(--ds-accent)] font-medium'
                        : 'text-[var(--ds-text-secondary)] hover:text-[var(--ds-text)]'
            ]"
        >
            <!-- Shopping Bag -->
            <svg v-if="item.icon === 'shopping-bag'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <!-- User -->
            <svg v-else-if="item.icon === 'user'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <!-- Map Pin -->
            <svg v-else-if="item.icon === 'map-pin'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <!-- Heart -->
            <svg v-else-if="item.icon === 'heart'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            <!-- Key -->
            <svg v-else-if="item.icon === 'key'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
            <!-- Logout -->
            <svg v-else-if="item.icon === 'logout'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            {{ $t(item.label) }}
        </LocalizedLink>
    </nav>
</template>
