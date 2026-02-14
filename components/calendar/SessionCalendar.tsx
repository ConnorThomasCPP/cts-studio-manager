'use client'

/**
 * Session Calendar Component
 *
 * Full-featured calendar view showing all studio sessions
 * Uses react-big-calendar for calendar UI
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Session } from '@/types/enhanced'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Configure date-fns localizer
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Calendar event type
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Session
}

// Status color mapping
const STATUS_COLORS = {
  planned: '#3b82f6',    // blue
  active: '#22c55e',     // green
  completed: '#6b7280',  // gray
  cancelled: '#ef4444',  // red
}

export default function SessionCalendar() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await import('@/lib/services/session-service').then((mod) =>
        mod.sessionService.getSessions()
      )
      setSessions(data || [])
    } catch (error) {
      console.error('Failed to load sessions:', error)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  // Transform sessions into calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return sessions.map((session) => {
      const start = new Date(session.start_time)
      let end: Date

      if (session.end_time) {
        end = new Date(session.end_time)
      } else {
        // Default to 1 hour duration if no end time specified
        end = new Date(start.getTime() + 60 * 60 * 1000)
      }

      return {
        id: session.id,
        title: `${session.session_name} - ${session.client_name}`,
        start,
        end,
        resource: session,
      }
    })
  }, [sessions])

  // Handle event click - navigate to session detail
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      router.push(`/sessions/${event.id}`)
    },
    [router]
  )

  // Handle slot selection - navigate to new session form with preselected time
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      const startTime = format(slotInfo.start, "yyyy-MM-dd'T'HH:mm")
      const endTime = format(slotInfo.end, "yyyy-MM-dd'T'HH:mm")
      router.push(`/sessions/new?start=${startTime}&end=${endTime}`)
    },
    [router]
  )

  // Custom event style based on session status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const backgroundColor = STATUS_COLORS[event.resource.status] || STATUS_COLORS.planned
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    }
  }, [])

  // Custom toolbar
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV')
    }

    const goToNext = () => {
      toolbar.onNavigate('NEXT')
    }

    const goToToday = () => {
      toolbar.onNavigate('TODAY')
    }

    const label = () => {
      const date = toolbar.date
      if (toolbar.view === 'month') {
        return format(date, 'MMMM yyyy')
      } else if (toolbar.view === 'week') {
        return format(date, 'MMMM yyyy')
      } else if (toolbar.view === 'day') {
        return format(date, 'MMMM dd, yyyy')
      }
      return format(date, 'MMMM yyyy')
    }

    return (
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button onClick={goToBack} variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={goToToday} variant="outline">
            Today
          </Button>
          <Button onClick={goToNext} variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold ml-2">{label()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => toolbar.onView('month')}
            variant={toolbar.view === 'month' ? 'default' : 'outline'}
            size="sm"
          >
            Month
          </Button>
          <Button
            onClick={() => toolbar.onView('week')}
            variant={toolbar.view === 'week' ? 'default' : 'outline'}
            size="sm"
          >
            Week
          </Button>
          <Button
            onClick={() => toolbar.onView('day')}
            variant={toolbar.view === 'day' ? 'default' : 'outline'}
            size="sm"
          >
            Day
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Session Calendar
          </CardTitle>
          <CardDescription>Team-wide session schedule</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Session Calendar
            </CardTitle>
            <CardDescription>
              All studio sessions • Click to view details, select time slot to create new
            </CardDescription>
          </div>
          <Link href="/sessions/new">
            <Button size="sm">
              <CalendarIcon className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
          <span className="font-medium">Status:</span>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STATUS_COLORS.planned }}
            />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STATUS_COLORS.active }}
            />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STATUS_COLORS.completed }}
            />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: STATUS_COLORS.cancelled }}
            />
            <span>Cancelled</span>
          </div>
        </div>

        {/* Calendar */}
        <div className="calendar-container" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            eventPropGetter={eventStyleGetter}
            components={{
              toolbar: CustomToolbar,
            }}
            tooltipAccessor={(event: CalendarEvent) =>
              `${event.resource.session_name}\nClient: ${event.resource.client_name}\nEngineer: ${event.resource.engineer}\nStatus: ${event.resource.status}`
            }
          />
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No sessions scheduled yet</p>
            <Link href="/sessions/new">
              <Button>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Create Your First Session
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
