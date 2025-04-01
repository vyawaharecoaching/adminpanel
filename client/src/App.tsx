import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Teachers from "@/pages/teachers";
import Attendance from "@/pages/attendance";
import TestResults from "@/pages/test-results";
import Installments from "@/pages/installments";
import AccountSettings from "@/pages/account-settings";
import StudentRegistration from "@/pages/student-registration";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

const AppRoutes = () => {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/students" component={Students} />
        <ProtectedRoute path="/teachers" component={Teachers} />
        <ProtectedRoute path="/attendance" component={Attendance} />
        <ProtectedRoute path="/test-results" component={TestResults} />
        <ProtectedRoute path="/installments" component={Installments} />
        <ProtectedRoute path="/account-settings" component={AccountSettings} />
        <ProtectedRoute path="/student-registration" component={StudentRegistration} />
        <Route path="/:rest*">
          <NotFound />
        </Route>
      </Switch>
    </AuthProvider>
  );
};

function App() {
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
