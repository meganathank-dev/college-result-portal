import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import { setAuthData } from "../../store/authStore";
import { api } from "../../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", form);
      const data = response.data?.data;

      setAuthData({
        accessToken: data.accessToken,
        user: data.user
      });

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid overflow-hidden rounded-[32px] border border-[#E6ECF2] bg-white shadow-[0_20px_60px_rgba(95,127,175,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-[linear-gradient(135deg,#EEF4FB_0%,#F7FAFD_100%)] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <img
                  src="/college-logo.png"
                  alt="College Logo"
                  className="h-16 w-16 rounded-2xl border border-[#DCE7F7] bg-white object-contain p-1"
                />
                <div>
                  <h1 className="text-xl font-bold text-[#243447]">
                    The Kavery Engineering College
                  </h1>
                  <p className="text-sm text-[#6B7A8C]">
                    College Result Portal
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <p className="inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[#4A6A94] shadow-sm">
                  Admin Access
                </p>

                <h2 className="mt-5 text-4xl font-bold leading-tight text-[#243447]">
                  Secure access for academic and examination administration
                </h2>

                <p className="mt-5 max-w-md text-sm leading-7 text-[#6B7A8C]">
                  Manage academic setup, student records, exam workflows, mark
                  entries, result processing, and publication through the admin portal.
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 p-5 text-sm text-[#5F6F82] shadow-sm backdrop-blur">
              Use your authorized admin credentials to continue.
            </div>
          </div>

          <div className="p-8 sm:p-10 lg:p-12">
            <div className="mb-8">
              <Link
                to="/"
                className="inline-flex rounded-xl border border-[#D7E2F0] bg-white px-4 py-2 text-sm font-medium text-[#4A6A94] transition hover:bg-[#F8FAFC]"
              >
                Back to Home
              </Link>
            </div>

            <div className="mx-auto max-w-md">
              <div className="text-center">
                <div className="mb-4 flex justify-center lg:hidden">
                  <img
                    src="/college-logo.png"
                    alt="College Logo"
                    className="h-16 w-16 rounded-2xl border border-[#E6ECF2] bg-white object-contain p-1"
                  />
                </div>

                <h1 className="text-3xl font-bold text-[#243447]">Admin Login</h1>
                <p className="mt-2 text-sm text-[#6B7A8C]">
                  Sign in to access the College Result Portal dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#243447]">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your admin email"
                    className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none transition placeholder:text-[#A3AFBF] focus:border-[#7C9CCF] focus:ring-4 focus:ring-[#7C9CCF]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#243447]">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none transition placeholder:text-[#A3AFBF] focus:border-[#7C9CCF] focus:ring-4 focus:ring-[#7C9CCF]/10"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#7C9CCF] px-4 py-3.5 font-medium text-white transition hover:bg-[#5F7FAF] disabled:opacity-70"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="mt-8 border-t border-[#EEF2F6] pt-5 text-center text-sm text-[#6B7A8C]">
                Authorized users only. All access activities may be monitored.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}