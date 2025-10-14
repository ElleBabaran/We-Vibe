import "./App.css";
import "./Account.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Account() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "user@example.com", // This will be populated from user data
    password: "••••••••", // Masked password display
    gender: "",
    birthDay: "",
    birthMonth: "",
    birthYear: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Only allow changes to editable fields
    if (name === 'email' || name === 'password') {
      return; // Prevent changes to email and password
    }
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
                <div className="form-value-display">
                  {formData.email}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-value-display">
                  {formData.password}
                </div>
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