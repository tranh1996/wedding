import Template from "@/components/Template";
import { groom } from "@/lib/content";

export const metadata = { title: "Thiệp cưới" };

export default function Page() {
  return <Template content={groom} />;
}
