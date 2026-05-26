import { ImageResponse } from "next/og";

import { brand } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at 20% 0%, rgba(37,99,235,0.3), transparent 38%), radial-gradient(circle at 80% 20%, rgba(124,58,237,0.28), transparent 35%), #F6F8FC",
          color: "#0F172A",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700 }}>{brand.name}</div>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08 }}>{brand.tagline}</div>
            <div style={{ marginTop: 16, fontSize: 28, color: "#334155", maxWidth: 760 }}>{brand.description}</div>
          </div>
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 48,
              background: "linear-gradient(135deg, #2563EB, #7C3AED, #0891B2)",
              boxShadow: "0 24px 50px rgba(59,130,246,0.35)",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
