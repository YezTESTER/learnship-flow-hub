import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Check, Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  employer_name: string | null;
}

interface FeedbackSubmission {
  id: string;
  learner_id: string;
  month: number;
  year: number;
  status: string;
  submitted_at: string | null;
  due_date: string;
  submission_data: Record<string, any> | null;
  mentor_rating: number | null;
  mentor_comments: string | null;
  mentor_approved_at: string | null;
  needs_mentor_review: boolean | null;
}

const pointsForRating: Record<number, number> = { 1: 1, 2: 5, 3: 10 };

const ManageFeedback: React.FC = () => {
  const { profile: me } = useAuth();
  const [learners, setLearners] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedLearner, setSelectedLearner] = useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [submission, setSubmission] = useState<FeedbackSubmission | null>(null);
  const [comments, setComments] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
const [hoverRating, setHoverRating] = useState<number | null>(null);
const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadLearners = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, employer_name")
        .eq("role", "learner")
        .order("full_name");
      if (error) {
        console.error(error);
        toast.error("Failed to load learners");
        return;
      }
      setLearners(data || []);
    };
    loadLearners();
  }, []);

  const filteredLearners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter(
      (l) =>
        l.full_name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.employer_name?.toLowerCase().includes(q)
    );
  }, [learners, search]);

  const month = selectedDate ? selectedDate.getMonth() + 1 : new Date().getMonth() + 1;
  const year = selectedDate ? selectedDate.getFullYear() : new Date().getFullYear();

  const openLearner = (l: Profile) => {
    setSelectedLearner(l);
    setOpen(true);
    setTimeout(fetchSubmission, 0);
  };

  const fetchSubmission = async () => {
    if (!selectedLearner) return;
    const { data, error } = await supabase
      .from("feedback_submissions")
      .select("*")
      .eq("learner_id", selectedLearner.id)
      .eq("month", month)
      .eq("year", year)
      .maybeSingle();
    if (error && error.code !== "PGRST116") {
      console.error(error);
      toast.error("Failed to fetch submission");
      return;
    }
    setSubmission((data as any) || null);
    setComments((data?.mentor_comments as string) || "");
    setAcknowledged(Boolean(data?.mentor_approved_at));
    setRating((data?.mentor_rating as number) || null);
  };

  useEffect(() => {
    if (open) fetchSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const notifyLearner = async (learnerId: string, title: string, message: string, type: string = "info") => {
    const { error } = await supabase.rpc("create_notification", {
      target_user_id: learnerId,
      notification_title: title,
      notification_message: message,
      notification_type: type,
    });
    if (error) console.error("notify error", error);
  };

  const handleAcknowledge = async () => {
    if (!submission || !selectedLearner) return;
    setLoading(true);
    const { error } = await supabase
      .from("feedback_submissions")
      .update({
        mentor_approved_at: acknowledged ? null : new Date().toISOString(),
        needs_mentor_review: acknowledged ? true : false,
      })
      .eq("id", submission.id);
    if (error) {
      toast.error("Failed to update acknowledgement");
    } else {
      setAcknowledged(!acknowledged);
      toast.success(!acknowledged ? "Marked as received" : "Acknowledgement removed");
      await notifyLearner(
        selectedLearner.id,
        !acknowledged ? "Feedback Received" : "Feedback Reopened",
        !acknowledged
          ? `Your monthly feedback for ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })} was received.`
          : `Your monthly feedback for ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })} requires updates.`,
        !acknowledged ? "success" : "warning"
      );
      fetchSubmission();
    }
    setLoading(false);
  };

  const handleSaveComments = async () => {
    if (!submission || !selectedLearner) return;
    setLoading(true);
    const { error } = await supabase
      .from("feedback_submissions")
      .update({ mentor_comments: comments })
      .eq("id", submission.id);
    if (error) {
      toast.error("Failed to save comments");
    } else {
      toast.success("Comments saved");
      await notifyLearner(
        selectedLearner.id,
        "Manager Comment Added",
        `A comment was added to your ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })} feedback.`
      );
      fetchSubmission();
    }
    setLoading(false);
  };

  const handleSetRating = async (value: number) => {
    if (!submission || !selectedLearner) return;
    setLoading(true);
    const { error } = await supabase
      .from("feedback_submissions")
      .update({ mentor_rating: value })
      .eq("id", submission.id);
    if (error) {
      toast.error("Failed to set rating");
      setLoading(false);
      return;
    }

    // Award achievement points
    const points = pointsForRating[value] || 0;
    if (points > 0) {
      const { error: achErr } = await supabase.from("achievements").insert({
        learner_id: selectedLearner.id,
        badge_type: "feedback_rating",
        badge_name: `${value}★ Feedback Rating`,
        description: `Rated ${value} star${value > 1 ? "s" : ""} for ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })} feedback`,
        points_awarded: points,
        badge_color: "#F59E0B",
        badge_icon: "star",
      });
      if (achErr) console.error("achievement insert error", achErr);
    }

    setRating(value);
    toast.success("Rating saved");

    // Special badge for consistency: award once when 3 or more 3★ ratings exist
    if (value === 3) {
      const { count, error: cntErr } = await supabase
        .from("feedback_submissions")
        .select("id", { count: "exact", head: true })
        .eq("learner_id", selectedLearner.id)
        .eq("mentor_rating", 3);
      if (!cntErr && (count || 0) >= 3) {
        const { data: existingBadge } = await supabase
          .from("achievements")
          .select("id")
          .eq("learner_id", selectedLearner.id)
          .eq("badge_type", "special_badge")
          .eq("badge_name", "3-Star Excellence")
          .maybeSingle();
        if (!existingBadge) {
          await supabase.from("achievements").insert({
            learner_id: selectedLearner.id,
            badge_type: "special_badge",
            badge_name: "3-Star Excellence",
            description: "Consistently achieved 3-star feedback ratings",
            points_awarded: 20,
            badge_color: "#10B981",
            badge_icon: "award",
          });
          await notifyLearner(
            selectedLearner.id,
            "Special Badge Earned",
            "Congratulations! You earned the 3-Star Excellence badge for consistent top ratings.",
            "success"
          );
        }
      }
    }

    await notifyLearner(
      selectedLearner.id,
      "Feedback Rated",
      `Your ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })} feedback was rated ${value}★.`
    );
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search learners by name, email, or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredLearners.map((l) => (
              <button
                key={l.id}
                onClick={() => openLearner(l)}
                className="w-full text-left p-4 hover:bg-muted/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{l.full_name}</p>
                    <p className="text-sm text-muted-foreground">{l.email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Open months</span>
                  </div>
                </div>
              </button>
            ))}
            {filteredLearners.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">No learners found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {selectedLearner ? `Feedback for ${selectedLearner.full_name}` : "Feedback"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? selectedDate.toLocaleString("en-US", { month: "long", year: "numeric" })
                      : "Pick month"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 bg-background shadow-lg border rounded-md" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="p-3 pointer-events-auto"
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>

              <div className="mt-2 space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Feedback received</div>
                  <Switch checked={acknowledged} onCheckedChange={() => handleAcknowledge()} disabled={!submission || loading} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle to acknowledge and notify the learner.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <ScrollArea className="h-[60vh] pr-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!submission && (
                      <p className="text-sm text-muted-foreground">No submission found for this month.</p>
                    )}

                    {submission && (
                      <>
                        <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <span className="text-muted-foreground">Status:</span>{" "}
                            <span className="font-medium">{submission.status}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>{" "}
                            <span className="font-medium">
                              {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Due:</span>{" "}
                            <span className="font-medium">{new Date(submission.due_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rating:</span>{" "}
                            <span className="font-medium">{rating || "—"}</span>
                          </div>
                        </div>

                        {submission.submission_data && (
                          <div className="border rounded-md p-3 bg-muted/30">
                            <p className="text-sm font-medium mb-2">Learner Responses</p>
                            <div className="space-y-1 text-sm">
                              {Object.entries(submission.submission_data).map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2">
                                  <span className="text-muted-foreground capitalize min-w-44">{key.replace(/_/g, " ")}</span>
                                  <span className="font-medium break-words">{String(value ?? "")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Manager Comment</p>
                          <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add notes or guidance for the learner"
                            rows={4}
                          />
                          <div className="flex items-center justify-between">
                            <TooltipProvider>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3].map((v) => (
                                  <Tooltip key={v}>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant={rating === v ? "default" : "outline"}
                                        onClick={() => handleSetRating(v)}
                                        onMouseEnter={() => setHoverRating(v)}
                                        onMouseLeave={() => setHoverRating(null)}
                                        disabled={loading || !submission}
                                        className="h-9 w-9"
                                        aria-label={`Rate ${v} star`}
                                      >
                                        <Star className={`h-4 w-4 ${((hoverRating ?? rating) || 0) >= v ? "fill-current text-yellow-500" : ""}`} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>+{pointsForRating[v]} pts</TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            </TooltipProvider>
                            <Button onClick={handleSaveComments} disabled={loading || !submission}>Save Comment</Button>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageFeedback;
