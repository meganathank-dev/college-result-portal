import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../layouts/AdminLayout";

import DashboardPage from "../pages/admin/DashboardPage";
import DepartmentsPage from "../pages/admin/DepartmentsPage";
import ProgramsPage from "../pages/admin/ProgramsPage";
import RegulationsPage from "../pages/admin/RegulationsPage";
import BatchesPage from "../pages/admin/BatchesPage";
import SemestersPage from "../pages/admin/SemestersPage";
import SubjectsPage from "../pages/admin/SubjectsPage";
import GradingPoliciesPage from "../pages/admin/GradingPoliciesPage";
import CurriculumMappingsPage from "../pages/admin/CurriculumMappingsPage";
import StudentsPage from "../pages/admin/StudentsPage";
import StudentImportPage from "../pages/admin/StudentImportPage";
import ExamSessionsPage from "../pages/admin/ExamSessionsPage";
import ExamRegistrationsPage from "../pages/admin/ExamRegistrationsPage";
import RegistrationPdfExportPage from "../pages/admin/RegistrationPdfExportPage";
import MarkImportPage from "../pages/admin/MarkImportPage";
import MarkEntriesPage from "../pages/admin/MarkEntriesPage";
import ResultsProcessingPage from "../pages/admin/ResultsProcessingPage";
import PublishWorkflowPage from "../pages/admin/PublishWorkflowPage";

import ResultSearchPage from "../pages/public-results/ResultSearchPage";
import ResultViewPage from "../pages/public-results/ResultViewPage";
import ResultHistoryPage from "../pages/public-results/ResultHistoryPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/results",
    element: <ResultSearchPage />
  },
  {
    path: "/results/view",
    element: <ResultViewPage />
  },
  {
    path: "/results/history",
    element: <ResultHistoryPage />
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <DashboardPage /> },

      { path: "academic/departments", element: <DepartmentsPage /> },
      { path: "academic/programs", element: <ProgramsPage /> },
      { path: "academic/regulations", element: <RegulationsPage /> },
      { path: "academic/batches", element: <BatchesPage /> },
      { path: "academic/semesters", element: <SemestersPage /> },
      { path: "academic/subjects", element: <SubjectsPage /> },
      { path: "academic/grading-policies", element: <GradingPoliciesPage /> },
      { path: "academic/curriculum-mappings", element: <CurriculumMappingsPage /> },

      { path: "students", element: <StudentsPage /> },
      { path: "students/import", element: <StudentImportPage /> },

      { path: "exams/sessions", element: <ExamSessionsPage /> },
      { path: "exams/registrations", element: <ExamRegistrationsPage /> },
      { path: "exams/registration-pdf", element: <RegistrationPdfExportPage /> },
      { path: "exams/marks/import", element: <MarkImportPage />},
      { path: "exams/marks", element: <MarkEntriesPage /> },

      { path: "results/processing", element: <ResultsProcessingPage /> },
      { path: "results/publish", element: <PublishWorkflowPage /> }
    ]
  }
]);