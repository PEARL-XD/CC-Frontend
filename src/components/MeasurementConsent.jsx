import { useEffect, useState } from "react";

export default function MeasurementConsent() {
  const [choice, setChoice] = useState(() => window.cleanChopsConsent?.read() ?? null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const visible = choice === null || editing;

  useEffect(() => {
    function syncChoice(event) {
      const consent = window.cleanChopsConsent;
      if (consent && (event.key === consent.storageKey || event.key === null)) {
        setChoice(consent.restore());
      }
    }
    window.addEventListener("storage", syncChoice);
    return () => window.removeEventListener("storage", syncChoice);
  }, []);

  function choose(allowed) {
    const consent = window.cleanChopsConsent;
    if (!consent) {
      setError(true);
      return;
    }
    setChoice(consent.choose(allowed));
    setEditing(false);
    setError(false);
  }

  return (
    <>
      <div className="bg-[#fffaf6] px-4 py-3 text-center text-xs text-black/60">
        <button type="button" onClick={() => setEditing(true)} aria-expanded={visible}
          aria-controls="measurement-choices" className="min-h-11 rounded-lg px-3 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a52b25]">
          Privacy choices
        </button>
      </div>
      {visible && (
        <section id="measurement-choices" aria-label="Advertising measurement choices"
          className="fixed inset-x-3 bottom-3 z-[200] max-h-[85dvh] overflow-y-auto rounded-2xl border border-[#eadbce] bg-[#fffaf6] p-5 text-[#281e19] shadow-xl sm:left-auto sm:right-5 sm:w-[28rem]">
          <h2 className="text-lg font-bold">Your privacy choices</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Allow Google advertising cookies and advertising data use to measure which ads lead to orders?
            Shopping works if you decline. Personalised ads stay off.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-black/60">
            We remember your choice for up to 180 days. Change it anytime using Privacy choices at the bottom of any page.
            {choice !== null && ` Current choice: ${choice ? "measurement allowed" : "optional measurement declined"}.`}
          </p>
          <a href="/privacy-policy#privacy" className="mt-3 inline-block text-sm underline underline-offset-4">Read our privacy policy</a>
          <div className="mt-4 grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
            <button type="button" onClick={() => choose(false)} className="min-h-11 rounded-xl border border-[#8b6b53] bg-white px-3 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a52b25]">
              Decline optional
            </button>
            <button type="button" onClick={() => choose(true)} className="min-h-11 rounded-xl border border-[#8b6b53] bg-white px-3 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a52b25]">
              Allow measurement
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-sm">Privacy controls could not load. Optional consent remains denied; you can still shop.</p>}
        </section>
      )}
    </>
  );
}
