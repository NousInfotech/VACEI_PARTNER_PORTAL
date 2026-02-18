import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Position,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "../../../../ui/Button";
import { ShadowCard } from "../../../../ui/ShadowCard";
import type { Company } from "../../../../types/company";

const LEVEL_GAP_Y = 400;
const NODE_WIDTH = 350;
const PARENT_NODE_WIDTH = 1400;
const NODE_GAP = 130;
const NODES_PER_ROW = 3;
const HEADER_WIDTH = 400;

export interface ShareDataItem {
  totalShares: number;
  class: string;
}

export interface HierarchyTreeNode {
  id: string;
  type?: string;
  name: string;
  percentage?: number;
  sharePercentage?: number;
  address?: string;
  nationality?: string;
  totalShares?: number | ShareDataItem[];
  sharesData?: ShareDataItem[];
  roles?: string[];
  children?: HierarchyTreeNode[];
  shareholders?: HierarchyTreeNode[];
}

interface HierarchyNodeData {
  label: ReactNode;
}

interface HierarchyTabProps {
  company: Company;
}

const HierarchyTab: React.FC<HierarchyTabProps> = ({ company }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<HierarchyNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const flowWrapperRef = useRef<HTMLDivElement | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance | null>(null);
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);

  // Transform portal company data into hierarchy tree structure
  const rootData = useMemo((): HierarchyTreeNode => {
    const shareholders: HierarchyTreeNode[] = (company.involvements || [])
      .map(inv => {
        const totalShares = (inv.classA || 0) + (inv.classB || 0) + (inv.classC || 0) + (inv.ordinary || 0);
        const sharesData: ShareDataItem[] = [
          { class: 'A', totalShares: inv.classA || 0 },
          { class: 'B', totalShares: inv.classB || 0 },
          { class: 'C', totalShares: inv.classC || 0 },
          { class: 'Ordinary', totalShares: inv.ordinary || 0 },
        ].filter(s => s.totalShares > 0);

        const name = inv.partyType === 'COMPANY' ? inv.holderCompany?.name : inv.person?.name;
        const address = inv.partyType === 'COMPANY' ? inv.holderCompany?.address : inv.person?.address;
        const nationality = inv.partyType === 'PERSON' ? inv.person?.nationality : undefined;

        return {
          id: inv.id,
          type: inv.partyType === 'COMPANY' ? 'company' : 'person',
          name: name || "Unnamed",
          address: address || "",
          nationality: nationality || "",
          percentage: company.issuedShares > 0 ? (totalShares / company.issuedShares) * 100 : 0,
          sharesData,
          roles: (inv.role || []).map(r => r.replace(/_/g, ' ')),
        };
      });

    return {
      id: company.id,
      type: 'company',
      name: company.name,
      address: company.address || "",
      totalShares: (company.shareClasses || []).map(sc => ({
        class: sc.class.replace('CLASS_', ''),
        totalShares: sc.issued
      })),
      children: shareholders,
    };
  }, [company]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!rootData) return { initialNodes: [], initialEdges: [], bounds: { width: 0, height: 0 } };

    const nodeMap = new Map<string, Node<HierarchyNodeData>>();
    const generatedEdges: Edge[] = [];

    const getShareClassPriority = (node: HierarchyTreeNode): number => {
      const shareItems: ShareDataItem[] = node.sharesData || (Array.isArray(node.totalShares) ? node.totalShares : []);
      let hasA = false, hasB = false, hasC = false;
      shareItems.forEach(sd => {
        if (sd.totalShares <= 0) return;
        if (sd.class === "A") hasA = true;
        else if (sd.class === "B") hasB = true;
        else if (sd.class === "C") hasC = true;
      });
      if (hasA) return 0;
      if (hasB) return 1;
      if (hasC) return 2;
      return 3;
    };

    const restructureHierarchy = (root: HierarchyTreeNode) => {
      const allDescendants = root.children || root.shareholders || [];
      const shareholders: HierarchyTreeNode[] = [];
      const onlyRepresentatives: HierarchyTreeNode[] = [];

      allDescendants.forEach(descendant => {
        const hasShares = (descendant.percentage || 0) > 0 || (descendant.sharesData?.some(sd => sd.totalShares > 0)) || (Array.isArray(descendant.totalShares) && descendant.totalShares.some(sd => sd.totalShares > 0));
        const hasRepRole = descendant.roles?.some(role => role.toLowerCase().includes('representative') || role.toLowerCase().includes('director') || role.toLowerCase().includes('secretary'));
        if (hasShares) shareholders.push(descendant);
        else if (hasRepRole) onlyRepresentatives.push(descendant);
      });

      shareholders.sort((a, b) => {
        const prioA = getShareClassPriority(a), prioB = getShareClassPriority(b);
        if (prioA !== prioB) return prioA - prioB;
        return (b.percentage || 0) - (a.percentage || 0);
      });

      return { root, shareholders, onlyRepresentatives };
    };

    const baseNodeStyle = { background: "transparent", border: "none", padding: 0, borderRadius: 0, width: NODE_WIDTH, boxShadow: "none" };

    const createLabelContent = (node: HierarchyTreeNode, isRoot: boolean = false) => {
      let displayRoles = node.roles ? [...node.roles] : [];
      if (!isRoot) {
        const isShareholder = (node.percentage || 0) > 0 || node.sharesData?.some(sd => sd.totalShares > 0);
        if (isShareholder && !displayRoles.some(r => r.toLowerCase() === 'shareholder')) displayRoles.unshift('Shareholder');
      }
      const finalRoles = displayRoles.length === 0 ? undefined : displayRoles;
      const nodeWidth = isRoot ? PARENT_NODE_WIDTH : NODE_WIDTH;
      const nameFontSize = isRoot ? 50 : 16;
      const paddingSize = isRoot ? "5px" : "6px";
      const addressFontSize = isRoot ? 30 : 11;

      return (
        <div style={{ width: nodeWidth, fontFamily: "Inter, sans-serif", borderRadius: 8, overflow: "hidden", border: "1px solid black", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ backgroundColor: "#f3f4f6", padding: paddingSize, color: "#111827" }}>
            <div style={{ fontWeight: 500, fontSize: nameFontSize, marginBottom: 5, textTransform: "uppercase", color: "#1f2937" }}>{node.name}</div>
            {node.address && <div style={{ fontSize: addressFontSize, color: "black", marginBottom: 6, lineHeight: 1.4 }}><span style={{ fontWeight: 600 }}>Address: </span> {node.address}</div>}
            {node.nationality && <div style={{ fontSize: isRoot ? 13 : 11, color: "black", marginTop: 4 }}><span style={{ fontWeight: 600 }}>Nationality: </span> {node.nationality}</div>}
          </div>
          {finalRoles && (
            <div style={{ backgroundColor: "black", padding: isRoot ? "12px 16px" : "10px 12px", color: "white" }}>
              <div style={{ fontSize: isRoot ? 13 : 11, fontWeight: 500, lineHeight: 1.4 }}>{finalRoles.join(" / ")}</div>
            </div>
          )}
          <div style={{ backgroundColor: "#f3f4f6", padding: paddingSize, color: "#111827" }}>
            {((node.sharePercentage || node.percentage || 0) > 0) && <div style={{ fontSize: isRoot ? 28 : 24, fontWeight: 700, color: "#1f2937", marginBottom: 6 }}>{(node.sharePercentage || node.percentage || 0).toFixed(2)}%</div>}
            {(() => {
              const sharesToDisplay = (Array.isArray(node.totalShares) ? node.totalShares : node.sharesData) || [];
              if (sharesToDisplay.length > 0) {
                return (
                  <div style={{ marginBottom: 4, display: "flex", flexDirection: "row", flexWrap: "wrap", placeItems: "center", placeContent: "center", gap: isRoot ? "12px" : "8px" }}>
                    {sharesToDisplay.map((sd, i) => (
                      <div key={i} style={{ fontSize: isRoot ? 30 : 11, color: "black" }}><span style={{ fontWeight: 600 }}>{sd.class === "Ordinary" ? "Ordinary" : `Class ${sd.class}`}: </span>{sd.totalShares.toLocaleString()}</div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
            <div style={{ marginTop: 8, fontSize: isRoot ? 13 : 11, color: "black", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: isRoot ? 10 : 8, height: isRoot ? 10 : 8, borderRadius: "50%", background: node.type === "company" ? "#3b82f6" : "#10b981", flexShrink: 0 }} />
              <span style={{ fontWeight: 500 }}>{node.type === "company" ? "Company" : "Person"}</span>
            </div>
          </div>
        </div>
      );
    };

    const createGroupHeader = (title: string, width: number = NODE_WIDTH) => (
      <div style={{ width: width, fontFamily: "Inter, sans-serif", borderRadius: 8, overflow: "hidden", border: "2px solid #111827", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", backgroundColor: "#f9fafb", padding: "16px", textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#111827", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
      </div>
    );

    const { shareholders, onlyRepresentatives } = restructureHierarchy(rootData);
    const maxNodesInRow = Math.max(shareholders.length, onlyRepresentatives.length, 1);
    const totalWidth = (maxNodesInRow * NODE_WIDTH) + ((maxNodesInRow - 1) * NODE_GAP) + 200;

    const rootId = String(rootData.id);
    nodeMap.set(rootId, { id: rootId, data: { label: createLabelContent(rootData, true) }, position: { x: (totalWidth - PARENT_NODE_WIDTH) / 2, y: 0 }, draggable: false, style: { ...baseNodeStyle, width: PARENT_NODE_WIDTH }, sourcePosition: Position.Bottom, targetPosition: Position.Top });

    if (shareholders.length > 0) {
      const sHeaderId = "shareholders-header";
      nodeMap.set(sHeaderId, { id: sHeaderId, data: { label: createGroupHeader("Shareholders/representatives", HEADER_WIDTH) }, position: { x: (totalWidth - HEADER_WIDTH) / 2, y: LEVEL_GAP_Y }, draggable: false, style: { ...baseNodeStyle, width: HEADER_WIDTH }, sourcePosition: Position.Bottom, targetPosition: Position.Top });
      generatedEdges.push({ id: `${rootId}-${sHeaderId}`, source: rootId, target: sHeaderId, type: "smoothstep", style: { stroke: "#111827", strokeWidth: 1.2 } });

      shareholders.forEach((sh, i) => {
        const rowIndex = Math.floor(i / NODES_PER_ROW), colIndex = i % NODES_PER_ROW;
        const nodesInRow = Math.min(NODES_PER_ROW, shareholders.length - rowIndex * NODES_PER_ROW);
        const xPos = ((totalWidth - ((nodesInRow * NODE_WIDTH) + ((nodesInRow - 1) * NODE_GAP))) / 2) + (colIndex * (NODE_WIDTH + NODE_GAP));
        const yPos = (LEVEL_GAP_Y * 2) + (rowIndex * LEVEL_GAP_Y);
        nodeMap.set(sh.id, { id: sh.id, data: { label: createLabelContent(sh) }, position: { x: xPos, y: yPos }, draggable: false, style: baseNodeStyle, sourcePosition: Position.Bottom, targetPosition: Position.Top });
        generatedEdges.push({ id: `${sHeaderId}-${sh.id}`, source: sHeaderId, target: sh.id, type: "smoothstep", style: { stroke: "#111827", strokeWidth: 1.2 } });
      });
    }

    const maxShY = shareholders.length > 0 ? (LEVEL_GAP_Y * 2) + (Math.floor((shareholders.length - 1) / NODES_PER_ROW) * LEVEL_GAP_Y) : LEVEL_GAP_Y;

    if (onlyRepresentatives.length > 0) {
      const rHeaderId = "representatives-header";
      const rHeaderY = maxShY + LEVEL_GAP_Y;
      nodeMap.set(rHeaderId, { id: rHeaderId, data: { label: createGroupHeader("Representatives", HEADER_WIDTH) }, position: { x: (totalWidth - HEADER_WIDTH) / 2, y: rHeaderY }, draggable: false, style: { ...baseNodeStyle, width: HEADER_WIDTH }, sourcePosition: Position.Bottom, targetPosition: Position.Top });
      const sourceId = shareholders.length > 0 ? "shareholders-header" : rootId;
      generatedEdges.push({ id: `${sourceId}-${rHeaderId}`, source: sourceId, target: rHeaderId, type: "smoothstep", style: { stroke: "#111827", strokeWidth: 1.2 } });

      onlyRepresentatives.forEach((rep, i) => {
        const rowIndex = Math.floor(i / NODES_PER_ROW), colIndex = i % NODES_PER_ROW;
        const nodesInRow = Math.min(NODES_PER_ROW, onlyRepresentatives.length - rowIndex * NODES_PER_ROW);
        const xPos = ((totalWidth - ((nodesInRow * NODE_WIDTH) + ((nodesInRow - 1) * NODE_GAP))) / 2) + (colIndex * (NODE_WIDTH + NODE_GAP));
        const yPos = rHeaderY + LEVEL_GAP_Y + (rowIndex * (LEVEL_GAP_Y * 0.9));
        nodeMap.set(rep.id, { id: rep.id, data: { label: createLabelContent(rep) }, position: { x: xPos, y: yPos }, draggable: false, style: baseNodeStyle, sourcePosition: Position.Bottom, targetPosition: Position.Top });
        generatedEdges.push({ id: `${rHeaderId}-${rep.id}`, source: rHeaderId, target: rep.id, type: "smoothstep", style: { stroke: "#111827", strokeWidth: 1.2 } });
      });
    }

    const maxY = (onlyRepresentatives.length > 0 ? (maxShY + LEVEL_GAP_Y + LEVEL_GAP_Y + (Math.floor((onlyRepresentatives.length - 1) / NODES_PER_ROW) * LEVEL_GAP_Y)) : maxShY) + 400;

    return { initialNodes: Array.from(nodeMap.values()), initialEdges: generatedEdges, bounds: { width: totalWidth + 400, height: maxY + 400 } };
  }, [rootData]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => { reactFlowRef.current?.fitView({ padding: 0.1, minZoom: 0.1, maxZoom: 1 }); }, 100);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const exportToPDF = useCallback(async () => {
    const wrap = flowWrapperRef.current, rfInstance = reactFlowRef.current;
    if (!wrap || !rfInstance) return;
    const viewport = wrap.querySelector<HTMLElement>(".react-flow__viewport");
    if (!viewport) return;

    const originalTransform = viewport.style.transform, originalWidth = wrap.style.width, originalHeight = wrap.style.height, originalOverflow = wrap.style.overflow, originalViewport = rfInstance.getViewport();

    try {
      const allNodes = rfInstance.getNodes();
      if (allNodes.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      allNodes.forEach(node => {
        const pos = node.position, isRoot = node.id === String(rootData.id);
        const width = node.width || (isRoot ? PARENT_NODE_WIDTH : NODE_WIDTH), height = node.height || 250;
        minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y); maxX = Math.max(maxX, pos.x + width); maxY = Math.max(maxY, pos.y + height);
      });

      const pL = 150, pR = 250, pT = 100, pB = 120;
      const dW = maxX - minX + pL + pR, dH = maxY - minY + pT + pB;
      wrap.style.width = `${dW}px`; wrap.style.height = `${dH}px`; wrap.style.overflow = "visible";
      viewport.style.transform = `translate(${pL - minX}px, ${pT - minY}px) scale(1)`;

      await new Promise(r => setTimeout(r, 500));
      const canvas = await html2canvas(wrap, { backgroundColor: "#ffffff", scale: 2, useCORS: true, logging: false, width: dW, height: dH, windowWidth: dW, windowHeight: dH, x: 0, y: 0, scrollX: 0, scrollY: 0 });
      const img = canvas.toDataURL("image/png", 1.0);
      const isLandscape = dW > dH;
      const pdf = new jsPDF({ orientation: isLandscape ? "landscape" : "portrait", unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth(), pageH = pdf.internal.pageSize.getHeight(), m = 20, imgW = pageW - (m * 2), imgH = (canvas.height * imgW) / canvas.width;

      let top = 0;
      while (top < imgH) {
        if (top > 0) pdf.addPage();
        pdf.addImage(img, "PNG", m, m - top, imgW, imgH, undefined, "FAST");
        top += pageH - (m * 2);
      }
      pdf.save(`${rootData.name}-hierarchy.pdf`);
    } finally {
      wrap.style.width = originalWidth; wrap.style.height = originalHeight; wrap.style.overflow = originalOverflow;
      viewport.style.transform = originalTransform; rfInstance.setViewport(originalViewport, { duration: 0 });
    }
  }, [rootData]);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", style: { stroke: "#111827", strokeWidth: 1.2 } }, eds)), [setEdges]);

  return (
    <ShadowCard className="p-8 border-none bg-white rounded-[40px] animate-in fade-in duration-500 overflow-hidden relative group">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="h-8 w-1 bg-primary rounded-full" />
            <div>
              <h4 className="text-lg font-bold text-gray-900 leading-tight">Entity Hierarchy</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">Visualization of ownership & control.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => reactFlowRef.current?.fitView()} className="rounded-xl border-gray-200">
            Reset View
          </Button>
          <Button onClick={exportToPDF} className="rounded-xl bg-gray-900 text-white hover:bg-black font-bold uppercase tracking-widest text-[10px]">
             Download PDF
          </Button>
        </div>
      </div>

      <div className="mb-4 text-xs text-gray-400 font-medium italic">Click inside diagram to zoom. Use scroll wheel to zoom when focused.</div>

      <div 
        className="h-[800px] w-full bg-gray-50/30 rounded-3xl border border-gray-100 overflow-hidden" 
        ref={flowWrapperRef}
        tabIndex={0}
        onFocus={() => setScrollZoomEnabled(true)}
        onBlur={() => setScrollZoomEnabled(false)}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView={false}
          minZoom={0.1}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnScroll={scrollZoomEnabled}
          panOnDrag={true}
          onInit={(instance) => { reactFlowRef.current = instance; }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#f3f4f6" gap={16} />
          <MiniMap nodeStrokeColor={() => "#111827"} nodeColor={() => "#fff"} pannable zoomable />
          <Controls showInteractive={false} className="bg-white border-gray-100 rounded-2xl shadow-2xl overflow-hidden" />
        </ReactFlow>
      </div>

      <div className="mt-8 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Corporate Entity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Individual Member</span>
        </div>
      </div>
    </ShadowCard>
  );
};

export default HierarchyTab;
