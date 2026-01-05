import { useEffect, useState, useMemo } from "react";
import { getAllTicketsAdmin } from "@/services/ticketService";
import { getAllUsers, deleteUser, createUser } from "@/services/authService";
import styles from "./AdminDashboard.module.css";
import { useNotification } from "@/context/NotificationContext";

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "Technician",
    specialty: "Smartphone",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const { showNotification } = useNotification();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ticketsData, usersData] = await Promise.all([
          getAllTicketsAdmin(),
          getAllUsers(),
        ]);

        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.contactInfo?.fullName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, filterStatus]);

  // Statistics for Overview
  const stats = useMemo(() => {
    const total = tickets.length;
    const completed = tickets.filter((t) => t.status === "Completed").length;
    const pending = tickets.filter((t) =>
      ["Pending", "Submitted", "In Progress"].includes(t.status)
    ).length;
    const underWarranty = tickets.filter(
      (t) => t.warrantyStatus === "Under Warranty"
    ).length;

    return {
      total,
      completed,
      completedRate: total > 0 ? (completed / total) * 100 : 0,
      pending,
      underWarranty,
      warrantyRate: total > 0 ? (underWarranty / total) * 100 : 0,
    };
  }, [tickets]);

  // --- HANDLERS for USER MANAGEMENT ---
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      setUsers(users.filter((u) => u._id !== id));
      showNotification("User deleted successfully", "success");
    } catch (err) {
      showNotification(
        err.response?.data?.message || "Failed to delete user",
        "error"
      );
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        specialty: formData.role === "Technician" ? formData.specialty : null,
      };
      const newUser = await createUser(dataToSend);

      setUsers([newUser.user, ...users]);
      setShowCreateModal(false);
      setFormData({
        fullName: "",
        email: "",
        password: "",
        role: "Technician",
        specialty: "Smartphone",
      });
      showNotification("User created successfully!", "success");
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get role badge class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "Admin":
        return styles.roleAdmin;
      case "Manager":
        return styles.roleManager;
      case "Technician":
        return styles.roleTechnician;
      case "Employee":
        return styles.roleEmployee;
      case "Customer":
      default:
        return styles.roleCustomer;
    }
  };

  if (loading) return <div className={styles.loading}>Loading System...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <>
            {/* STATS CARDS */}
            <div className={styles.statsGrid}>
              <StatCard
                label="Total Tickets"
                value={stats.total}
                icon="📦"
                color="#2563eb"
              />
              <StatCard
                label="Open Requests"
                value={stats.pending}
                icon="🕒"
                color="#f59e0b"
              />
              <StatCard
                label="Completed"
                value={stats.completed}
                icon="✅"
                color="#10b981"
              />
              <StatCard
                label="In Warranty"
                value={stats.underWarranty}
                icon="🛡️"
                color="#3b82f6"
              />
            </div>

            {/* PROGRESS BARS */}
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Efficiency Rate</h3>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${stats.completedRate}%`,
                      backgroundColor: "#10b981",
                    }}
                  ></div>
                </div>
                <span className={styles.progressValue}>
                  {stats.completedRate.toFixed(1)}% Resolved
                </span>
              </div>
              <div className={styles.chartCard}>
                <h3>Warranty Coverage</h3>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${stats.warrantyRate}%`,
                      backgroundColor: "#3b82f6",
                    }}
                  ></div>
                </div>
                <span className={styles.progressValue}>
                  {stats.warrantyRate.toFixed(1)}% Under Guarantee
                </span>
              </div>
            </div>

            {/*recent tickets table*/}
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <h2>Recent Activity (Last 5)</h2>
                <button
                  className={styles.viewAllBtn}
                  onClick={() => setActiveTab("All Tickets")}
                >
                  View Full List
                </button>
              </div>
              <TicketTable data={tickets.slice(0, 5)} />
            </div>
          </>
        );

      case "All Tickets":
        return (
          <div className={styles.tableSection}>
            <div className={styles.filterBar}>
              <input
                type="text"
                placeholder="Search by ID or Customer..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                className={styles.filterSelect}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <TicketTable data={filteredTickets} />
          </div>
        );

      case "User Management":
        return (
          <>
            <div className={styles.tableSection}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2>System Users</h2>
                <button
                  className={styles.btnSubmit}
                  onClick={() => setShowCreateModal(true)}
                >
                  + Create User
                </button>
              </div>

              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Specialty</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${getRoleBadgeClass(
                            u.role
                          )}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>{u.specialty || "-"}</td>
                      <td>
                        <button
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteUser(u._id || u.id)}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- CREATE USER MODAL --- */}
            {showCreateModal && (
              <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                  <h3>Create New User</h3>
                  <form onSubmit={handleCreateUser}>
                    <div className={styles.formGroup}>
                      <label>Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Password</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                      >
                        <option value="Customer">Customer</option>
                        <option value="Technician">Technician</option>
                        <option value="Manager">Manager</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    {formData.role === "Technician" && (
                      <div
                        className={`${styles.formGroup} ${styles.highlightGroup}`}
                      >
                        <label>Specialty</label>
                        <select
                          value={formData.specialty}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              specialty: e.target.value,
                            })
                          }
                        >
                          <option value="Smartphone">Smartphone</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Desktop">Desktop</option>
                        </select>
                      </div>
                    )}
                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className={styles.btnCancel}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className={styles.spinner}></span>
                        ) : (
                          "Create"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        );

      default:
        return (
          <div className={styles.placeholderView}>
            <h2>{activeTab}</h2>
            <p>This section is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Manager Control Panel</h1>
          <p className={styles.welcomeText}>
            Electronics Returns & Repairs Management
          </p>
        </div>
      </header>

      <nav className={styles.tabsNav}>
        {[
          "Overview",
          "All Tickets",
          "User Management",
          "Reports",
          "Settings",
        ].map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${
              activeTab === tab ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <main>{renderTabContent()}</main>
    </div>
  );
};

const TicketTable = ({ data }) => (
  <table className={styles.miniTable}>
    <thead>
      <tr>
        <th>Ticket ID</th>
        <th>Customer</th>
        <th>Status</th>
        <th>Warranty</th>
      </tr>
    </thead>
    <tbody>
      {data.map((t) => (
        <tr key={t._id}>
          <td className={styles.idCell}>
            #{t.ticketId || t._id.substring(0, 6)}
          </td>
          <td>{t.contactInfo?.fullName || "N/A"}</td>
          <td>
            <span
              className={`${styles.badge} ${
                styles[t.status?.toLowerCase().replace(/ /g, "-")] ||
                styles.submitted
              }`}
            >
              {t.status}
            </span>
          </td>
          <td className={styles.warrantyCell}>{t.warrantyStatus}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const StatCard = ({ label, value, icon, color }) => (
  <div className={styles.statCard}>
    <div
      className={styles.iconBox}
      style={{ backgroundColor: `${color}15`, color: color }}
    >
      {icon}
    </div>
    <div className={styles.cardInfo}>
      <h3 className={styles.statLabel}>{label}</h3>
      <p className={styles.statValue}>{value}</p>
    </div>
  </div>
);

export default AdminDashboard;
