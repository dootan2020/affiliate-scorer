import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E87B35",
          borderRadius: "8px",
          color: "white",
          fontWeight: 800,
          letterSpacing: "-0.5px",
        }}
      >
        P
      </div>
    ),
    { ...size }
  );
}
