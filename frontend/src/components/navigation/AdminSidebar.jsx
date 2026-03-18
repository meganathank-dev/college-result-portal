import { NavLink } from "react-router-dom";

const sections = [
  {
    title: "Dashboard",
    items: [{ label: "Overview", to: "/admin/dashboard" }]
  },
  {
    title: "Academic Setup",
    items: [
      { label: "Departments", to: "/admin/academic/departments" },
      { label: "Programs", to: "/admin/academic/programs" },
      { label: "Regulations", to: "/admin/academic/regulations" },
      { label: "Batches", to: "/admin/academic/batches" },
      { label: "Semesters", to: "/admin/academic/semesters" },
      { label: "Subjects", to: "/admin/academic/subjects" },
      { label: "Grading Policies", to: "/admin/academic/grading-policies" },
      { label: "Curriculum Mappings", to: "/admin/academic/curriculum-mappings" }
    ]
  },
  {
    title: "Student Management",
    items: [
      { label: "Students", to: "/admin/students", end: true },
      { label: "Bulk Import", to: "/admin/students/import" }
    ]
  },
  {
  title: "Examination Workflow",
  items: [
    { label: "Exam Sessions", to: "/admin/exams/sessions" },
    { label: "Exam Registrations", to: "/admin/exams/registrations" },
    { label: "Registration Verification", to: "/admin/exams/registration-pdf" },
    { label: "Mark Import", to: "/admin/exams/marks/import", end: true },
    { label: "Mark Entries", to: "/admin/exams/marks", end: true }
  ]
},
  {
    title: "Result Workflow",
    items: [
      { label: "Results Processing", to: "/admin/results/processing" },
      { label: "Publish Workflow", to: "/admin/results/publish" }
    ]
  }
];

export default function AdminSidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-[#E6ECF2] bg-[#F3F7FC]">
      <div className="shrink-0 p-5">
        <div className="rounded-3xl border border-[#DCE7F7] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <img
              src="/college-logo.png"
              alt="College Logo"
              className="h-12 w-12 rounded-xl object-contain bg-white"
            />
            <div>
              <h2 className="text-base font-bold text-[#243447]">
                TKEC Result Portal
              </h2>
              <p className="mt-1 text-sm text-[#6B7A8C]">Admin Panel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[#6B7A8C]">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `block rounded-xl px-3 py-2.5 text-sm transition ${
                        isActive
                          ? "bg-[#DCE7F7] text-[#3E5F8A] shadow-sm font-semibold"
                          : "text-[#334155] hover:bg-white"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}