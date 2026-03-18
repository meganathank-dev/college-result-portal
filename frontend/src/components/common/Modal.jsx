export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40">
      <div className="h-full w-full overflow-y-auto">
        <div className="flex min-h-full items-start justify-center px-3 py-4 sm:px-4 sm:py-6 lg:py-8">
          <div className="my-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[#E6ECF2] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EEF2F6] bg-white px-5 py-4 sm:px-7 sm:py-5">
              <h2 className="pr-4 text-xl font-semibold text-[#243447] sm:text-2xl">
                {title}
              </h2>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E6ECF2] bg-white text-[#4A6A94] transition hover:bg-[#F8FAFC]"
                aria-label="Close modal"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-5 py-5 sm:max-h-[calc(100vh-8rem)] sm:px-7 sm:py-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}