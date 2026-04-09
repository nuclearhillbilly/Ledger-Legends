(function () {
    const SETTINGS_STORAGE_KEY = "ledger-legends-settings";
    const BASE_VIEWPORT_WIDTH = 1920;
    const BASE_VIEWPORT_HEIGHT = 1080;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function readViewport() {
        const viewport = window.visualViewport;
        if (viewport && viewport.width > 0 && viewport.height > 0) {
            return {
                width: Math.max(320, Math.round(viewport.width)),
                height: Math.max(320, Math.round(viewport.height))
            };
        }

        return {
            width: Math.max(320, Math.round(window.innerWidth)),
            height: Math.max(320, Math.round(window.innerHeight))
        };
    }

    function getViewportMetrics() {
        const viewport = readViewport();
        const scaleX = viewport.width / BASE_VIEWPORT_WIDTH;
        const scaleY = viewport.height / BASE_VIEWPORT_HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        const uiScale = clamp(scale * 3.15, 0.74, 1);
        const overlayScale = clamp(scale * 3.35, 0.72, 1);
        const touchScale = clamp(scale * 3.25, 0.76, 1);

        return {
            width: viewport.width,
            height: viewport.height,
            scaleX: scaleX,
            scaleY: scaleY,
            scale: scale,
            uiScale: uiScale,
            overlayScale: overlayScale,
            touchScale: touchScale,
            edgePadding: Math.round(10 + (10 * uiScale)),
            cornerMargin: Math.round(10 + (12 * uiScale)),
            overlayPadding: Math.round(14 + (16 * overlayScale))
        };
    }

    function applyResponsiveMetrics() {
        const metrics = getViewportMetrics();
        const root = document.documentElement;

        root.style.setProperty("--viewport-width", `${metrics.width}px`);
        root.style.setProperty("--viewport-height", `${metrics.height}px`);
        root.style.setProperty("--ui-scale-x", metrics.scaleX.toFixed(4));
        root.style.setProperty("--ui-scale-y", metrics.scaleY.toFixed(4));
        root.style.setProperty("--ui-scale-raw", metrics.scale.toFixed(4));
        root.style.setProperty("--ui-scale", metrics.uiScale.toFixed(4));
        root.style.setProperty("--overlay-scale", metrics.overlayScale.toFixed(4));
        root.style.setProperty("--touch-ui-scale", metrics.touchScale.toFixed(4));
        root.style.setProperty("--ui-edge-padding", `${metrics.edgePadding}px`);
        root.style.setProperty("--ui-corner-margin", `${metrics.cornerMargin}px`);
        root.style.setProperty("--ui-overlay-padding", `${metrics.overlayPadding}px`);

        return metrics;
    }

    function bindResponsiveMetrics() {
        if (window.__ledgerLegendsResponsiveMetricsBound) {
            return;
        }

        window.__ledgerLegendsResponsiveMetricsBound = true;
        window.addEventListener("resize", applyResponsiveMetrics);

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", applyResponsiveMetrics);
            window.visualViewport.addEventListener("scroll", applyResponsiveMetrics);
        }
    }

    function readSettings() {
        try {
            const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
            return {
                category: typeof parsed.category === "string" ? parsed.category : "mixed",
                devMode: !!parsed.devMode
            };
        } catch (error) {
            return {
                category: "mixed",
                devMode: false
            };
        }
    }

    function bootGame() {
        window.LedgerLegends = window.LedgerLegends || {};
        window.LedgerLegends.getViewportMetrics = getViewportMetrics;
        window.LedgerLegends.applyResponsiveMetrics = applyResponsiveMetrics;
        window.LedgerLegends.settings = readSettings();
        applyResponsiveMetrics();
        bindResponsiveMetrics();

        const createGame = window.LedgerLegends && window.LedgerLegends.createGame;
        if (typeof createGame !== "function") {
            console.error("[Ledger Legends] Game bootstrap failed: createGame is missing.");
            return;
        }

        const game = createGame();
        game.start();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootGame, { once: true });
    } else {
        bootGame();
    }
})();
