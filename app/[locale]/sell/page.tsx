import { redirect } from "next/navigation";

export default function SellRoot({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/sell/step1`);
}
