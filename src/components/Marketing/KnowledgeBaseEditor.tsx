import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateMarketingProject } from "@/hooks/useMarketingProject";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: string;
  initialValue: string;
}

export default function KnowledgeBaseEditor({ projectId, initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  const update = useUpdateMarketingProject();
  const dirty = value !== initialValue;

  useEffect(() => setValue(initialValue), [initialValue]);

  const save = useCallback(() => {
    update.mutate({ id: projectId, knowledge_base: value }, {
      onSuccess: () => toast.success("Knowledge base saved"),
    });
  }, [projectId, value]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">Describe your product, features, target audience, value proposition, etc.</p>
        </div>
        <Button onClick={save} disabled={!dirty || update.isPending} size="sm">
          <Save className="h-4 w-4 mr-1" /> {update.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Tell the AI everything about your product...&#10;&#10;Example:&#10;- Product name and what it does&#10;- Key features and benefits&#10;- Target audience&#10;- Unique selling points&#10;- Pricing model"
        className="min-h-[400px] font-mono text-sm"
      />
    </div>
  );
}
