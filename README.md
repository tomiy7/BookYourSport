# 🎾 BookYourSport

**BookYourSport** is a full-stack, microservice-based platform for discovering tennis clubs and courts, managing reservations, and handling payments through a credit-based system.

The platform provides functionality for players, Club Owners, and administrators while separating authentication, reservations, payments, and search into independent backend services.

The backend is exposed through a central **YARP API Gateway** and uses REST, gRPC, and RabbitMQ for communication between system components.

---

## ✨ Key Features

### 👤 Players

- User registration and authentication
- Search for tennis clubs and courts
- Filtering by location, price, surface type, and court characteristics
- Location-based club discovery
- Court reservation management
- Credit-based reservation payments
- Reservation cancellation and refunds
- Credit balance and transaction management

### 🎾 Club Owners

- Club Owner request and approval workflow
- Subscription contract generation
- PDF contract signing
- Subscription payment
- Club and court management
- Working-hours management
- Reservation overview

### 🛡️ Administration

- User management
- Club Owner approval
- Role and approval-status management
- Contract and subscription workflow supervision

---

# 🏗️ System Architecture

BookYourSport follows a **microservice architecture** consisting of four main backend services:

| Service | Responsibility |
|---|---|
| **Auth Service** | Authentication, authorization, users, roles, and Club Owner approval |
| **Reservation Service** | Tennis clubs, courts, working hours, and reservation lifecycle |
| **Payment Service** | Credit accounts, transactions, payments, refunds, and subscription contracts |
| **Search Service** | Club and court search, filtering, sorting, geolocation, and distance-based discovery |

All external backend requests are routed through a **YARP API Gateway**.

![BookYourSport High-Level Architecture](docs/diagrams/architecture/architecture.png)

A detailed description of the architecture is available in the [Architecture Documentation](docs/Architecture.md).

---

## 🔄 Service Communication

BookYourSport uses multiple communication mechanisms depending on the type of interaction.

| Technology | Purpose |
|---|---|
| **REST / HTTP** | External API communication and selected synchronous service-to-service operations |
| **gRPC** | Synchronous communication between Search and Reservation |
| **RabbitMQ** | Asynchronous integration events |
| **YARP** | API Gateway routing |

The main backend communication structure is:

```text
                         Client
                           |
                           | HTTP / REST
                           v
                    +---------------+
                    |  API Gateway  |
                    |     YARP      |
                    +-------+-------+
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
        Auth            Reservation        Payment
                            ^                 |
                            |                 |
                            +-----------------+
                            |
                          Search
```

The **Search Service** retrieves current club and court information from the Reservation Service through **gRPC**.

The **Reservation Service** communicates with the Payment Service when reservation operations require charging or refunding a user.

The **Payment Service** communicates with the Auth Service during Club Owner contract and subscription workflows.

**RabbitMQ** is used for asynchronous integration events where loose coupling between services is appropriate.

---

# 🧩 Domain-Driven Design

The business-rich parts of BookYourSport, particularly the **Reservation** and **Payment** services, are designed using **Domain-Driven Design (DDD)** principles.

These services represent separate bounded contexts with their own domain models and business rules.

Their internal organization separates responsibilities into:

```text
API
 |
 v
Application
 |
 v
Domain
 ^
 |
Infrastructure
```

### Reservation Bounded Context

The Reservation domain models concepts such as:

- `TennisClub`
- `Court`
- `Reservation`
- `WorkingHours`
- `Address`
- `Price`
- reservation status
- court surface type

Reservation business rules are separated from persistence and external service communication.

### Payment Bounded Context

The Payment domain models concepts such as:

- `CreditAccount`
- `Transaction`
- `Contract`
- `RefundPolicy`
- transaction types
- contract status
- credit and refund business rules

Application handlers coordinate individual use cases, while infrastructure components provide persistence, messaging, external service communication, and PDF generation.

The **Auth** and **Search** services are independent microservices with narrower domain responsibilities and simpler internal models.

More information about individual subsystems is available in the [Class Diagrams](docs/ClassDiagrams.md).

---

# 🛠️ Technology Stack

## Backend

- **C#**
- **ASP.NET Core**
- **Entity Framework Core**
- **YARP Reverse Proxy**

## Frontend

- **Next.js**
- **React**
- **TypeScript**

## Databases and Caching

- **PostgreSQL**
- **Redis**

## Communication

- **REST / HTTP**
- **gRPC**
- **RabbitMQ**

## Security

- **JWT authentication**
- **Role-based authorization**

## Infrastructure

- **Docker**
- **Docker Compose**

---

# 🗄️ Data and Persistence

BookYourSport follows the principle of **independent service data ownership**.

Each business service owns the data required for its responsibilities instead of relying on a single shared application database.

```text
Auth Service
     |
     v
Auth PostgreSQL


Reservation Service
     |
     v
Reservation PostgreSQL


Payment Service
     |
     v
Payment PostgreSQL


Search Service
     |
     v
Redis Cache
```

### PostgreSQL

Separate PostgreSQL databases are used by:

- Auth Service
- Reservation Service
- Payment Service

### Redis

The Search Service uses **Redis** to cache geocoding results and reduce unnecessary repeated requests to the external geocoding service.

---

# 📦 Services and Local Ports

## Backend Services

| Component | Local Port | Purpose |
|---|---:|---|
| API Gateway | `5000` | Main backend entry point |
| Auth Service | `5001` | Authentication and user management |
| Reservation Service | `5002` | Reservation REST API |
| Reservation internal endpoint | `5004` | Internal service communication |
| Payment Service | `8080` | Payments, credits, and contracts |
| Search Service | `8081` | Search and discovery |

## Infrastructure

| Component | Local Port |
|---|---:|
| Auth PostgreSQL | `5433` |
| Reservation PostgreSQL | `5434` |
| Payment PostgreSQL | `5435` |
| Search Redis | `6380` |

---

# 🚀 Getting Started

## Prerequisites

Before running the application locally, make sure the following tools are installed:

- Docker
- Docker Compose
- Git

The .NET SDK is also recommended for development and for running Entity Framework Core commands directly.

---

## 1. Clone the Repository

```bash
git clone https://github.com/tomiy7/BookYourSport.git
cd BookYourSport
```

---

## 2. Configure Environment Variables

The root `.env` file provides environment variables required by the Docker configuration.

Configure:

```env
DB_PASSWORD=<your-database-password>
JWT_SECRET=<your-jwt-secret>
```

Sensitive credentials should not be committed to a public repository or reused in a production environment.

---

## 3. Create the Shared Docker Network

The backend services communicate through the external Docker network:

```text
bookyoursport-network
```

Create it before starting the application:

```bash
docker network create bookyoursport-network
```

If the network already exists, this step can be skipped.

---

## 4. Start the Application

The root `docker-compose.yml` includes the Compose configurations for:

- Payment
- Search
- Auth
- Reservation
- API Gateway

Start and build the complete backend from the project root:

```bash
docker compose up --build
```

To run the application in the background:

```bash
docker compose up --build -d
```

---

## 5. Verify the Containers

Check that the required containers are running:

```bash
docker compose ps
```

The API Gateway is exposed locally at:

```text
http://localhost:5000
```

---

## 6. Stop the Application

Stop the application with:

```bash
docker compose down
```

Container logs can be inspected using:

```bash
docker compose logs
```

or for a specific service:

```bash
docker compose logs <service-name>
```

---

# 🔐 Authentication and Authorization

The Auth Service is responsible for user identity and access management.

BookYourSport uses **JWT-based authentication**. After successful authentication, users receive an access token that is used to access protected endpoints.

Role-based authorization separates functionality available to different types of users.

The Auth Service also participates in the Club Owner approval workflow by tracking user approval, contract, and subscription status.

---

# 📅 Reservation System

The Reservation Service contains the core booking domain of BookYourSport.

It manages:

- tennis clubs;
- courts;
- club working hours;
- court availability;
- reservations;
- reservation cancellation;
- reservation rescheduling.

Reservation operations that require financial processing communicate with the Payment Service instead of directly modifying user credit balances.

This keeps reservation and payment responsibilities separated between their respective bounded contexts.

---

# 💳 Credit and Payment System

BookYourSport uses an internal **credit-based payment system**.

Each user can have a credit account containing their available balance and transaction history.

Supported credit operations include:

- **Top Up** – adds credits to a user's account
- **Charge** – deducts credits when a reservation requires payment
- **Refund** – returns credits according to reservation cancellation rules

Transactions are recorded by the Payment Service.

The Payment domain is separated from the Reservation domain, allowing payment rules and reservation rules to evolve independently.

---

# 📄 Club Owner Subscription Workflow

Before gaining access to Club Owner functionality, a user goes through an approval and subscription workflow.

```text
Club Owner Request
        |
        v
      PENDING
        |
        v
 Administrator Approval
        |
        v
 Generate Contract
        |
        v
 Contract Signing
        |
        v
 Subscription Payment
        |
        v
     APPROVED
        |
        v
Club Owner Features Enabled
```

The **Payment Service** manages subscription contracts and payments, while the **Auth Service** owns the final user approval state.

Subscription contracts are generated as **PDF documents** by the Payment Service.

---

# 🔎 Search and Geolocation

The Search Service provides discovery of tennis clubs and courts.

Search criteria include:

- club name;
- city;
- price range;
- court surface;
- indoor or outdoor preference;
- address;
- maximum distance;
- sorting;
- pagination.

The Search Service retrieves current club and court information from the Reservation Service through **gRPC**.

For location-based search, addresses are converted into geographic coordinates through geocoding.

Geocoding results are cached using **Redis**, reducing unnecessary repeated external requests.

Distance-based search uses geographic coordinates to calculate the distance between the requested location and available clubs.

---

# 📨 Messaging

BookYourSport uses **RabbitMQ** for asynchronous communication between services.

Integration events allow services to react to changes in other parts of the system without introducing unnecessary direct dependencies.

Shared messaging components are located in the `Messaging` part of the solution.

---

# 📂 Repository Structure

```text
BookYourSport/
├── ApiGateway/
├── Messaging/
├── Payment/
├── Search/
├── Security/
│   └── Auth/
├── Services/
│   └── Reservation/
├── frontend/
│   ├── app/
│   └── lib/
├── docs/
│   ├── diagrams/
│   │   ├── architecture/
│   │   ├── auth-class-diagram/
│   │   ├── payment-class-diagram/
│   │   ├── reservation-class-diagram/
│   │   └── search-class-diagram/
│   ├── Architecture.md
│   ├── ClassDiagrams.md
│   └── UserManual.md
├── BookYourSport.sln
├── docker-compose.yml
└── README.md
```

The backend is divided according to service responsibility rather than around a single shared application model.

Payment and Reservation contain the richer domain models, while Auth and Search provide more specialized capabilities.

---

# 🧪 Testing

The backend contains automated tests for application functionality.

The complete .NET test suite can be executed using:

```bash
dotnet test
```

A build can be verified using:

```bash
dotnet build
```

Individual test projects or selected groups of tests can also be executed independently while developing a specific service.

---

# 📚 Documentation

Additional project documentation is available in the [`docs`](docs/) directory.

### 📖 User Manual

[UserManual.md](docs/UserManual.md)

Describes application functionality and the main workflows available to users.

### 🏗️ Architecture Documentation

[Architecture.md](docs/Architecture.md)

Describes the high-level system architecture, microservices, data ownership, and communication mechanisms.

### 🧩 Class Diagrams

[ClassDiagrams.md](docs/ClassDiagrams.md)

Contains class diagrams and descriptions for:

- Auth Service
- Reservation Service
- Payment Service
- Search Service

The documentation also contains the high-level architecture diagram and individual subsystem diagrams.

---

# 🎯 Design Principles

BookYourSport was designed around the following principles:

- **Microservice architecture**
- **Clear service boundaries**
- **Separation of concerns**
- **Domain-Driven Design for business-rich contexts**
- **Independent service data ownership**
- **Dependency on abstractions**
- **Isolation of infrastructure concerns from business logic**
- **REST and gRPC for synchronous communication**
- **RabbitMQ for asynchronous communication**
- **Containerized local development**

The goal of this architecture is to keep individual services independently understandable and maintainable while allowing them to collaborate through clearly defined communication mechanisms.