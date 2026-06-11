<script setup>
import {
    TransitionRoot, TransitionChild,
    Dialog, DialogPanel, DialogTitle,
} from '@headlessui/vue'

defineProps({
    show: { type: Boolean, required: true },
    productName: { type: String, default: '' },
    form: { type: Object, required: true },
    submitting: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])
</script>

<template>
    <TransitionRoot appear :show="show" as="template">
        <Dialog as="div" @close="emit('close')" class="relative z-50">
            <TransitionChild
                as="template"
                enter="duration-300 ease-out" enter-from="opacity-0" enter-to="opacity-100"
                leave="duration-200 ease-in" leave-from="opacity-100" leave-to="opacity-0"
            >
                <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            </TransitionChild>

            <div class="fixed inset-0 overflow-y-auto">
                <div class="flex min-h-full items-center justify-center p-4">
                    <TransitionChild
                        as="template"
                        enter="duration-300 ease-out" enter-from="opacity-0 scale-95" enter-to="opacity-100 scale-100"
                        leave="duration-200 ease-in" leave-from="opacity-100 scale-100" leave-to="opacity-0 scale-95"
                    >
                        <DialogPanel class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <DialogTitle class="text-lg font-semibold text-[#2d2d2d]">
                                {{ $t('Notify When In Stock') }}
                            </DialogTitle>
                            <p class="mt-1 text-sm text-[#8a8274]">{{ productName }}</p>

                            <form @submit.prevent="emit('submit')" class="mt-5 space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('Email address') }}</label>
                                    <input
                                        v-model="form.email"
                                        type="email"
                                        required
                                        placeholder="name@example.com"
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#c8a45c]/30 focus:border-[#c8a45c]"
                                    />
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('Your name') }}</label>
                                    <input
                                        v-model="form.name"
                                        type="text"
                                        required
                                        :placeholder="$t('E.g. John Wick')"
                                        class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[#c8a45c]/30 focus:border-[#c8a45c]"
                                    />
                                </div>
                                <div class="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        @click="emit('close')"
                                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                    >
                                        {{ $t('Close') }}
                                    </button>
                                    <button
                                        type="submit"
                                        :disabled="submitting"
                                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1a1a1a] bg-[#c8a45c] rounded-lg hover:bg-[#b8943c] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg v-if="submitting" class="animate-spin size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        {{ submitting ? $t('Submitting...') : $t('Notify me') }}
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </TransitionChild>
                </div>
            </div>
        </Dialog>
    </TransitionRoot>
</template>
