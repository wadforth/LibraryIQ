import type { ReactNode } from "react";

export function SettingRow({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 800,
            color: "rgba(245,248,252,0.96)",
            letterSpacing: "0.1px"
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "rgba(218,228,240,0.68)"
          }}
        >
          {description}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          minWidth: 0
        }}
      >
        {children}
      </div>
    </div>
  );
}