(function () {
    const SETTINGS_STORAGE_KEY = "ledger-legends-settings";
    const SESSION_SETTINGS_STORAGE_KEY = "ledger-legends-session-settings";

    function readPersistentSettings() {
        try {
            const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
            return {
                category: typeof parsed.category === "string" ? parsed.category : "mixed"
            };
        } catch (error) {
            return {
                category: "mixed"
            };
        }
    }

    function readLaunchSettings() {
        try {
            const parsed = JSON.parse(window.sessionStorage.getItem(SESSION_SETTINGS_STORAGE_KEY) || "{}");
            return {
                devMode: !!parsed.devMode
            };
        } catch (error) {
            return {
                devMode: false
            };
        }
    }

    function readSettings() {
        const persistentSettings = readPersistentSettings();
        const launchSettings = readLaunchSettings();

        return {
            category: persistentSettings.category,
            devMode: launchSettings.devMode
        };
    }

    function clearLaunchSettings() {
        try {
            window.sessionStorage.setItem(SESSION_SETTINGS_STORAGE_KEY, JSON.stringify({
                devMode: false
            }));
        } catch (error) {
            return;
        }
    }

    function bootGame() {
        window.LedgerLegends = window.LedgerLegends || {};
        window.LedgerLegends.settings = readSettings();
        clearLaunchSettings();

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
