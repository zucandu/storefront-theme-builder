<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@/stores/utils/menu'
import { useHelpers } from '@/composables/useHelpers'
import { useAuthCustomerStore } from '@/stores/auth/customer'
import { useStorefrontIframeHooks } from '@/composables/useStorefrontIframeHooks'
import StorefrontIframeHook from '@theme/storefront/components/layout/StorefrontIframeHook.vue'

const toast = useToast()
const { t, locale } = useI18n()

const { translateItemField, parseMenuLink } = useHelpers()
const menuStore = useMenuStore()
const authCustomerStore = useAuthCustomerStore()

const { hooks: footerHooks, fetchHooks: fetchFooterHooks } = useStorefrontIframeHooks('storefront_footer_main');

const footerMiddle = ref(null)
const footerBottom = ref(null)
onMounted(async () => {
    fetchFooterHooks();
    const [middle, bottom] = await Promise.all([
        menuStore.fetchMenuByType('footer-middle'),
        menuStore.fetchMenuByType('footer-bottom'),
    ])
    footerMiddle.value = middle
    footerBottom.value = bottom
})

const formdata = ref({
    email: '',
    grecaptcha_token: undefined,
})

const submitting = ref(false)

const handleSubscription = async () => {
    if (submitting.value) return
    submitting.value = true

    try {
        // Get Google reCAPTCHA token if the site key is set
        if (zucConfig.recaptcha_site_key) {
            const token = await new Promise((resolve) => {
                grecaptcha.ready(() => {
                    grecaptcha.execute(zucConfig.recaptcha_site_key, { action: 'submit' }).then(resolve)
                })
            })
            formdata.value.grecaptcha_token = token
        }

        await authCustomerStore.subscribeNewsletter(formdata.value)
        toast.success(t('Thank you for subscribing to our newsletter.'))
        formdata.value.email = ''
        formdata.value.grecaptcha_token = undefined
    } catch (error) {
        toast.error(t(error.response?.data?.message || 'Something went wrong.'))
    } finally {
        submitting.value = false
    }
}

const currentYear = new Date().getFullYear()

// Mobile accordion state for footer menu blocks
const expandedBlocks = ref(new Set())

const toggleBlock = (id) => {
    const s = new Set(expandedBlocks.value)
    s.has(id) ? s.delete(id) : s.add(id)
    expandedBlocks.value = s
}

// Extract the first heading or content-title element as the block's accordion title
const getBlockTitle = (block) => {
    const first = block.elements?.[0]
    if (!first) return null
    if (+first.heading === 1 || first.block_type === 'content') {
        return translateItemField(first, 'title', locale.value)
    }
    return null
}

// Return body elements (skip the first element if it was used as the title)
const getBlockBody = (block) => {
    const first = block.elements?.[0]
    if (first && (+first.heading === 1)) {
        return block.elements.slice(1)
    }
    // For content blocks, the first element IS the body content — keep it
    return block.elements
}
</script>

<template>
    <footer class="bg-[#1a1a1a] text-white">
        <!-- Main footer content -->
        <div class="container mx-auto px-4 py-14 lg:py-16">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">

                <!-- Footer middle menu blocks (col-7) -->
                <div v-if="footerMiddle?.items?.[0]?.blocks?.length" class="lg:col-span-7">
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div v-for="block in footerMiddle.items[0].blocks" :key="block.id">
                            <!-- Block title (accordion trigger on mobile) -->
                            <button
                                v-if="getBlockTitle(block)"
                                @click="toggleBlock(block.id)"
                                class="flex w-full items-center justify-between sm:pointer-events-none sm:cursor-default"
                            >
                                <h3 class="text-sm font-semibold uppercase tracking-wider text-[#c8a45c]"
                                    style="font-family: var(--font-label)">
                                    {{ getBlockTitle(block) }}
                                </h3>
                                <svg class="size-4 text-[#c8a45c]/60 transition-transform sm:hidden"
                                    :class="{ 'rotate-180': expandedBlocks.has(block.id) }"
                                    fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            <!-- Block body (collapsible on mobile, always visible on sm+) -->
                            <div class="grid transition-[grid-template-rows] duration-300 sm:!grid-rows-[1fr]"
                                :class="expandedBlocks.has(block.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
                                <div class="overflow-hidden">
                                    <div class="pt-4">
                                        <template v-for="el in getBlockBody(block)" :key="el.id">
                                            <!-- Content block (article/HTML) -->
                                            <div v-if="el.block_type === 'content'">
                                                <div
                                                    class="text-sm text-[#8a8274] leading-relaxed [&>p]:!mb-0"
                                                    v-html="translateItemField(el, 'content', locale)"
                                                />
                                            </div>

                                            <!-- Link -->
                                            <div v-else class="mb-2.5">
                                                <LocalizedLink
                                                    :to="`/${parseMenuLink(el, 'url', locale)}`"
                                                    class="text-sm text-[#8a8274] hover:text-[#c8a45c] transition-colors">
                                                    {{ translateItemField(el, 'title', locale) }}
                                                </LocalizedLink>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Newsletter + Social + Payment (col-5) -->
                <div class="lg:col-span-5">
                    <!-- Newsletter -->
                    <div class="mb-8">
                        <h3 class="text-sm font-semibold uppercase tracking-wider text-[#c8a45c] mb-2" style="font-family: var(--font-label)">
                            {{ $t('Subscribe to Our Newsletter') }}
                        </h3>
                        <p class="text-sm text-[#8a8274] mb-4 !mb-4">
                            {{ $t('Get the latest updates, deals and exclusive offers straight to your inbox.') }}
                        </p>
                        <form @submit.prevent="handleSubscription" class="flex gap-2">
                            <input
                                v-model="formdata.email"
                                type="email"
                                required
                                :placeholder="$t('Enter your email')"
                                class="flex-1 min-w-0 px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-hidden focus:ring-2 focus:ring-[#c8a45c]/30 focus:border-[#c8a45c]/50 transition-colors" />
                            <button
                                type="submit"
                                :disabled="submitting"
                                class="px-5 py-2.5 bg-[#c8a45c] text-[#1a1a1a] text-sm font-semibold rounded-lg hover:bg-[#b8943c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                style="font-family: var(--font-label); letter-spacing: 0.05em; text-transform: uppercase">
                                {{ $t('Subscribe') }}
                            </button>
                        </form>
                    </div>

                    <!-- Social icons -->
                    <div v-if="zucConfig.store_facebook_url || zucConfig.store_twitter_url || zucConfig.store_instagram_url || zucConfig.store_youtube_url" class="mb-8">
                        <h3 class="text-sm font-semibold uppercase tracking-wider text-[#c8a45c] mb-3" style="font-family: var(--font-label)">
                            {{ $t('Follow Us') }}
                        </h3>
                        <div class="flex items-center gap-4">
                            <!-- Facebook -->
                            <a v-if="zucConfig.store_facebook_url" :href="zucConfig.store_facebook_url" target="_blank" rel="noopener" aria-label="Facebook" class="text-[#8a8274] hover:text-[#c8a45c] transition-colors">
                                <svg class="size-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                                </svg>
                            </a>
                            <!-- Twitter / X -->
                            <a v-if="zucConfig.store_twitter_url" :href="zucConfig.store_twitter_url" target="_blank" rel="noopener" aria-label="Twitter" class="text-[#8a8274] hover:text-[#c8a45c] transition-colors">
                                <svg class="size-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </a>
                            <!-- Instagram -->
                            <a v-if="zucConfig.store_instagram_url" :href="zucConfig.store_instagram_url" target="_blank" rel="noopener" aria-label="Instagram" class="text-[#8a8274] hover:text-[#c8a45c] transition-colors">
                                <svg class="size-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                                </svg>
                            </a>
                            <!-- YouTube -->
                            <a v-if="zucConfig.store_youtube_url" :href="zucConfig.store_youtube_url" target="_blank" rel="noopener" aria-label="YouTube" class="text-[#8a8274] hover:text-[#c8a45c] transition-colors">
                                <svg class="size-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- Payment icons -->
                    <div>
                        <h3 class="text-sm font-semibold uppercase tracking-wider text-[#c8a45c] mb-3" style="font-family: var(--font-label)">
                            {{ $t('We Accept') }}
                        </h3>
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center justify-center h-8 px-2.5 rounded bg-white/5 border border-white/10">
                                <svg class="h-5 w-auto" viewBox="0 0 48 32" fill="none">
                                    <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                                    <text x="24" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="Arial">VISA</text>
                                </svg>
                            </span>
                            <span class="inline-flex items-center justify-center h-8 px-2.5 rounded bg-white/5 border border-white/10">
                                <svg class="h-5 w-auto" viewBox="0 0 48 32" fill="none">
                                    <rect width="48" height="32" rx="4" fill="#252525"/>
                                    <circle cx="19" cy="16" r="8" fill="#EB001B" opacity="0.9"/>
                                    <circle cx="29" cy="16" r="8" fill="#F79E1B" opacity="0.9"/>
                                    <path d="M24 10.34a8 8 0 010 11.32 8 8 0 010-11.32z" fill="#FF5F00"/>
                                </svg>
                            </span>
                            <span class="inline-flex items-center justify-center h-8 px-2.5 rounded bg-white/5 border border-white/10">
                                <svg class="h-5 w-auto" viewBox="0 0 48 32" fill="none">
                                    <rect width="48" height="32" rx="4" fill="#2E77BC"/>
                                    <text x="24" y="20" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="Arial">AMEX</text>
                                </svg>
                            </span>
                            <span class="inline-flex items-center justify-center h-8 px-2.5 rounded bg-white/5 border border-white/10">
                                <svg class="h-5 w-auto" viewBox="0 0 48 32" fill="none">
                                    <rect width="48" height="32" rx="4" fill="#003087"/>
                                    <text x="24" y="19" text-anchor="middle" fill="#009CDE" font-size="9" font-weight="bold" font-family="Arial" font-style="italic">Pay</text>
                                    <text x="11" y="19" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="Arial" font-style="italic">Pal</text>
                                </svg>
                            </span>
                            <span class="inline-flex items-center justify-center h-8 px-2.5 rounded bg-white/5 border border-white/10">
                                <svg class="h-5 w-auto" viewBox="0 0 48 32" fill="none">
                                    <rect width="48" height="32" rx="4" fill="#000"/>
                                    <text x="24" y="19" text-anchor="middle" fill="white" font-size="8" font-weight="500" font-family="Arial"> Pay</text>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Storefront hook: footer main -->
        <StorefrontIframeHook
            v-for="hook in footerHooks" :key="hook.id"
            :hook="hook" hook-point="storefront_footer_main"
        />

        <!-- Bottom bar -->
        <div class="border-t border-white/10">
            <div class="container mx-auto px-4 py-6">
                <p class="text-sm text-[#8a8274] text-center !mb-0">
                    &copy; {{ currentYear }} {{ zucConfig.store_name }}. {{ $t('All rights reserved.') }}
                </p>
            </div>
        </div>
    </footer>
</template>
