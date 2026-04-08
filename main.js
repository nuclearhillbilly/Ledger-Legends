(function () {
    const SETTINGS_STORAGE_KEY = "ledger-legends-settings";

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
        window.LedgerLegends.settings = readSettings();

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
