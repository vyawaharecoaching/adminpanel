import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

type ApiStatus = "loading" | "success" | "error";

interface ApiResult {
  status: ApiStatus;
  data?: any;
  error?: string;
}

const DebugPage: React.FC = () => {
  const [apiHello, setApiHello] = useState<ApiResult>({ status: "loading" });
  const [dbStatus, setDbStatus] = useState<ApiResult>({ status: "loading" });
  const [teachers, setTeachers] = useState<ApiResult>({ status: "loading" });
  const [students, setStudents] = useState<ApiResult>({ status: "loading" });
  const [installments, setInstallments] = useState<ApiResult>({ status: "loading" });
  const [testResults, setTestResults] = useState<ApiResult>({ status: "loading" });
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Function to force a hard refresh that bypasses browser cache
  const forceHardRefresh = () => {
    localStorage.clear(); // Clear local storage
    sessionStorage.clear(); // Clear session storage
    window.location.href = window.location.href + '?t=' + new Date().getTime(); // Force browser to bypass cache
  };

  useEffect(() => {
    // Check basic API connection
    fetch(`/api/debug/hello?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => setApiHello({ status: "success", data }))
      .catch(err => setApiHello({ status: "error", error: err.message }));

    // Check database connection
    fetch(`/api/debug/check-db?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => setDbStatus({ status: "success", data }))
      .catch(err => setDbStatus({ status: "error", error: err.message }));

    // Get teachers data
    fetch(`/api/debug/teachers?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Teachers data:", data);
        setTeachers({ status: "success", data });
      })
      .catch(err => setTeachers({ status: "error", error: err.message }));

    // Get students data
    fetch(`/api/debug/students?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Students data:", data);
        setStudents({ status: "success", data });
      })
      .catch(err => setStudents({ status: "error", error: err.message }));

    // Get installments data
    fetch(`/api/debug/installments?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Installments data:", data);
        setInstallments({ status: "success", data });
      })
      .catch(err => setInstallments({ status: "error", error: err.message }));
      
    // Get test results data
    fetch(`/api/debug/test-results?t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => {
        console.log("Test results data:", data);
        setTestResults({ status: "success", data });
      })
      .catch(err => setTestResults({ status: "error", error: err.message }));
  }, [refreshKey]);

  const createTestUser = () => {
    fetch("/api/debug/create-test-user", { method: "POST" })
      .then(res => res.json())
      .then(data => {
        alert(`Test user created: ${data.user.username} (${data.user.role})`);
      })
      .catch(err => {
        alert(`Error creating test user: ${err.message}`);
      });
  };

  const StatusBadge = ({ status }: { status: ApiStatus }) => {
    switch (status) {
      case "loading":
        return <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Loading</span>
        </Badge>;
      case "success":
        return <Badge variant="default" className="bg-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Connected</span>
        </Badge>;
      case "error":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          <span>Error</span>
        </Badge>;
    }
  };

  return (
    <div className="container py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Vyawahare Coaching Classes</CardTitle>
          <CardDescription>
            System Diagnostic Page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* API Status */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">API Status</CardTitle>
                  <StatusBadge status={apiHello.status} />
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                {apiHello.status === "success" && (
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(apiHello.data, null, 2)}
                  </pre>
                )}
                {apiHello.status === "error" && (
                  <p className="text-destructive">{apiHello.error}</p>
                )}
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Database</CardTitle>
                  <StatusBadge status={dbStatus.status} />
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                {dbStatus.status === "success" && (
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(dbStatus.data, null, 2)}
                  </pre>
                )}
                {dbStatus.status === "error" && (
                  <p className="text-destructive">{dbStatus.error}</p>
                )}
              </CardContent>
            </Card>

            {/* User Count */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">User Data</CardTitle>
                  <div className="flex gap-1">
                    <StatusBadge status={teachers.status} />
                    <StatusBadge status={students.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">Teachers:</span> {teachers.status === "success" ? teachers.data.length : "Loading..."}
                  </div>
                  <div>
                    <span className="font-semibold">Students:</span> {students.status === "success" ? students.data.length : "Loading..."}
                  </div>
                  <div>
                    <span className="font-semibold">Installments:</span> {installments.status === "success" ? 
                      (installments.data.all ? installments.data.all.length : installments.data.count) 
                      : "Loading..."}
                  </div>
                  <div>
                    <span className="font-semibold">Test Results:</span> {testResults.status === "success" ? 
                      (Array.isArray(testResults.data) ? testResults.data.length : 0)
                      : "Loading..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Teachers List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Teachers</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                {teachers.status === "loading" && <p>Loading teachers data...</p>}
                {teachers.status === "error" && <p className="text-destructive">{teachers.error}</p>}
                {teachers.status === "success" && (
                  <div className="space-y-2">
                    {teachers.data.length === 0 ? (
                      <p>No teachers found</p>
                    ) : (
                      teachers.data.map((teacher: any) => (
                        <div key={teacher.id} className="border p-3 rounded-md">
                          <div className="font-semibold">{teacher.fullName}</div>
                          <div className="text-sm text-muted-foreground">ID: {teacher.id}</div>
                          <div className="text-sm">{teacher.email || "No email provided"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Students List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Students</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                {students.status === "loading" && <p>Loading students data...</p>}
                {students.status === "error" && <p className="text-destructive">{students.error}</p>}
                {students.status === "success" && (
                  <div className="space-y-2">
                    {students.data.length === 0 ? (
                      <p>No students found</p>
                    ) : (
                      students.data.map((student: any) => (
                        <div key={student.id} className="border p-3 rounded-md">
                          <div className="font-semibold">{student.fullName}</div>
                          <div className="text-sm text-muted-foreground">ID: {student.id}</div>
                          <div className="text-sm">Grade: {student.grade || "Not specified"}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                {testResults.status === "loading" && <p>Loading test results data...</p>}
                {testResults.status === "error" && <p className="text-destructive">{testResults.error}</p>}
                {testResults.status === "success" && (
                  <div className="space-y-2">
                    {!testResults.data || testResults.data.length === 0 ? (
                      <p>No test results found</p>
                    ) : (
                      testResults.data.map((result: any) => (
                        <div key={result.id} className="border p-3 rounded-md">
                          <div className="font-semibold">{result.name}</div>
                          <div className="text-sm">Student ID: {result.studentId}</div>
                          <div className="text-sm">Score: {result.score}/{result.maxScore}</div>
                          <div className="text-sm">
                            Status: <Badge>{result.status}</Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Installments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Installments</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                {installments.status === "loading" && <p>Loading installments data...</p>}
                {installments.status === "error" && <p className="text-destructive">{installments.error}</p>}
                {installments.status === "success" && (
                  <div className="space-y-2">
                    {!installments.data || 
                     (!installments.data.all && !installments.data.pending && !installments.data.overdue && !installments.data.paid) ? (
                      <p>No installments found</p>
                    ) : (
                      <>
                        {installments.data.pending && installments.data.pending.map((inst: any) => (
                          <div key={inst.id} className="border p-3 rounded-md border-yellow-300">
                            <div className="font-semibold">Amount: ₹{inst.amount}</div>
                            <div className="text-sm">Student ID: {inst.studentId}</div>
                            <div className="text-sm">
                              Status: <Badge variant="outline" className="bg-yellow-100">{inst.status}</Badge>
                            </div>
                          </div>
                        ))}
                        
                        {installments.data.overdue && installments.data.overdue.map((inst: any) => (
                          <div key={inst.id} className="border p-3 rounded-md border-red-300">
                            <div className="font-semibold">Amount: ₹{inst.amount}</div>
                            <div className="text-sm">Student ID: {inst.studentId}</div>
                            <div className="text-sm">
                              Status: <Badge variant="destructive">{inst.status}</Badge>
                            </div>
                          </div>
                        ))}
                        
                        {installments.data.paid && installments.data.paid.map((inst: any) => (
                          <div key={inst.id} className="border p-3 rounded-md border-green-300">
                            <div className="font-semibold">Amount: ₹{inst.amount}</div>
                            <div className="text-sm">Student ID: {inst.studentId}</div>
                            <div className="text-sm">
                              Status: <Badge variant="default" className="bg-green-500">{inst.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex gap-3 flex-wrap">
            <Button onClick={createTestUser}>Create Test Admin</Button>
            <Button onClick={() => setRefreshKey(Date.now())}>Refresh Data</Button>
            <Button onClick={forceHardRefresh} variant="destructive">Force Hard Refresh</Button>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/auth">Go to Login</Link>
            </Button>
            <Button asChild>
              <Link to="/">Go to Dashboard</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default DebugPage;