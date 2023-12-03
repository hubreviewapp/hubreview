import { Route, Routes } from 'react-router-dom';
import AnalyticsPage from "./pages/AnalyticsPage";
import PRListPage from "./pages/PRListPage";
import PRCreationPage from "./pages/PRCreationPage";
import NavBar from "./components/NavBar";
import PRDetailsPage from "./pages/PRDetailsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<NavBar />}>
        <Route index element={<PRListPage />} />
        <Route path="/pulls/create" element={<PRCreationPage />} />
        <Route path="/pulls/:pullid" element={<PRDetailsPage id={"1"} name={"pull request"} />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* TODO
        <Route path="*" element={<NotFoundPage />} />
        */}
      </Route>
    </Routes>
  )
}

export default App
