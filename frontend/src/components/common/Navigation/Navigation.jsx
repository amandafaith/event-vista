import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import styles from "./Navigation.module.css";

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={styles.navigation}>
      <div className={styles.navLeft}>
        <h1 className={styles.appName}>Event Vista</h1>
        <div className={styles.navLinks}>
          <NavLink
            to="/dashboard"
            className={`${styles.navLink} ${
              isActive("/dashboard") ? styles.active : ""
            }`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/profile"
            className={`${styles.navLink} ${
              isActive("/profile") ? styles.active : ""
            }`}
          >
            Profile
          </NavLink>
          <NavLink
            to="/venues"
            className={`${styles.navLink} ${
              isActive("/venues") ? styles.active : ""
            }`}
          >
            Venues
          </NavLink>
          <NavLink
            to="/vendors"
            className={`${styles.navLink} ${
              isActive("/vendors") ? styles.active : ""
            }`}
          >
            Vendors
          </NavLink>
          <NavLink
            to="/clients"
            className={`${styles.navLink} ${
              isActive("/clients") ? styles.active : ""
            }`}
          >
            Clients
          </NavLink>
        </div>
      </div>
      <div className={styles.navRight}>
        <div className={styles.userInfo}>
          <span className={styles.welcomeText}>
            Welcome, {user?.name || "User"}
          </span>
          <img
            src={user?.pictureUrl}
            alt="Profile"
            className={styles.profilePic}
          />
        </div>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
