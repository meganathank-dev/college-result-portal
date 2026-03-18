import { Link } from "react-router-dom";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-[#E6ECF2] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/college-logo.png"
              alt="College Logo"
              className="h-14 w-14 rounded-xl object-contain bg-white"
            />

            <div>
              <h1 className="text-xl font-bold text-[#243447] sm:text-2xl">
                The Kavery Engineering College (Autonomous), Mecheri
              </h1>
              <p className="mt-1 text-sm text-[#6B7A8C]">Student Result Portal</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/"
              className="rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-sm font-medium text-[#4A6A94]"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-[#7C9CCF] px-4 py-2 text-sm font-medium text-white hover:bg-[#5F7FAF]"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}