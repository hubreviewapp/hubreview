import { Route, Routes } from "react-router-dom";
import AnalyticsPage from "./pages/AnalyticsPage";
import PRListPage from "./pages/PRListPage";
import NavBar from "./components/NavBar";
import PRDetailsPage from "./pages/PRDetailsPage";
import '@mantine/core/styles.css';
import { MantineProvider} from '@mantine/core';

import RepositoriesPage from "./pages/RepositoriesPage";
import SignInPage from "./pages/SignInPage";
import PRCreationPage from "./pages/PRCreationPage";
import ApprRejRatesForAuthorPage from "./pages/ApprRejRatesForAuthorPage.tsx";

function App() {

    return(
    <MantineProvider theme={{
   primaryColor: "cyan",
      colors: {
        dark: ['#E0E1DD', '#778DA9', '#778DA9', '#2f3d60', '#293757', '#222e49', '#1B263B', '#152942', '#0f1f31', '#0D1B2A'],
      },
    }} defaultColorScheme={'dark'}>
      <NavBar/>
    <Routes>
      <Route path="/" element={<PRListPage />}>
        {/* TODO
        <Route path="*" element={<NotFoundPage />} />
        */}
      </Route>
      <Route path="/pulls/:pullid" element={<PRDetailsPage id={"1"} name={"pull request"} />} />
      <Route path={"/repositories"} element={<RepositoriesPage/>}/>
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/createPR" element={<PRCreationPage />} />
      <Route path="/signIn" element={<SignInPage />} />
      <Route path="/pulls/create" element={<PRDetailsPage  id={"1"} name={"pull request"} />} />

      <Route path="/analytics/author/rates" element={<ApprRejRatesForAuthorPage />} />
    </Routes>
    </MantineProvider>

  );
}

export default App;
