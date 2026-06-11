<script setup>
</script>

<template>
    <div class="animate-pulse">
        <!-- Hero skeleton (dark) -->
        <div class="aspect-[21/9] sm:aspect-[21/8] lg:aspect-[21/7] bg-[#2a2a2a]" />

        <!-- Service bar skeleton (warm neutral) -->
        <div class="bg-[#f5f0e8]">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-[#e0d8c8]">
                    <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-4 sm:justify-center">
                        <div class="size-9 rounded-full bg-[#ddd5c5]" />
                        <div class="space-y-1.5">
                            <div class="h-3.5 w-28 rounded bg-[#ddd5c5]" />
                            <div class="h-2.5 w-36 rounded bg-[#e8e0d0]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Product section skeleton -->
        <div class="py-12 sm:py-16 bg-white">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="mb-8">
                    <div class="h-8 w-56 rounded bg-gray-200" />
                    <div class="mt-2 h-4 w-32 rounded bg-gray-100" />
                    <div class="mt-3 h-0.5 w-16 rounded bg-[#e8e0d0]" />
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                    <div v-for="j in 5" :key="j">
                        <div class="aspect-square rounded-lg bg-[#f5f0e8]" />
                        <div class="mt-4 space-y-2 px-1">
                            <div class="h-2.5 w-16 rounded bg-gray-100" />
                            <div class="h-4 w-full rounded bg-gray-200" />
                            <div class="h-6 w-20 rounded bg-gray-200 mt-3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Blog skeleton (warm neutral bg) -->
        <div class="py-12 sm:py-16 bg-[#f5f0e8]">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="mb-8">
                    <div class="h-8 w-48 rounded bg-[#ddd5c5]" />
                    <div class="mt-2 h-4 w-48 rounded bg-[#e8e0d0]" />
                    <div class="mt-3 h-0.5 w-16 rounded bg-[#ddd5c5]" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div v-for="k in 4" :key="k">
                        <div class="aspect-[3/2] rounded-lg bg-white" />
                        <div class="mt-4 space-y-2">
                            <div class="h-5 w-full rounded bg-[#ddd5c5]" />
                            <div class="h-4 w-full rounded bg-[#e8e0d0]" />
                            <div class="h-4 w-2/3 rounded bg-[#e8e0d0]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
