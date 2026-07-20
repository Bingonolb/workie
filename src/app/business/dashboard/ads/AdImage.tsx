"use client";

import Image from "next/image";

export function AdImage({ src }: { src: string }) {
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="90px"
      style={{ objectFit: "cover" }}
    />
  );
}
