import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../../layouts/PublicLayout";
import {
  searchPublishedResultApi,
  getPublishedResultHistoryApi
} from "../../api/publicResults.api";

export default function ResultSearchPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    registerNumber: "",
    dob: ""
  });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({
      ...prev,
      [event.target.name]: event.target.value
    }));
    setError("");
    setInfoMessage("");
  };

  const convertDobToIso = () => {
    const dob = form.dob.trim();

    if (!dob) return "";

    const parts = dob.split("-");
    if (parts.length !== 3) return "";

    const [day, month, year] = parts;

    if (!day || !month || !year) return "";
    if (day.length !== 2 || month.length !== 2 || year.length !== 4) return "";

    return `${year}-${month}-${day}T00:00:00.000Z`;
  };

  const validateForm = () => {
    if (!form.registerNumber.trim()) {
      return "Register Number is required";
    }

    if (!form.dob.trim()) {
      return "Date of Birth is required";
    }

    const dobPattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!dobPattern.test(form.dob.trim())) {
      return "Date of Birth must be in dd-mm-yyyy format";
    }

    return "";
  };

  const buildPayload = () => ({
    registerNumber: form.registerNumber.trim().toUpperCase(),
    dob: convertDobToIso()
  });

  const handleSearch = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      setInfoMessage("");
      return;
    }

    try {
      setLoadingSearch(true);
      setError("");
      setInfoMessage("");

      const payload = buildPayload();

      sessionStorage.setItem("last_result_search_payload", JSON.stringify(payload));

      const response = await searchPublishedResultApi(payload);

      sessionStorage.setItem(
        "latest_published_result",
        JSON.stringify(response.data)
      );

      navigate("/results/view");
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to fetch latest result";

      const normalized = message.toLowerCase();

      if (
        normalized.includes("no published result") ||
        normalized.includes("not published") ||
        normalized.includes("no published latest result")
      ) {
        setError("");
        setInfoMessage(
          "No latest published result is available for this register number yet. Please check again later."
        );
      } else {
        setInfoMessage("");
        setError(message);
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleHistory = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      setInfoMessage("");
      return;
    }

    try {
      setLoadingHistory(true);
      setError("");
      setInfoMessage("");

      const payload = buildPayload();

      sessionStorage.setItem("last_result_search_payload", JSON.stringify(payload));

      const response = await getPublishedResultHistoryApi({
        registerNumber: payload.registerNumber,
        dob: payload.dob
      });

      sessionStorage.setItem(
        "published_result_history",
        JSON.stringify(response.data)
      );

      navigate("/results/history");
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to fetch result history";

      const normalized = message.toLowerCase();

      if (
        normalized.includes("no published result") ||
        normalized.includes("not published") ||
        normalized.includes("no result history")
      ) {
        setError("");
        setInfoMessage(
          "No published result history is available for this register number yet."
        );
      } else {
        setInfoMessage("");
        setError(message);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <PublicLayout>
      <div className="space-y-8">
        <section className="rounded-[32px] border border-[#E6ECF2] bg-white p-8 shadow-[0_10px_30px_rgba(95,127,175,0.08)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div>
              <div className="mb-4 inline-flex rounded-2xl bg-[#EEF4FB] px-4 py-2 text-sm font-semibold text-[#4A6A94]">
                Student Result Search
              </div>

              <h2 className="text-3xl font-bold text-[#243447]">
                Search Published Result
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B7A8C]">
                Enter your Register Number and Date of Birth to view the latest
                published result or check your semester-wise published result history.
              </p>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#243447]">
                    Register Number
                  </label>
                  <input
                    type="text"
                    name="registerNumber"
                    value={form.registerNumber}
                    onChange={handleChange}
                    placeholder="Enter Register Number"
                    className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none transition placeholder:text-[#A3AFBF] focus:border-[#7C9CCF] focus:ring-4 focus:ring-[#7C9CCF]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#243447]">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    placeholder="dd-mm-yyyy"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-[#E6ECF2] px-4 py-3 text-[#243447] outline-none transition placeholder:text-[#A3AFBF] focus:border-[#7C9CCF] focus:ring-4 focus:ring-[#7C9CCF]/10"
                  />
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                {infoMessage ? (
                  <div className="rounded-2xl border border-[#DCE7F7] bg-[#F4F8FC] px-4 py-3 text-sm text-[#4A6A94]">
                    {infoMessage}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleSearch}
                    disabled={loadingSearch || loadingHistory}
                    className="rounded-2xl bg-[#7C9CCF] px-4 py-3.5 font-medium text-white transition hover:bg-[#5F7FAF] disabled:opacity-70"
                  >
                    {loadingSearch ? "Searching..." : "View Latest Result"}
                  </button>

                  <button
                    onClick={handleHistory}
                    disabled={loadingSearch || loadingHistory}
                    className="rounded-2xl border border-[#E6ECF2] bg-white px-4 py-3.5 font-medium text-[#4A6A94] transition hover:bg-[#F8FAFC] disabled:opacity-70"
                  >
                    {loadingHistory ? "Loading..." : "View Result History"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#E6ECF2] bg-[#FBFCFE] p-6 shadow-sm">
              <h3 className="text-xl font-bold text-[#243447]">Important Notes</h3>

              <div className="mt-5 space-y-4 text-sm leading-6 text-[#6B7A8C]">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  Only <span className="font-semibold text-[#243447]">published results</span> are available in this portal.
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  Students can view <span className="font-semibold text-[#243447]">grades and result status</span>. Raw marks are not displayed here.
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  Use the exact <span className="font-semibold text-[#243447]">Register Number</span> and
                  <span className="font-semibold text-[#243447]"> Date of Birth</span> as per college records.
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  If the latest result is not published yet, you can try again later or check the published result history.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.06)]">
            <h4 className="text-lg font-semibold text-[#243447]">Fast Search</h4>
            <p className="mt-2 text-sm leading-6 text-[#6B7A8C]">
              Quickly access the latest published result using your academic credentials.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.06)]">
            <h4 className="text-lg font-semibold text-[#243447]">Semester History</h4>
            <p className="mt-2 text-sm leading-6 text-[#6B7A8C]">
              Review previously published semester result history in one place.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E6ECF2] bg-white p-6 shadow-[0_10px_30px_rgba(95,127,175,0.06)]">
            <h4 className="text-lg font-semibold text-[#243447]">Official Access</h4>
            <p className="mt-2 text-sm leading-6 text-[#6B7A8C]">
              This portal displays official college-published academic result information.
            </p>
          </div>
        </section>

        <footer className="rounded-[28px] border border-[#E6ECF2] bg-white px-6 py-5 text-center text-sm text-[#6B7A8C] shadow-sm">
          © {new Date().getFullYear()} The Kavery Engineering College (Autonomous), Mecheri. Student Result Portal.
        </footer>
      </div>
    </PublicLayout>
  );
}