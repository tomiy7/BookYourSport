# BookYourSport User Manual

## 1. Introduction

BookYourSport is a web application for discovering sports facilities and managing reservations.

The current version of the system is focused on tennis clubs and tennis courts. Users can search available clubs and courts, create reservations, manage their bookings, and interact with payment-related functionality.

The system also supports club owners, who can manage clubs and courts and complete the required subscription process before using club-management features.

---

## 2. User Roles

The application supports the following user roles:

### 2.1 Player

A Player can:

- create an account and log in;
- search available tennis clubs and courts;
- view club and court information;
- create reservations;
- view personal reservations;
- reschedule reservations;
- cancel reservations;
- use available account credit for reservation payment.

### 2.2 Club Owner

A Club Owner can:

- request Club Owner status;
- complete the approval process;
- receive and sign a subscription agreement;
- complete subscription payment;
- manage sports clubs;
- add and manage tennis courts;
- define working hours and court information;
- review reservations related to owned clubs.

### 2.3 Administrator

An Administrator can:

- review Club Owner requests;
- approve or reject requests;
- manage user roles and account statuses;
- oversee the Club Owner onboarding process.

---

## 3. Registration and Login

### 3.1 User Registration

A new user must create an account by providing the required personal information:

- first name;
- last name;
- email address;
- password;
- city;
- date of birth.

After successful registration, the user receives an account with the default Player role.

The user can then authenticate using the registered email address and password.

### 3.2 Login

To access protected features, the user must log in using valid credentials.

After successful authentication, the system provides an access token that is used for authenticated requests.

The user's permissions depend on their assigned role.

---

## 4. Club Owner Registration Process

A registered Player can request permission to become a Club Owner.

The onboarding process consists of several stages.

### 4.1 Request Club Ownership

The user submits a request for Club Owner status.

The request is stored with the appropriate approval status and becomes available to an Administrator for review.

### 4.2 Administrator Approval

An Administrator reviews the request.

The request can be approved or rejected.

Only approved users can continue with the Club Owner onboarding process.

### 4.3 Subscription Contract

After approval, a subscription agreement can be generated for the Club Owner.

The contract contains:

- Club Owner information;
- unique contract identifier;
- subscription fee;
- subscription currency;
- agreement details;
- signature fields for the Club Owner and BookYourSport.

The generated agreement is stored as a PDF document.

### 4.4 Contract Signing

The Club Owner must accept and sign the generated agreement before proceeding with subscription payment.

### 4.5 Subscription Payment

After the agreement has been signed, the required subscription payment can be processed.

Once all required onboarding steps are successfully completed, the user can use Club Owner functionality.

---

## 5. Searching for Clubs and Courts

Players can search available sports facilities through the Search functionality.

The Search subsystem provides information about available clubs and courts.

Search results can include information such as:

- club name;
- location;
- available tennis courts;
- court surface type;
- indoor or outdoor court type;
- court price;
- availability information.

The Search service obtains reservation-related information from the Reservation service and uses caching to improve response performance.

---

## 6. Reservations

### 6.1 Creating a Reservation

A Player can select an available tennis court and request a reservation for a specific time interval.

Before creating the reservation, the system validates:

- whether the court exists;
- whether the club is active;
- whether the selected time is within club working hours;
- whether the requested time overlaps with another reservation;
- whether the user has sufficient funds or credit when payment is required.

If all conditions are satisfied, the reservation is created.

### 6.2 Viewing Reservations

Users can retrieve their existing reservations.

Club Owners can also review reservations associated with their clubs.

Reservation information includes:

- selected court;
- club;
- reservation start time;
- reservation end time;
- reservation price;
- reservation status.

### 6.3 Rescheduling a Reservation

An existing reservation can be moved to another available time.

The new time is validated using the same availability rules as a new reservation.

### 6.4 Cancelling a Reservation

A reservation can be cancelled according to the configured cancellation rules.

When required, the Payment service processes the corresponding refund.

The cancelled time slot becomes available for future reservations.

---

## 7. Payments and Credit

BookYourSport uses a credit-based payment model.

### 7.1 Adding Credit

Credit can be added to a user's account.

A successful top-up creates a corresponding transaction and increases the account balance.

### 7.2 Reservation Payment

When a reservation requires payment, the system checks the user's available credit.

If sufficient credit is available:

1. the required amount is deducted;
2. a payment transaction is recorded;
3. the payment result is communicated to the Reservation subsystem.

If there is insufficient credit, the payment is rejected.

### 7.3 Refunds

When a reservation is cancelled and the cancellation rules allow a refund, the corresponding amount is returned to the user's account.

A refund transaction is recorded in the payment history.

---

## 8. Club Management

Club Owners can manage information related to their sports facilities.

Available operations include:

- creating a club;
- updating club information;
- adding tennis courts;
- removing or disabling courts;
- defining court properties;
- defining club working hours.

Court information can include:

- court name;
- surface type;
- indoor or outdoor status;
- price per hour;
- active status.

---

## 9. System Communication

Users interact with the application through the API Gateway.

The API Gateway routes requests to the appropriate backend microservice.

The application consists of several independent services:

- Auth Service;
- Search Service;
- Reservation Service;
- Payment Service.

The services communicate using REST, gRPC and asynchronous messaging where appropriate.

---

## 10. Error Handling

The application can reject operations when business or validation rules are not satisfied.

Examples include:

- invalid login credentials;
- unauthorized access;
- insufficient permissions;
- invalid Club Owner status;
- unavailable reservation time;
- insufficient account balance;
- invalid reservation operation;
- missing requested resource.

The API returns an appropriate HTTP status code and error information that describes the problem.

---

## 11. Typical Player Workflow

A typical Player workflow is:

1. Register an account.
2. Log in.
3. Search for a tennis club or court.
4. Select an available court and time.
5. Create a reservation.
6. Complete payment using available credit.
7. View or manage the reservation.
8. Cancel or reschedule the reservation if necessary.

---

## 12. Typical Club Owner Workflow

A typical Club Owner workflow is:

1. Register as a standard user.
2. Request Club Owner status.
3. Wait for Administrator approval.
4. Generate the subscription agreement.
5. Review and sign the agreement.
6. Complete subscription payment.
7. Create and manage clubs.
8. Add and manage courts.
9. Configure working hours.
10. Review reservations for owned clubs.

---

## 13. Typical Administrator Workflow

A typical Administrator workflow is:

1. Log in using an Administrator account.
2. Review pending Club Owner requests.
3. Approve or reject requests.
4. Manage user roles and statuses when required.
5. Monitor the Club Owner onboarding process.

---

## 14. Conclusion

BookYourSport provides a centralized platform for tennis court discovery, reservation management, payment processing and club administration.

The application separates functionality into independent microservices and supports different user roles with clearly defined permissions and workflows.
