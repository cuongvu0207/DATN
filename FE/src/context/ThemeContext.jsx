import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  //  Lấy theme đã lưu trong localStorage, nếu chưa có thì mặc định là "success"
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("appTheme") || "success";
  });

  //  Mỗi khi theme thay đổi -> lưu vào localStorage
  useEffect(() => {
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}

