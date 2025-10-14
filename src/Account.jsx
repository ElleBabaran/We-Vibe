import "./App.css";
import "./Account.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Account() {
  const navigate = useNavigate();
  
  // Initialize state with localStorage values
  const [formData, setFormData] = useState(() => {
    try {
      const storedEmail = localStorage.getItem("wv_user_email") || localStorage.getItem("user_email") || "";
      const storedPassword = localStorage.getItem("wv_user_password") || localStorage.getItem("user_password") || "";
      const masked = storedPassword ? "*".repeat(storedPassword.length) : "********";
      
      return {
        username: "",
        email: storedEmail,
        password: masked,
        gender: "",
        birthDay: "",
        birthMonth: "",
        birthYear: "",
        country: ""
      };
    } catch {
      return {
        username: "",
        email: "",
        password: "********",
        gender: "",
        birthDay: "",
        birthMonth: "",
        birthYear: "",
        country: ""
      };
    }
  });

  // Fetch email from Spotify if missing
  useEffect(() => {
    if (formData.email) return;
    const token = localStorage.getItem("spotify_access_token");
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.email) {
          localStorage.setItem("wv_user_email", data.email);
          setFormData(prev => ({ ...prev, email: data.email }));
        }
      } catch (_) {}
    })();
  }, [formData.email]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    console.log("Profile saved:", formData);
    // Add save functionality here later
    alert("Profile saved successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    navigate("/");
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="home-container">
      <Sidebar />
      
      <div className="account-container">
        <div className="account-content">
          {/* ====================================================== */}
          {/* START OF THE NEW WRAPPER DIV                           */}
          {/* ====================================================== */}
          <div className="account-form-wrapper">

            <h1 className="account-title">Edit personal info</h1>
            
            <form className="account-form" onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className="form-input"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="Your email"
                  value={formData.email}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="********"
                  value={formData.password}
                  readOnly
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-select"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required // Make selection mandatory
                >
                  <option value="" disabled hidden>
                      Select your gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <div className="date-inputs">
                  <input
                    type="number"
                    name="birthDay"
                    className="date-input day-input"
                    placeholder="DD"
                    min="1"
                    max="31"
                    value={formData.birthDay}
                    onChange={handleInputChange}
                  />
                  <select
                    name="birthMonth"
                    className="date-input month-input"
                    value={formData.birthMonth}
                    onChange={handleInputChange}
                    required // Make selection mandatory
                  >
                    <option value="" disabled hidden>
                      Select your month
                    </option>
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="birthYear"
                    className="date-input year-input"
                    placeholder="YYYY"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.birthYear}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Country or region</label>
                <select
                  name="country"
                  className="form-select"
                  value={formData.country}
                  onChange={handleInputChange}
                  required // Make selection mandatory
                >
                  <option value="" disabled hidden>
                      Select your country
                  </option>
                  <option value="Philippines">Philippines</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Japan">Japan</option>
                  <option value="South Korea">South Korea</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Thailand">Thailand</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input type="checkbox" className="form-checkbox" />
                  <span>Share my registration data with WeVibe's content providers for marketing purposes.</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-button">
                  Save Profile
                </button>
              </div>
            </form>

            <div className="logout-section">
              <button type="button" className="logout-button" onClick={handleLogout}>
                Log Out
              </button>
            </div>

          </div>
          {/* ====================================================== */}
          {/* END OF THE NEW WRAPPER DIV                             */}
          {/* ====================================================== */}
        </div>
      </div>
    </div>
  );
}