import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllTicketsAdmin } from "@/services/ticketService";
import { getAllUsers, deleteUser, createUser, updateUser } from "@/services/authService"; 
import styles from "./AdminDashboard.module.css";
import { useNotification } from "@/context/NotificationContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { getFeedbackKPIs } from "@/services/ticketService";

// Helper για τον τύπο υπηρεσίας (όπως στον Staff)
function getServiceType(t) { 
  return t.serviceType || t.type || "Repair"; 
}

// Helper για τα Stale Tickets (παραμένουν ανοιχτά >5 λεπτά)
const getStaleTickets = (tickets) => {
  const FIVE_MINUTES_IN_MS = 5 * 60 * 1000;
  const now = new Date();
  
  return tickets.filter(t => {
    const isClosed = ["Completed", "Closed", "Cancelled"].includes(t.status);
    const createdDate = new Date(t.createdAt);
    const age = now - createdDate;
    return !isClosed && age > FIVE_MINUTES_IN_MS;
  });
};

const AdminDashboard = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  // --- Data States ---
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  // --- Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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

  // Stale Tickets Memoization
  const staleTickets = useMemo(() => getStaleTickets(tickets), [tickets]);


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


  // STATISTICS CALCULATIONS 
  const filteredTickets = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    if (to) to.setHours(23, 59, 59, 999); // includes the whole end day

    return tickets.filter((t) => {
      const matchesSearch = t.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.contactInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || t.status === filterStatus;
      const ticketType = getServiceType(t);
      const matchesType = filterType === "All" || ticketType === filterType;

      // Date Range Logic
      let matchesDate = true;
      if (from || to) {
        const ticketDate = new Date(t.updatedAt || t.createdAt);
        if (from && ticketDate < from) matchesDate = false;
        if (to && ticketDate > to) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [tickets, searchTerm, filterStatus, filterType, dateFrom, dateTo]);

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

  // REPORTS COMPUTED VALUES 
  const filteredFeedbackData = useMemo(() => {
    // Filter tickets with feedback by date range
    const ticketsWithFeedback = filteredTickets.filter(t => t.feedback && t.feedback.rating);
    
    // Count ratings 1-5
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ticketsWithFeedback.forEach(t => {
      const rating = t.feedback.rating;
      if (rating >= 1 && rating <= 5) {
        counts[rating]++;
      }
    });
    
    return [1, 2, 3, 4, 5].map(num => ({
      _id: num,
      count: counts[num]
    }));
  }, [filteredTickets]);

  const chartData = useMemo(() => {
    return filteredFeedbackData.map(item => ({
      rating: `${item._id} Star`,
      count: item.count
    }));
  }, [filteredFeedbackData]);

  const totalReviews = useMemo(() => {
    return filteredFeedbackData.reduce((acc, curr) => acc + curr.count, 0);
  }, [filteredFeedbackData]);

  const avgRating = useMemo(() => {
    return totalReviews > 0 
      ? (filteredFeedbackData.reduce((a, b) => a + (b._id * b.count), 0) / totalReviews).toFixed(1) 
      : 0;
  }, [filteredFeedbackData, totalReviews]);

  // --- TICKET STATUS DISTRIBUTION FOR PIE CHART ---
  const statusData = useMemo(() => {
  const counts = filteredTickets.reduce((acc, ticket) => {
    const status = ticket.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.keys(counts).map(status => ({
    name: status,
    count: counts[status]
  }));
}, [filteredTickets]);

// --- REPAIR VS RETURN DATA FOR PIE CHART ---
  const repairReturnData = useMemo(() => {
    const repairs = filteredTickets.filter(t => t.serviceType === "Repair").length;
    const returns = filteredTickets.filter(t => t.serviceType === "Return").length;
    
    return [
      { name: "Repair", value: repairs, color: "#10b981" },
      { name: "Return", value: returns, color: "#f59e0b" }
    ];
  }, [filteredTickets]);

// TICKET TYPE DISTRIBUTION (Smartphones, TVs, etc.)
  const ticketTypeData = useMemo(() => {
    const counts = filteredTickets.reduce((acc, t) => {
      const type = t.product?.type || "Other"; 
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(counts).map(type => ({
      name: type,
      value: counts[type]
    }));
  }, [filteredTickets]);


// Colors for the Pie Chart slices
const TYPE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

// ESCALATED TICKETS DATA 
  const escalationData = useMemo(() => {
    const escalatedCount = filteredTickets.filter(t => t.escalated === true).length;
    const normalCount = filteredTickets.length - escalatedCount;

    return [
      { name: 'Escalated', value: escalatedCount },
      { name: 'Normal', value: normalCount }
    ];
  }, [filteredTickets]);

// Χρώματα για το γράφημα (Κόκκινο για τα Escalated)
const ESCALATION_COLORS = ['#ef4444', '#e2e8f0'];

// MONTHLY TRENDS DATA - Repairs vs Returns by Month
const monthlyData = useMemo(() => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const data = months.map(month => ({ name: month, repairs: 0, returns: 0 }));

  filteredTickets.forEach(t => {
    const monthIndex = new Date(t.createdAt).getMonth();
    if (t.serviceType === "Return") {
      data[monthIndex].returns++;
    } else {
      data[monthIndex].repairs++;
    }
  });
  return data;
}, [filteredTickets]);


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
          {/* TICKET ALERT BOX */}
          {staleTickets.length > 0 && (
            <div className={styles.staleAlert}>
              <div className={styles.alertIcon}>⚠️</div>
              <div className={styles.alertText}>
                <strong>Attention:</strong> There are {staleTickets.length} tickets open for more than 5 minutes.
              </div>
              <button 
                className={styles.alertAction}
                onClick={() => {
                  setFilterStatus("All");
                  setSearchTerm("");
                  setActiveTab("All Tickets"); // Switch to list 
                }}
              >
                View Stale Tickets
              </button>
            </div>
          )}
            <div className={styles.statsGrid}>
              <StatCard label="Total Tickets" value={stats.total} icon="📦" color="#2563eb" />
              <StatCard label="Open Requests" value={stats.pending} icon="🕒" color="#f59e0b" />
              <StatCard label="Completed" value={stats.completed} icon="✅" color="#10b981" />
              <StatCard label="In Warranty" value={stats.underWarranty} icon="🛡️" color="#3b82f6" />
              <StatCard label="Stale Tickets" value={staleTickets.length} icon="⏳" color="#ef4444" />
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
              <SimpleTicketTable data={tickets.slice(0, 5)} />
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
              <select className={styles.filterSelect} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Repair">Repair</option>
                <option value="Return">Return</option>
              </select>
              <select className={styles.filterSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <AdvancedTicketTable data={filteredTickets} navigate={navigate} />
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
            <div className={styles.filterBar}> 
              <div className={styles.dateFilterGroup}>
                <label>From:</label>
                <input type="date" className={styles.searchInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <label>To:</label>
                <input type="date" className={styles.searchInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
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
              {/* TICKET STATUS CHART */}
              <div className={styles.chartCard}>
                <h3>Tickets by Status</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Monthly Trends Repairs vs Returns */}
              <div className={styles.chartCard} style={{ gridColumn: 'span 2' }}>
                <h3>Monthly Trends: Repairs vs Returns</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="repairs" stroke="#10b981" strokeWidth={2} name="Repairs" />
                      <Line type="monotone" dataKey="returns" stroke="#ef4444" strokeWidth={2} name="Returns" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* REPAIR VS RETURN PIE CHART */}
              <div className={styles.chartCard}>
                <h3>Service Type Distribution</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={repairReturnData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {repairReturnData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* TICKET TYPE DISTRIBUTION PIE CHART */}
              <div className={styles.chartCard}>
                <h3>Ticket Types (Product Categories)</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ticketTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ticketTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Γράφημα Escalated Tickets */}
              <div className={styles.chartCard}>
                <h3>Escalation Status</h3>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={escalationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {escalationData.map((entry, index) => (
                          <Cell key={`cell-esc-${index}`} fill={ESCALATION_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
        
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
                  rows="8"
                  style={{ minWidth: '100%', maxWidth: '100%' }}
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

      default: return null;
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

// 1. Πίνακας για το Overview (Παραμένει ο αρχικός/απλός)
const SimpleTicketTable = ({ data }) => (
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

// 2. Πίνακας για το All Tickets (Ακριβές αντίγραφο του Staff Table - ΜΟΝΟ οι στήλες που ζήτησες)
const AdvancedTicketTable = ({ data, navigate }) => (
  <div className={styles.tableContainer}>
    <table className={styles.miniTable}>
      <thead>
        <tr>
          <th>Ticket ID</th>
          <th>Customer</th>
          <th>Type</th>
          <th>Assign Technician</th>
          <th>Status Action</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t._id}>
            <td style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
              {t.ticketId}
              {/* Show a red dot if the ticket is stale */}
              {getStaleTickets([t]).length > 0 && (
                <span title="Overdue" style={{ color: 'red', marginLeft: '5px' }}>●</span>
              )}
            </td>
            <td>
              <div style={{ fontWeight: "600" }}>{t.contactInfo?.fullName || t.customer?.fullName || 'N/A'}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{t.contactInfo?.email || t.customer?.email}</div>
            </td>
            <td>
              <span style={{ 
                fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '6px',
                backgroundColor: getServiceType(t) === 'Return' ? '#fef2f2' : '#eff6ff',
                color: getServiceType(t) === 'Return' ? '#dc2626' : '#2563eb',
                border: '1px solid currentColor',
                display: 'inline-block'
              }}>
                {getServiceType(t).toUpperCase()}
              </span>
            </td>
            <td>
              <div style={{ fontSize: "0.9rem", color: "#475569" }}>
                {t.assignedRepairCenter?.fullName || t.assignedTechnician?.fullName ? (
                  <span>🔧 {t.assignedRepairCenter?.fullName || t.assignedTechnician?.fullName}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </div>
            </td>
            <td>
              <span className={`${styles.badge} ${styles[t.status?.toLowerCase().replace(/ /g, '-')] || styles.submitted}`}>
                {t.status}
              </span>
            </td>
            <td>
              <button 
                className={styles.viewLink} 
                onClick={() => navigate(`/tickets/${t._id}`)}
              >
                View
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
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