<script setup>
import { computed } from 'vue'
import { useHelpers } from '@/composables/useHelpers'

const { translateItemField } = useHelpers()

const props = defineProps({
    posts: { type: Array, default: () => [] }
})

const visiblePosts = computed(() => props.posts.slice(0, 4))

const stripHtml = (html) => html ? html.replace(/<[^>]*>/g, '') : ''

const hasImage = (post) => post.image && post.image.trim() !== ''
</script>

<template>
    <section v-if="visiblePosts.length > 0" class="py-12 sm:py-20 bg-[#f5f0e8]">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <!-- Section header -->
            <div class="flex items-end justify-between mb-10 sm:mb-14">
                <div>
                    <h2 class="text-3xl sm:text-4xl tracking-tight text-[#2d2d2d] uppercase" style="font-family: var(--font-display)">
                        {{ $t('From the Blog') }}
                    </h2>
                    <p class="!mb-0 mt-2 text-sm text-[#8a8274]">
                        {{ $t('Latest news and updates') }}
                    </p>
                    <div class="mt-3 h-0.5 w-16 bg-[#c8a45c]" />
                </div>
                <LocalizedLink
                    to="/blog"
                    class="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#2d2d2d] hover:text-[#c8a45c] transition-colors uppercase tracking-wider"
                    style="font-family: var(--font-label)"
                >
                    {{ $t('View all') }}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                </LocalizedLink>
            </div>

            <!-- 4-column editorial grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-x-8">
                <LocalizedLink
                    v-for="post in visiblePosts"
                    :key="post.id"
                    :to="`/article/${translateItemField(post, 'slug', $i18n.locale)}`"
                    class="group flex flex-col"
                >
                    <!-- Image area -->
                    <div class="relative aspect-[3/2] overflow-hidden rounded-lg bg-white mb-4">
                        <img
                            v-if="hasImage(post)"
                            :src="`${zucConfig.store_url}/storage/${post.image}`"
                            :alt="translateItemField(post, 'title', $i18n.locale)"
                            class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            loading="lazy"
                            @error="e => e.target.parentElement.classList.add('blog-img-error')"
                        />
                        <!-- Placeholder when no image or image fails to load -->
                        <div
                            v-if="!hasImage(post)"
                            class="absolute inset-0 flex items-center justify-center bg-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="size-10 text-[#ddd5c5]">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                            </svg>
                        </div>
                    </div>

                    <!-- Text content -->
                    <div class="flex flex-col flex-1">
                        <h3 class="text-[15px] font-semibold leading-snug text-[#2d2d2d] line-clamp-2 group-hover:text-[#c8a45c] transition-colors duration-300">
                            {{ translateItemField(post, 'title', $i18n.locale) }}
                        </h3>
                        <p
                            v-if="translateItemField(post, 'summary', $i18n.locale)"
                            class="!mb-0 mt-2 text-sm leading-relaxed text-[#8a8274] line-clamp-2"
                            v-text="stripHtml(translateItemField(post, 'summary', $i18n.locale))"
                        />
                        <span class="mt-3 inline-flex items-center gap-1 text-xs font-semibold tracking-[0.15em] uppercase text-[#8a8274] group-hover:text-[#c8a45c] transition-colors duration-300"
                            style="font-family: var(--font-label)">
                            {{ $t('Read more') }}
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3 transition-transform duration-300 group-hover:translate-x-0.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </div>
                </LocalizedLink>
            </div>

            <!-- Thin separator -->
            <div class="mt-10 sm:mt-14 border-t border-[#e0d8c8]" />

            <!-- Mobile "View all" -->
            <div class="mt-6 text-center sm:hidden">
                <LocalizedLink
                    to="/blog"
                    class="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2d2d2d] hover:text-[#c8a45c] transition-colors uppercase tracking-wider"
                    style="font-family: var(--font-label)"
                >
                    {{ $t('View all articles') }}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                </LocalizedLink>
            </div>
        </div>
    </section>
</template>
