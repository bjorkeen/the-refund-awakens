import { useState } from "react";
import AuthForm from "../AuthForm";
import MessageBox from "../MessageBox";
import styles from "./AuthPanel.module.css";

const AuthPanel = () => {
  // State:  Login / Register
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
  });
  const [message, setMessage] = useState("");

  // Check if (Development environment) true (Vite specific)
  const isDev = import.meta.env.DEV;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    //  login() OR register() depending on mode
    console.log(`Submitting ${mode} form:`, form);
  };

  return (
    <div className={styles.card}>
      {/* Tabs Header (Sign In / Sign Up) */}
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome</h2>
        <p className={styles.subtitle}>
          Sign in to your account or create a new one
        </p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              mode === "login" ? styles.activeTab : ""
            }`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${
              mode === "register" ? styles.activeTab : ""
            }`}
            onClick={() => setMode("register")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Form */}
      <div className={styles.body}>
        <AuthForm form={form} onChange={handleChange} />

        {/* Submit Button */}
        <button className={styles.submitButton} onClick={handleSubmit}>
          {mode === "login" ? "Sign In" : "Sign Up"}
        </button>

        <MessageBox message={message} />
      </div>

      {/* 3. Development Only Box */}
      {isDev && (
        <div className={styles.devBox}>
          <h4>Demo Accounts:</h4>
          <p>
            Create your own account or use these test credentials (password:
            demo123):
          </p>
          <ul>
            <li>
              <strong>Customer:</strong> customer@demo.com
            </li>
            <li>
              <strong>Manager:</strong> manager@demo.com
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;
