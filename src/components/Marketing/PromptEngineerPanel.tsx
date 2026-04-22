import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Wand2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prompt {
  angle: string;
  prompt: string;
  suggested_featured_labels: string[];
}

interface Props {
  projectId: string;
}

const TARGETS = [
  { value: "any", label: "Any (general)" },
  { value: "marketing-video", label: "Marketing Video" },
  { value: "social-post", label: "Social Post (Instagram / X / LinkedIn)" },
  { value: "email", label: "Email campaign" },
  { value: "ad-copy", label: "Ad copy (Meta / Google)" },
  { value: "merch-design", label: "Merch design brief" },
];

export default function PromptEngineerPanel({ projectId }: Props) {
  const [goal, setGoal] = useState("");
  const [target, setTarget] = useState("marketing-video");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const generate = async () => {
    if (!goal.trim()) {
      toast.error("Describe what you want to create");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-prompt", {
        body: { project_id: projectId, goal, target, notes, count },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPrompts(data.prompts || []);
      toast.success(`Generated ${data.prompts?.length || 0} prompts`);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate prompts");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Prompt copied");
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Prompt Engineer</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Describe what you want to create. AI reads your knowledge base, brand voice, locale and featured screenshots
          to craft tight, ready-to-paste prompts for your video / content generators.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>What do you want to create?</Label>
            <Textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              placeholder="e.g. Promote our new event-add page to event organizers in Kenya, highlight free tier and KES pricing."
            />
          </div>

          <div className="space-y-2">
            <Label>Target format</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TARGETS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of prompts</Label>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 6, 8].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} prompts</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Extra notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mention free shipping, end with shop URL, avoid superlatives"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={generate} disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Crafting prompts...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Prompts</>
            )}
          </Button>
        </div>
      </Card>

      {prompts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Generated Prompts</h4>
          <div className="grid grid-cols-1 gap-3">
            {prompts.map((p, idx) => (
              <Card key={idx} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-2">{p.angle}</Badge>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.prompt}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(p.prompt, idx)}
                    className="shrink-0"
                  >
                    {copiedIdx === idx ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedIdx === idx ? "Copied" : "Copy"}
                  </Button>
                </div>
                {p.suggested_featured_labels && p.suggested_featured_labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground self-center mr-1">Use featured:</span>
                    {p.suggested_featured_labels.map((label) => (
                      <Badge key={label} variant="outline" className="text-[11px]">{label}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
