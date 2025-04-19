import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from "recharts";
import { ChevronLeft, ChevronRight, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, isToday, isSameDay } from "date-fns";
import PageContainer from "@/components/layout/page-container";

// Sample colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tabValue, setTabValue] = useState("daily");

  // If user is not admin, redirect
  if (!user || user.role !== "admin") {
    return (
      <PageContainer title="Unauthorized">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </PageContainer>
    );
  }

  // Fetch installment data from API
  const { data: installments, isLoading } = useQuery({
    queryKey: ['/api/installments', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/installments?studentId=all');
      if (!res.ok) throw new Error('Failed to fetch installments');
      return res.json();
    }
  });

  // Navigate date based on view
  const navigateDate = (direction: 'prev' | 'next') => {
    if (tabValue === 'daily') {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 1) : addDays(currentDate, 1));
    } else if (tabValue === 'weekly') {
      setCurrentDate(direction === 'prev' ? subDays(currentDate, 7) : addDays(currentDate, 7));
    } else if (tabValue === 'yearly') {
      const newDate = new Date(currentDate);
      newDate.setFullYear(newDate.getFullYear() + (direction === 'prev' ? -1 : 1));
      setCurrentDate(newDate);
    }
  };

  // Calculate daily data
  const getDailyData = () => {
    if (!installments) return [];
    
    // Filter installments that were paid on the selected date
    const dailyPayments = installments.filter(
      (inst: any) => inst.status === 'paid' && inst.paymentDate && 
      isSameDay(new Date(inst.paymentDate), currentDate)
    );
    
    // Group by hour of day
    const hourlyData = Array(24).fill(0).map((_, idx) => ({
      hour: idx,
      amount: 0,
      count: 0
    }));
    
    dailyPayments.forEach((payment: any) => {
      const date = new Date(payment.paymentDate);
      const hour = date.getHours();
      hourlyData[hour].amount += payment.amount;
      hourlyData[hour].count += 1;
    });
    
    // Only return hours with activity
    return hourlyData.filter(item => item.amount > 0).map(item => ({
      ...item,
      hour: `${item.hour}:00`,
    }));
  };

  // Calculate weekly data
  const getWeeklyData = () => {
    if (!installments) return [];
    
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      // Filter payments made on this day
      const dayPayments = installments.filter(
        (inst: any) => inst.status === 'paid' && inst.paymentDate && 
        isSameDay(new Date(inst.paymentDate), day)
      );
      
      // Sum up amounts
      const totalAmount = dayPayments.reduce((sum: number, payment: any) => 
        sum + payment.amount, 0
      );
      
      return {
        day: format(day, 'EEEE'),
        date: format(day, 'MMM d'),
        amount: totalAmount,
        count: dayPayments.length,
        isToday: isToday(day)
      };
    });
  };

  // Calculate yearly data
  const getYearlyData = () => {
    if (!installments) return [];
    
    const year = currentDate.getFullYear();
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return monthNames.map((month, idx) => {
      // Filter payments made in this month of the selected year
      const monthPayments = installments.filter((inst: any) => {
        if (inst.status !== 'paid' || !inst.paymentDate) return false;
        const paymentDate = new Date(inst.paymentDate);
        return paymentDate.getFullYear() === year && paymentDate.getMonth() === idx;
      });
      
      // Sum up amounts
      const totalAmount = monthPayments.reduce((sum: number, payment: any) => 
        sum + payment.amount, 0
      );
      
      return {
        month,
        amount: totalAmount,
        count: monthPayments.length,
        isCurrent: new Date().getMonth() === idx && new Date().getFullYear() === year
      };
    });
  };

  // Calculate payment status distribution
  const getPaymentStatusData = () => {
    if (!installments) return [];
    
    const statusCount = {
      paid: { value: 0, label: 'Paid' },
      pending: { value: 0, label: 'Pending' },
      overdue: { value: 0, label: 'Overdue' }
    };
    
    installments.forEach((inst: any) => {
      statusCount[inst.status as keyof typeof statusCount].value += 1;
    });
    
    return Object.values(statusCount);
  };

  // Data for current view
  const data = {
    daily: getDailyData(),
    weekly: getWeeklyData(),
    yearly: getYearlyData()
  };

  // Format date for display
  const dateDisplay = () => {
    if (tabValue === 'daily') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (tabValue === 'weekly') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'yyyy');
    }
  };

  return (
    <PageContainer title="Financial Reports" subtitle="View earnings and payment statistics">
      <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-sm font-medium min-w-[150px] text-center">
              {dateDisplay()}
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigateDate('next')}
              disabled={tabValue === 'daily' && isToday(currentDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {tabValue === 'daily' && (
              <DatePicker
                date={currentDate}
                setDate={setCurrentDate}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
              <CardDescription>
                {tabValue === 'daily' ? 'Today\'s earnings' : 
                 tabValue === 'weekly' ? 'This week\'s earnings' : 'This year\'s earnings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{isLoading ? '...' : 
                  data[tabValue as keyof typeof data].reduce(
                    (sum: number, item: any) => sum + item.amount, 0
                  ).toLocaleString()
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Payments Received</CardTitle>
              <CardDescription>
                Number of payments processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {isLoading ? '...' : 
                  data[tabValue as keyof typeof data].reduce(
                    (sum: number, item: any) => sum + (item.count || 0), 0
                  )
                }
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Payment</CardTitle>
              <CardDescription>
                Average amount per payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₹{isLoading ? '...' : 
                  Math.round(
                    data[tabValue as keyof typeof data].reduce(
                      (sum: number, item: any) => sum + item.amount, 0
                    ) / 
                    Math.max(1, data[tabValue as keyof typeof data].reduce(
                      (sum: number, item: any) => sum + (item.count || 0), 0
                    ))
                  ).toLocaleString()
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="daily" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Earnings</CardTitle>
                <CardDescription>
                  Revenue distribution by hour for {format(currentDate, 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">Loading...</div>
                  ) : data.daily.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <FileBarChart className="h-16 w-16 mb-4 opacity-50" />
                      <p>No payments recorded for this day</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.daily}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                        />
                        <Legend />
                        <Bar dataKey="amount" name="Revenue" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>
                  Distribution of payment statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">Loading...</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPaymentStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="label"
                          label={({ name, percent }) => 
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {getPaymentStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [value, 'Count']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Revenue</CardTitle>
              <CardDescription>
                Daily revenue for the week of {dateDisplay()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : data.weekly.every(day => day.amount === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileBarChart className="h-16 w-16 mb-4 opacity-50" />
                    <p>No payments recorded for this week</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.weekly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                        labelFormatter={(value) => {
                          const item = data.weekly.find(d => d.day === value);
                          return item ? `${item.day}, ${item.date}` : value;
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="amount" 
                        name="Revenue" 
                        fill="#8884d8" 
                        stroke="#8884d8"
                        strokeWidth={1}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Revenue</CardTitle>
              <CardDescription>
                Monthly revenue for {currentDate.getFullYear()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">Loading...</div>
                ) : data.yearly.every(month => month.amount === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <FileBarChart className="h-16 w-16 mb-4 opacity-50" />
                    <p>No payments recorded for {currentDate.getFullYear()}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.yearly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        name="Revenue" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Reports;