import { ref } from 'vue';

const MIN_HEIGHT = 100;
const MAX_HEIGHT = 1000;

export function useIframeResize(getIframeEl) {
    const isDragging = ref(false);

    let startY = 0;
    let startHeight = 0;
    let hookId = null;
    let heightRef = null;

    const clamp = (val) => Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, val));

    const onMove = (e) => {
        if (!isDragging.value) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const newHeight = clamp(startHeight + (clientY - startY));
        heightRef.value = `${newHeight}px`;
    };

    const onEnd = () => {
        if (!isDragging.value) return;
        isDragging.value = false;

        const iframe = getIframeEl?.();
        if (iframe) iframe.style.pointerEvents = '';

        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        // No DB save in builder
    };

    const startResize = (e, id, iframeHeightRef) => {
        e.preventDefault();
        isDragging.value = true;
        hookId = id;
        heightRef = iframeHeightRef;

        startY = e.touches ? e.touches[0].clientY : e.clientY;
        startHeight = parseInt(iframeHeightRef.value, 10) || 400;

        const iframe = getIframeEl?.();
        if (iframe) iframe.style.pointerEvents = 'none';

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    };

    return { isDragging, startResize };
}
