import { useEffect, useState, useMemo } from "react";
import { getAllTicketsAdmin } from "@/services/ticketService";
import styles from "./AdminDashboard.module.css";

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");

  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getAllTicketsAdmin();
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.contactInfo?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, filterStatus]);

  // Statistics for Overview
  const stats = useMemo(() => {
    const total = tickets.length;
    const completed = tickets.filter(t => t.status === 'Completed').length;
    const pending = tickets.filter(t => ['Pending', 'Submitted', 'In Progress'].includes(t.status)).length;
    const underWarranty = tickets.filter(t => t.warrantyStatus === 'Under Warranty').length;

    return {
      total,
      completed,
      completedRate: total > 0 ? (completed / total) * 100 : 0,
      pending,
      underWarranty,
      warrantyRate: total > 0 ? (underWarranty / total) * 100 : 0
    };
  }, [tickets]);

  if (loading) return <div className={styles.loading}>Loading System...</div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <>
            {/* STATS CARDS */}
            <div className={styles.statsGrid}>
              <StatCard label="Total Tickets" value={stats.total} icon="📦" color="#2563eb" />
              <StatCard label="Open Requests" value={stats.pending} icon="🕒" color="#f59e0b" />
              <StatCard label="Completed" value={stats.completed} icon="✅" color="#10b981" />
              <StatCard label="In Warranty" value={stats.underWarranty} icon="🛡️" color="#3b82f6" />
            </div>

            {/* PROGRESS BARS */}
            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3>Efficiency Rate</h3>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${stats.completedRate}%`, backgroundColor: '#10b981' }}></div>
                </div>
                <span className={styles.progressValue}>{stats.completedRate.toFixed(1)}% Resolved</span>
              </div>
              <div className={styles.chartCard}>
                <h3>Warranty Coverage</h3>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar} style={{ width: `${stats.warrantyRate}%`, backgroundColor: '#3b82f6' }}></div>
                </div>
                <span className={styles.progressValue}>{stats.warrantyRate.toFixed(1)}% Under Guarantee</span>
              </div>
            </div>

          {/*recent tickets table*/}
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
          <p className={styles.welcomeText}>Electronics Returns & Repairs Management</p>
        </div>
      </header>

      <nav className={styles.tabsNav}>
        {["Overview", "All Tickets", "User Management", "Reports", "Settings"].map((tab) => (
          <button
            key={tab}
            className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
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
      {data.map(t => (
        <tr key={t._id}>
          <td className={styles.idCell}>#{t.ticketId || t._id.substring(0, 6)}</td>
          <td>{t.contactInfo?.fullName || 'N/A'}</td>
          <td>
            <span className={`${styles.badge} ${styles[t.status?.toLowerCase().replace(/ /g, '-')] || styles.submitted}`}>
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