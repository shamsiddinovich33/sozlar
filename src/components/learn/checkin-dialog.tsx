"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CheckinDialogProps = {
  open: boolean;
  percent: number;
  answered: number;
  untilNext: number;
  onRestart: () => void;
  onContinue: () => void;
};

export function CheckinDialog({
  open,
  percent,
  answered,
  untilNext,
  onRestart,
  onContinue,
}: CheckinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onContinue()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Yaxshi ketyapsiz!</DialogTitle>
          <DialogDescription>Natijalaringizni ko&apos;rib chiqing.</DialogDescription>
        </DialogHeader>
        <dl className="grid gap-3">
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <dt className="text-muted-foreground">Umumiy progress</dt>
            <dd className="text-lg font-bold text-success">{percent}%</dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <dt className="text-muted-foreground">Bajarilgan savollar</dt>
            <dd className="text-lg font-bold">{answered}</dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
            <dt className="text-muted-foreground">Keyingi tekshiruvgacha savollar</dt>
            <dd className="text-lg font-bold">{untilNext}</dd>
          </div>
        </dl>
        <DialogFooter>
          <Button variant="outline" onClick={onRestart}>
            Qayta boshlash
          </Button>
          <Button variant="cta" onClick={onContinue} autoFocus>
            Davom etish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
