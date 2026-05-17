// src/shared/services/ai.js

const AI_ENDPOINT = "/api/ai";

/**
 * Chiama Gemini tramite la Vercel Edge Function.
 * @param {string} prompt — il prompt utente
 * @param {string} systemPrompt — istruzioni di sistema (opzionale)
 * @param {number} maxTokens — lunghezza massima risposta (default 300)
 * @returns {Promise<string>} — testo generato
 */
export async function callAI(prompt, systemPrompt = "", maxTokens = 300) {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const res = await fetch(AI_ENDPOINT, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            signal:  controller.signal,
            body:    JSON.stringify({ prompt, systemPrompt, maxTokens }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { text, error } = await res.json();
        if (error) {
            const err = new Error(error);
            err.status = res.status;
            throw err;
        }
        return text;

    } catch (err) {
        if (err.name === "AbortError") throw new Error("Timeout: risposta AI troppo lenta", { cause: err });
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Versione con fallback — non lancia eccezione, restituisce null se AI non disponibile.
 * Usare per feature opzionali (messaggi alter ego, summary news).
 */
export async function callAIWithFallback(prompt, systemPrompt = "", maxTokens = 300) {
    try {
        return await callAI(prompt, systemPrompt, maxTokens);
    } catch {
        return null;
    }
}