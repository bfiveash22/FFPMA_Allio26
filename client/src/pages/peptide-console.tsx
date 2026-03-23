import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, Sparkles } from "lucide-react";

export default function PeptideConsolePage() {
  return (
    <main className="flex-1 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                FF Intelligent Peptide Console
              </h1>
              <p className="text-muted-foreground">
                AI-powered peptide guidance and protocol recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <Card className="h-[calc(100dvh-200px)] min-h-[600px]">
              <CardContent className="p-0 h-full">
                <iframe
                  src="https://peptide-chat.abacusai.app"
                  className="w-full h-full rounded-md border-0"
                  allow="fullscreen"
                  loading="lazy"
                  title="FF Peptide Chat AI"
                  data-testid="iframe-peptide-console"
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  About This Tool
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-3">
                  The FF Intelligent Peptide Console is an AI-powered assistant designed to help you understand peptide therapies, dosing protocols, and potential benefits.
                </p>
                <p>
                  Ask questions about specific peptides, reconstitution, storage, and stacking protocols.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-secondary" />
                  Example Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5">Q</Badge>
                    <span>What is BPC-157 used for?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5">Q</Badge>
                    <span>How do I reconstitute a peptide vial?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5">Q</Badge>
                    <span>Can Thymosin Alpha-1 and TB-500 be stacked?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge variant="outline" className="shrink-0 mt-0.5">Q</Badge>
                    <span>What are bioregulators?</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Disclaimer:</strong> This AI provides educational information only. Always consult with a qualified healthcare provider before starting any peptide protocol.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
