import React from "react";
import styles from "./VendorPage.module.css";

const VendorSearch = ({
  searchTerm,
  setSearchTerm,
  searchType,
  setSearchType,
  onSearch,
}) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchTypeSelector}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className={styles.searchSelect}
        >
          <option value="name">Name</option>
          <option value="location">Location</option>
          <option value="skills">Skill</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
        <div className={styles.selectArrow}>▼</div>
      </div>

      <div className={styles.searchInputWrapper}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Search by ${searchType}...`}
          className={styles.searchInput}
        />
        <div className={styles.searchIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 21L16.65 16.65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <button onClick={onSearch} className={styles.searchButton}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ marginRight: "0.5rem" }}
        >
          <path
            d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 21L16.65 16.65"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Search
      </button>
    </div>
  );
};

export default VendorSearch;
