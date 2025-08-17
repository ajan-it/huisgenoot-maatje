import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/I18nProvider";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function MinutesHelperSheet({ open, onOpenChange }: Props) {
  const { t } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{t("time.helper.title")}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <ul className="space-y-2 text-sm">
            {((t("time.helper.body") as unknown) as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          
          <div className="mt-6 p-3 bg-muted/30 rounded-md">
            <p className="text-xs text-muted-foreground">
              {t("time.helper.note")}
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              {t("setupFlow.timeEstimator.cancel")}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}