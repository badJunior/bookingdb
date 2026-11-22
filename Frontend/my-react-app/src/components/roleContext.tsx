import { createContext, useContext, useState, type ReactNode } from "react";

type RoleContextType = {
  username: string;
  email: string;
  role: string;
  setRole: (role: string) => void;
  refresh: () => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState(() => ({
    username: localStorage.getItem("username") || "Гость",
    email: localStorage.getItem("email") || "",
    role: localStorage.getItem("role") || "User",
  }));

  const setRole = (newRole: string) => {
    setUserData((previous) => {
      const updated = { ...previous, role: newRole };
      localStorage.setItem("role", newRole);
      return updated;
    });
  };

  const refresh = () => {
    setUserData({
      username: localStorage.getItem("username") || "Гость",
      email: localStorage.getItem("email") || "",
      role: localStorage.getItem("role") || "User",
    });
  };

  return (
    <RoleContext.Provider
      value={{
        username: userData.username,
        email: userData.email,
        role: userData.role,
        setRole,
        refresh,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
