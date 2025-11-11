import { useState } from "react";
import { useTheme } from "next-themes";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DrawtirFooter() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [showLicense, setShowLicense] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  return (
    <>
      <div className="fixed bottom-2 right-4 z-30 flex items-center gap-3 bg-background/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2 text-xs">
        {/* Drawtir Logo */}
        <svg width="67" height="14.5" viewBox="0 0 134 29" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
          <path d="M0 25.3158V16.8596C0 14.4035 3.41632 14.4035 4.63643 14.7719C7.30206 15.7896 7.9826 19.0609 8.13875 21.6454C8.39888 18.8079 9.7967 16.8476 10.615 16.1228C12.5561 14.4035 15.8208 14.4444 17.6916 14.4035C15.7395 14.4035 12.5672 13.7045 11.3471 12.807C8.53743 10.7404 8.15241 7.58209 8.15761 5.46496C8.01196 8.69057 6.97258 10.927 6.36842 11.6491C4.58861 14.0105 1.91462 13.9158 0.611804 13.6144C0.229751 13.526 0 13.1693 0 12.7771V3C0 2.44772 0.447715 2 0.999999 2H10.615C19.107 2.29474 21.718 9.73684 21.962 13.4211C22.5477 22.2632 16.2275 26.3158 11.9571 26.3158H1C0.447715 26.3158 0 25.8681 0 25.3158Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M122.816 26V9.67999H127.52V13.52H127.616V26H122.816ZM127.616 17.488L127.2 13.616C127.584 12.2293 128.214 11.1733 129.088 10.448C129.963 9.72265 131.051 9.35999 132.352 9.35999C132.758 9.35999 133.056 9.40265 133.248 9.48799V13.968C133.142 13.9253 132.992 13.904 132.8 13.904C132.608 13.8827 132.374 13.872 132.096 13.872C130.56 13.872 129.43 14.1493 128.704 14.704C127.979 15.2373 127.616 16.1653 127.616 17.488Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M115.151 26V9.68001H119.951V26H115.151ZM114.991 7.50401V2.32001H120.111V7.50401H114.991Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M110.543 26.352C108.452 26.352 106.895 25.8507 105.871 24.848C104.868 23.824 104.367 22.2773 104.367 20.208V6.03199L109.167 4.23999V20.368C109.167 21.0933 109.369 21.6373 109.775 22C110.18 22.3627 110.809 22.544 111.663 22.544C111.983 22.544 112.281 22.512 112.559 22.448C112.836 22.384 113.113 22.3093 113.391 22.224V25.872C113.113 26.0213 112.719 26.1387 112.207 26.224C111.716 26.3093 111.161 26.352 110.543 26.352ZM101.327 13.328V9.67999H113.391V13.328H101.327Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M81.0258 26L76.0338 9.67999H81.0898L83.5858 21.072H83.4578L86.5938 9.67999H91.0737L94.2418 21.072H94.1138L96.5778 9.67999H101.506L96.5138 26H91.9058L88.7058 14.64H88.8338L85.6338 26H81.0258Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M71.6157 26C71.4877 25.5307 71.3917 25.0293 71.3277 24.496C71.2851 23.9627 71.2637 23.344 71.2637 22.64H71.1357V14.928C71.1357 14.2667 70.9117 13.7547 70.4637 13.392C70.0371 13.008 69.3971 12.816 68.5437 12.816C67.7331 12.816 67.0824 12.9547 66.5917 13.232C66.1224 13.5093 65.8131 13.9147 65.6637 14.448H61.0877C61.3011 12.976 62.0584 11.76 63.3597 10.8C64.6611 9.83999 66.4424 9.35999 68.7037 9.35999C71.0504 9.35999 72.8424 9.88265 74.0797 10.928C75.3171 11.9733 75.9357 13.4773 75.9357 15.44V22.64C75.9357 23.1733 75.9677 23.7173 76.0317 24.272C76.1171 24.8053 76.2451 25.3813 76.4157 26H71.6157ZM65.9197 26.32C64.2984 26.32 63.0077 25.9147 62.0477 25.104C61.0877 24.272 60.6077 23.1733 60.6077 21.808C60.6077 20.2933 61.1731 19.0773 62.3037 18.16C63.4557 17.2213 65.0557 16.6133 67.1037 16.336L71.8717 15.664V18.448L67.9037 19.056C67.0504 19.184 66.4211 19.4187 66.0157 19.76C65.6104 20.1013 65.4077 20.5707 65.4077 21.168C65.4077 21.7013 65.5997 22.1067 65.9837 22.384C66.3677 22.6613 66.8797 22.8 67.5197 22.8C68.5224 22.8 69.3757 22.5333 70.0797 22C70.7837 21.4453 71.1357 20.8053 71.1357 20.08L71.5837 22.64C71.1144 23.856 70.3997 24.7733 69.4397 25.392C68.4797 26.0107 67.3064 26.32 65.9197 26.32Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M50.1475 26V9.67999H54.8515V13.52H54.9475V26H50.1475ZM54.9475 17.488L54.5315 13.616C54.9155 12.2293 55.5449 11.1733 56.4195 10.448C57.2942 9.72265 58.3822 9.35999 59.6835 9.35999C60.0889 9.35999 60.3875 9.40265 60.5795 9.48799V13.968C60.4729 13.9253 60.3235 13.904 60.1315 13.904C59.9395 13.8827 59.7049 13.872 59.4275 13.872C57.8915 13.872 56.7609 14.1493 56.0355 14.704C55.3102 15.2373 54.9475 16.1653 54.9475 17.488Z" fill={isDark ? "#ffffff" : "#141526"} />
          <path d="M29.608 26V22.16H35.432C37.096 22.16 38.504 21.8293 39.656 21.168C40.8293 20.4853 41.7146 19.5573 42.312 18.384C42.9306 17.2107 43.24 15.8667 43.24 14.352C43.24 12.8587 42.9413 11.5467 42.344 10.416C41.7466 9.28533 40.8613 8.39999 39.688 7.75999C38.536 7.11999 37.1173 6.79999 35.432 6.79999H29.704V2.95999H35.432C38.0133 2.95999 40.264 3.42932 42.184 4.36799C44.104 5.28532 45.5866 6.60799 46.632 8.33599C47.6986 10.0427 48.232 12.0693 48.232 14.416C48.232 16.7627 47.6986 18.8107 46.632 20.56C45.5653 22.288 44.072 23.632 42.152 24.592C40.2533 25.5307 38.024 26 35.464 26H29.608ZM26.6 26V2.95999H31.528V26H26.6Z" fill={isDark ? "#ffffff" : "#141526"} />
        </svg>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowLicense(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            License
          </button>
          <span className="text-muted-foreground">•</span>
          <a 
            href="https://github.com/RantirAI/drawtir" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Open Source
          </a>
          <span className="text-muted-foreground">•</span>
          <a 
            href="/sdk-demo"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Embed
          </a>
          <span className="text-muted-foreground">•</span>
          <button 
            onClick={() => setShowRoadmap(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Roadmap
          </button>
        </div>
      </div>

      {/* License Modal */}
      <Dialog open={showLicense} onOpenChange={setShowLicense}>
        <DialogContent className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1200px] p-3 m-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">License</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[40vh] pr-3">
            <div className="space-y-2 text-[11px] text-muted-foreground">
              <p>
                MIT License
              </p>
              <p>
                Copyright (c) 2025 Rantir, Inc. (DBA Hexigon AI, INC.)
              </p>
              <p>
                Permission is hereby granted, free of charge, to any person obtaining a copy
                of this software and associated documentation files (the "Software"), to deal
                in the Software without restriction, including without limitation the rights
                to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                copies of the Software, and to permit persons to whom the Software is
                furnished to do so, subject to the following conditions:
              </p>
              <p>
                The above copyright notice and this permission notice shall be included in all
                copies or substantial portions of the Software.
              </p>
              <p>
                THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                SOFTWARE.
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Roadmap Modal */}
      <Dialog open={showRoadmap} onOpenChange={setShowRoadmap}>
        <DialogContent className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1200px] p-3 m-0">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm">Roadmap</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[40vh] pr-3">
            <div className="space-y-3 text-[11px]">
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold">🪐 Rantir Studio + Drawtir SDK Roadmap</h3>
                <p className="text-muted-foreground">
                  Rantir Studio is the visual layer of the Rantir ecosystem — a collaborative, AI-native workspace that blends no-code app design, schema-aware data editing, and AI generation into a single cloud environment. Its companion, Drawtir SDK, powers the design canvas and embeddable visual logic layer — letting developers integrate drawing, prototyping, and live-data components directly inside their own tools or Rantir Cloud apps.
                </p>
                <p className="text-muted-foreground">
                  The roadmap below outlines the next six releases on our journey from visual editing to full 3D/AI-powered creation.
                </p>
              </div>

              <div className="space-y-3">
                <div className="border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-semibold text-xs">1️⃣ November 15, 2025 — Initial Rantir Studio Cloud Release</h4>
                  <p className="text-muted-foreground italic text-[10px]">Codename: "Aurora"</p>
                  <p className="text-muted-foreground mt-1">
                    The first public release of Rantir Studio Cloud. Includes workspace creation, project saving via Supabase, visual layout grid, schema editing, and AI-powered page scaffolding. Users can generate pages, connect to Rantir Data, and deploy to Rantir Cloud or external domains.
                  </p>
                </div>

                <div className="border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-semibold text-xs">2️⃣ December 6, 2025 — Drawtir Embed Release</h4>
                  <p className="text-muted-foreground italic text-[10px]">Codename: "Embed-1"</p>
                  <p className="text-muted-foreground mt-1">
                    Launch of the Drawtir SDK as an embeddable canvas package. Developers can embed the Rantir canvas inside any app or platform with full node editing, TLDraw-based structure, and JSON sync via Supabase. Includes multi-user presence, custom block types, and SDK documentation for Lovable and Supabase integrations.
                  </p>
                </div>

                <div className="border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-semibold text-xs">3️⃣ January 10, 2026 — Components Library + AI Actions</h4>
                  <p className="text-muted-foreground italic text-[10px]">Codename: "Nova"</p>
                  <p className="text-muted-foreground mt-1">
                    Unified Rantir Components Library release — drag-and-drop blocks for forms, charts, and UI logic. Adds AI Actions, allowing users to trigger scripts, Supabase queries, or model calls from within the visual builder. Integration with Lovable templates and versioned component storage inside Rantir Data.
                  </p>
                </div>

                <div className="border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-semibold text-xs">4️⃣ February 18, 2026 — Video & Motion Release (Veo 3.1 + Sora Integration)</h4>
                  <p className="text-muted-foreground italic text-[10px]">Codename: "Pulse"</p>
                  <p className="text-muted-foreground mt-1">
                    Native video and motion design support powered by Veo 3.1 and Sora. Users can generate, edit, and embed dynamic videos directly in projects, apply motion prompts, and sync AI-generated clips to UI states or timelines. Adds "Record Canvas" and "AI Scene Transitions" for interactive storytelling.
                  </p>
                </div>

                <div className="border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-semibold text-xs">5️⃣ March 15, 2026 — 3D + Lottie Support</h4>
                  <p className="text-muted-foreground italic text-[10px]">Codename: "Dimension"</p>
                  <p className="text-muted-foreground mt-1">
                    Full 3D object import (GLB/FBX) and Lottie animation layers. Adds physics and interaction scripting to scenes, along with AI texture generation. Drawtir SDK adds lightweight WebGL renderer for live canvas previews and animation playback.
                  </p>
                </div>

                <div className="border-l-2 border-primary pl-3 py-1">
                  <h4 className="font-semibold text-xs">6️⃣ April 20, 2026 — 2D → 3D Canvas & Mixed Reality Toolkit</h4>
                  <p className="text-muted-foreground italic text-[10px]">Codename: "Orbit"</p>
                  <p className="text-muted-foreground mt-1">
                    Transform 2D designs into 3D environments with a single click. Launches Rantir Mixed Reality Toolkit — enabling 2D-to-3D projection, environment lighting, and spatial editing within the same Drawtir canvas. Paves the way for Rantir hardware integration (r.canvas) and multi-viewport collaboration.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}