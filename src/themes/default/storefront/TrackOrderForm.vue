<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useOrderStore } from '@/stores/order';
import { useRedirect } from '@/composables/useRedirect';

const router = useRouter();
const { t } = useI18n();
const toast = useToast();
const orderStore = useOrderStore();
const { redirectTo } = useRedirect();

const formdata = ref({
    order_id: undefined,
    email: undefined,
    grecaptcha_token: undefined,
});

const trackNow = async () => {

    try {

        if(zucConfig.recaptcha_site_key) {
            grecaptcha.ready(function() {
                grecaptcha.execute(zucConfig.recaptcha_site_key, { action: 'submit' }).then(function(token) {
                    formdata.value.grecaptcha_token = token
                })
            })
            while(formdata.value.grecaptcha_token === undefined) {
                await new Promise(r => setTimeout(r, 100))
            }
        }

        const verified = await orderStore.verify(formdata.value);
        redirectTo(`/track-order/${verified.ref}`);
    } catch (error) {
        toast.error(t(error.response?.data?.message || "An error occurred while sending your message."));
    }
}
</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="max-w-md mx-auto">
                <div class="text-center mb-8">
                    <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t('Track Your Order') }}</h1>
                    <p class="text-sm text-gray-500 mt-1.5 !mb-0">{{ $t('Enter your order details below to check the status.') }}</p>
                </div>
                <div class="border border-gray-200 rounded-xl p-6 sm:p-8">
                    <form @submit.prevent="trackNow" class="space-y-5">
                        <div>
                            <label for="order-id" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Order ID') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.order_id" id="order-id" name="order-id" type="number" required="" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" placeholder="E.g. 847568" />
                            </div>
                        </div>
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Email address') }}</label>
                            <div class="mt-1.5">
                                <input v-model="formdata.email" id="email" name="email" type="email" autocomplete="email" required="" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" placeholder="E.g. name@example.com" />
                            </div>
                        </div>
                        <div>
                            <button type="submit" class="w-full flex justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors">{{ $t('Track Now') }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
