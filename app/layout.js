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
// On phones the first measurement can be taken before the viewport settles (address bar shown,
// viewport meta not applied yet), which leaves the page off-centre until the first scroll fires
// `resize`. So re-measure on every moment the width can change, not just once.
const fitScript = `(function(){var d=document.documentElement;function f(){var w=d.clientWidth||innerWidth;if(window.visualViewport&&visualViewport.width)w=Math.min(w,visualViewport.width);d.style.setProperty("--page-zoom",Math.min(1,w/${PAGE_WIDTH}))}f();["resize","orientationchange","DOMContentLoaded","load","pageshow"].forEach(function(e){addEventListener(e,f)});if(window.visualViewport)visualViewport.addEventListener("resize",f);requestAnimationFrame(f);setTimeout(f,300)})()`;

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
