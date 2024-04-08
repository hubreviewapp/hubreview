import { Route, Routes } from "react-router-dom";
import AnalyticsPage from "./pages/AnalyticsPage";
import NavBar from "./components/NavBar";
import PRDetailsPage from "./pages/PRDetailsPage";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

import RepositoriesPage from "./pages/RepositoriesPage";
import SignInPage from "./pages/SignInPage";
import PRCreationPage from "./pages/PRCreationPage";
import ApprRejRatesForAuthorPage from "./pages/ApprRejRatesForAuthorPage.tsx";
import ReviewQueuePage from "./pages/ReviewQueuePage.tsx";
import UserProvider from "./providers/UserProvider.tsx";
import NoRenderOnPath from "./utility/NoRenderOnPath";
import "@mantine/tiptap/styles.css";
import "@mantine/charts/styles.css";
import "./styles/filter.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={{
          primaryColor: "cyan",
          colors: {
            dark: [
              "#E0E1DD",
              "#778DA9",
              "#778DA9",
              "#778DA9",
              "#293757",
              "#222e49",
              "#1B263B",
              "#152942",
              "#0f1f31",
              "#0D1B2A",
            ],
          },
        }}
        defaultColorScheme="dark"
      >
        <UserProvider>
          <NoRenderOnPath noRenderPaths={["/signIn", "/logout", "/notfound"]}>
            <NavBar />
          </NoRenderOnPath>
          <Routes>
            <Route path="/" element={<ReviewQueuePage />} />
            <Route path="/pulls/pullrequest/:owner/:repoName/:prnumber">
              <Route path="reviews" element={<PRDetailsPage tab="reviews" />} />
              <Route path="commits" element={<PRDetailsPage tab="commits" />} />
              <Route path="details" element={<PRDetailsPage tab="details" />} />
              <Route path="" element={<PRDetailsPage />} />
            </Route>
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/createPR" element={<PRCreationPage />} />
            <Route path="/signIn" element={<SignInPage />} />
            <Route path="/pulls/create" element={<PRDetailsPage />} />

            <Route path="/analytics/author/rates" element={<ApprRejRatesForAuthorPage />} />

            {/* TODO
        <Route path="*" element={<NotFoundPage />} />
        */}
          </Routes>
        </UserProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
