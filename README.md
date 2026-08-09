# College Result Portal

A full-stack web application for managing and publishing semester examination results for The Kavery Engineering College (Autonomous), Mecheri.

## Overview

The College Result Portal is designed to digitize and simplify the complete semester examination result management workflow.

The system provides separate functionality for administrators and students. Administrators can manage academic data, students, examinations, marks, result processing, and result publication. Students can search and view their published semester results through the public result portal.

## Key Features

### Admin Portal

* Secure administrator login
* Role-based access control
* Dashboard with system statistics
* Department management
* Program management
* Regulation management
* Batch management
* Semester management
* Subject management
* Grading policy management
* Curriculum mapping
* Student management
* Bulk student import using Excel
* Exam session management
* Regular examination management
* Revaluation examination management
* Exam registration management
* Current semester student auto-registration
* Arrear candidate registration
* Internal and external mark entry
* Bulk mark import using Excel
* Mark verification workflow
* Mark locking workflow
* Result processing
* GPA calculation
* CGPA calculation
* Arrear tracking
* Result publication workflow
* Versioned result publishing snapshots
* Exam registration PDF export
* Result data management

### Student Result Portal

* No student login required
* Register number and date of birth based result search
* Published semester result viewing
* Subject-wise grade display
* GPA display
* CGPA display
* Credit information
* Arrear information
* Previous semester result history
* Grade sheet PDF download

## Technology Stack

### Frontend

* React
* Vite
* Tailwind CSS
* React Router DOM
* Axios
* XLSX
* JavaScript

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Token
* bcryptjs
* Zod
* Multer
* XLSX
* PDFKit
* Helmet
* CORS
* Express Rate Limit
* Morgan
* Dotenv

### Database

MongoDB is used as the primary database with Mongoose as the ODM.

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB

## System Architecture

```text
                    ┌─────────────────────────┐
                    │        User Browser     │
                    │                         │
                    │   React + Vite +        │
                    │   Tailwind CSS          │
                    └────────────┬────────────┘
                                 │
                                 │ HTTP / REST API
                                 ▼
                    ┌─────────────────────────┐
                    │      Express.js API     │
                    │                         │
                    │ Authentication          │
                    │ Authorization           │
                    │ Validation              │
                    │ Business Logic          │
                    │ Result Processing       │
                    └────────────┬────────────┘
                                 │
                                 │ Mongoose
                                 ▼
                    ┌─────────────────────────┐
                    │        MongoDB          │
                    │                         │
                    │ Students                │
                    │ Subjects                │
                    │ Exams                   │
                    │ Marks                   │
                    │ Results                 │
                    │ Users                   │
                    └─────────────────────────┘
```

## User Roles

The system supports multiple administrative roles with different permissions.

### SUPER_ADMIN

Full system access including:

* Academic configuration
* Student management
* Exam management
* Mark management
* Result processing
* Result publication
* System administration

### EXAM_CELL_ADMIN

Responsible for examination and result operations including:

* Exam session management
* Student examination registration
* Mark management
* Result processing
* Result publication

### DEPARTMENT_ADMIN

Responsible for department-level academic operations including:

* Student management
* Examination registration
* Mark-related operations

### DATA_ENTRY_OPERATOR

Responsible mainly for entering examination marks.

### VERIFIER

Responsible for:

* Reviewing marks
* Verifying marks
* Locking verified marks
* Processing results

## Result Processing Workflow

```text
Academic Setup
      │
      ▼
Student Management
      │
      ▼
Exam Session Creation
      │
      ▼
Exam Registration
      │
      ▼
Mark Entry
      │
      ▼
Mark Verification
      │
      ▼
Mark Locking
      │
      ▼
Result Processing
      │
      ▼
GPA / CGPA Calculation
      │
      ▼
Result Approval
      │
      ▼
Result Publication
      │
      ▼
Student Result Portal
```

## Academic Setup

Before conducting an examination, the administrator can configure the academic structure.

The system supports:

1. Departments
2. Programs
3. Regulations
4. Batches
5. Semesters
6. Subjects
7. Grading Policies
8. Curriculum Mappings

This structure allows students, subjects, examinations, and results to be associated with the correct academic configuration.

## Student Management

The administrator can:

* Add individual students
* Update student information
* Manage student academic status
* Import multiple students using Excel
* Download an Excel import template
* Associate students with departments
* Associate students with programs
* Associate students with regulations
* Associate students with batches
* Associate students with semesters

Supported academic statuses include:

* ACTIVE
* GRADUATED
* DISCONTINUED

## Examination Management

The system supports different examination workflows.

### Regular Examination

Used for students appearing for their current semester examinations.

### Arrear Examination

Used for students appearing for subjects that they have not previously cleared.

### Revaluation Examination

Used for managing results associated with revaluation processes.

## Exam Registration

Students can be registered for subjects through the examination registration system.

The system supports:

* Current semester registration
* Arrear registration
* Automatic current semester registration
* Individual registration
* Eligibility management
* Registration data export

## Mark Management

The mark management module supports:

* Internal marks
* External marks
* Total marks
* Absent status
* Withheld status
* Malpractice status
* Excel mark import
* Bulk mark entry
* Mark verification
* Mark locking

### Mark Status Workflow

```text
DRAFT
  │
  ▼
VERIFIED
  │
  ▼
LOCKED
```

Locked marks are used for the result processing stage.

## Result Processing

The result processing module automatically processes examination marks based on the configured grading policy.

The system can:

* Determine pass or fail status
* Assign letter grades
* Assign grade points
* Calculate earned credits
* Calculate GPA
* Calculate CGPA
* Track arrears
* Generate semester summaries

The system also considers special examination conditions such as:

* Absent
* Withheld
* Malpractice

## Grading System

The grading policy is configurable according to the academic regulation.

A typical 10-point grading system can be configured with:

| Grade | Grade Point |
| ----- | ----------- |
| O     | 10          |
| A+    | 9           |
| A     | 8           |
| B+    | 7           |
| B     | 6           |
| C     | 5           |
| U     | 0           |

The actual grade ranges are controlled through the grading policy configuration in the system.

## GPA and CGPA

The system calculates GPA and CGPA based on the configured grading policies, subject credits, and obtained grade points.

The system maintains semester-level summaries containing information such as:

* GPA
* CGPA
* Total credits
* Earned credits
* Arrear count

## Result Publication

Results are not immediately exposed to students after processing.

The system provides a controlled publication workflow.

```text
Result Processing
       │
       ▼
Result Verification
       │
       ▼
Result Approval
       │
       ▼
Result Publication
       │
       ▼
Public Result Portal
```

Published results are marked as published and can then be accessed through the student result portal.

The system also maintains publish snapshots to track different publication versions.

## Student Result Portal

Students can access the result portal without creating an account.

The student provides:

* Register Number
* Date of Birth

The system validates the submitted information and returns only published results.

Students can view:

* Examination session
* Subject-wise grades
* Credits
* GPA
* CGPA
* Arrear information
* Previous semester results

Students can also download their grade sheet as a PDF.

## Authentication and Authorization

The administrator portal uses JWT-based authentication.

The authentication workflow is:

```text
Admin Login
    │
    ▼
Credential Validation
    │
    ▼
JWT Access Token
    │
    ▼
Authenticated API Requests
    │
    ▼
Role Verification
    │
    ▼
Authorized Operation
```

Passwords are securely hashed using bcryptjs.

Role-based middleware controls access to protected administrative operations.

## Security Features

The application includes several security mechanisms:

* JWT authentication
* Password hashing using bcryptjs
* Role-based access control
* Request validation using Zod
* Helmet security headers
* CORS configuration
* API rate limiting
* Environment variable based configuration
* Protected administrative routes
* Published-result filtering
* Centralized error handling

## Project Structure

```text
SRMS_Project/
│
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   │
│   │   ├── config/
│   │   │   ├── constants.js
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── notFound.middleware.js
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── departments/
│   │   │   ├── programs/
│   │   │   ├── regulations/
│   │   │   ├── batches/
│   │   │   ├── semesters/
│   │   │   ├── subjects/
│   │   │   ├── grading-policies/
│   │   │   ├── curriculum/
│   │   │   ├── students/
│   │   │   ├── exam-sessions/
│   │   │   ├── exam-registrations/
│   │   │   ├── mark-entries/
│   │   │   ├── results/
│   │   │   ├── publish/
│   │   │   ├── public-results/
│   │   │   └── dashboard/
│   │   │
│   │   ├── routes/
│   │   │   └── index.js
│   │   │
│   │   ├── seeds/
│   │   │   ├── seedAdmin.js
│   │   │   ├── resetBatches.js
│   │   │   ├── resetRegulations.js
│   │   │   └── resetSubjects.js
│   │   │
│   │   └── utils/
│   │       ├── apiError.js
│   │       ├── apiResponse.js
│   │       └── asyncHandler.js
│   │
│   ├── uploads/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   │   ├── App.jsx
│   │   │   └── router.jsx
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── navigation/
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   └── PublicLayout.jsx
│   │   ├── lib/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── public-results/
│   │   ├── store/
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   │   └── college-logo.png
│   │
│   ├── vercel.json
│   └── package.json
│
├── atlas-import/
│   ├── admins.json
│   └── users.json
│
└── .gitignore
```

## Database Models

The application uses MongoDB collections for managing different parts of the academic and examination workflow.

| Model             | Purpose                           |
| ----------------- | --------------------------------- |
| User              | Administrator accounts and roles  |
| Department        | College departments               |
| Program           | Academic programs                 |
| Regulation        | Academic regulations              |
| Batch             | Student batches                   |
| Semester          | Semester information              |
| Subject           | Subject information               |
| GradingPolicy     | Grade and mark rules              |
| CurriculumMapping | Subject curriculum mapping        |
| Student           | Student information               |
| ExamSession       | Examination sessions              |
| ExamRegistration  | Student examination registrations |
| MarkEntry         | Examination marks                 |
| ProcessedResult   | Processed subject results         |
| SemesterSummary   | GPA, CGPA and semester summary    |
| PublishSnapshot   | Result publication versions       |

## API Structure

The backend provides REST APIs for:

* Authentication
* Dashboard
* Departments
* Programs
* Regulations
* Batches
* Semesters
* Subjects
* Grading Policies
* Curriculum Mapping
* Students
* Exam Sessions
* Exam Registrations
* Mark Entries
* Result Processing
* Result Publication
* Public Results

All backend API routes are grouped under the `/api` prefix.

## Installation

### Prerequisites

Install the following before running the project:

* Node.js 18 or later
* npm
* MongoDB

### Clone the Repository

```bash
git clone <repository-url>
cd SRMS_Project
```

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure the required environment variables.

### Frontend Setup

```bash
cd ../frontend
npm install
```

Create a frontend environment file if required.

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

### Start MongoDB

Make sure MongoDB is running locally or configure a MongoDB Atlas connection string.

### Create Admin Account

Run the admin seed command from the backend directory.

```bash
npm run seed:admin
```

The application contains one initial administrator account.

For security reasons, administrator credentials should not be stored in the public repository README.

### Start Backend

```bash
cd backend
npm run dev
```

The backend runs on the configured server port.

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend runs using the Vite development server.

## Environment Variables

### Backend

```text
PORT=
NODE_ENV=
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=
FRONTEND_URL=
```

### Frontend

```text
VITE_API_BASE_URL=
```

Never commit `.env` files or production secrets to GitHub.

## Deployment

The application is deployed using:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB

## Live Demo

[College Result Portal](https://college-result-portal-bay.vercel.app/)

## Screenshots

### Landing Home Page

![Landing Home Page](docs/screenshots/Landing%20Home%20Page.jpeg)

### Admin Login

![Admin Login](docs/screenshots/Admin%20Login.jpeg)

### Admin Dashboard

![Admin Dashboard](docs/screenshots/Admin%20Dashboard.jpeg)

### Student Management

![Student Management](docs/screenshots/Student%20Management.jpeg)

### Mark Entry

![Mark Entry](docs/screenshots/Mark%20Entry.jpeg)

### Result Processing

![Result Processing](docs/screenshots/Result%20Processing.jpeg)

### Student Result Search

![Student Result Search](docs/screenshots/Student%20Result%20Search.jpeg)

### Student Result View

![Student Result View](docs/screenshots/Student%20Result%20View.jpeg)

## Testing

The application should be manually tested across the complete result publishing workflow.

Recommended testing flow:

1. Login as administrator
2. Configure academic data
3. Add students
4. Create an examination session
5. Register students
6. Enter examination marks
7. Verify marks
8. Lock marks
9. Process results
10. Verify GPA and CGPA
11. Publish results
12. Search for the result through the public portal
13. Download the grade sheet PDF

## Current Limitations

* Automated unit testing is not currently implemented.
* Automated end-to-end testing is not currently implemented.
* The system currently uses a single administrator account.
* Student authentication is not implemented because the public result portal uses register number and date of birth verification.
* Refresh token renewal functionality may require further enhancement.
* Additional production-level monitoring and logging can be added in future versions.

## Future Enhancements

Possible future improvements include:

* Student authentication
* Multiple administrator account management
* Email notifications for result publication
* SMS notifications
* Advanced analytics dashboard
* Result comparison and performance analytics
* Automated testing
* Audit log management
* Advanced search and filtering
* Pagination for large datasets
* Improved security using HTTP-only cookies
* Mobile application
* Online revaluation request management
* Result notification system

## Academic Use

This project was developed as a full-stack software project to demonstrate the practical implementation of:

* Full-stack web development
* REST API development
* Database design
* Authentication
* Authorization
* Role-based access control
* Academic data management
* Examination management
* Result processing
* GPA and CGPA calculation
* Excel data processing
* PDF generation
* Cloud deployment

## Author

Meganathan K

Computer Science and Engineering

The Kavery Engineering College (Autonomous), Mecheri, Salem

## License

This project is intended for academic and educational purposes.
