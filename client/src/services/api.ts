import { format } from "date-fns";

export interface RawAttendance {
  class_id: string;
  date: string;
  status: "present" | "absent";
}

export const fetchTodayAttendance = async (): Promise<RawAttendance[]> => {
  const today = format(new Date(), "yyyy-MM-dd");
  const response = await fetch(`/api/attendance?date=${today}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch attendance data');
  }
  
  return response.json();
}; 