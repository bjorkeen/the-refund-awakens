# 🏛️ System Architecture & Technical Documentation

Αυτό το έγγραφο περιγράφει την τεχνική δομή, τη ροή δεδομένων και τη λογική του **Returns & Repairs Management System (RRMS)**.

## 1. Επισκόπηση Συστήματος

Το RRMS είναι μια cloud-based εφαρμογή 3 επιπέδων (3-tier architecture) που τρέχει σε περιβάλλον Docker.



* **Frontend (Client):** React Single Page Application (SPA).
* **Backend (Server):** REST API σε Node.js/Express.
* **Database (Data):** MongoDB (NoSQL).

---

## 2. Ροές Δεδομένων (Data Flows)

### 🔐 A. Authentication & Security (Η "Πύλη")
Η ασφάλεια δεν βασίζεται σε `localStorage` αλλά σε **HttpOnly Cookies**, που είναι πιο ασφαλή ενάντια σε επιθέσεις XSS.

1.  **Login/Register:** Ο χρήστης στέλνει credentials (POST `/api/auth/login`).
2.  **Token Generation:** Ο Server ελέγχει τα στοιχεία και δημιουργεί ένα JWT (JSON Web Token).
3.  **Cookie Set:** Το Token αποθηκεύεται **αυτόματα** στον browser ως `HttpOnly Cookie`. Το JavaScript (Frontend) **δεν** μπορεί να το διαβάσει.
4.  **Protected Requests:** Σε κάθε επόμενο request (π.χ. `/api/tickets`), το Cookie στέλνεται αυτόματα μαζί.
5.  **Middleware:** Στο Backend, το `authMiddleware.js` διαβάζει το cookie, αποκωδικοποιεί το JWT και βάζει τα στοιχεία του χρήστη στο `req.user`.

> **Για τον Developer:** Δεν χρειάζεται να στέλνετε manual headers. Το `axios` είναι ρυθμισμένο (`withCredentials: true`) και τα κάνει όλα μόνο του.

### 🎫 B. Ticket Lifecycle (Η "Καρδιά" του συστήματος)
Η διαχείριση των αιτημάτων ακολουθεί συγκεκριμένους επιχειρηματικούς κανόνες (Business Logic).

1.  **Submission:** Ο πελάτης στέλνει τη φόρμα (`CreateTicket.jsx`).
2.  **Validation & Routing (Backend Logic):**
    * Ο `ticketController.js` παραλαμβάνει τα δεδομένα.
    * **Warranty Check:** Υπολογίζει αν η ημερομηνία αγοράς είναι < 24 μήνες.
    * **Repair Center Assignment:** Αναθέτει αυτόματα σε Κέντρο ανάλογα με τα ticket που έχει αναλάβει.
3.  **Persistence:** Το Ticket αποθηκεύεται στη MongoDB με τα αποτελέσματα της αυτοματοποίησης.
4.  **Updates (UC4):** Τεχνικοί και Υπάλληλοι ενημερώνουν το `status` μέσω του Dashboard τους.

---

## 3. Frontend Architecture (React)

### 📂 Δομή Φακέλων
* **`components/`**: "Χαζά" (Presentational) components που δέχονται `props` και δείχνουν UI (π.χ. `AuthForm`, `Header`).
* **`pages/`**: "Έξυπνα" (Container) components που έχουν πρόσβαση στο API και τη λογική (π.χ. `CreateTicket`, `MyTickets`).
* **`context/`**: Global State (`AccessContext`) που κρατάει το αν ο χρήστης είναι logged in.
* **`services/`**: Αρχεία που περιέχουν ΜΟΝΟ τις κλήσεις `axios` (π.χ. `authService.js`, `ticketService.js`).

### 🎨 Styling Strategy
Χρησιμοποιούμε **CSS Modules** για να αποφύγουμε συγκρούσεις ονομάτων.
* Κάθε component έχει το δικό του αρχείο CSS (π.χ. `Header.jsx` -> `Header.module.css`).
* Στο αρχείο JSX κάνουμε import: `import styles from './Header.module.css'`.
* Χρήση: `<div className={styles.container}>`.

### 🛡️ Routing & Protection
Το `App.jsx` χρησιμοποιεί το `AccessGate` και το `PrivateRoute`:
* **AccessGate:** Περιμένει να δει αν ο χρήστης έχει έγκυρο cookie πριν δείξει οτιδήποτε.
* **PrivateRoute:** Πετάει έξω όποιον δεν έχει κάνει login.

---

## 4. Backend Architecture (Node/Express)

### 🧱 Controller-Service Pattern
Για να κρατάμε τον κώδικα καθαρό:
* **Routes (`/routes`):** Ορίζουν ΜΟΝΟ τα URL (π.χ. `router.post('/')`).
* **Controllers (`/controllers`):** Περιέχουν τη λογική (Validation, υπολογισμοί, απαντήσεις HTTP).
* **Models (`/models`):** Ορίζουν τη δομή των δεδομένων στη MongoDB (Mongoose Schemas).

### 🗄️ Database Models
1.  **User:** `fullName`, `email`, `password` (hashed), `role` (Customer, Employee, Technician, Admin).
2.  **Ticket:**
    * `product`: Serial, Model, Type, Date.
    * `issue`: Category, Description.
    * `status`: (Submitted, In Progress, Completed, etc.).
    * `warrantyStatus`: (Under Warranty / Out of Warranty).
    * `assignedRepairCenter`: (Center A, B, C).

---

## 5. Οδηγίες για Developers

1.  **Νέα Components:** Πάντα να φτιάχνετε αντίστοιχο `Component.module.css`.
2.  **API Calls:** Μην κάνετε `axios.get` μέσα στα components. Φτιάξτε συνάρτηση στο `services/` και καλέστε την.
3.  **State:** Χρησιμοποιήστε `useState` για τοπικά δεδομένα και `useAccess` για δεδομένα χρήστη/login.