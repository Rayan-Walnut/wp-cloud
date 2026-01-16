import React from "react";
import { AppProvider } from "./context/AppContext";
import Router from "./app/Routes";

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
