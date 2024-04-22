import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AnalyticsPage from "./pages/AnalyticsPage";
import NavBar from "./components/NavBar";
import PRDetailsPage from "./pages/PRDetailsPage";
import "@mantine/core/styles.css";
import { Center, Loader, MantineProvider } from "@mantine/core";

import RepositoriesPage from "./pages/RepositoriesPage";
import SignInPage from "./pages/SignInPage";
import PRCreationPage from "./pages/PRCreationPage";
import ApprRejRatesForAuthorPage from "./pages/ApprRejRatesForAuthorPage.tsx";
import ReviewQueuePage from "./pages/ReviewQueuePage.tsx";
import UserProvider from "./providers/UserProvider.tsx";
import "@mantine/tiptap/styles.css";
import "@mantine/charts/styles.css";
import "./styles/filter.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RepoAnalyticsPage from "./pages/RepoAnalyticsPage.tsx";
import { useUser } from "./providers/context-utilities.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function AppRoutes() {
  const location = useLocation();
  const { user, isLoadingUser } = useUser();

  if (isLoadingUser)
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );

  return (
    <>
      {user !== null && <NavBar />}
      <Routes>
        <Route path="/signIn" element={<SignInPage />} />
        {user ? (
          <>
            <Route path="/" element={<ReviewQueuePage />} />
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/analytics/:repoName/:owner" element={<RepoAnalyticsPage />} />
            <Route path="/analytics/author/rates" element={<ApprRejRatesForAuthorPage />} />
            <Route path="/createPR" element={<PRCreationPage />} />
            <Route path="/pulls/create" element={<PRDetailsPage />} />
            <Route path="/:owner/:repoName/pull/:prnumber">
              <Route path="reviews" element={<PRDetailsPage tab="reviews" />} />
              <Route path="commits" element={<PRDetailsPage tab="commits" />} />
              <Route path="details" element={<PRDetailsPage tab="details" />} />
              <Route path="" element={<PRDetailsPage />} />
            </Route>
            {/* TODO
              <Route path="*" element={<NotFoundPage />} />
            */}
          </>
        ) : (
          <Route path="*" element={<Navigate to="/signIn" state={{ previousLocation: location.pathname }} />} />
        )}
      </Routes>
    </>
  );
}

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
          <AppRoutes />
        </UserProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
