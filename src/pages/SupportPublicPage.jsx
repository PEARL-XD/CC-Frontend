import { useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TOPIC_OPTIONS = [
  "Order help",
  "Delivery issue",
  "Payment issue",
  "Product quality",
  "General question",
];

const initialForm = {
  name: "",
  email: "",
  orderId: "",
  topic: TOPIC_OPTIONS[0],
  message: "",
};

export default function SupportPublicPage() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await axios.post(`${API_BASE_URL}/api/support/public`, {
        name: form.name,
        email: form.email,
        orderId: form.orderId,
        topic: form.topic,
        message: form.message,
      });
      setSubmitted(true);
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.error || "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  };

  const details = useMemo(
    () => [
      "Order questions",
      "Delivery updates",
      "Payment problems",
      "Quality or packaging feedback",
    ],
    [],
  );

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] items-start">
          <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Support
              </p>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
                Contact CleanChops
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Send us a message and we&apos;ll reply by email.
              </p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <h2 className="text-lg font-bold text-green-900">
                  Message sent
                </h2>
                <p className="text-sm text-green-800 mt-2">
                  Thanks. We&apos;ve received your support message and will get
                  back to you by email.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800 hover:bg-green-50 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1">
                      Name
                    </span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange("name")}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
                      placeholder="Your name"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1">
                      Email
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
                      placeholder="you@example.com"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1">
                      Order ID
                    </span>
                    <input
                      type="text"
                      value={form.orderId}
                      onChange={handleChange("orderId")}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
                      placeholder="Optional"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1">
                      Topic
                    </span>
                    <select
                      value={form.topic}
                      onChange={handleChange("topic")}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white focus:outline-none focus:border-indigo-400"
                    >
                      {TOPIC_OPTIONS.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <span className="block text-sm font-semibold text-gray-700 mb-1">
                    Message
                  </span>
                  <textarea
                    value={form.message}
                    onChange={handleChange("message")}
                    rows={6}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-400"
                    placeholder="Tell us what happened"
                    required
                  />
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </section>

          <aside className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-gray-900">
                Other ways to reach us
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                For quick help, email our support inbox directly.
              </p>
              <a
                href="mailto:supportcleanchops@gmail.com"
                className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
              >
                supportcleanchops@gmail.com
              </a>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-gray-900">Best for</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                {details.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
