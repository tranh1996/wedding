import Template from "@/components/Template";
import { groom } from "@/lib/content";

export const metadata = { title: "Thiệp cưới - Nhà Trai" };

export default function Page() {
  return <Template content={groom} />;
}
