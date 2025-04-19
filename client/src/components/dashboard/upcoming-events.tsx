import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";

export const UpcomingEvents = () => {
  const { isLoading, error, data } = useQuery({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events data");
      return await res.json() as Event[];
    }
  });

  // Filter and sort events by date to get upcoming events
  // In a real app, this filtering would likely happen on the server
  const upcomingEvents = data?.filter(event => {
    const eventDate = typeof event.date === 'string' ? parseISO(event.date) : event.date;
    return eventDate >= new Date();
  }).sort((a, b) => {
    const dateA = typeof a.date === 'string' ? parseISO(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? parseISO(b.date) : b.date;
    return dateA.getTime() - dateB.getTime();
  }).slice(0, 3);

  const formatEventDate = (date: Date | string) => {
    const eventDate = typeof date === 'string' ? parseISO(date) : date;
    return {
      day: format(eventDate, 'd'),
      month: format(eventDate, 'MMM')
    };
  };

  if (isLoading) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <Skeleton className="h-7 w-40 mb-4" />
        <ul className="space-y-4">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex">
              <div className="flex-shrink-0">
                <Skeleton className="h-12 w-12" />
              </div>
              <div className="ml-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32 mt-1" />
              </div>
            </li>
          ))}
        </ul>
        <Skeleton className="h-10 w-full mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Upcoming Events</h2>
        <p className="text-red-500">Error loading events data</p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
      <ul className="space-y-4">
        {upcomingEvents?.length ? (
          upcomingEvents.map((event) => {
            const { day, month } = formatEventDate(event.date);
            return (
              <li key={event.id} className="flex">
                <div className="flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-primary">{day}</span>
                    <span className="text-xs text-gray-600">{month}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-gray-600">
                    {event.targetGrades ? `${event.targetGrades} • ` : ''}
                    {event.time}
                  </p>
                </div>
              </li>
            );
          })
        ) : (
          <li className="py-6 text-center text-gray-500">
            No upcoming events
          </li>
        )}
      </ul>
      <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/10">
        View Calendar
      </Button>
    </div>
  );
};

export default UpcomingEvents;
