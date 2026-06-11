<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useOrderStore } from '@/stores/order';
import { useCartStore } from '@/stores/cart';
import { useSettingsStore } from '@/stores/settings';

const props = defineProps({
    hook: {
        type: Object,
        required: true,
    },
    hookPoint: {
        type: String,
        required: true,
    },
    queryParams: {
        type: Object,
        default: () => ({}),
    },
    // Optional CSS selector for a reference input in the parent DOM. When set,
    // the host copies that element's computed style into the iframe (via
    // zuc:hook-style on hook-ready) so an embedded <input> matches the theme's
    // own inputs. Omit for hooks that don't render a themed input (e.g. toggles).
    styleRef: {
        type: String,
        default: '',
    },
});

// 'set-meta' lets an iframe write a single scalar into the host form's `meta`
// bag (e.g. the SMS app sets meta.twilio_sms on the register form). The parent
// component decides what to do with it — this hook only forwards a validated
// (key, value) pair; it never mutates form state itself.
const emit = defineEmits(['set-meta']);

const orderStore = useOrderStore();
const cartStore = useCartStore();
const settingsStore = useSettingsStore();

const iframeRef = ref(null);
const iframeHeight = ref(props.hook.config?.height || '60px');
const hasError = ref(false);

// Modal state
const modal = reactive({
    isOpen: false,
    url: '',
    title: '',
    width: '600px',
    height: '80vh',
});

/**
 * Sign iframe query params with HMAC-SHA256 using the app's signing secret.
 * Signature = HMAC-SHA256(sorted_query_string, signing_secret)
 */
const signUrl = async (url) => {
    const secret = props.hook.signing_secret;
    if (!secret) return url.toString();

    const params = new URLSearchParams(url.searchParams);
    params.delete('signature');
    const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const queryString = sorted.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(queryString));
    const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');

    url.searchParams.set('signature', hex);
    return url.toString();
};

const iframeSrc = ref('');

const buildSrc = async () => {
    const url = new URL(props.hook.iframe_url);
    for (const [key, value] of Object.entries(props.queryParams)) {
        if (value !== null && value !== undefined) {
            url.searchParams.set(key, value);
        }
    }
    url.searchParams.set('store_url', window.location.hostname);
    iframeSrc.value = await signUrl(url);
};

const buildModalUrl = async (path) => {
    const iframeUrl = new URL(props.hook.iframe_url);
    const appBase = `${iframeUrl.protocol}//${iframeUrl.host}`;
    const url = new URL(appBase + '/' + path.replace(/^\//, ''));
    for (const [key, value] of Object.entries(props.queryParams)) {
        if (value !== null && value !== undefined) {
            url.searchParams.set(key, value);
        }
    }
    url.searchParams.set('store_url', window.location.hostname);
    return await signUrl(url);
};

const isValidModalPath = (path) => {
    if (typeof path !== 'string') return false;
    if (!path.startsWith('/')) return false;
    if (/^(javascript|data|vbscript):/i.test(path)) return false;
    if (path.startsWith('//')) return false;
    if (path.includes('..')) return false;
    return true;
};

const closeModal = () => {
    modal.isOpen = false;
    modal.url = '';
};

const handleMessage = (event) => {
    const msg = event.data;
    if (!msg?.type?.startsWith('zuc:')) return;

    // zuc:scroll-to-hook is a cross-iframe broadcast: any iframe can request
    // the parent to scroll another hook point into view. Handle it before the
    // source-filter so every mounted instance can claim its matching target.
    if (msg.type === 'zuc:scroll-to-hook') {
        const target = typeof msg.target === 'string' ? msg.target : '';
        if (target && target === props.hookPoint && iframeRef.value) {
            iframeRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
    }

    const fromOwnIframe = iframeRef.value && event.source === iframeRef.value.contentWindow;
    // Modal iframe is allowed to talk back, but only for modal-close. Height
    // messages from the modal must never resize the underlying inline hook.
    if (!fromOwnIframe && !(modal.isOpen && msg.type === 'zuc:modal-close')) {
        return;
    }

    switch (msg.type) {
        case 'zuc:hook-ready':
            if (msg.height) {
                iframeHeight.value = typeof msg.height === 'number' ? `${msg.height}px` : msg.height;
            }
            // Once the iframe is ready, push the host theme's input style so an
            // embedded <input> matches the surrounding fields (no-op if styleRef
            // is unset or matches nothing).
            sendHookStyle();
            break;
        case 'zuc:hook-resize':
            if (msg.height) {
                iframeHeight.value = typeof msg.height === 'number' ? `${msg.height}px` : msg.height;
            }
            break;
        case 'zuc:hook-error':
            hasError.value = true;
            console.error(`Storefront hook error [${props.hook.id}]:`, msg.message);
            break;
        case 'zuc:set-meta':
            // Forward a single (key, value) into the host form's meta bag. Only
            // string keys and JSON-primitive values are accepted; nested
            // objects/arrays are rejected so an iframe can't smuggle a large or
            // structured payload into a customer record via meta.
            if (typeof msg.key === 'string' && msg.key !== ''
                && (msg.value === null || ['string', 'number', 'boolean'].includes(typeof msg.value))) {
                emit('set-meta', { key: msg.key, value: msg.value });
            }
            break;
        case 'zuc:modal-open':
            if (msg.url && isValidModalPath(msg.url)) {
                buildModalUrl(msg.url).then(signedUrl => {
                    modal.url = signedUrl;
                    modal.title = msg.title || '';
                    modal.width = msg.width || '600px';
                    modal.height = msg.height || '80vh';
                    modal.isOpen = true;
                });
            }
            break;
        case 'zuc:modal-close':
            closeModal();
            break;
        case 'zuc:request-context':
            // Iframe wants cart totals so it can bound user input (e.g. max redeemable
            // points). Reply with subtotal + currency only — no monetary decisions are
            // made from this data; the backend recomputes discount amounts server-side.
            replyToIframe({
                type: 'zuc:context',
                module: props.hook.client_id,
                subtotal: cartStore.subtotal,
                currency: settingsStore.selectedCurrency,
            });
            break;
        case 'zuc:apply-discount':
            // msg.module MUST equal hook.client_id — prevents an iframe owned by app A
            // from applying a discount under app B's module id. msg.input carries raw
            // user intent only (e.g. { redeem_reward_points: 70 }); any `amount` field
            // is ignored because applyAppDiscount -> CheckoutService::applyDiscount
            // recomputes the dollar amount server-to-server via appService->postData.
            handleApplyDiscount(msg);
            break;
        case 'zuc:remove-discount':
            handleRemoveDiscount(msg);
            break;
        case 'zuc:fill-address':
            // An app (e.g. Radar autocomplete) pushes a chosen address into the
            // checkout form. msg.module MUST equal hook.client_id (same anti-spoof
            // guard as apply-discount). Prefill only — written to the order store,
            // never auto-submitted or trusted server-side (an address isn't money).
            handleFillAddress(msg);
            break;
    }
};

// Computed-style properties copied from the reference input into the iframe.
// Fixed whitelist — the iframe applies these keys individually, never a raw CSS
// string, so the host can only influence an input's appearance, not inject CSS.
const HOOK_STYLE_PROPS = [
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderStyle', 'borderColor', 'borderRadius',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
    'color', 'backgroundColor', 'height', 'boxShadow',
];

// Copy the reference input's computed style into the iframe so its embedded
// <input> matches the theme. No-op when styleRef is unset / selector misses.
const sendHookStyle = () => {
    if (!props.styleRef) return;
    let el;
    try {
        el = document.querySelector(props.styleRef);
    } catch {
        return; // invalid selector — ignore
    }
    if (!el) return;

    const computed = window.getComputedStyle(el);
    const style = {};
    for (const prop of HOOK_STYLE_PROPS) {
        const val = computed[prop];
        if (val) style[prop] = val;
    }
    replyToIframe({ type: 'zuc:hook-style', style });
};

// Send a message back to the iframe that originated the request. Using the known
// iframe contentWindow instead of event.source guarantees we don't reply to a
// spoofed sender. Origin '*' is acceptable here because the iframe was loaded from
// a URL we signed with HMAC; it cannot be substituted by a third party.
const replyToIframe = (message) => {
    iframeRef.value?.contentWindow?.postMessage(message, '*');
};

const handleApplyDiscount = async (msg) => {
    const module = typeof msg.module === 'string' ? msg.module : '';
    if (!module || module !== props.hook.client_id) {
        replyToIframe({ type: 'zuc:discount-applied', ok: false, module, error: 'module_mismatch' });
        return;
    }

    // Apply/remove only make sense during checkout, where a draft exists.
    if (!orderStore.checkoutDraftId) {
        replyToIframe({ type: 'zuc:discount-applied', ok: false, module, error: 'no_draft' });
        return;
    }

    const input = msg.input && typeof msg.input === 'object' ? msg.input : {};
    const ok = await orderStore.applyAppDiscount(module, input);
    replyToIframe({ type: 'zuc:discount-applied', ok, module });
};

const handleRemoveDiscount = async (msg) => {
    const module = typeof msg.module === 'string' ? msg.module : '';
    if (!module || module !== props.hook.client_id) {
        replyToIframe({ type: 'zuc:discount-removed', ok: false, module, error: 'module_mismatch' });
        return;
    }

    if (!orderStore.checkoutDraftId) {
        replyToIframe({ type: 'zuc:discount-removed', ok: false, module, error: 'no_draft' });
        return;
    }

    const ok = await orderStore.removeAppDiscount(module);
    replyToIframe({ type: 'zuc:discount-removed', ok, module });
};

const handleFillAddress = (msg) => {
    const module = typeof msg.module === 'string' ? msg.module : '';
    if (!module || module !== props.hook.client_id) {
        replyToIframe({ type: 'zuc:address-filled', ok: false, module, error: 'module_mismatch' });
        return;
    }

    const address = msg.address && typeof msg.address === 'object' ? msg.address : null;
    if (!address) {
        replyToIframe({ type: 'zuc:address-filled', ok: false, module, error: 'no_address' });
        return;
    }

    // Prefill only — the order store holds it; the checkout Address form maps it
    // into its fields. No backend call (an address isn't money to recompute).
    orderStore.prefillAddress(address);
    replyToIframe({ type: 'zuc:address-filled', ok: true, module });
};

onMounted(() => {
    window.addEventListener('message', handleMessage);
    buildSrc();
});

onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
});
</script>

<template>
    <div v-if="!hasError && iframeSrc">
        <iframe
            ref="iframeRef"
            :src="iframeSrc"
            :style="{ height: iframeHeight, width: '100%', border: 'none' }"
            :data-hook-point="hookPoint"
            :data-hook-id="hook.id"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            loading="lazy"
        ></iframe>
    </div>

    <!-- Modal overlay -->
    <Teleport to="body">
        <Transition
            enter-active-class="duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div v-if="modal.isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/50" @click="closeModal"></div>
                <div class="relative w-full rounded-xl bg-white shadow-2xl overflow-hidden" :style="{ maxWidth: modal.width }">
                    <div v-if="modal.title" class="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                        <h3 class="text-base font-semibold text-gray-900">{{ modal.title }}</h3>
                        <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <button v-else @click="closeModal" class="absolute top-3 right-3 z-10 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <iframe
                        :src="modal.url"
                        :style="{ height: modal.height, width: '100%', border: 'none' }"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    ></iframe>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
