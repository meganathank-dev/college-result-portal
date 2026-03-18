export default function MobileAdminTopbar({ onMenuOpen }) {
  return (
    <div className="flex items-center justify-between border-b border-[#E6ECF2] bg-white px-4 py-3 lg:hidden">
      <button
        onClick={onMenuOpen}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#E6ECF2] bg-white text-[#5F7FAF]"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="text-right">
        <h2 className="text-sm font-bold text-[#243447]">Admin Panel</h2>
        <p className="text-xs text-[#6B7A8C]">College Result Portal</p>
      </div>
    </div>
  );
}