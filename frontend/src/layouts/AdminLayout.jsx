import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "../components/navigation/AdminSidebar";
import MobileAdminTopbar from "../components/navigation/MobileAdminTopbar";
import { clearAuthData, getStoredUser } from "../store/authStore";

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">
        <AdminSidebar />
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden">
          <div className="h-full w-72 bg-white shadow-xl">
            <AdminSidebar />
          </div>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute right-4 top-4 rounded-xl bg-white px-3 py-2 text-sm font-medium text-[#4A6A94] shadow"
          >
            Close
          </button>
        </div>
      ) : null}

      <div className="h-screen overflow-hidden lg:ml-72">
        <MobileAdminTopbar onMenuOpen={() => setMobileMenuOpen(true)} />

        <header className="hidden border-b border-[#E6ECF2] bg-white px-6 py-4 lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/college-logo.png"
              alt="College Logo"
              className="h-12 w-12 rounded-xl object-contain bg-white"
            />
            <div>
              <p className="text-sm text-[#6B7A8C]">Welcome</p>
              <h2 className="font-semibold text-[#243447]">
                {user?.fullName || "Admin User"}
              </h2>
              <p className="text-xs text-[#6B7A8C]">{user?.role || ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="rounded-xl border border-[#E6ECF2] bg-white px-4 py-2 text-sm font-medium text-[#4A6A94]"
            >
              Home
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-[#7C9CCF] px-4 py-2 text-sm font-medium text-white hover:bg-[#5F7FAF]"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="h-[calc(100vh-61px)] overflow-y-auto p-4 sm:p-6 lg:h-[calc(100vh-81px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}