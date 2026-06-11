<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useRedirect } from '@/composables/useRedirect';

const toast = useToast();
const { t } = useI18n();
const authCustomerStore = useAuthCustomerStore();
const { redirectTo } = useRedirect();

const formdata = ref({
    email: undefined,
});

const submitForm = async () => {
    await authCustomerStore.unsubscribeNewsletter(formdata.value)
        .then(() => {
            toast.success(t("You've been unsubscribed from our newsletter."));
            redirectTo('/');
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        })
}

</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="max-w-md mx-auto">
                <div class="text-center mb-8">
                    <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t("We're sorry to see you go!") }}</h1>
                    <p class="text-sm text-gray-500 mt-1.5 !mb-0">{{ $t('Enter your email to unsubscribe from our newsletter.') }}</p>
                </div>
                <div class="border border-gray-200 rounded-xl p-6 sm:p-8">
                    <form @submit.prevent="submitForm" class="space-y-5">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Email address') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.email" id="email" name="email" type="email" autocomplete="email" required="" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" class="w-full flex justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors">{{ $t("It's over!") }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
