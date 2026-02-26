import { redirect } from "next/navigation";

export default function UploadPage(): never {
  redirect("/sync");
}
