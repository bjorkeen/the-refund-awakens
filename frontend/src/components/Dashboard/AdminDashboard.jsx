import { useEffect, useState, useMemo } from "react";
import { getAllTicketsAdmin } from "@/services/ticketService";
import { getAllUsers, deleteUser, createUser, updateUser } from "@/services/authService"; 
import styles from "./AdminDashboard.module.css";
import { useNotification } from "@/context/NotificationContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getFeedbackKPIs } from "@/services/ticketService";

const AdminDashboard = () => {
  const { showNotification } = useNotification();
  
  // --- Data States ---
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // --- Modal States ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: "", role: "Technician", specialty: "Smartphone",
  });
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // --- Delete Modal State ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // --- Settings State ---
  const [warrantyPeriod, setWarrantyPeriod] = useState(() => {
    const saved = localStorage.getItem('warrantyPeriod');
    return saved ? parseInt(saved, 10) : 24;
  });

  const [returnPolicyDays, setReturnPolicyDays] = useState(() => {
    const saved = localStorage.getItem('returnPolicyDays');
    return saved ? parseInt(saved, 10) : 15;
  });

  // --- Reports/KPI State ---
  const [kpiData, setKpiData] = useState([]);
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']; // Red to Green logic


  // --- LOAD DATA ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // 1. Φόρτωση Users
      try {
        const usersData = await getAllUsers();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        console.error("Users error:", err);
      }

      // 2. Φόρτωση Tickets
      try {
        const ticketsData = await getAllTicketsAdmin();
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      } catch (err) {
        console.error("Tickets error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // --- LOAD KPI DATA ---
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const data = await getFeedbackKPIs();
        setKpiData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch KPIs", err);
        setKpiData([]);
      }
    };
    fetchKPIs();
  }, []);


  // --- STATISTICS CALCULATIONS ---
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.contactInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const completed = tickets.filter((t) => t.status === "Completed").length;
    const pending = tickets.filter((t) => ["Pending", "Submitted", "In Progress"].includes(t.status)).length;
    const underWarranty = tickets.filter((t) => t.warrantyStatus === "Under Warranty").length;

    return {
      total,
      completed,
      completedRate: total > 0 ? (completed / total) * 100 : 0,
      pending,
      underWarranty,
      warrantyRate: total > 0 ? (underWarranty / total) * 100 : 0,
    };
  }, [tickets]);

  // --- REPORTS COMPUTED VALUES ---
  const chartData = useMemo(() => {
    const dataArray = Array.isArray(kpiData) ? kpiData : [];
    return [1, 2, 3, 4, 5].map(num => {
      const found = dataArray.find(d => d._id === num);
      return { rating: `${num} Star`, count: found ? found.count : 0 };
    });
  }, [kpiData]);

  const totalReviews = useMemo(() => {
    const dataArray = Array.isArray(kpiData) ? kpiData : [];
    return dataArray.reduce((acc, curr) => acc + curr.count, 0);
  }, [kpiData]);

  const avgRating = useMemo(() => {
    const dataArray = Array.isArray(kpiData) ? kpiData : [];
    return totalReviews > 0 
      ? (dataArray.reduce((a, b) => a + (b._id * b.count), 0) / totalReviews).toFixed(1) 
      : 0;
  }, [kpiData, totalReviews]);

  // --- STATISTICS (USERS)  ---
  const userStats = useMemo(() => {
    const admins = users.filter(u => u.role === 'Admin').length;
    const managers = users.filter(u => u.role === 'Manager').length;
    const technicians = users.filter(u => u.role === 'Technician').length;
    const employees = users.filter(u => u.role === 'Employee').length;
    const customers = users.filter(u => u.role === 'Customer').length;
    
    return { admins, managers, technicians, employees, customers };
  }, [users]);



  // --- USER HANDLERS ---
  const initiateDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
        await deleteUser(userToDelete._id || userToDelete.id);
        setUsers(users.filter(u => (u._id || u.id) !== (userToDelete._id || userToDelete.id)));
        showNotification("User deleted successfully", "success");
    } catch (err) {
        showNotification(err.response?.data?.message || "Failed to delete user", "error");
    } finally {
        setShowDeleteConfirm(false);
        setUserToDelete(null);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditUserId(null);
    setShowPasswordInput(true);
    setFormData({ fullName: '', email: '', password: '', role: 'Technician', specialty: 'Smartphone' });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setEditUserId(user._id || user.id);
    setShowPasswordInput(false);
    setFormData({
        fullName: user.fullName,
        email: user.email,
        password: '',
        role: user.role,
        specialty: user.specialty || 'Smartphone'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        specialty: formData.role === 'Technician' ? formData.specialty : null
      };

      if (isEditing) {
          const response = await updateUser(editUserId, dataToSend);
          setUsers(users.map(u => (u._id || u.id) === editUserId ? response.user : u));
          showNotification("User updated successfully!", "success");
      } else {
          const newUser = await createUser(dataToSend);
          setUsers([newUser.user, ...users]);
          showNotification("User created successfully!", "success");
      }
      setShowModal(false);
    } catch (err) {
      showNotification(err.response?.data?.message || err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "Admin": return styles.roleAdmin;
      case "Manager": return styles.roleManager;
      case "Technician": return styles.roleTechnician;
      case "Employee": return styles.roleEmployee;
      default: return styles.roleCustomer;
    }
  };

  if (loading) return <div className={styles.loading}>Loading System...</div>;

  // --- RENDER ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <>
            <div className={styles.statsGrid}>
              <StatCard label="Total Tickets" value={stats.total} icon="📦" color="#2563eb" />
              <StatCard label="Open Requests" value={stats.pending} icon="🕒" color="#f59e0b" />
              <StatCard label="Completed" value={stats.completed} icon="✅" color="#10b981" />
              <StatCard label="In Warranty" value={stats.underWarranty} icon="🛡️" color="#3b82f6" />
            </div>
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Efficiency Rate</h3>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${stats.completedRate}%`, backgroundColor: "#10b981" }}></div>
                </div>
                <span className={styles.progressValue}>{stats.completedRate.toFixed(1)}% Resolved</span>
              </div>
              <div className={styles.chartCard}>
                <h3>Warranty Coverage</h3>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${stats.warrantyRate}%`, backgroundColor: "#3b82f6" }}></div>
                </div>
                <span className={styles.progressValue}>{stats.warrantyRate.toFixed(1)}% Under Guarantee</span>
              </div>
            </div>
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <h2>Recent Activity (Last 5)</h2>
                <button className={styles.viewAllBtn} onClick={() => setActiveTab("All Tickets")}>View Full List</button>
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
                type="text" placeholder="Search by ID or Customer..." className={styles.searchInput}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
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
            <div className={styles.statsGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <StatCard label="Admins" value={userStats.admins} icon="🛡️" color="#7e22ce" />
              <StatCard label="Managers" value={userStats.managers} icon="💼" color="#f59e0b" />
              <StatCard label="Technicians" value={userStats.technicians} icon="🔧" color="#3b82f6" />
              <StatCard label="Employees" value={userStats.employees} icon="👔" color="#10b981" />
              <StatCard label="Customers" value={userStats.customers} icon="👥" color="#64748b" />
            </div>

            <div className={styles.tableSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2>System Users</h2>
                <button className={styles.btnSubmit} onClick={openCreateModal}>+ Create User</button>
              </div>

              <table className={styles.miniTable}>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Specialty</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id || u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.email}</td>
                      <td><span className={`${styles.badge} ${getRoleBadgeClass(u.role)}`}>{u.role}</span></td>
                      <td>{u.specialty || "-"}</td>
                      <td>
                        <button className={styles.actionBtn} onClick={() => openEditModal(u)} title="Edit User">✏️</button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => initiateDelete(u)} title="Delete User">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );

      case "Reports":
        return (
          <div className={styles.reportsContainer}>
            <div className={styles.statsGrid}>
              <StatCard label="Total Feedbacks" value={totalReviews} icon="💬" color="#2563eb" />
              <StatCard label="Avg. Rating" value={`${avgRating} / 5`} icon="⭐" color="#eab308" />
            </div>
            <div className={styles.chartGrid}>
              <div className={styles.chartCard}>
                <h3>Rating Distribution</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="rating" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3>Satisfaction Mix</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count">
                        {chartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
        
      // TAB 4: SETTINGS
      case "Settings":
        return (
          <div className={styles.settingsWrapper}>
            <header style={{ marginBottom: '1.5rem' }}>
              <h2>System Settings</h2>
              <p className={styles.subLabel}>Configure system-wide settings and rules</p>
            </header>

            <section className={styles.settingsSection}>
              <h3><span>⚙️</span> Warranty Rules</h3>
              <div className={styles.formGroup}>
                <label className={styles.statLabel}>Standard Warranty Period (months)</label>
                <input 
                  type="number" 
                  value={warrantyPeriod} 
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    setWarrantyPeriod(value);
                    localStorage.setItem('warrantyPeriod', value.toString());
                  }}
                  className={styles.searchInput} 
                  style={{ maxWidth: '200px' }} 
                  min="1"
                />
                <p className={styles.subLabel}>Products purchased within this period are automatically validated as under warranty</p>
              </div>
              <div className={styles.highlightGroup}>
                <p style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '8px' }}>Current Rule</p>
                <p className={styles.idCell} style={{ fontSize: '0.85rem', margin: '2px 0', fontFamily: 'monospace' }}>
                  R1: If purchase date ≤ {warrantyPeriod} months → Under Warranty
                </p>
                <p className={styles.idCell} style={{ fontSize: '0.85rem', margin: '2px 0', fontFamily: 'monospace' }}>
                  R2: If purchase date {'>'} {warrantyPeriod} months → Out of Warranty
                </p>
              </div>
            </section>
            
            <section className={styles.settingsSection}>
                <h3><span>🔄</span> Return Policy</h3>
                <div className={styles.formGroup}>
                <label className={styles.statLabel}>Return Eligibility Window</label>
                <div className={styles.inlineInputGroup}>
                    <input 
                    type="number" 
                    value={returnPolicyDays} 
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 0;
                        setReturnPolicyDays(value);
                        localStorage.setItem('returnPolicyDays', value.toString());
                    }}
                    className={styles.searchInput} 
                    style={{ width: '100px' }} 
                    min="1"
                    />
                    <span className={styles.subLabel}>Days from date of purchase</span>
                </div>
                </div>

                <div className={styles.returnRuleBox}>
                <p className={styles.returnRuleTitle}>Return Policy Logic Check</p>
                <p className={styles.returnRuleText}>
                    IF (days_since_purchase) ≤ {returnPolicyDays} → <span className={styles.returnEligible}>ELIGIBLE</span>
                </p>
                <p className={styles.returnRuleText}>
                    IF (days_since_purchase) {'>'} {returnPolicyDays} → <span className={styles.returnExpired}>EXPIRED</span>
                </p>
                </div>
            </section>

            <section className={styles.settingsSection}>
              <h3>Notification Templates</h3>
              <div className={styles.formGroup}>
                <label className={styles.statLabel}>Email Template</label>
                <textarea 
                  className={styles.textareaField} 
                  defaultValue={`Dear {customer_name},\n\nYour repair request {ticket_id} has been {status}.\n\n{details}\n\nThank you for choosing our service.`}
                />
                <div className={styles.variableContainer}>
                  <span className={styles.subLabel} style={{ width: '100%' }}>Available Variables:</span>
                  {['{customer_name}', '{ticket_id}', '{status}', '{details}', '{repair_center}'].map(tag => (
                    <span key={tag} className={styles.variableBadge}>{tag}</span>
                  ))}
                </div>
              </div>
            </section>

            <div className={styles.saveActions}>
              <button 
                className={styles.btnSubmit} 
                style={{ padding: '10px 30px' }}
                onClick={() => showNotification("Settings saved successfully!", "success")}
              >
                Save Settings
              </button>
            </div>
          </div>
        );

      case "Reports":
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
        <div><h1>Admin Dashboard</h1><p className={styles.welcomeText}>Electronics Returns & Repairs Management</p></div>
      </header>

      <nav className={styles.tabsNav}>
        {["Overview", "All Tickets", "User Management", "Reports", "Settings"].map((tab) => (
          <button key={tab} className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      <main>{renderTabContent()}</main>

      {/* --- CREATE / EDIT MODAL --- */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>{isEditing ? 'Edit User' : 'Create New User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              
              <div className={styles.formGroup}>
                <div className={styles.passwordHeader}>
                    <label style={{marginBottom: 0}}>Password</label>
                    {isEditing && (
                        <button 
                            type="button" 
                            className={styles.btnResetLink}
                            onClick={() => setShowPasswordInput(!showPasswordInput)}
                        >
                            {showPasswordInput ? 'Cancel Reset' : 'Reset Password'}
                        </button>
                    )}
                </div>
                
                {showPasswordInput && (
                    <input 
                        type="password" 
                        required={!isEditing} 
                        placeholder={isEditing ? "Enter new password to reset" : "Enter password"}
                        value={formData.password} 
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    />
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label>Role</label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="Customer">Customer</option>
                  <option value="Technician">Technician</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              {formData.role === "Technician" && (
                <div className={`${styles.formGroup} ${styles.highlightGroup}`}>
                  <label>Specialty</label>
                  <select value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}>
                    <option value="Smartphone">Smartphone</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Desktop">Desktop</option>
                  </select>
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowModal(false)} className={styles.btnCancel}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <span className={styles.spinner}></span> : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRM DELETE MODAL --- */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.deleteModalContent}`}>
              <h3 className={styles.deleteTitle}>Delete User?</h3>
              <p>Are you sure you want to delete <strong>{userToDelete?.fullName}</strong>?</p>
              
              <div className={styles.modalActions} style={{justifyContent: 'center', marginTop: '1.5rem'}}>
                  <button onClick={() => setShowDeleteConfirm(false)} className={styles.btnCancel}>Cancel</button>
                  <button onClick={confirmDelete} className={styles.btnDelete}>Yes, Delete</button>
              </div>
          </div>
        </div>
      )}

    </div>
  );
};

const TicketTable = ({ data }) => (
  <table className={styles.miniTable}>
    <thead>
      <tr><th>Ticket ID</th><th>Customer</th><th>Status</th><th>Warranty</th></tr>
    </thead>
    <tbody>
      {data.map((t) => (
        <tr key={t._id}>
          <td className={styles.idCell}>#{t.ticketId || t._id.substring(0, 6)}</td>
          <td>{t.contactInfo?.fullName || "N/A"}</td>
          <td>
            <span className={`${styles.badge} ${styles[t.status?.toLowerCase().replace(/ /g, "-")] || styles.submitted}`}>
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
    <div className={styles.iconBox} style={{ backgroundColor: `${color}15`, color: color }}>{icon}</div>
    <div className={styles.cardInfo}>
      <h3 className={styles.statLabel}>{label}</h3>
      <p className={styles.statValue}>{value}</p>
    </div>
  </div>
);

export default AdminDashboard;