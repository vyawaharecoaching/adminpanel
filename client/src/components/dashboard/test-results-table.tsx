import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TestResult } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface TestResultDisplay {
  id: number;
  name: string;
  className: string;
  date: string;
  avgScore: number;
  status: "pending" | "graded";
}

export const TestResultsTable = () => {
  const [testResults, setTestResults] = useState<TestResultDisplay[]>([]);
  
  const { isLoading, error } = useQuery({
    queryKey: ["/api/test-results"],
    queryFn: async () => {
      // In a real app, we would likely have a specific endpoint
      // that returns combined test results data
      const res = await fetch("/api/test-results");
      if (!res.ok) throw new Error("Failed to fetch test results");
      return await res.json() as TestResult[];
    },
    onSuccess: (data) => {
      // Process the test results to get average scores per test
      // Group by test name and class
      const testSummary = data.reduce((acc, result) => {
        const key = `${result.name}-${result.classId}`;
        if (!acc[key]) {
          acc[key] = {
            id: result.id,
            name: result.name,
            classId: result.classId,
            className: `Class ${result.classId}`, // In a real app, fetch class names
            date: result.date,
            scores: [],
            status: result.status
          };
        }
        
        acc[key].scores.push((result.score / result.maxScore) * 100);
        return acc;
      }, {} as Record<string, { 
        id: number; 
        name: string; 
        classId: number; 
        className: string; 
        date: string | Date; 
        scores: number[]; 
        status: string;
      }>);
      
      // Calculate average scores and format for display
      const results = Object.values(testSummary).map(test => {
        const avgScore = test.scores.length > 0 
          ? Math.round(test.scores.reduce((sum, score) => sum + score, 0) / test.scores.length) 
          : 0;
        
        return {
          id: test.id,
          name: test.name,
          className: test.className,
          date: typeof test.date === 'string' ? test.date : format(test.date, 'PPP'),
          avgScore,
          status: test.status as "pending" | "graded"
        };
      });
      
      setTestResults(results);
    }
  });

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 70) return "bg-amber-500";
    return "bg-red-600";
  };

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Test Results</h2>
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Avg. Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Recent Test Results</h2>
        <p className="text-red-500">Error loading test results</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Test Results</h2>
          <Button variant="ghost" className="text-primary text-sm font-medium" size="sm">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs text-gray-500 uppercase">Test Name</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Class</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Date</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Avg. Score</TableHead>
              <TableHead className="text-xs text-gray-500 uppercase">Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testResults.length > 0 ? (
              testResults.map((result) => (
                <TableRow key={result.id} className="hover:bg-gray-50">
                  <TableCell>{result.name}</TableCell>
                  <TableCell>{result.className}</TableCell>
                  <TableCell>{result.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">{result.avgScore}%</span>
                      <Progress 
                        className="w-16 h-2" 
                        value={result.avgScore}
                        indicatorColor={getProgressColor(result.avgScore)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={result.status === "graded" ? "success" : "outline"}>
                      {result.status === "graded" ? "Graded" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" className="text-primary" size="sm">
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No test results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TestResultsTable;
