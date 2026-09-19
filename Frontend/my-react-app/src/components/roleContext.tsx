import { createContext, useContext, useState, type ReactNode } from "react";

type RoleContextType = {
  username: string;
  email: string;
  role: string;
  setRole: (role: string) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState(() => {
    return {
      username: localStorage.getItem("username") || "Гость",
      email: localStorage.getItem("email") || "",
      role: localStorage.getItem("role") || "User",
    };
  });

  const setRole = (newRole: string) => {
    setUserData((prev) => {
      const updated = { ...prev, role: newRole };
      localStorage.setItem("role", newRole);
      return updated;
    });
  };

  return (
    <RoleContext.Provider
      value={{
        username: userData.username,
        email: userData.email,
        role: userData.role,
        setRole,
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
