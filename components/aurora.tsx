/** Fixed, blurred colour blobs behind everything - gives the glass panels something to refract. */
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#e9eff7]">
      <div className="absolute -left-48 -top-48 h-[38rem] w-[38rem] rounded-full bg-brand/45 blur-[110px]" />
      <div className="absolute -right-40 top-[18%] h-[34rem] w-[34rem] rounded-full bg-accent/40 blur-[110px]" />
      <div className="absolute -bottom-52 left-[20%] h-[36rem] w-[36rem] rounded-full bg-sky-400/35 blur-[110px]" />
      <div className="absolute bottom-[10%] right-[8%] h-[22rem] w-[22rem] rounded-full bg-fuchsia-300/30 blur-[100px]" />
      {/* faint grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black, transparent 75%)",
        }}
      />
    </div>
  );
}
