# 📋 Task 01: Global Layout Components (Header & Footer)

**Στόχος:** Δημιουργία των βασικών στοιχείων πλοήγησης που θα εμφανίζονται σε όλες τις σελίδες.

## 1. Προετοιμασία
1.  Κάνε `git checkout main` και `git pull`.
2.  Φτιάξε νέο branch: `git checkout -b feature/layout-components`.
3.  Διάβασε το `SYSTEM_ARCHITECTURE.md` για να καταλάβεις τη δομή.

## 2. Οδηγίες Υλοποίησης

Θα εργαστείς στον φάκελο: `frontend/src/components/`

### A. Footer Component
1.  Δημιούργησε φάκελο `Footer`.
2.  Μέσα φτιάξε: `Footer.jsx` και `Footer.module.css`.
3.  **Requirements:**
    * Να περιέχει Copyright text (© 2024 Electronics R&R).
    * Να είναι "sticky" στο κάτω μέρος ή να έχει σταθερό ύψος.
    * Χρώμα background: Σκούρο γκρι/μπλε (δες Variables στο CSS).

### B. Header (AppBar) Component
1.  Δημιούργησε φάκελο `Header`.
2.  Μέσα φτιάξε: `Header.jsx` και `Header.module.css`.
3.  **Requirements:**
    * **Logo:** Αριστερά (κείμενο "RRMS" ή εικόνα).
    * **Navigation:** Δεξιά.
    * **Dynamic Logic:**
        * Αν ο χρήστης **ΔΕΝ** είναι logged in: Δείξε κουμπί "Login".
        * Αν είναι logged in: Δείξε "Dashboard", "New Request" και "Logout".
4.  **Integration με Auth:**
    * Χρησιμοποίησε το `useAccess` hook για να δεις αν είναι logged in.
    * `import { useAccess } from '../../context/AccessContext';`
    * `const { hasAccess, logout } = useAccess();`

### C. Styling
* Χρησιμοποίησε **αποκλειστικά CSS Modules** (`.module.css`).
* Μην γράφεις inline styles.

## 3. Πώς να το δοκιμάσεις (Playground)
Μην πειράξεις το `App.jsx` ή το `HomePage.jsx`!

1.  Άνοιξε το `frontend/src/pages/Playground.jsx`.
2.  Κάνε import τα components σου:
    ```jsx
    import Footer from '../components/Footer/Footer';
    import Header from '../components/Header/Header';
    ```
3.  Πρόσθεσέ τα στο JSX για να τα δεις.
4.  Μπες στο **http://localhost:3000/test**.

## 4. Παράδοση
* Κάνε commit: `git commit -m "feat: Add Header and Footer components"`
* Κάνε push: `git push origin feature/layout-components`
* Ενημέρωσέ με για Code Review.