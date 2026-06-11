<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="flex flex-col items-center justify-center text-center py-16">
                <svg class="w-20 h-20 text-gray-200 mb-6" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t('Hmmm...') }}</h1>
                <p class="text-sm text-gray-500 mt-2 !mb-0">{{ $t("We couldn't find any matches for your request") }}</p>
                <div class="mt-6">
                    <LocalizedLink to="/" class="bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors">
                        {{ $t('Go back home') }}
                    </LocalizedLink>
                </div>
            </div>
        </div>
    </div>
</template>
