export default function AnnounceBanner() {
  return (
    <div className="w-full bg-[#18181B] border-b border-white/5 py-2 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <p className="text-center text-[10px] text-white/80" style={{ letterSpacing: '1px' }}>
          GET ACCESS TO OUR EMBED YEARLY LICENSE FOR 50% OFF FOR BETA RELEASE USING CODE:{" "}
          <span className="font-semibold text-white">DRAWTIR50</span>
        </p>
      </div>
    </div>
  );
}
