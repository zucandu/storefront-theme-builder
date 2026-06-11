import { ref } from 'vue';

export function useIframeHooks(hookPoint) {
    const hooks = ref([]);
    const loading = ref(false);

    const fetchHooks = async () => {
        hooks.value = [];
    };

    const broadcastToHooks = (type, data = {}) => {
        const iframes = document.querySelectorAll(`iframe[data-hook-point="${hookPoint}"]`);
        const promises = [];

        iframes.forEach(iframe => {
            if (!iframe.contentWindow) return;

            const promise = new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ hookId: iframe.dataset.hookId, success: false, error: 'timeout' });
                }, 10000);

                const handler = (event) => {
                    if (event.source !== iframe.contentWindow) return;
                    const msg = event.data;
                    if (msg?.type === 'zuc:hook-saved' || msg?.type === 'zuc:hook-error') {
                        clearTimeout(timeout);
                        window.removeEventListener('message', handler);
                        resolve({
                            hookId: iframe.dataset.hookId,
                            success: msg.type === 'zuc:hook-saved',
                            error: msg.message || null,
                        });
                    }
                };

                window.addEventListener('message', handler);
            });

            promises.push(promise);
            iframe.contentWindow.postMessage({ type, ...data }, '*');
        });

        return Promise.all(promises);
    };

    return { hooks, loading, fetchHooks, broadcastToHooks };
}
