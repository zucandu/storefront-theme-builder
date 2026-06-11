<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { useContactStore } from '@/stores/utils/contact'

const { t } = useI18n();
const toast = useToast();
const contactStore = useContactStore();

const formdata = ref({
    name: undefined,
    email: undefined,
    phone: undefined,
    message: undefined,
    grecaptcha_token: undefined,
});

function initMap() {

    if (typeof google === "object" && typeof google.maps === "object") {

        // The location of Uluru
        const lat = 40.42741908700797;
        const lng = -79.94883732472249;
        const uluru = { lat: lat, lng: lng }
        // The map, centered at Uluru
        const map = new google.maps.Map(document.getElementById("store-map"), {
            zoom: 16,
            center: uluru,
        })

        // The marker, positioned at Uluru
        const marker = new google.maps.Marker({ position: uluru,  map: map })
    }
}

onMounted(() => {
    const gmapi = "AIzaSyAaT3hKh5mBQ7idj1J8pPm-45jBrWUcoZA";
    const gmjs = document.createElement("script")
    gmjs.src = `https://maps.googleapis.com/maps/api/js?key=${gmapi}`
    gmjs.id = 'google-map-script'
    document.head.appendChild(gmjs)
    setTimeout(() => initMap(), 1000)
});

const sendmail = async () => {
    await contactStore.sendMail(formdata.value)
        .then(() => {
            toast.success(t("Thank you for contacting us. We will get to you as soon as possible."));
        })
        .catch(error => {
            toast.error(t(error.response.data.message));
        });
}
</script>

<template>
    <div>
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div class="text-center mb-10">
                <h1 class="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight !mb-0">{{ $t('Get in touch') }}</h1>
                <p class="text-sm text-gray-500 mt-1.5 !mb-0">{{ $t('We would love to hear from you. Send us a message and we will respond as soon as possible.') }}</p>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div class="lg:col-span-5">
                    <div class="border border-gray-200 rounded-xl p-6">
                        <form @submit.prevent="sendmail()" class="space-y-5">
                            <div>
                                <label for="name" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Your name') }}</label>
                                <div class="mt-1.5">
                                    <input v-model="formdata.name" id="name" name="name" type="text" required="" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label for="email" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Email address') }}</label>
                                <div class="mt-1.5">
                                    <input v-model="formdata.email" id="email" name="email" type="email" autocomplete="email" required="" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label for="phone" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Phone (Optional)') }}</label>
                                <div class="mt-1.5">
                                    <input v-model="formdata.phone" id="phone" name="phone" type="text" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label for="message" class="block text-sm font-medium text-gray-700 !mb-0">{{ $t('Message') }}</label>
                                <div class="mt-1.5">
                                    <textarea v-model="formdata.message" id="message" rows="4" :placeholder="$t('Enter your message here...')" class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors resize-none"></textarea>
                                </div>
                            </div>
                            <div>
                                <button type="submit" class="w-full flex justify-center bg-gray-900 hover:bg-gray-800 text-white rounded-xl px-6 py-2.5 font-medium text-sm transition-colors">{{ $t('Send now') }}</button>
                            </div>
                        </form>
                    </div>
                </div>
                <div class="lg:col-span-7">
                    <div class="rounded-xl overflow-hidden border border-gray-200 h-full min-h-[400px]">
                        <div id="store-map" class="w-full h-full"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
