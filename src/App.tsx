import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SolanaWalletProvider } from "@/providers/WalletProvider";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import ZkPFPs from "./pages/ZkPFPs";
import HowToUse from "./pages/HowToUse";
import ManageSharing from "./pages/ManageSharing";
import NDA from "./pages/NDA";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaWalletProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/take-photo" element={<Index />} />
            <Route path="/zkpfps" element={<ZkPFPs />} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="/manage-sharing" element={<ManageSharing />} />
            <Route path="/nda" element={<NDA />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SolanaWalletProvider>
  </QueryClientProvider>
);

export default App;
