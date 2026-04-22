import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Volume2, ShieldAlert, Loader2 } from "lucide-react";
import { useUpdateMarketingProject } from "@/hooks/useMarketingProject";
import { toast } from "sonner";

interface Props {
  projectId: string;
  country: string;
  currency: string;
  language: string;
  brandVoice: string;
  forbiddenWords: string[];
}

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "KES", "NGN", "ZAR", "INR", "AED", "JPY", "CNY", "AUD", "CAD", "BRL", "MXN"];

export default function BrandSettingsPanel({
  projectId,
  country,
  currency,
  language,
  brandVoice,
  forbiddenWords,
}: Props) {
  const update = useUpdateMarketingProject();
  const [c, setC] = useState(country || "");
  const [cur, setCur] = useState(currency || "USD");
  const [lang, setLang] = useState(language || "English");
  const [voice, setVoice] = useState(brandVoice || "");
  const [forbidden, setForbidden] = useState((forbiddenWords || []).join(", "));

  useEffect(() => {
    setC(country || "");
    setCur(currency || "USD");
    setLang(language || "English");
    setVoice(brandVoice || "");
    setForbidden((forbiddenWords || []).join(", "));
  }, [country, currency, language, brandVoice, forbiddenWords]);

  const dirty =
    c !== (country || "") ||
    cur !== (currency || "USD") ||
    lang !== (language || "English") ||
    voice !== (brandVoice || "") ||
    forbidden !== (forbiddenWords || []).join(", ");

  const save = async () => {
    const words = forbidden
      .split(/[,\n]/)
      .map((w) => w.trim())
      .filter(Boolean);
    await update.mutateAsync({
      id: projectId,
      country: c.trim() || "United States",
      currency: cur.trim().toUpperCase() || "USD",
      language: lang.trim() || "English",
      brand_voice: voice,
      forbidden_words: words,
    });
    toast.success("Brand settings saved");
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Locale defaults</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Used for every video unless overridden. Currency figures, dates, units, and language tone all follow these.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Country</Label>
            <Input value={c} onChange={(e) => setC(e.target.value)} placeholder="e.g. Kenya" />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Input
              value={cur}
              onChange={(e) => setCur(e.target.value.toUpperCase())}
              placeholder="KES"
              list="currency-list"
            />
            <datalist id="currency-list">
              {COMMON_CURRENCIES.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Input value={lang} onChange={(e) => setLang(e.target.value)} placeholder="English" />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Brand voice & tone guidelines</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Plain English rules the AI must follow. e.g. "Never use emojis. Refer to users as 'members'. Avoid hype words like 'revolutionary'."
        </p>
        <Textarea
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          placeholder="How does your brand sound?"
          rows={5}
        />
      </Card>

      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Forbidden words & claims</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Comma or new-line separated. The AI will avoid these terms in scripts (e.g. "best in the world", "guaranteed", competitor names).
        </p>
        <Textarea
          value={forbidden}
          onChange={(e) => setForbidden(e.target.value)}
          placeholder="best in the world, guaranteed, cheap"
          rows={3}
        />
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={!dirty || update.isPending}>
          {update.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save brand settings"}
        </Button>
      </div>
    </div>
  );
}
