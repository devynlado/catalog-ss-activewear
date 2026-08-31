/**
 * Run a promise as background work that must outlive the HTTP response.
 *
 * On Vercel, serverless functions can be frozen/killed once the response is
 * sent — which can cut off a fire-and-forget `placeSSOrder(...)` after the POST
 * to S&S but before we record it, leaving the order in an undetermined state.
 * When the optional `@vercel/functions` package is installed, this uses
 * `waitUntil()` so the platform keeps the function alive until the work settles.
 *
 * If the package isn't available (e.g. local dev, or not yet installed), it
 * degrades to plain fire-and-forget. That remains safe because placeSSOrder is
 * idempotent and verifies with S&S before any re-send — a cut-off attempt is
 * reconciled (never duplicated) on the next retry.
 */
export function scheduleBackground(
  promise: Promise<unknown>,
  label = 'background task'
): void {
  const guarded = Promise.resolve(promise).catch((err) =>
    console.error(`[background] ${label} failed:`, err)
  );

  try {
    // Load `@vercel/functions` indirectly so bundlers don't hard-fail when the
    // optional dependency is absent. Grab the runtime `require` in Node.
    const req: NodeRequire | undefined =
      typeof require !== 'undefined'
        ? require
        : (() => {
            try {
              // eslint-disable-next-line no-eval
              return eval('require') as NodeRequire;
            } catch {
              return undefined;
            }
          })();

    if (req) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = req('@vercel/functions') as {
        waitUntil?: (p: Promise<unknown>) => void;
      };
      if (mod && typeof mod.waitUntil === 'function') {
        mod.waitUntil(guarded);
        return;
      }
    }
  } catch {
    // Optional dependency not present — fall through to fire-and-forget.
  }

  void guarded;
}
