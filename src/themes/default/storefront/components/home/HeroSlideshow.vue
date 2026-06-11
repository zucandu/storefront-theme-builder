<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { useHelpers } from '@/composables/useHelpers'
import { useRedirect } from '@/composables/useRedirect'

const props = defineProps({
    banners: { type: Array, default: () => [] }
})

const { translateItemField } = useHelpers()
const { redirectTo } = useRedirect()

const currentIndex = ref(0)
let intervalId = null

const totalSlides = computed(() => props.banners.length)

const goTo = (index) => {
    currentIndex.value = ((index % totalSlides.value) + totalSlides.value) % totalSlides.value
    resetTimer()
}

const next = () => goTo(currentIndex.value + 1)
const prev = () => goTo(currentIndex.value - 1)

const resetTimer = () => {
    if (intervalId) clearInterval(intervalId)
    if (totalSlides.value > 1) {
        intervalId = setInterval(next, 5000)
    }
}

const handleBannerClick = (banner) => {
    if (banner.link) redirectTo(banner.link)
}

onMounted(() => resetTimer())
onUnmounted(() => { if (intervalId) clearInterval(intervalId) })
</script>

<template>
    <section v-if="banners.length > 0" class="relative w-full overflow-hidden bg-[#1a1a1a]">
        <!-- Slides -->
        <div class="relative aspect-[16/9] sm:aspect-[21/8] lg:aspect-[21/7]">
            <div
                v-for="(banner, index) in banners"
                :key="banner.id"
                :class="[
                    'absolute inset-0 transition-opacity duration-700 ease-in-out',
                    index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                ]"
            >
                <img
                    :src="`${zucConfig.store_url}/storage/${banner.image}`"
                    :alt="translateItemField(banner, 'title', $i18n.locale) || 'Banner'"
                    class="h-full w-full object-cover object-[95%_center] sm:object-center"
                    :class="banner.link ? 'cursor-pointer' : ''"
                    @click="handleBannerClick(banner)"
                    @error.once="e => e.target.src = '/images/placeholder.webp'"
                />
                <!-- Dark overlay gradient -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

                <!-- Banner content overlay -->
                <div
                    v-if="translateItemField(banner, 'title', $i18n.locale)"
                    class="absolute inset-x-0 bottom-0 z-10 pb-8 sm:pb-12 lg:pb-16"
                >
                    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <!-- Subtitle -->
                        <p
                            v-if="translateItemField(banner, 'subtitle', $i18n.locale)"
                            class="text-xs sm:text-sm text-[#c8a45c] font-semibold tracking-[0.2em] uppercase mb-3 drop-shadow"
                            style="font-family: var(--font-label)"
                        >
                            {{ translateItemField(banner, 'subtitle', $i18n.locale) }}
                        </p>

                        <!-- Title (Bebas Neue) -->
                        <h2
                            class="text-3xl sm:text-5xl lg:text-7xl text-white drop-shadow-lg uppercase tracking-wide"
                            style="font-family: var(--font-display); line-height: 0.95"
                        >
                            {{ translateItemField(banner, 'title', $i18n.locale) }}
                        </h2>

                        <!-- Content / Description -->
                        <div
                            v-if="translateItemField(banner, 'content', $i18n.locale)"
                            class="mt-3 text-sm sm:text-base text-white/80 max-w-xl drop-shadow [&_strong]:font-bold"
                            v-html="translateItemField(banner, 'content', $i18n.locale)"
                        />

                        <!-- CTA Buttons -->
                        <div
                            v-if="translateItemField(banner, 'btn_primary', $i18n.locale) || translateItemField(banner, 'btn_secondary', $i18n.locale)"
                            class="mt-5 flex flex-wrap gap-3"
                        >
                            <LocalizedLink
                                v-if="translateItemField(banner, 'btn_primary', $i18n.locale)"
                                :to="translateItemField(banner, 'url_primary', $i18n.locale) || '/'"
                                class="inline-flex items-center rounded-lg bg-[#c8a45c] px-6 py-3 text-sm font-semibold text-[#1a1a1a] shadow-md hover:bg-[#b8943c] transition-colors uppercase tracking-wider"
                                style="font-family: var(--font-label)"
                            >
                                {{ translateItemField(banner, 'btn_primary', $i18n.locale) }}
                            </LocalizedLink>
                            <LocalizedLink
                                v-if="translateItemField(banner, 'btn_secondary', $i18n.locale)"
                                :to="translateItemField(banner, 'url_secondary', $i18n.locale) || '/'"
                                class="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors uppercase tracking-wider"
                                style="font-family: var(--font-label)"
                            >
                                {{ translateItemField(banner, 'btn_secondary', $i18n.locale) }}
                            </LocalizedLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Navigation arrows -->
        <template v-if="totalSlides > 1">
            <button
                @click="prev"
                class="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/80 shadow-md backdrop-blur-sm transition hover:bg-black/60 hover:text-[#c8a45c] cursor-pointer"
                aria-label="Previous slide"
            >
                <ChevronLeftIcon class="size-5" />
            </button>
            <button
                @click="next"
                class="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white/80 shadow-md backdrop-blur-sm transition hover:bg-black/60 hover:text-[#c8a45c] cursor-pointer"
                aria-label="Next slide"
            >
                <ChevronRightIcon class="size-5" />
            </button>

            <!-- Dots -->
            <div class="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                <button
                    v-for="(_, index) in banners"
                    :key="index"
                    @click="goTo(index)"
                    :class="[
                        'size-2.5 rounded-full transition-all duration-300 cursor-pointer',
                        index === currentIndex
                            ? 'bg-[#c8a45c] w-6 rounded-full'
                            : 'bg-white/40 hover:bg-white/70'
                    ]"
                    :aria-label="`Go to slide ${index + 1}`"
                />
            </div>
        </template>
    </section>
</template>
