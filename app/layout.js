import "./template.css";
import "./animate.css";

export const metadata = {
  title: "Thiệp cưới online",
  description: "Trân trọng kính mời bạn đến dự lễ thành hôn của chúng tôi.",
};
export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
