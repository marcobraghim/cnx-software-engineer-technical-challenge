"use client";

import { FormEvent, useMemo, useState } from "react";
import { UploadCloudIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EmailsysRepository } from "@/data/repositories/emailsys.repository";

export default function EmailProcessorPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const helperText = useMemo(
    () =>
      selectedFile
        ? `Arquivo selecionado: ${selectedFile.name}`
        : "Selecione um arquivo CSV com a coluna email.",
    [selectedFile]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFile) {
      setStatusMessage("Selecione um arquivo antes de enviar.");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Fazendo upload...");

    try {
      await EmailsysRepository.uploadCsv(selectedFile);
      setStatusMessage("Arquivo enviado para processamento!");
    } catch (error: any) {
      console.error("Erro ao enviar arquivo:", error);

      setStatusMessage(
        error?.response?.data?.message || "Falha ao enviar arquivo. Tente novamente."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <header className="flex items-center gap-4 border-b bg-background/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <SidebarTrigger className="-ml-1" />
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Emails
          </p>
          <h1 className="text-2xl font-semibold leading-tight">
            Processador de Listas
          </h1>
          <p className="text-sm text-muted-foreground">
            Faça upload de um CSV para exportar emails para o sistema de envio
          </p>
        </div>
      </header>

      {statusMessage && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-4">
          <p className="text-sm font-medium text-red-800">{statusMessage}</p>
        </div>
      )}

      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl rounded-2xl border bg-card p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <UploadCloudIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Upload de lista de emails
              </h2>
              <p className="text-sm text-muted-foreground">
                Aceitamos arquivos CSV com cabeçalho. A coluna deve se
                chamar "email".
              </p>
            </div>
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Formulário de upload de emails"
          >
            <div className="space-y-2">
              <label
                htmlFor="email-file"
                className="text-sm font-medium text-foreground"
              >
                Arquivo CSV
              </label>
              <Input
                id="email-file"
                type="file"
                accept=".csv,text/csv"
                className="cursor-pointer border-dashed bg-muted/30 file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setStatusMessage(null);
                }}
              />
              <p className="text-sm text-muted-foreground">{helperText}</p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? "Enviando..." : "Enviar para processamento"}
            </Button>
          </form>
        </div>
      </section>
    </>
  );
}

