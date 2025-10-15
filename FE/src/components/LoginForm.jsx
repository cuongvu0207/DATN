import React, { useState } from "react";
import text from "../constants/text";
import "bootstrap/dist/css/bootstrap.min.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (role) => {
    console.log("Login with:", { username, password, role });
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{
        backgroundImage: `url(${text.background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Card form */}
      <div
      className="card shadow border rounded-4 d-flex flex-column justify-content-between"
      style={{
        width: "100%",
        maxWidth: "25%",
        minHeight: "30%",
        borderRadius: "16px",
      }}
>
        <div className="card-body p-4">
          <h4 className="text-center mb-4 fw-bold">{text.loginTitle}</h4>

          {/* Username */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder={text.username}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder={text.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Remember + Forgot */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="remember" />
              <label htmlFor="remember" className="form-check-label">
                {text.remember}
              </label>
            </div>
            <a href="#" className="small text-primary">
              {text.forgotPassword}
            </a>
          </div>
        </div>

        {/* Footer buttons liền khung */}
        <div className="card-footer d-flex p-0 border-0">
          <button
            className="btn btn-secondary w-50"
            style={{
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "0px",
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              marginRight: "-1px",
              paddingTop: "16px",
              paddingBottom: "16px",
            }}
            onClick={() => handleLogin("manager")}
          >
            {text.manager}
          </button>
          <button
            className="btn btn-success w-50"
            style={{
              borderBottomRightRadius: "16px",
              borderBottomLeftRadius: "0px",
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              marginLeft: "-1px",
              paddingTop: "16px",
              paddingBottom: "16px",
              backgroundColor: "#20c997",
              borderColor: "#20c997",
            }}
            onClick={() => handleLogin("sales")}
          >
            {text.sales}
          </button>
        </div>
      </div>
    </div>
  );
}
