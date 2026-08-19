import type { CSSProperties, ReactNode } from "react";

import { AbsoluteFill } from "remotion";



type PhoneMockupProps = {

  children: ReactNode;

  /** Altura relativa al viewport (0–1). Catálogo: 0.9, overlay: 0.58 ancho. */

  heightRatio?: number;

  widthRatio?: number;

  style?: CSSProperties;

};



/** Marco smartphone grande — catálogo ocupa ~90% altura viewport. */

export function PhoneMockup({

  children,

  heightRatio = 0.9,

  widthRatio,

  style,

}: PhoneMockupProps) {

  const height = `${heightRatio * 100}%`;

  const width = widthRatio ? `${widthRatio * 100}%` : undefined;



  return (

    <AbsoluteFill

      style={{

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        ...style,

      }}

    >

      <div

        style={{

          height,

          width: width ?? "auto",

          aspectRatio: width ? undefined : "9 / 19.5",

          maxWidth: width ? undefined : "94%",

          borderRadius: 44,

          border: "4px solid rgba(255,255,255,0.92)",

          boxShadow: "0 24px 80px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(255,255,255,0.15)",

          overflow: "hidden",

          background: "#0a0a0a",

          position: "relative",

        }}

      >

        {/* Notch decorativo */}

        <div

          style={{

            position: "absolute",

            top: 12,

            left: "50%",

            transform: "translateX(-50%)",

            width: 120,

            height: 28,

            borderRadius: 20,

            background: "rgba(0,0,0,0.65)",

            zIndex: 10,

          }}

        />

        <div

          style={{

            width: "100%",

            height: "100%",

            overflow: "hidden",

            paddingTop: 40,

          }}

        >

          {children}

        </div>

      </div>

    </AbsoluteFill>

  );

}


