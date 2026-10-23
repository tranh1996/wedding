import "./template.css";
import "./animate.css";

export const metadata = {
  title: "Thiệp cưới online",
  description: "Trân trọng kính mời bạn đến dự lễ thành hôn của chúng tôi.",
};
export const viewport = { width: "device-width", initialScale: 1 };

// The template is laid out at a fixed 420px width. On narrower screens, scale the
// whole page down via `zoom` (set before first paint to avoid a flash).
const PAGE_WIDTH = 420;
const fitScript = `(function(){var d=document.documentElement;function f(){d.style.setProperty("--page-zoom",Math.min(1,d.clientWidth/${PAGE_WIDTH}))}f();addEventListener("resize",f)})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: fitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
