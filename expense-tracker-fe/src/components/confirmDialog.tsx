import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type ConfirmDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    cancelLabel?: string
    confirmLabel?: string
    onCancel?: () => void
    onConfirm: () => void
    confirmButtonClass?: string
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    cancelLabel = "",
    confirmLabel = "",
    onCancel,
    onConfirm,
    confirmButtonClass = "",
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-300 dark:bg-slate-900">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <button
                        onClick={onConfirm}
                        className={`font-medium py-2 px-4 rounded-lg transition-colors ${confirmButtonClass}`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={() => {
                            onCancel?.()
                            onOpenChange(false)
                        }}
                        className=" text-white font-medium py-2 px-4 rounded-lg transition-colors bg-green-grass hover:bg-lime-700"
                    >
                        {cancelLabel}
                    </button>


                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
