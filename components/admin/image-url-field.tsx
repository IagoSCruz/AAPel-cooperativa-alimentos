"use client";

import { useState, useTransition } from "react";
import { Upload } from "lucide-react";

import {
  uploadImageAction,
  type UploadState,
} from "@/app/(admin)/admin/(panel)/upload-actions";
import { SafeImage } from "@/components/ui/safe-image";

type Props = {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
};

export function ImageUrlField({
  label,
  name,
  defaultValue,
  placeholder = "https://… ou envie um arquivo abaixo",
}: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const result: UploadState = await uploadImageAction(
        { status: "idle" },
        fd,
      );
      if (result.status === "ok") {
        setUrl(result.url);
        e.target.value = "";
      } else if (result.status === "error") {
        setUploadError(result.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted">
          <Upload className="h-4 w-4" />
          {pending ? "Enviando…" : "Enviar imagem"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={pending}
            onChange={handleFileChange}
          />
        </label>
        {url ? (
          <SafeImage
            src={url}
            alt="Pré-visualização"
            className="h-16 w-16 rounded-md border object-cover"
          />
        ) : null}
      </div>
      {uploadError ? (
        <p className="text-sm text-destructive" role="alert">
          {uploadError}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP ou GIF — até 5 MB. URLs externas (ex.: Unsplash) também
        funcionam.
      </p>
    </div>
  );
}
