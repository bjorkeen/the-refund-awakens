
# Electronics R&R - Service Management System

A full-stack web application for managing electronic repair and return requests. Designed to streamline communication between Customers, Technicians, and Employees.

## 🏗️ System Architecture

This diagram illustrates the high-level architecture of the application, deployed via Docker Containers.

# System Architecture Diagram

```mermaid
graph TB
    User[End User]
    
    subgraph Frontend[Frontend Service]
        NginxServer[Nginx Server]
        ReactSPA[React SPA]
    end

    subgraph Backend[Backend Service]
        subgraph API[API Service]
            EntryPoint[Application Entry Point<br/>backend/index.js]
            Router[API Router<br/>backend/routes]
            Controllers[Controllers<br/>backend/controllers]
            Services[Services<br/>backend/services]
            Models[Data Access Layer<br/>backend/models]
        end
    end

    subgraph Database[MongoDB Database]
        MongoServer[MongoDB Server]
        DataStore[Data Storage]
    end

    User -->|Uses| NginxServer
    NginxServer -->|Serves| ReactSPA
    NginxServer -->|Makes API requests to| Router
    EntryPoint -->|Sets up| Router
    Router -->|Routes requests to| Controllers
    Controllers -->|Calls| Services
    Services -->|Uses| Models
    Models -->|Performs CRUD operations on| MongoServer
    MongoServer -->|Reads from and writes to| DataStore

    style Frontend fill:#dae8fc,stroke:#6c8ebf
    style Backend fill:#dae8fc,stroke:#6c8ebf
    style API fill:#dae8fc,stroke:#6c8ebf
    style Database fill:#dae8fc,stroke:#6c8ebf
```



## 🚀 Key Features

    Role-Based Access Control: Distinct dashboards for Customers, Technicians, Employees, and Admins.

    Ticket Lifecycle Management: Full workflow from "Submitted" to "Completed" with status tracking.

    Placement Algorithm: Smart resource allocation logic (Simulation).

    Attachments & Media: Support for photo uploads and invoice handling.

    Reporting: Automated generation of service reports.

## 📸 Screenshots



| Landing page | Customer Dashboard |
|:------------------:|:--------------------:|
| ![Landing page](./screenshots/landing_page.png) | ![Customer Dashboard](./screenshots/customer_dashboard.png) |

| Create Ticket Form | Ticket details |
|:------------------:|:--------------------:|
| ![Create Ticket Form](./screenshots/create_ticket_form.png) | ![Ticket details](./screenshots/ticket-details_page.png) |

| Staff Dashboard | Technician Dashboard |
|:------------------:|:--------------------:|
| ![Staff Dashboard](./screenshots/staff_dashboard.png) | ![Technician Dashboard](./screenshots/tech_dashboard.png) |

| Admin Reports | Admin Panel |
|:---------------:|:-----------:|
| ![Admin Reports](./screenshots/admin_reports.png) | ![Admin Panel](./screenshots/admin_panel.png) |



## 🛠️ Tech Stack

    Frontend: React.js, Vite, Axios, CSS Modules.

    Backend: Node.js, Express.js.

    Database: MongoDB (Mongoose ODM).

    DevOps: Docker, Docker Compose, Nginx.

    Tools: Git, GitHub Actions (CI/CD).

## 🏁 Getting Started

### Prerequisites

    Docker & Docker Compose installed.

### Installation & Run

1. Clone the repository:

```bash
    git clone [https://github.com/bjorkeen/the-refund-awakens.git](https://github.com/bjorkeen/the-refund-awakens.git)
cd the-refund-awakens
```

2. Download the two files (make sure that the name of the files are exactly the same as in the drive): 
* .env file to be added to the backend folder https://drive.google.com/file/d/1VpgRY32E7AduaYKf0RNnhR1sEgwMawAj/view?usp=drive_link 
* .env file to be added just to the project folder https://drive.google.com/file/d/1ODlLpcDRSqzchQ2pjAfRI7SPCekK0OaA/view?usp=sharing 


3. Start the application (Production Mode):

```bash
docker compose up --build
```

4. Access the app:

    Frontend: http://localhost:3000

    Backend API: http://localhost:5050

---

## 🔑 Demo Accounts

You can **Sign Up** to create a new Customer user.

* Password must contain at least 8 characters, 1 number, and 1 symbol (e.g. `Demo123!`).

Alternatively you can use one of the following demo accounts to navigate throught the different views each role has:

1. Customer 
    - Email : customer@demo.com
    - Password : demo123!

2. Employee
    - Email : staff@demo.com
    - Password : demo123!

3. Technician (Repair Center's employee)
    - Emails : 
        mobile@demo.com
        mobile2@demo.com
        tv@demo.com
        laptop@demo.com
        other@demo.com
    - Password : demo123!

5. Manager
    - Email : manager@demo.com
    - Password : demo123!

---

## Folder Structure

```
/
├── backend/                 # API code
│   ├── controllers/         # Business logic (e.g. Ticket creation, Auth)
│   ├── models/              # Mongoose Schemas (User, Ticket)
│   ├── routes/              # API Endpoints definition
│   └── services/            # Business logic services
│
├── frontend/                # React App code
│   └── src/
│       ├── components/      # Reusable UI (AuthForm, Header, etc.)
│       ├── context/         # Global State (AccessContext)
│       ├── pages/           # Pages (CreateTicket, MyTickets)
│       └── services/        # Axios calls to the Backend
│
└── docker-compose.yml       # Container configurations
```


---
