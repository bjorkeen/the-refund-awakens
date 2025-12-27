import React, { useState } from "react"; 
import styles from "./AuthForm.module.css";
import { Link } from 'react-router-dom';

const AuthForm = ({ form, onChange, mode, onSubmit }) => {
  // 2. Το state για το κουμπί
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className={styles.container} onSubmit={onSubmit}>
      {mode === "register" && (
        <input
          name="fullName"
          type="text"
          placeholder="Full Name"
          value={form.fullName}
          onChange={onChange}
          className={styles.input}
          required
        />
      )}
      <input
        name="username"
        type="email"
        placeholder="Email Address"
        value={form.username}
        onChange={onChange}
        className={styles.input}
      />

      {/* 3. Προσθήκη του wrapper ΜΟΝΟ γύρω από το password */}
      <div className={styles.passwordWrapper}>
        <input
          name="password"
          type={showPassword ? "text" : "password"} // Εναλλαγή type
          placeholder="Password"
          value={form.password}
          onChange={onChange}
          className={styles.input}
        />
        <button
          type="button"
          className={styles.eyeButton}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "🙉" : "🙈"}
        </button>
      </div>

       {/* 2. Προσθήκη Forgot Password */}
       <div className={styles.forgotPasswordContainer}>
        <Link to="/forgot-password" className={styles.forgotLink}>
         Forgot password?
        </Link>
        </div>

      <button type="submit" style={{ display: 'none' }}></button>
    </form>
  );
};

export default AuthForm;