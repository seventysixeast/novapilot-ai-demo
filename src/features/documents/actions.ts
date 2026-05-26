"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";

export async function createDocumentRecord(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    redirect("/dashboard/documents?error=Please select a file");
  }

  const fileName = file.name;
  const mimeType = file.type.toLowerCase();
  const sizeBytes = file.size;

  const supportedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
  if (!supportedTypes.includes(mimeType)) {
    redirect("/dashboard/documents?error=Unsupported file type");
  }
  if (sizeBytes > 20 * 1024 * 1024) {
    redirect("/dashboard/documents?error=File is too large. Max 20MB");
  }

  const membership = await getCurrentMembership();
  if (!membership) {
    redirect("/login");
  }

  const kind = mimeType === "application/pdf" ? "pdf" : "image";
  const supabase = await createClient();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${membership.organizationId}/${membership.userId}/${Date.now()}-${safeName}`;

  const { error: storageError } = await supabase.storage
    .from("documents")
    .upload(filePath, file, { upsert: false, contentType: mimeType });
  if (storageError) {
    redirect(`/dashboard/documents?error=${encodeURIComponent(storageError.message)}`);
  }

  const { error } = await supabase.from("documents").insert({
    organization_id: membership.organizationId,
    uploaded_by: membership.userId,
    kind,
    file_path: filePath,
    file_name: fileName,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    status: "uploaded",
  });

  if (error) {
    redirect(`/dashboard/documents?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/documents");
  redirect("/dashboard/documents?message=Document uploaded");
}
