"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { MapProps } from "./deal-map";

const pin = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:var(--brand,#0f766e);transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

export default function DealMapInner({ lat, lng, mode }: MapProps) {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      center: [lat, lng],
      zoom: mode === "exact" ? 16 : 13,
      scrollWheelZoom: false,
      zoomControl: mode === "exact",
      dragging: mode === "exact",
      doubleClickZoom: mode === "exact",
      touchZoom: mode === "exact",
      boxZoom: false,
      keyboard: false,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    if (mode === "exact") {
      L.marker([lat, lng], { icon: pin }).addTo(map);
    } else {
      L.circle([lat, lng], {
        radius: 1400,
        color: "#0f766e",
        weight: 2,
        fillColor: "#0f766e",
        fillOpacity: 0.15,
      }).addTo(map);
    }
    return () => {
      map.remove();
    };
  }, [lat, lng, mode]);

  return <div ref={el} className="h-64 w-full overflow-hidden rounded-xl sm:h-72" />;
}
