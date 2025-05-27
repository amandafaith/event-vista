import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Configure axios defaults
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Add a request interceptor to handle CSRF token and auth headers
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any necessary headers here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token refresh for auth endpoints
    if (
      originalRequest.url === "/api/auth/user" ||
      originalRequest.url === "/api/auth/login" ||
      originalRequest.url === "/api/auth/refresh" ||
      originalRequest.url === "/api/auth/logout"
    ) {
      return Promise.reject(error);
    }

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await axiosInstance.post("/api/auth/refresh");

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        if (refreshError.response?.status === 401) {
          // Use window.location.replace instead of href to prevent back button issues
          window.location.replace("/login");
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden errors
    if (error.response?.status === 403) {
      // Use window.location.replace instead of href to prevent back button issues
      window.location.replace("/login");
      return Promise.reject(error);
    }

    // Handle CORS errors
    if (error.message === "Network Error" && !error.response) {
      console.error("CORS or Network Error:", error);
      // You might want to show a user-friendly error message here
      return Promise.reject(
        new Error(
          "Unable to connect to the server. Please check your connection."
        )
      );
    }

    return Promise.reject(error);
  }
);

export const venueApi = {
  getAllVenues: () => axiosInstance.get("/api/venues/all"),
  getVenueById: (id) => axiosInstance.get(`/api/venues/find/${id}`),
  getVenueByName: (name) => axiosInstance.get(`/api/venues/find/name/${name}`),
  getVenueByLocation: (location) =>
    axiosInstance.get(`/api/venues/find/location/${location}`),
  getVenueByPhoneNumber: (phoneNumber) =>
    axiosInstance.get(`/api/venues/find/phone/${phoneNumber}`),
  getVenueByEmail: (emailAddress) =>
    axiosInstance.get(`/api/venues/find/email/${emailAddress}`),
  createVenue: (data) => axiosInstance.post("/api/venues/add", data),
  updateVenue: (id, data) =>
    axiosInstance.put(`/api/venues/update/${id}`, data),
  deleteVenue: (id) => axiosInstance.delete(`/api/venues/delete/${id}`),
};

export const eventApi = {
  getAllEvents: () => axiosInstance.get("/api/events/all"),
  getEventById: (id) => axiosInstance.get(`/api/events/find/${id}`),
  getEventByName: (name) => axiosInstance.get(`/api/events/find/name/${name}`),
  getEventsByVenue: (venueId) =>
    axiosInstance.get(`/api/events/find/venue/${venueId}`),
  getEventsByClient: (clientId) =>
    axiosInstance.get(`/api/events/find/client/${clientId}`),
  getEventsByVendor: (vendorId) =>
    axiosInstance.get(`/api/events/find/vendor/${vendorId}`),
  createEvent: (eventData) => axiosInstance.post("/api/events/add", eventData),
  updateEvent: (id, eventData) =>
    axiosInstance.put(`/api/events/update/${id}`, eventData),
  deleteEvent: (id) => axiosInstance.delete(`/api/events/delete/${id}`),
  rebookEvent: (id, rebookData) =>
    axiosInstance.post(`/api/events/rebook/${id}`, rebookData),
  getUpcomingEvents: () => axiosInstance.get("/api/events/upcoming-events"),
  getEventsByDate: (date) => axiosInstance.get(`/api/events/by-date/${date}`),
  getEventsByDateRange: (startDate, endDate) =>
    axiosInstance.get(`/api/events/by-date-range`, {
      params: { startDate, endDate },
    }),
};

export const weatherApi = {
  getWeather: (location, date) =>
    axiosInstance.get("/api/weather", {
      params: {
        location,
        date,
      },
    }),
};

export const vendorApi = {
  getAllVendors: () => axiosInstance.get("/api/vendors/all"),
  getVendorById: (id) => axiosInstance.get(`/api/vendors/find/${id}`),
  getVendorByName: (name) =>
    axiosInstance.get(`/api/vendors/find/name/${name}`),
  getVendorBySkillId: (skillId) =>
    axiosInstance.get(`/api/vendors/find/skills/id/${skillId}`),
  getVendorBySkillName: (skillName) =>
    axiosInstance.get(
      `/api/vendors/find/skills/name/${encodeURIComponent(skillName)}`
    ),
  removeSkillFromVendors: (skillId) =>
    axiosInstance.delete(`/api/vendors/delete/skills/${skillId}`),
  getVendorByLocation: (location) =>
    axiosInstance.get(`/api/vendors/find/location/${location}`),
  getVendorByPhoneNumber: (phoneNumber) =>
    axiosInstance.get(`/api/vendors/find/phone/${phoneNumber}`),
  getVendorByEmail: (emailAddress) =>
    axiosInstance.get(`/api/vendors/find/email/${emailAddress}`),
  createVendor: (vendorData) =>
    axiosInstance.post("/api/vendors/add", vendorData),
  updateVendor: (id, vendorData) =>
    axiosInstance.put(`/api/vendors/update/${id}`, vendorData),
  deleteVendor: (id) => axiosInstance.delete(`/api/vendors/delete/${id}`),
};

export const skillApi = {
  getAllSkills: () => axiosInstance.get("/api/skills/all"),
  getSkillById: (id) => axiosInstance.get(`/api/skills/find/${id}`),
  getSkillByName: (name) => axiosInstance.get(`/api/skills/find/name/${name}`),
  createSkill: (data) => axiosInstance.post("/api/skills/add", data),
  updateSkill: (id, data) =>
    axiosInstance.put(`/api/skills/update/${id}`, data),
  deleteSkill: (id) => axiosInstance.delete(`/api/skills/delete/${id}`),
};

//export const guestApi = {
//    getAllGuests:
//    createGuest:
//    updateRsvp:
//    deleteGuest:
//};

export const clientApi = {
  getAllClients: () => axiosInstance.get("/api/clients/all"),
  getClientById: (id) => axiosInstance.get(`/api/clients/find/${id}`),
  getClientByName: (name) =>
    axiosInstance.get(`/api/clients/find/name/${name}`),
  getClientByLocation: (location) =>
    axiosInstance.get(`/api/clients/find/location/${location}`),
  getClientByPhoneNumber: (phoneNumber) =>
    axiosInstance.get(`/api/clients/find/phone/${phoneNumber}`),
  getClientByEmail: (emailAddress) =>
    axiosInstance.get(`/api/clients/find/email/${emailAddress}`),
  createClient: (data) => axiosInstance.post("/api/clients/add", data),
  updateClient: (id, data) =>
    axiosInstance.put(`/api/clients/update/${id}`, data),
  deleteClient: (id) => axiosInstance.delete(`/api/clients/delete/${id}`),
};

//export const calendarApi = {
//    getCalendarByUser: (userId) =>
//       axiosInstance.get(`/api/calendars/user/${userId}`),
//    updateCalendar: (id, data) => axiosInstance.put(`/api/calendars/${id}`, data),
//    deleteCalendar: (id) => axiosInstance.delete(`/api/calendars/${id}`),
//};

export const calendarApi = {
  getMyCalendar: () => axiosInstance.get("/api/calendars/my"),
  getCalendarById: (id) => axiosInstance.get(`/api/calendars/${id}`),
  addCalendar: (calendarData) =>
    axiosInstance.post("/api/calendars", calendarData),
  deleteCalendar: (id) => axiosInstance.delete(`/api/calendars/${id}`),
};

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post("/api/auth/login", credentials);
      return response;
    } catch (error) {
      console.error("Login API error:", error.response?.data || error.message);
      throw error;
    }
  },
  register: async (userData) => {
    try {
      const response = await axiosInstance.post("/api/auth/register", userData);
      return response;
    } catch (error) {
      console.error(
        "Register API error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  getCurrentUser: async () => {
    try {
      const response = await axiosInstance.get("/api/auth/user");
      return response;
    } catch (error) {
      console.error(
        "Get current user API error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  logout: async () => {
    try {
      const response = await axiosInstance.post("/api/auth/logout");
      return response;
    } catch (error) {
      console.error("Logout API error:", error.response?.data || error.message);
      throw error;
    }
  },
  getOAuthUrl: () => "http://localhost:8080/oauth2/authorization/google",
  exchangeCodeForToken: async (code) => {
    try {
      const response = await axiosInstance.post("/api/auth/oauth2/callback", {
        code,
      });
      return response;
    } catch (error) {
      console.error(
        "OAuth2 code exchange error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  resetPassword: async (data) => {
    try {
      const response = await axiosInstance.post(
        "/api/auth/reset-password",
        data
      );
      return response;
    } catch (error) {
      console.error(
        "Reset password API error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  refreshToken: async () => {
    try {
      const response = await axiosInstance.post("/api/auth/refresh");
      return response;
    } catch (error) {
      console.error(
        "Refresh token API error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};

export const userApi = {
  getUserProfile: () => axiosInstance.get("/api/auth/profile"),
  updateUser: (data) => axiosInstance.put("/api/auth/update-profile", data),
  deleteUser: (userId) =>
    axiosInstance.post("/api/auth/delete", null, {
      params: { userId },
    }),
  fetchUsers: () => axiosInstance.get("/api/auth/all"),
};
