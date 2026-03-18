export default function SectionCard({ title, subtitle, action, children }) {
  return (
    <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
      {(title || subtitle || action) ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? (
              <h3 className="text-lg font-semibold text-[#243447]">{title}</h3>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-[#6B7A8C]">{subtitle}</p>
            ) : null}
          </div>

          {action ? <div>{action}</div> : null}
        </div>
      ) : null}

      {children}
    </div>
  );
}