import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  return (
    <Route path={path}>
      {(params) => {
        // Using the auth context inside the render function to ensure it's used
        // within the AuthProvider
        const { user, isLoading } = useAuth();
        
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Only allow admin and teacher roles to access the app
        if (user.role !== 'admin' && user.role !== 'teacher') {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
              <p className="text-center mb-4">
                This application is only accessible to administrators and teachers.
              </p>
              <button 
                onClick={() => window.location.href = "/auth"}
                className="px-4 py-2 bg-primary text-white rounded-md"
              >
                Back to Login
              </button>
            </div>
          );
        }

        return <Component params={params} />;
      }}
    </Route>
  );
}
