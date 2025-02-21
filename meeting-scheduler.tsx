"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Clock, Moon, Sun, Sparkles, DollarSign, Palette } from "lucide-react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Meeting title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  date: z.date({
    required_error: "A date is required.",
  }),
  duration: z.string({
    required_error: "Please select meeting duration",
  }),
  participants: z.array(z.string().email()).min(1, {
    message: "At least one participant is required",
  }),
  timezone: z.string({
    required_error: "Please select a timezone",
  }),
  priority: z.enum(["low", "medium", "high"]),
  themeColor: z.string(),
})

const durations = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
]

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
]

const meetingTemplates = [
  {
    name: "Quick Sync",
    duration: "15",
    description: "Brief alignment meeting",
    priority: "low",
  },
  {
    name: "Team Planning",
    duration: "60",
    description: "Detailed team planning session",
    priority: "medium",
  },
  {
    name: "Client Presentation",
    duration: "45",
    description: "Important client meeting",
    priority: "high",
  },
]

const themeColors = [
  { name: "Blue", value: "blue" },
  { name: "Purple", value: "purple" },
  { name: "Green", value: "green" },
  { name: "Red", value: "red" },
]

export default function MeetingScheduler() {
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [meetingCost, setMeetingCost] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      participants: [""],
      timezone: "UTC",
      priority: "medium",
      themeColor: "blue",
    },
  })

  // Calculate meeting cost based on participants and duration
  useEffect(() => {
    const participantsCount = form.watch("participants").length
    const duration = Number.parseInt(form.watch("duration") || "0")
    const averageHourlyRate = 100 // Assumed average hourly rate
    const cost = participantsCount * (duration / 60) * averageHourlyRate
    setMeetingCost(cost)
  }, [form.watch("participants"), form.watch("duration"), form])

  async function getSuggestedTimes(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      const response = await fetch("/api/suggest-times", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participants: values.participants,
          duration: values.duration,
          timezone: values.timezone,
        }),
      })
      const times = await response.json()
      setSuggestedTimes(times)
    } catch (error) {
      console.error("Error getting suggested times:", error)
    }
    setLoading(false)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedTime) {
      await getSuggestedTimes(values)
      return
    }

    // Trigger confetti on successful scheduling
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    console.log({ ...values, time: selectedTime })
  }

  const applyTemplate = (template: (typeof meetingTemplates)[0]) => {
    form.setValue("duration", template.duration)
    form.setValue("description", template.description)
    form.setValue("priority", template.priority as "low" | "medium" | "high")
  }

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <Card className="w-full max-w-3xl mx-auto bg-background">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Schedule AI-Powered Meeting</CardTitle>
              <CardDescription>Let AI help you find the optimal meeting time for all participants.</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Meeting Templates */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Quick Templates</h3>
            <div className="flex gap-2">
              {meetingTemplates.map((template) => (
                <Button key={template.name} variant="outline" size="sm" onClick={() => applyTemplate(template)}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter meeting title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <span className="flex items-center">
                              <Badge variant="outline" className="mr-2 bg-green-100">
                                Low
                              </Badge>
                              Regular catch-up
                            </span>
                          </SelectItem>
                          <SelectItem value="medium">
                            <span className="flex items-center">
                              <Badge variant="outline" className="mr-2 bg-yellow-100">
                                Medium
                              </Badge>
                              Important discussion
                            </span>
                          </SelectItem>
                          <SelectItem value="high">
                            <span className="flex items-center">
                              <Badge variant="outline" className="mr-2 bg-red-100">
                                High
                              </Badge>
                              Critical meeting
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter meeting description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {durations.map((duration) => (
                            <SelectItem key={duration.value} value={duration.value}>
                              {duration.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        <AnimatePresence>
                          {field.value.map((email, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-2"
                            >
                              <Input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                  const newParticipants = [...field.value]
                                  newParticipants[index] = e.target.value
                                  field.onChange(newParticipants)
                                }}
                                placeholder="Enter email"
                                className="w-64"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const newParticipants = field.value.filter((_, i) => i !== index)
                                  field.onChange(newParticipants)
                                }}
                              >
                                Remove
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            field.onChange([...field.value, ""])
                          }}
                        >
                          Add Participant
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Enter email addresses of meeting participants</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Meeting Cost Estimator */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">Estimated Meeting Cost</span>
                  </div>
                  <span className="text-lg font-bold">${meetingCost.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on average hourly rates and participant count
                </p>
              </div>

              <FormField
                control={form.control}
                name="themeColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Meeting Theme Color
                    </FormLabel>
                    <div className="flex gap-2">
                      {themeColors.map((color) => (
                        <div
                          key={color.value}
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                            field.value === color.value ? "border-primary" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => field.onChange(color.value)}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              {suggestedTimes.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium">AI Suggested Times</h3>
                    <p className="text-sm text-muted-foreground">Select one of the suggested meeting times:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {suggestedTimes.map((time) => (
                        <Badge
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className="cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => setSelectedTime(time)}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                  </motion.div>
                ) : suggestedTimes.length > 0 ? (
                  "Schedule Meeting"
                ) : (
                  "Get AI Suggestions"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

