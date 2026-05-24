# RentSphere — Property Rental Platform

A full-stack property rental platform connecting **landlords** and **tenants** with a seamless experience for listing, browsing, booking, and managing rental properties.

> **Stack:** Spring Boot · React.js · MySQL · JWT · Docker Compose

---

##  Features

### For Tenants
-  Browse and search available properties with filters (location, price, type)
-  View detailed property listings with images and descriptions
-  Submit rental requests and track their status in real time
-  Manage account profile and rental history

### For Landlords
- Create, update, and manage property listings
- Dashboard to track all rental requests and approvals
- Accept or reject tenant applications
- Manage active and past rental agreements

### System
-  JWT-based authentication and Spring Security RBAC (Tenant / Landlord / Admin roles)
-  One-command Docker Compose deployment for the entire stack
-  Normalized MySQL database schema with referential integrity
-  RESTful API architecture with clean DTO and Mapper separation

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Java 17, Spring Boot, Spring Security, JPA/Hibernate |
| Frontend   | React.js, JavaScript, CSS           |
| Database   | MySQL 8.0                           |
| Auth       | JWT (JSON Web Tokens)               |
| DevOps     | Docker, Docker Compose              |
| Build Tool | Maven                               |

---

##  Architecture

```
RentSphere/
├── Backend/          # Spring Boot REST API
│   ├── src/
│   │   ├── main/java/
│   │   │   ├── controller/   # REST controllers
│   │   │   ├── service/      # Business logic
│   │   │   ├── repository/   # JPA repositories
│   │   │   ├── model/        # JPA entities
│   │   │   ├── dto/          # Data Transfer Objects
│   │   │   └── security/     # JWT & Spring Security config
│   └── Dockerfile
├── Frontend/         # React.js SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/         # API client
│   └── Dockerfile
├── Database/
│   └── Schema.sql            # DB initialization script
└── docker-compose.yml        # Full stack orchestration
```

---

##  Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- Git

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/ixi3boda/RentSphere.git
cd RentSphere

# Start the entire stack (backend + frontend + database)
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8080 |
| Database | localhost:3306        |

### Stop the stack

```bash
docker compose down
```

To also remove persisted data:

```bash
docker compose down -v
```

---

##  Default Credentials (Dev Only)

>  Change all credentials before any production deployment.

| Field    | Value             |
|----------|-------------------|
| DB User  | `rentsphere`      |
| DB Pass  | `rentsphere123`   |
| DB Name  | `RentSphereSchema`|

---

##  API Overview

| Method | Endpoint                        | Description                  | Role Required |
|--------|---------------------------------|------------------------------|---------------|
| POST   | `/api/auth/register`            | Register new user            | Public        |
| POST   | `/api/auth/login`               | Login and receive JWT token  | Public        |
| GET    | `/api/properties`               | List all available properties| Public        |
| POST   | `/api/properties`               | Create a new property listing| Landlord      |
| PUT    | `/api/properties/{id}`          | Update a property listing    | Landlord      |
| DELETE | `/api/properties/{id}`          | Delete a property listing    | Landlord      |
| POST   | `/api/rentals`                  | Submit a rental request      | Tenant        |
| GET    | `/api/rentals/my`               | View my rental requests      | Tenant        |
| PUT    | `/api/rentals/{id}/approve`     | Approve a rental request     | Landlord      |
| PUT    | `/api/rentals/{id}/reject`      | Reject a rental request      | Landlord      |

> All protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`

---

##  Database Schema

Key entities managed by the MySQL schema:

- **Users** — id, name, email, password (hashed), role (TENANT / LANDLORD / ADMIN)
- **Properties** — id, title, description, location, price, status, landlord_id
- **Rental Requests** — id, property_id, tenant_id, status (PENDING / APPROVED / REJECTED), dates
- **Rental Agreements** — id, rental_request_id, start_date, end_date, total_price

---

##  Development Setup (Without Docker)

### Backend

```bash
cd Backend
# Update src/main/resources/application.properties with your local DB URL
mvn spring-boot:run
```

### Frontend

```bash
cd Frontend
npm install
npm start
```

> Ensure your local MySQL instance is running and the schema is initialized from `Database/Schema.sql`.

---

##  Environment Variables

| Variable                   | Description                        |
|----------------------------|------------------------------------|
| `SPRING_DATASOURCE_URL`    | JDBC connection string for MySQL   |
| `SPRING_DATASOURCE_USERNAME` | Database username                |
| `SPRING_DATASOURCE_PASSWORD` | Database password                |
| `BACKEND_URL`              | Backend URL used by the frontend   |

---

##  Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Author

**Abdelrahman Essam**
- GitHub: [@ixi3boda](https://github.com/ixi3boda)
- LinkedIn: [ixi3boda](https://www.linkedin.com/in/ixi3boda)

---

## License

This project is open source and available under the [MIT License](LICENSE).
