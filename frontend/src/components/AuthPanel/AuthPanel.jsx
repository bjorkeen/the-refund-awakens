import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAccess } from "@/context/AccessContext";
import * as authService from "@/services/authService";
import AuthForm from "../AuthForm";
import MessageBox from "../MessageBox";
import styles from "./AuthPanel.module.css";

const AuthPanel = () => {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
  });
  const [message, setMessage] = useState("");

  const { login } = useAccess();
  const navigate = useNavigate();
  const isDev = import.meta.env.DEV;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    console.log("1. Button Clicked! Mode:", mode);
    setMessage("");

    try {
      if (mode === "login") {
        const response = await authService.login({
          email: form.username,
          password: form.password
        });
        
        if (response.user) {
            await login(response.user);
            navigate("/dashboard");
        } else {
            setMessage("Login failed: Invalid server response");
        }

      } else {
        await authService.register({
          fullName: form.fullName,
          email: form.username,
          password: form.password
        });
        
        setMessage("Account created! Please sign in.");
        setMode("login");
        setForm(prev => ({ ...prev, password: "" }));
      }
    } catch (err) {
      console.error("Auth Error:", err);
      setMessage(err.response?.data?.message || err.message || "An error occurred");
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Welcome</h2>
        <p className={styles.subtitle}>
          Sign in to your account or create a new one
        </p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${mode === "login" ? styles.activeTab : ""}`}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            className={`${styles.tab} ${mode === "register" ? styles.activeTab : ""}`}
            onClick={() => setMode("register")}
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <AuthForm form={form} onChange={handleChange} mode={mode} onSubmit={handleSubmit} />
        <button className={styles.submitButton} onClick={handleSubmit}>
          {mode === "login" ? "Sign In" : "Sign Up"}
        </button>

        <MessageBox message={message} />
      </div>

      {isDev && (
        <div className={styles.devBox}>
          <h4>Demo Accounts:</h4>
          <p>Test credentials (password: demo123!):</p>
          <ul>
           <ul>
            <li><strong>Manager:</strong> manager@demo.com</li>
            <li><strong>Employee:</strong> staff@demo.com</li>
            <li><strong>Technician</strong>tech@demo.com</li>
            <li><strong>Customer:</strong> customer@demo.com</li>
          </ul>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AuthPanel;