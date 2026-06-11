<script setup>
import { ref } from 'vue';
import { useAuthCustomerStore } from '@/stores/auth/customer';
import { useCartStore } from '@/stores/cart';
import { useSettingsStore } from '@/stores/settings';

const auth = useAuthCustomerStore();
const cart = useCartStore();
const settings = useSettingsStore();
const open = ref(false);

function toggleLogin() {
    if (auth.isLoggedIn) {
        auth.clearCustomerAuth();
    } else {
        auth.login({ email: 'jane@example.com', password: 'password' });
    }
}

function addMockProductToCart() {
    cart.addProduct({ id: 1, name: 'Classic Wooden Chair', price: 69.99, cart_quantity: 1, image: '/storage/products/chair.jpg' });
}

function switchCurrency(code) {
    settings.setSelectedCurrency(code);
}
</script>

<template>
    <div v-if="open" class="fixed bottom-16 right-4 z-[9999] bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64 text-sm font-sans">
        <div class="font-semibold mb-3 text-gray-700">Dev Panel</div>

        <div class="mb-3">
            <div class="text-xs text-gray-500 mb-1">Auth</div>
            <button @click="toggleLogin" class="w-full px-3 py-1.5 rounded text-white text-xs font-medium"
                :class="auth.isLoggedIn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'">
                {{ auth.isLoggedIn ? 'Logout (Jane)' : 'Login as Jane' }}
            </button>
        </div>

        <div class="mb-3">
            <div class="text-xs text-gray-500 mb-1">Cart</div>
            <button @click="addMockProductToCart" class="w-full px-3 py-1.5 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-medium">
                Add Chair to Cart ({{ cart.numberOfItems }} items)
            </button>
        </div>

        <div>
            <div class="text-xs text-gray-500 mb-1">Currency</div>
            <div class="flex gap-2">
                <button @click="switchCurrency('USD')"
                    class="flex-1 px-2 py-1 rounded text-xs border"
                    :class="settings.selectedCurrency === 'USD' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'">
                    USD
                </button>
                <button @click="switchCurrency('EUR')"
                    class="flex-1 px-2 py-1 rounded text-xs border"
                    :class="settings.selectedCurrency === 'EUR' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-300'">
                    EUR
                </button>
            </div>
        </div>
    </div>

    <button @click="open = !open"
        class="fixed bottom-4 right-4 z-[9999] bg-gray-800 hover:bg-gray-700 text-white rounded-full w-10 h-10 text-base shadow-lg flex items-center justify-center font-mono">
        {{ open ? '✕' : '⚙' }}
    </button>
</template>
