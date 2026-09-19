import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MAPS_BROWSER_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY;

const emptyDraft = {
  addressLabel: "Home",
  addressLine: "",
  placeName: "",
  street: "",
  locality: "",
  administrativeArea: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  tower: "",
  floor: "",
  flat: "",
};

function locationKey(item = {}) {
  return item.locationKey || `${item.latitude || ""}:${item.longitude || ""}:${item.addressLine || ""}`;
}

function MapPicker({ latitude, longitude, onMove }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const onMoveRef = useRef(onMove);
  const initialCenterRef = useRef({ latitude, longitude });
  const [status, setStatus] = useState(MAPS_BROWSER_KEY ? "loading" : "missing-key");

  onMoveRef.current = onMove;

  useEffect(() => {
    if (!MAPS_BROWSER_KEY || !initialCenterRef.current.latitude || !initialCenterRef.current.longitude) return undefined;
    const renderMap = () => {
      if (!mapRef.current || !window.google?.maps) return;
      const center = {
        lat: Number(initialCenterRef.current.latitude),
        lng: Number(initialCenterRef.current.longitude),
      };
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 17,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });
      markerInstance.current = new window.google.maps.Marker({
        map: mapInstance.current,
        position: center,
        draggable: true,
        title: "Move to the delivery point",
      });
      markerInstance.current.addListener("dragend", () => {
        const position = markerInstance.current.getPosition();
        onMoveRef.current(position.lat(), position.lng());
      });
      setStatus("ready");
    };

    if (window.google?.maps) {
      renderMap();
      return undefined;
    }

    const existing = document.querySelector("script[data-google-maps]");
    const script = existing || document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_BROWSER_KEY)}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    if (!existing) document.head.appendChild(script);
    script.addEventListener("load", renderMap);
    script.addEventListener("error", () => setStatus("error"));
    return () => script.removeEventListener("load", renderMap);
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !latitude || !longitude) return;
    const center = { lat: Number(latitude), lng: Number(longitude) };
    mapInstance.current.setCenter(center);
    markerInstance.current.setPosition(center);
  }, [latitude, longitude]);

  if (status === "missing-key") {
    return <div className="rounded-2xl border border-orange-100 bg-[#fffaf8] p-4 text-sm text-black/60">Map preview is unavailable until the browser Maps key is configured. GPS coordinates will still be saved safely.</div>;
  }
  if (status === "error") {
    return <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">The map could not load. You can still save the detected coordinates and address details.</div>;
  }
  return <div className="relative h-64 overflow-hidden rounded-2xl border border-black/10 bg-[#f5f0e9]"><div ref={mapRef} className="h-full w-full" />{status === "loading" && <div className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-semibold text-black/60">Loading map...</div>}<div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-black/65 shadow-sm">Drag the pin to the exact delivery point</div></div>;
}

export default function LocationPage() {
  const { accessToken, user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const savedLocations = useMemo(() => {
    const values = [
      ...(Array.isArray(user?.savedLocations) ? user.savedLocations : []),
      user?.deliveryLocation,
    ].filter((item) => item && (item.locationKey || item.latitude != null || item.addressLine));

    return [...new Map(values.map((item) => [locationKey(item), item])).values()];
  }, [user]);

  if (!accessToken) return <AuthRequired />;

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const moveDraftPin = (latitude, longitude) => setDraft((current) => ({ ...current, latitude: String(latitude), longitude: String(longitude) }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location detection is not available in this browser.");
      return;
    }

    setBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setDraft((current) => ({
          ...current,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
          addressLine: current.addressLine || "Current location",
        }));
        setEditing(true);
        setBusy(false);
      },
      (geoError) => {
        setError(geoError.code === 1 ? "Please allow location access to continue." : "Could not detect your location.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const selectLocation = async (item) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(item),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not select this address.");
      setUser(data.user);
      toast.success(data.serviceability?.serviceable ? "Address selected" : "This address is outside our delivery area.");
      if (routerLocation.state?.from) navigate(routerLocation.state.from, { replace: true });
    } catch (selectionError) {
      setError(selectionError.message);
    } finally {
      setBusy(false);
    }
  };

  const saveLocation = async (event) => {
    event.preventDefault();
    if (!draft.latitude || !draft.longitude) {
      setError("Select your current location before saving the address.");
      return;
    }
    if (!draft.addressLine.trim() || !draft.flat.trim()) {
      setError("Add the full address and house/flat number for delivery.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ ...draft, flat: draft.flat.trim(), floor: draft.floor.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save this address.");
      setUser(data.user);
      setEditing(false);
      toast.success(data.serviceability?.serviceable ? "Address saved" : "Address saved, but it is not serviceable yet.");
      if (routerLocation.state?.from) navigate(routerLocation.state.from, { replace: true });
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#fff0e5_100%)] px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-[#E53935]">Delivery details</p>
              <h1 className="mt-2 text-3xl font-black text-[#151515]">Select your location</h1>
              <p className="mt-2 text-sm text-black/60">Choose a saved address or use your current location to check delivery availability.</p>
            </div>
            <button className="rounded-xl border border-orange-200 px-4 py-2 font-semibold text-orange-700" onClick={() => navigate(-1)}>Back</button>
          </div>

          {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

          {!editing ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={useCurrentLocation} disabled={busy} className="rounded-2xl border border-[#E53935]/20 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60">
                  <div className="text-2xl">⌖</div>
                  <h2 className="mt-3 font-extrabold text-[#E53935]">Use my current location</h2>
                  <p className="mt-1 text-sm text-black/55">Allow browser location access and complete your delivery details.</p>
                </button>
                <button type="button" onClick={() => { setDraft(emptyDraft); setEditing(true); }} className="rounded-2xl border border-orange-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="text-2xl">＋</div>
                  <h2 className="mt-3 font-extrabold text-[#E53935]">Add new address</h2>
                  <p className="mt-1 text-sm text-black/55">Start with your current location, then add house and building details.</p>
                </button>
              </div>

              <section className="mt-8 rounded-3xl border border-black/8 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-[#151515]">Saved addresses</h2>
                <div className="mt-4 space-y-3">
                  {savedLocations.length === 0 && <p className="rounded-2xl bg-[#fffaf8] p-4 text-sm text-black/55">No saved addresses yet.</p>}
                  {savedLocations.map((item) => {
                    const selected = locationKey(item) === locationKey(user?.deliveryLocation);
                    return <button key={locationKey(item)} type="button" onClick={() => selectLocation(item)} disabled={busy} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-[#E53935] bg-[#fff4ef]" : "border-black/8 hover:border-orange-200"}`}>
                      <div className="flex items-start justify-between gap-3"><div><div className="font-extrabold text-[#151515]">{item.addressLabel || "Saved address"}</div><p className="mt-1 text-sm leading-6 text-black/60">{[item.flat, item.floor && `Floor ${item.floor}`, item.tower, item.addressLine].filter(Boolean).join(", ")}</p></div>{selected && <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-700">Selected</span>}</div>
                      {item.serviceable === false && <p className="mt-2 text-xs font-bold text-red-600">Outside current delivery area</p>}
                    </button>;
                  })}
                </div>
              </section>
            </>
          ) : (
            <form onSubmit={saveLocation} className="rounded-3xl border border-black/8 bg-white p-5 shadow-sm sm:p-7">
              <div className="rounded-2xl bg-[#fffaf8] p-4 text-sm text-black/65"><strong>Location selected:</strong> {draft.latitude && draft.longitude ? `${Number(draft.latitude).toFixed(5)}, ${Number(draft.longitude).toFixed(5)}` : "Use current location to continue"}</div>
              {draft.latitude && draft.longitude && <div className="mt-4"><MapPicker latitude={draft.latitude} longitude={draft.longitude} onMove={moveDraftPin} /></div>}
              <button type="button" onClick={useCurrentLocation} disabled={busy} className="mt-3 rounded-xl border border-orange-200 px-4 py-2 text-sm font-bold text-orange-700 disabled:opacity-60">Use current location</button>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-1 block text-sm font-bold">Full address</span><input value={draft.addressLine} onChange={(e) => updateDraft("addressLine", e.target.value)} placeholder="Street, locality, landmark" className="w-full rounded-xl border border-black/12 px-4 py-3 outline-none focus:border-[#E53935]" /></label>
                <label><span className="mb-1 block text-sm font-bold">House / flat number</span><input value={draft.flat} onChange={(e) => updateDraft("flat", e.target.value)} placeholder="Required" className="w-full rounded-xl border border-black/12 px-4 py-3 outline-none focus:border-[#E53935]" /></label>
                <label><span className="mb-1 block text-sm font-bold">Floor <span className="font-normal text-black/45">(optional)</span></span><input value={draft.floor} onChange={(e) => updateDraft("floor", e.target.value)} placeholder="e.g. 2" className="w-full rounded-xl border border-black/12 px-4 py-3 outline-none focus:border-[#E53935]" /></label>
                <label><span className="mb-1 block text-sm font-bold">Building / tower <span className="font-normal text-black/45">(optional)</span></span><input value={draft.tower} onChange={(e) => updateDraft("tower", e.target.value)} className="w-full rounded-xl border border-black/12 px-4 py-3 outline-none focus:border-[#E53935]" /></label>
                <label><span className="mb-1 block text-sm font-bold">Address label</span><select value={draft.addressLabel} onChange={(e) => updateDraft("addressLabel", e.target.value)} className="w-full rounded-xl border border-black/12 bg-white px-4 py-3 outline-none focus:border-[#E53935]"><option>Home</option><option>Office</option><option>Friends Home</option><option>Other</option></select></label>
                <label><span className="mb-1 block text-sm font-bold">Postal code <span className="font-normal text-black/45">(optional)</span></span><input value={draft.postalCode} onChange={(e) => updateDraft("postalCode", e.target.value)} className="w-full rounded-xl border border-black/12 px-4 py-3 outline-none focus:border-[#E53935]" /></label>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-orange-200 py-3 font-bold text-orange-700">Cancel</button><button type="submit" disabled={busy || !draft.latitude || !draft.longitude || !draft.flat.trim()} className="flex-1 rounded-xl bg-[#E53935] py-3 font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45">{busy ? "Saving..." : "Save address"}</button></div>
            </form>
          )}
        </div>
      </main>
    </>
  );
}
