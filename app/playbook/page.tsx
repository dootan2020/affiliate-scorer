import { redirect } from "next/navigation";

export default function PlaybookPage(): never {
  redirect("/insights?tab=playbook");
}
