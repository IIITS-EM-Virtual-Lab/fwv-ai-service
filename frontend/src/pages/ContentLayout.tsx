import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { Bot, FileText, FunctionSquare, Sparkles } from "lucide-react";

const getTopicTitle = (pathname: string) =>
  pathname
    .replace(/^\//, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Fields and Waves";

const askFieldora = (prompt: string) => {
  window.dispatchEvent(
    new CustomEvent("fieldora:prompt", {
      detail: { prompt, autoSend: true },
    }),
  );
};

const ContentLayout = () => {
  const location = useLocation();
  const showSidebar = location.pathname !== "/home";
  const topicTitle = getTopicTitle(location.pathname);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleAskAboutPage = () => {
    askFieldora(
      `I am studying "${topicTitle}" in the Fields and Waves Visualization Lab. Explain the key idea, important formulas, physical intuition, and common mistakes in a student-friendly way.`,
    );
  };

  const handleGenerateLabReport = () => {
    askFieldora(
      `Generate a concise lab report for the "${topicTitle}" page in the Fields and Waves Visualization Lab. Include Objective, Theory, Procedure using the visualization, Observations, Result, and Conclusion. Keep it practical for a student lab notebook.`,
    );
  };

  const handleExplainFormula = () => {
    const selectedText = window.getSelection()?.toString().trim();
    const formulaContext = selectedText
      ? `Formula or expression selected by the student: ${selectedText}`
      : `No formula was selected. Explain the most important formulas normally used in this topic.`;

    askFieldora(
      `Act as an AI formula explainer for the "${topicTitle}" page.
${formulaContext}

Explain each symbol, the physical meaning, units where useful, when the formula applies, and one simple example. Keep it clear for an electromagnetic fields and waves student.`,
    );
  };

  const handleSimulationAssistant = () => {
    askFieldora(
      `Act as an AI simulation assistant for the "${topicTitle}" visualization page in the Fields and Waves Visualization Lab.

Tell the student what controls or parameters to try changing, what visual changes to observe, what physics principle those changes demonstrate, and one quick experiment they can perform on this page. Keep it practical and concise.`,
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

        {/* Sidebar (Desktop) */}
        {showSidebar && (
          <aside
            className={`relative hidden md:block bg-white border-r h-screen overflow-y-auto transition-all duration-300 ${
              sidebarOpen ? "md:w-80" : "md:w-0"
            }`}
          >
            {/* Hide button */}
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-2 z-10 px-2 py-1 text-sm rounded border bg-white hover:bg-slate-100"
              >
                ❮
              </button>
            )}

            {/* Sidebar content only when open */}
            {sidebarOpen && <Sidebar />}
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-y-auto bg-white">
          
          {/* Show button when sidebar is closed */}
          {showSidebar && !sidebarOpen && (
            <div className="hidden md:block px-4 pt-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-3 py-2 text-sm rounded border hover:bg-slate-100"
              >
                ☰ Show Topics
              </button>
            </div>
          )}

          <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
            {showSidebar && (
              <div className="mb-5 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={handleAskAboutPage}
                  className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Sparkles size={16} />
                  Ask AI About This Page
                </button>
                <button
                  type="button"
                  onClick={handleExplainFormula}
                  className="inline-flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <FunctionSquare size={16} />
                  Explain Formula
                </button>
                <button
                  type="button"
                  onClick={handleSimulationAssistant}
                  className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  <Bot size={16} />
                  Simulation Assistant
                </button>
                <button
                  type="button"
                  onClick={handleGenerateLabReport}
                  className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <FileText size={16} />
                  Generate Lab Report
                </button>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ContentLayout;
