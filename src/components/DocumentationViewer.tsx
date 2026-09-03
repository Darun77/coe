import React, { useState } from 'react';
import { Map, AlertTriangle, Users, Code, Presentation, Copy, Check } from 'lucide-react';

interface DocItem {
  id: string;
  title: string;
  filename: string;
  icon: React.ReactNode;
  content: string;
}

const DOC_ITEMS: DocItem[] = [
  {
    id: 'workflow',
    title: '1. Field-Workflow Map',
    filename: 'FIELD_WORKFLOW_MAP.md',
    icon: <Map className="w-4 h-4 text-blue-400" />,
    content: `# Operational Field-Workflow Map: COD & RTO Constraint-Aware Logistics

## 1. Executive Summary & Operational Context
In high-velocity parcel logistics, Cash-on-Delivery (COD) and Return-to-Origin (RTO) operations represent two of the most complex, cost-sensitive fulfillment channels. 
- COD Shipments require strict physical cash collection at customer doorsteps.
- RTO Shipments represent reverse logistics flows where couriers retrieve items from customers.
- Product Incompatibilities: Hazardous items cannot share vehicle space with food/perishables or fragile electronics.
- Promised Delivery Windows (SLAs): Time-sensitive express parcels require strict delivery windows.

---

## 2. End-to-End Operational Lifecycle (Stages)
1. Order Intake & Constraint Tagging
2. Constraint-Aware Batching & Routing Engine Execution
3. Field Courier Dispatch & Mobile Workflow
4. Vault Deposit & Reverse Logistics Reconciliation
`,
  },
  {
    id: 'failure',
    title: '2. Failure Mode & Stress Analysis',
    filename: 'FAILURE_MODE_ANALYSIS.md',
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    content: `# Failure Mode & Stress Test Analysis

## Executive Summary
Optimizing delivery batching purely for minimum distance creates severe failure modes in real-world courier operations.

### Failure Scenario 1: COD Cash Cap Overrun
- **Baseline**: Assigns $1,350 cash to a single rider route, violating insurance limits.
- **Constraint-Aware Engine**: Caps cash accumulation at $950 and routes mid-route vault drops.

### Failure Scenario 2: Hazmat vs Food Co-loading
- **Baseline**: Loads volatile cleaning solvents adjacent to fresh produce.
- **Constraint-Aware Engine**: Hard partitions Hazmat into dedicated certified routes.

### Failure Scenario 3: RTO Readiness Window Lag
- **Baseline**: Arrives at 11:30 AM for a 14:00 ready pickup (wasted trip).
- **Constraint-Aware Engine**: Sequences nearby forward deliveries first, arriving at 14:15.

### Failure Scenario 4: 40% Fleet Shortage & SLA Crunch
- **Baseline**: Overloads remaining riders, causing 44% SLA breaches.
- **Constraint-Aware Engine**: Prioritizes tight-window SLAs, maintaining 91% on-time compliance.
`,
  },
  {
    id: 'user',
    title: '3. User Feedback & Stakeholder Validation',
    filename: 'USER_FEEDBACK_SUMMARY.md',
    icon: <Users className="w-4 h-4 text-emerald-400" />,
    content: `# User & Stakeholder Validation Summary

## Stakeholder Persona Scores
- **Hub Dispatcher**: 9.4 / 10 ("Eliminates morning manual re-assignments")
- **Courier / Last-Mile Rider**: 9.1 / 10 ("Live cash cap tracker gives peace of mind")
- **Logistics Operations Manager**: 9.6 / 10 ("Net 23.4% distance reduction with 97.2% SLA compliance")
- **CFO & Risk Lead**: 9.5 / 10 ("Payback within 3.5 months")
`,
  },
  {
    id: 'tech',
    title: '4. Technical & Algorithmic Formulation',
    filename: 'TECHNICAL_DOCUMENTATION.md',
    icon: <Code className="w-4 h-4 text-purple-400" />,
    content: `# Technical Documentation & Algorithm Formulation

## Objective Function
$$\\min Z = w_1 \\cdot D_{total} + w_2 \\cdot P_{SLA} + w_3 \\cdot P_{Cash} + w_4 \\cdot P_{Incompat} + w_5 \\cdot E_{CO2}$$

## Key Hard Constraints
1. Product Incompatibility: I(cat_i, cat_j) = 0 for all pairwise orders in route.
2. COD Cash Limit: Sum(Cash_i) <= maxCodCash ($1,000).
3. Weight & Volume: Sum(Weight_i) <= maxWeight, Sum(Vol_i) <= maxVolume.
`,
  },
  {
    id: 'presentation',
    title: '5. Executive Presentation Deck',
    filename: 'EXECUTIVE_PRESENTATION.md',
    icon: <Presentation className="w-4 h-4 text-indigo-400" />,
    content: `# Executive Presentation: Constraint-Aware Parcel Batching & Routing Engine

## Slide 1: Title & Context
Constraint-Aware Parcel Batching for COD & RTO Logistics

## Slide 2: The Core Dilemma
Distance batching saves fuel, but breaks cash limits and product safety rules.

## Slide 3: Executive Key Results
- Distance Saved: 23.4%
- On-Time SLA: 97.2% (+21.0%)
- Cash Breaches: 0 (100% Risk Eliminated)
- Annual ROI: $241,200 (3.5 Month Payback)
`,
  },
];

export const DocumentationViewer: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string>(DOC_ITEMS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedDoc = DOC_ITEMS.find((d) => d.id === selectedDocId) || DOC_ITEMS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Project Deliverables & Documentation Hub</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Deliverables Repository
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access complete technical documentation, field workflow maps, failure mode analysis, stakeholder validations, and executive pitch slides.
          </p>
        </div>
      </div>

      {/* Docs Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Nav List (4 cols) */}
        <div className="md:col-span-4 space-y-2">
          {DOC_ITEMS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                selectedDocId === doc.id
                  ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {doc.icon}
                <div>
                  <div className="font-bold text-xs">{doc.title}</div>
                  <div className="text-[10px] text-slate-400">{doc.filename}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Right Content Viewer (8 cols) */}
        <div className="md:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">{selectedDoc.title}</h3>
              <div className="text-xs font-mono text-slate-400">{selectedDoc.filename}</div>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Markdown
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-[500px] overflow-y-auto leading-relaxed">
            {selectedDoc.content}
          </div>
        </div>

      </div>

    </div>
  );
};
