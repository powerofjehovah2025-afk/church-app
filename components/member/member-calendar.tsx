"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  type: "duty" | "task";
  title: string;
  date: string;
  time?: string;
  status: string;
  priority?: string;
}

export function MemberCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate]);

  const fetchCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

      const response = await fetch(
        `/api/member/calendar?start_date=${startDate}&end_date=${endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error("Failed to fetch calendar events");
      }
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{ date: number; events: CalendarEvent[] }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: 0, events: [] });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => e.date === dateStr);
      days.push({ date: day, events: dayEvents });
    }

    return days;
  };

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === "duty") {
      return "bg-blue-500/20 text-blue-300 border-blue-500/50";
    }
    if (event.priority === "urgent") {
      return "bg-red-500/20 text-red-300 border-red-500/50";
    }
    if (event.priority === "high") {
      return "bg-orange-500/20 text-orange-300 border-orange-500/50";
    }
    return "bg-green-500/20 text-green-300 border-green-500/50";
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const days = getDaysInMonth();
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
            className="border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="border-slate-700"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
            className="border-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-slate-900/40 border-slate-700/50">
        <CardContent className="pt-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-400 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isToday =
                isCurrentMonth &&
                day.date === today.getDate() &&
                currentDate.getMonth() === today.getMonth();
              const isCurrentMonthDay = day.date > 0;

              return (
                <div
                  key={index}
                  className={`min-h-[80px] p-1 border rounded ${
                    isCurrentMonthDay
                      ? isToday
                        ? "bg-blue-500/10 border-blue-500/30"
                        : "bg-slate-800/30 border-slate-700/50"
                      : "bg-slate-900/20 border-slate-800/30"
                  }`}
                >
                  {isCurrentMonthDay && (
                    <>
                      <div
                        className={`text-xs font-medium mb-1 ${
                          isToday ? "text-blue-300" : "text-slate-300"
                        }`}
                      >
                        {day.date}
                      </div>
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-[10px] px-1 py-0.5 rounded border truncate ${getEventColor(
                              event
                            )}`}
                            title={event.title}
                          >
                            {event.type === "duty" && <CalendarIcon className="h-2 w-2 inline mr-1" />}
                            {event.type === "task" && <Clock className="h-2 w-2 inline mr-1" />}
                            {event.title}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-[10px] text-slate-400 px-1">
                            +{day.events.length - 2} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {events.length > 0 && (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <h3 className="text-white font-semibold mb-4">Upcoming Events</h3>
            <div className="space-y-2">
              {events.slice(0, 10).map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {event.type === "duty" ? (
                          <CalendarIcon className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Clock className="h-4 w-4 text-green-400" />
                        )}
                        <h4 className="text-white text-sm font-medium">{event.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400">
                        {new Date(event.date).toLocaleDateString()}
                        {event.time && ` • ${event.time}`}
                      </p>
                    </div>
                    <Badge className={getEventColor(event)}>{event.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {events.length === 0 && (
        <Card className="bg-slate-900/40 border-slate-700/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No events scheduled for this month</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

