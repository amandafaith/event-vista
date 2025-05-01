import React from "react";
import "../../styles/components.css";

const ClientSearch = ({
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
    <div
      className="search-container"
      style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1.5rem",
        maxWidth: "800px",
        width: "100%",
      }}
    >
      <div
        className="search-type-selector"
        style={{
          position: "relative",
          minWidth: "120px",
        }}
      >
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="search-select"
          style={{
            appearance: "none",
            backgroundColor: "var(--background-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            fontSize: "0.9rem",
            color: "var(--text-color)",
            cursor: "pointer",
            width: "100%",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
        >
          <option value="name">Name</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
        <div
          style={{
            position: "absolute",
            right: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--text-secondary)",
          }}
        >
          ▼
        </div>
      </div>

      <div
        className="search-input-wrapper"
        style={{
          flex: 1,
          position: "relative",
        }}
      >
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Search by ${searchType}...`}
          className="search-input"
          style={{
            width: "100%",
            padding: "0.75rem 1rem",
            paddingLeft: "2.5rem",
            fontSize: "0.9rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            backgroundColor: "var(--background-color)",
            color: "var(--text-color)",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "1rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-secondary)",
          }}
        >
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

      <button onClick={onSearch} className="search-button">
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

export default ClientSearch;
