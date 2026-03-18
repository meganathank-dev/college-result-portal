import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#243447]">
      <header className="border-b border-[#E6ECF2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/college-logo.png"
              alt="College Logo"
              className="h-14 w-14 rounded-2xl border border-[#E6ECF2] bg-white object-contain p-1 shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold text-[#243447] sm:text-xl">
                The Kavery Engineering College (Autonomous), Mecheri
              </h1>
              <p className="text-sm text-[#6B7A8C]">Result Publishing Portal</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              to="/results"
              className="rounded-xl border border-[#D7E2F0] bg-white px-4 py-2.5 text-sm font-medium text-[#4A6A94] transition hover:bg-[#F8FAFC]"
            >
              Student Portal
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-[#7C9CCF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5F7FAF]"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,156,207,0.18),_transparent_40%)]" />
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 flex justify-center">
                <img
                  src="/college-logo.png"
                  alt="College Logo"
                  className="h-24 w-24 rounded-3xl border border-[#E6ECF2] bg-white object-contain p-2 shadow-[0_10px_30px_rgba(95,127,175,0.12)]"
                />
              </div>

              <h2 className="text-3xl font-bold leading-tight text-[#243447] sm:text-4xl lg:text-5xl">
                Official Result Portal for Students and Administration
              </h2>

              <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[#6B7A8C] sm:text-lg">
                Access published semester results, review result history, and manage
                the complete academic result workflow through one centralized portal.
              </p>

            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[#E6ECF2] bg-white p-8 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
              <div className="mb-5 inline-flex rounded-2xl bg-[#EEF4FB] px-4 py-2 text-sm font-semibold text-[#4A6A94]">
                Student Portal
              </div>

              <h3 className="text-2xl font-bold text-[#243447]">
                Search Published Results
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#6B7A8C]">
                Students can view the latest published result, access semester-wise
                result history, and download the official grade sheet where available.
              </p>

              <div className="mt-6 space-y-3 text-sm text-[#5F6F82]">
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                  Search using <span className="font-semibold text-[#243447]">Register Number</span> and
                  <span className="font-semibold text-[#243447]"> Date of Birth</span>.
                </div>
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                  View only <span className="font-semibold text-[#243447]">published results</span>.
                </div>
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-3">
                  Access semester result history and summary details.
                </div>
              </div>

              <Link
                to="/results"
                className="mt-7 inline-flex rounded-2xl bg-[#7C9CCF] px-5 py-3 font-medium text-white transition hover:bg-[#5F7FAF]"
              >
                Go to Result Search
              </Link>
            </div>

            <div className="rounded-[28px] border border-[#E6ECF2] bg-white p-8 shadow-[0_10px_30px_rgba(95,127,175,0.08)]">
              <div className="mb-5 inline-flex rounded-2xl bg-[#EEF4FB] px-4 py-2 text-sm font-semibold text-[#4A6A94]">
                Admin Portal
              </div>

              <h3 className="text-2xl font-bold text-[#243447]">
                Manage the Result Workflow
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#6B7A8C]">
                Admin users can manage academic setup, student records, exam
                registrations, mark entry, result processing, and result publication.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-4 text-sm text-[#5F6F82]">
                  Students & Bulk Import
                </div>
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-4 text-sm text-[#5F6F82]">
                  Exam Sessions & Registrations
                </div>
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-4 text-sm text-[#5F6F82]">
                  Mark Entry & Verification
                </div>
                <div className="rounded-2xl bg-[#F7FAFD] px-4 py-4 text-sm text-[#5F6F82]">
                  Result Processing & Publish
                </div>
              </div>

              <Link
                to="/login"
                className="mt-7 inline-flex rounded-2xl border border-[#D7E2F0] bg-white px-5 py-3 font-medium text-[#4A6A94] transition hover:bg-[#F8FAFC]"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E6ECF2] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[#6B7A8C] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} The Kavery Engineering College (Autonomous), Mecheri.</p>
          <p>Official Result Publishing Portal</p>
        </div>
      </footer>
    </div>
  );
}