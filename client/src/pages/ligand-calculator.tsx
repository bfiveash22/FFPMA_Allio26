import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Beaker, 
  Target, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Search,
  Dna,
  Heart,
  Brain,
  Sparkles,
  Info
} from "lucide-react";
import {
  cannabinoids,
  proteinTargets,
  ligandPathways,
  conditionProfiles,
  getPathwaysForCannabinoid,
  getProteinsForCondition,
  type Cannabinoid,
  type ProteinTarget,
  type LigandPathway,
  type ConditionProfile
} from "@shared/ligand-pathway-data";

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Cardiovascular': return <Heart className="h-4 w-4" />;
    case 'Neurological': return <Brain className="h-4 w-4" />;
    case 'Neuropsychiatric': return <Brain className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
}

function getAffinityColor(affinity: string) {
  switch (affinity) {
    case 'high': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getEffectColor(effect: string) {
  switch (effect) {
    case 'activates': return 'text-green-600 dark:text-green-400';
    case 'inhibits': return 'text-red-600 dark:text-red-400';
    case 'modulates': return 'text-blue-600 dark:text-blue-400';
    default: return 'text-gray-600';
  }
}

export default function LigandCalculator() {
  const [selectedCannabinoid, setSelectedCannabinoid] = useState<string | null>(null);
  const [selectedProtein, setSelectedProtein] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConditions = conditionProfiles.filter(cp =>
    cp.condition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cp.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCannabinoidData = selectedCannabinoid ? cannabinoids[selectedCannabinoid] : null;
  const selectedProteinData = selectedProtein ? proteinTargets[selectedProtein] : null;
  const selectedConditionData = selectedCondition ? conditionProfiles.find(cp => cp.condition === selectedCondition) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Dna className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Ligand Pathway Mapping Calculator</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Explore cannabinoid-protein interactions and condition-specific recommendations based on clinical research
          </p>
        </div>

        <Tabs defaultValue="cannabinoids" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="cannabinoids" className="data-[state=active]:bg-cyan-600">
              <Beaker className="h-4 w-4 mr-2" />
              By Cannabinoid
            </TabsTrigger>
            <TabsTrigger value="proteins" className="data-[state=active]:bg-cyan-600">
              <Target className="h-4 w-4 mr-2" />
              By Protein Target
            </TabsTrigger>
            <TabsTrigger value="conditions" className="data-[state=active]:bg-cyan-600">
              <Activity className="h-4 w-4 mr-2" />
              By Condition
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cannabinoids" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.values(cannabinoids).map((c) => (
                <Card 
                  key={c.id}
                  data-testid={`cannabinoid-card-${c.id}`}
                  className={`cursor-pointer transition-all ${
                    selectedCannabinoid === c.id 
                      ? 'bg-cyan-900/40 border-cyan-500 ring-2 ring-cyan-500' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-cyan-600'
                  }`}
                  onClick={() => setSelectedCannabinoid(c.id === selectedCannabinoid ? null : c.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white flex items-center justify-between">
                      {c.abbreviation}
                      <Badge variant="outline" className="text-xs">
                        {c.type}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-slate-400">{c.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-slate-500">
                      {c.targets.length} protein targets
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedCannabinoidData && (
              <Card className="bg-slate-800/70 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Beaker className="h-5 w-5 text-cyan-400" />
                    {selectedCannabinoidData.name} ({selectedCannabinoidData.abbreviation})
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Source: {selectedCannabinoidData.source}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" /> Benefits
                      </h3>
                      <ul className="space-y-2">
                        {selectedCannabinoidData.benefits.map((benefit, i) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Considerations
                      </h3>
                      <ul className="space-y-2">
                        {selectedCannabinoidData.considerations.map((con, i) => (
                          <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                            <span className="text-amber-400 mt-1">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-400" /> Protein Target Pathways
                    </h3>
                    <div className="space-y-3">
                      {getPathwaysForCannabinoid(selectedCannabinoidData.id).map((pathway, i) => (
                        <div key={i} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-cyan-300 font-semibold">{pathway.protein}</span>
                              <Badge className={getAffinityColor(pathway.bindingAffinity)}>
                                {pathway.bindingAffinity} affinity
                              </Badge>
                            </div>
                            <span className={`text-sm font-medium ${getEffectColor(pathway.effect)}`}>
                              {pathway.effect}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">{pathway.clinicalImplication}</p>
                          {proteinTargets[pathway.protein] && (
                            <p className="text-slate-500 text-xs mt-2">
                              {proteinTargets[pathway.protein].name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="proteins" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.values(proteinTargets).map((p) => (
                <Card 
                  key={p.symbol}
                  data-testid={`protein-card-${p.symbol}`}
                  className={`cursor-pointer transition-all ${
                    selectedProtein === p.symbol 
                      ? 'bg-purple-900/40 border-purple-500 ring-2 ring-purple-500' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-purple-600'
                  }`}
                  onClick={() => setSelectedProtein(p.symbol === selectedProtein ? null : p.symbol)}
                >
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-lg font-mono text-white">{p.symbol}</CardTitle>
                    <CardDescription className="text-slate-400 text-xs line-clamp-1">
                      {p.name}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {selectedProteinData && (
              <Card className="bg-slate-800/70 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-400" />
                    {selectedProteinData.symbol} - {selectedProteinData.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Function</h3>
                    <p className="text-slate-300">{selectedProteinData.function}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-purple-400 mb-3">Biological Pathways</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProteinData.pathways.map((pathway, i) => (
                          <Badge key={i} variant="outline" className="bg-purple-900/30 text-purple-300 border-purple-700">
                            {pathway}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-cyan-400 mb-3">Clinical Relevance</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProteinData.clinicalRelevance.map((relevance, i) => (
                          <Badge key={i} variant="outline" className="bg-cyan-900/30 text-cyan-300 border-cyan-700">
                            {relevance}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">Cannabinoids That Target This Protein</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ligandPathways
                        .filter(lp => lp.protein === selectedProteinData.symbol)
                        .map((lp, i) => (
                          <div key={i} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-white">{lp.cannabinoid}</span>
                              <span className={`text-xs ${getEffectColor(lp.effect)}`}>{lp.effect}</span>
                            </div>
                            <Badge className={`text-xs ${getAffinityColor(lp.bindingAffinity)}`}>
                              {lp.bindingAffinity}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="conditions" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                data-testid="condition-search"
                placeholder="Search conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConditions.map((cp) => (
                <Card 
                  key={cp.condition}
                  data-testid={`condition-card-${cp.condition.replace(/\s+/g, '-').toLowerCase()}`}
                  className={`cursor-pointer transition-all ${
                    selectedCondition === cp.condition 
                      ? 'bg-green-900/40 border-green-500 ring-2 ring-green-500' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-green-600'
                  }`}
                  onClick={() => setSelectedCondition(cp.condition === selectedCondition ? null : cp.condition)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        {getCategoryIcon(cp.category)}
                        {cp.condition}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="w-fit">{cp.category}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {cp.recommendedCannabinoids.map((c, i) => (
                        <Badge key={i} className="bg-cyan-900/50 text-cyan-300 text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedConditionData && (
              <Card className="bg-slate-800/70 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-400" />
                    {selectedConditionData.condition}
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">{selectedConditionData.category}</Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-2">Clinical Rationale</h3>
                    <p className="text-slate-300">{selectedConditionData.rationale}</p>
                  </div>

                  {selectedConditionData.contraindications && (
                    <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Contraindications
                      </h3>
                      <ul className="space-y-1">
                        {selectedConditionData.contraindications.map((c, i) => (
                          <li key={i} className="text-amber-200 text-sm">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-cyan-400 mb-3">Recommended Cannabinoids</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedConditionData.recommendedCannabinoids.map((c, i) => {
                        const cannabinoidData = cannabinoids[c];
                        return cannabinoidData ? (
                          <div key={i} className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3">
                            <div className="font-semibold text-cyan-300">{cannabinoidData.abbreviation}</div>
                            <div className="text-slate-400 text-xs">{cannabinoidData.name}</div>
                          </div>
                        ) : (
                          <div key={i} className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3">
                            <div className="font-semibold text-cyan-300">{c}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-purple-400 mb-3">Relevant Protein Targets</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {selectedConditionData.relevantProteins.map((p, i) => (
                        <div key={i} className="bg-purple-900/30 border border-purple-700 rounded-lg p-2 text-center">
                          <span className="font-mono text-purple-300 text-sm">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8 bg-blue-900/20 border-blue-700">
          <CardHeader>
            <CardTitle className="text-lg text-blue-300 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Research Reference
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm">
              This calculator is based on network-based pharmacology research revealing protein targets for 
              medical benefits of cannabinoids. The 18 essential protein targets and 8 cannabinoid compounds 
              were identified through molecular docking simulation and pathway enrichment analysis.
            </p>
            <p className="text-slate-500 text-xs mt-2">
              Reference: Li, X., et al. (2022). Network-Based Pharmacology Study Reveals Protein Targets for 
              Medical Benefits and Harms of Cannabinoids in Humans. Applied Sciences, 12(4), 2205.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
