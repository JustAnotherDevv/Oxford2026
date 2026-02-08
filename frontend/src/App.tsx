import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/landing";
import DashboardLayout from "@/pages/dashboard/layout";
import DashboardPage from "@/pages/dashboard/index";
import AssetsPage from "@/pages/dashboard/assets";
import CardsPage from "@/pages/dashboard/cards";
import PaymentsPage from "@/pages/dashboard/payments";
import SettingsPage from "@/pages/dashboard/settings";
import PrivacyPage from "@/pages/dashboard/privacy";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
