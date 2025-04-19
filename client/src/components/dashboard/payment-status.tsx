import { useQuery } from "@tanstack/react-query";
import { Installment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export const PaymentStatus = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/installments"],
    queryFn: async () => {
      const paidRes = await fetch("/api/installments?status=paid");
      const pendingRes = await fetch("/api/installments?status=pending");
      const overdueRes = await fetch("/api/installments?status=overdue");
      
      if (!paidRes.ok || !pendingRes.ok || !overdueRes.ok) {
        throw new Error("Failed to fetch installment data");
      }
      
      const paidData: Installment[] = await paidRes.json();
      const pendingData: Installment[] = await pendingRes.json();
      const overdueData: Installment[] = await overdueRes.json();
      
      return {
        paid: paidData,
        pending: pendingData,
        overdue: overdueData
      };
    }
  });

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <Skeleton className="h-7 w-48 mb-4" />
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-2 w-full rounded" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Payment Status</h2>
        <p className="text-red-500">Error loading payment data</p>
      </div>
    );
  }

  // Calculate percentages
  const total = data ? data.paid.length + data.pending.length + data.overdue.length : 0;
  const paidPercentage = total > 0 ? Math.round((data?.paid.length / total) * 100) : 0;
  const pendingPercentage = total > 0 ? Math.round((data?.pending.length / total) * 100) : 0;
  const overduePercentage = total > 0 ? Math.round((data?.overdue.length / total) * 100) : 0;

  return (
    <div className="bg-background rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Payment Status</h2>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">Paid Installments</span>
            <span className="text-sm font-medium text-green-600">{paidPercentage}%</span>
          </div>
          <Progress value={paidPercentage} indicatorColor="bg-green-600" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">Pending Installments</span>
            <span className="text-sm font-medium text-amber-500">{pendingPercentage}%</span>
          </div>
          <Progress value={pendingPercentage} indicatorColor="bg-amber-500" />
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">Overdue Installments</span>
            <span className="text-sm font-medium text-red-600">{overduePercentage}%</span>
          </div>
          <Progress value={overduePercentage} indicatorColor="bg-red-600" />
        </div>
        <Button className="w-full mt-4 bg-primary hover:bg-primary/90">
          View Payment Details
        </Button>
      </div>
    </div>
  );
};

export default PaymentStatus;
