# Returns & Repairs Management System (RRMS)

Το σύστημα διαχείρισης επιστροφών και επισκευών (RRMS) είναι μια web εφαρμογή που ψηφιοποιεί τον κύκλο ζωής των επισκευών, συνδέοντας πελάτες, υπαλλήλους και τεχνικούς.

## 🏗️ Αρχιτεκτονική (Tech Stack)

Το έργο ακολουθεί αρχιτεκτονική MERN σε περιβάλλον Docker:

* **Frontend**: React + Vite  (Τρέχει στη θύρα `3000`)
* **Backend**: Node.js + Express (Τρέχει στη θύρα `5050`)
* **Database**: MongoDB (Τρέχει στη θύρα `27017` με persistent volume)
* **DevOps**: Docker Compose για ενορχήστρωση των services

---

## 🚀 Γρήγορη Εκκίνηση (Προτείνεται)

Αυτός είναι ο πιο εύκολος τρόπος για να τρέξετε όλο το σύστημα (Βάση, Backend, Frontend) με μία εντολή.

### Προαπαιτούμενα
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) εγκατεστημένο και να τρέχει.

### Οδηγίες
1.  Ανοίξτε τερματικό στον φάκελο του project.
2.  Τρέξτε την εντολή:
    ```bash
    docker compose up -d --build
    ```
3.  Περιμένετε μέχρι να δείτε ότι τα containers (frontend, backend, mongo) είναι `Started`.
4.  Ανοίξτε τον browser στο: **http://localhost:3000**

### Χρήσιμες Εντολές Docker
* **Stop & Remove:** `docker compose down` (Σταματάει τα πάντα).
* **Δείτε τα logs (Backend):** `docker logs -f my-app-backend` (Χρήσιμο για debugging).
* **Restart Backend (μετά από αλλαγή κώδικα):** `docker compose restart backend_service`.
* **Δείτε ποια containers τρέχουν:** `docker compose ps`.

---

## 💻 Hybrid Development (Για UI Developers)

Αν δουλεύετε **μόνο στο Frontend** και θέλετε ταχύτατο Hot Reload, μπορείτε να τρέχετε το Backend/DB στο Docker και το React τοπικά στον υπολογιστή σας.

1.  **Σηκώστε Υποδομές (Backend + DB):**
    ```bash
    docker compose up -d backend_service mongo_db
    ```
2.  **Τρέξτε το Frontend τοπικά:**
    * Ανοίξτε νέο τερματικό.
    * Πηγαίνετε στον φάκελο frontend: `cd frontend`
    * Εγκατάσταση βιβλιοθηκών (μόνο την πρώτη φορά): `npm install`
    * Εκκίνηση: `npm run dev`
3.  Το Frontend θα τρέχει στο **http://localhost:5173** (προσοχή στο port, το Vite τοπικά διαφέρει από το Docker).

---

## 📂 Δομή Φακέλων

```
/
├── backend/                 # Ο κώδικας του API
│   ├── controllers/         # Η λογική (π.χ. Ticket creation, Auth)
│   ├── models/              # Mongoose Schemas (User, Ticket)
│   ├── routes/              # API Endpoints definition
│   └── services/            # Business logic services
│
├── frontend/                # Ο κώδικας του React App
│   └── src/
│       ├── components/      # Reusable UI (AuthForm, Header, etc.)
│       ├── context/         # Global State (AccessContext)
│       ├── pages/           # Σελίδες (CreateTicket, MyTickets)
│       └── services/        # Axios calls προς το Backend
│
└── docker-compose.yml       # Ρυθμίσεις των containers
```

## 🔑 Demo Λογαριασμοί

Επειδή η βάση είναι φρέσκια, πρέπει να κάνετε **Sign Up** έναν νέο χρήστη κατά την πρώτη εκκίνηση.
* Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες, 1 αριθμό και 1 σύμβολο (π.χ. `Demo123!`).

---


## 🤝 Git Workflow (ΠΩΣ ΔΟΥΛΕΥΟΥΜΕ)

Για να μην χάνουμε κώδικα και να μην έχουμε συγκρούσεις (conflicts), ακολουθούμε **ΠΑΝΤΑ** αυτά τα βήματα:

### Βήμα 1: Ξεκινάμε ΠΑΝΤΑ με ενημέρωση
Πριν γράψετε έστω και μια γραμμή κώδικα, σιγουρευτείτε ότι έχετε την τελευταία έκδοση:
1. Πηγαίνουμε στο κεντρικό branch:
   `git checkout main`
2. Κατεβάζουμε τις αλλαγές των άλλων:
   `git pull origin main`

### Βήμα 2: Φτιάχνουμε ΔΙΚΟ ΜΑΣ Branch
**ΑΠΑΓΟΡΕΥΕΤΑΙ** να γράφετε κώδικα απευθείας στο `main`.
Φτιάξτε ένα νέο branch με περιγραφικό όνομα (π.χ. `feature/header`, `fix/login-bug`):

```bash
git checkout -b feature/to-onoma-tou-task-sas

```

### Βήμα 3: Κάνουμε δουλειά & Commit

Κάντε τις αλλαγές σας. Όταν τελειώσετε:

```bash
git add .
git commit -m "Περιγραφή του τι έφτιαξα"
```

### Βήμα 4: Ανέβασμα (Push)

Στέλνουμε το branch μας στο GitHub:

```bash
git push origin feature/to-onoma-tou-task-sas
```

(Μετά κάνουμε Pull Request στο GitHub για να ενωθεί με το main).

---

### 2. Πού δοκιμάζουν τα Components (Playground)

Αντί να χαλάμε το `MyTickets.jsx`, θα φτιάξουμε μια προσωρινή σελίδα **`Playground.jsx`**.
* **Τι είναι:** Μια λευκή σελίδα όπου μπορούν να κάνουν import το component τους (π.χ. `<Header />`, `<Footer />`) για να δουν πώς φαίνεται.
* **Πλεονέκτημα:** Δεν επηρεάζει την κανονική ροή της εφαρμογής.

"Για να δείτε αυτό που φτιάχνετε, ανοίξτε το αρχείο frontend/src/pages/Playground.jsx, κάντε import το component σας εκεί και μπείτε στο http://localhost:3000/test. Μην πειράζετε τις άλλες σελίδες!"