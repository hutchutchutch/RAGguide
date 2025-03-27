import { useRef, useEffect } from "react";
import { Node, Edge } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
}

// Helper function to get node color
function getNodeColor(type: string): string {
  switch (type) {
    case 'person':
      return '#3182CE'; // primary-500
    case 'place':
      return '#805AD5'; // secondary-500
    case 'object':
      return '#48BB78'; // green-500
    case 'concept':
      return '#F6AD55'; // orange-400
    default:
      return '#A0AEC0'; // neutral-400
  }
}

export default function GraphVisualization({ nodes, edges }: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  
  // Simple force-directed graph layout
  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;
    
    const svg = svgRef.current;
    const width = svg.clientWidth;
    const height = 250;
    
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    
    // Create node positions (simple circle layout for now)
    const nodePositions = new Map<string, { x: number, y: number }>();
    
    // Calculate positions in a circle
    const radius = Math.min(width, height) / 2.5;
    const centerX = width / 2;
    const centerY = height / 2;
    
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodePositions.set(node.id, { x, y });
    });
    
    // Draw edges first (so they're behind nodes)
    edges.forEach(edge => {
      const sourcePos = nodePositions.get(edge.source_node_id);
      const targetPos = nodePositions.get(edge.target_node_id);
      
      if (sourcePos && targetPos) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', sourcePos.x.toString());
        line.setAttribute('y1', sourcePos.y.toString());
        line.setAttribute('x2', targetPos.x.toString());
        line.setAttribute('y2', targetPos.y.toString());
        line.setAttribute('class', 'graph-edge');
        line.setAttribute('stroke', '#CBD5E0');
        line.setAttribute('stroke-width', '1.5');
        
        // Add hover effect
        line.addEventListener('mouseenter', () => {
          line.setAttribute('stroke-width', '2.5');
          
          // Show edge label on hover
          const sourceNode = nodes.find(n => n.id === edge.source_node_id);
          const targetNode = nodes.find(n => n.id === edge.target_node_id);
          if (sourceNode && targetNode) {
            toast({
              title: `${sourceNode.label} ${edge.label} ${targetNode.label}`,
              description: edge.explanation || "",
              duration: 3000,
            });
          }
        });
        
        line.addEventListener('mouseleave', () => {
          line.setAttribute('stroke-width', '1.5');
        });
        
        svg.appendChild(line);
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      const pos = nodePositions.get(node.id);
      
      if (pos) {
        // Create node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x.toString());
        circle.setAttribute('cy', pos.y.toString());
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', getNodeColor(node.type));
        circle.setAttribute('class', 'graph-node');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('stroke', '#ffffff');
        
        // Add hover effect
        circle.addEventListener('mouseenter', () => {
          circle.setAttribute('stroke-width', '3');
          
          // Show node details on hover
          toast({
            title: node.label,
            description: node.description || `Type: ${node.type}`,
            duration: 3000,
          });
        });
        
        circle.addEventListener('mouseleave', () => {
          circle.setAttribute('stroke-width', '2');
        });
        
        svg.appendChild(circle);
        
        // Add text label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pos.x.toString());
        text.setAttribute('y', pos.y.toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '10');
        text.textContent = node.label.length > 10 ? node.label.substring(0, 10) + '...' : node.label;
        
        svg.appendChild(text);
      }
    });
    
  }, [nodes, edges, toast]);
  
  return (
    <svg 
      ref={svgRef} 
      width="100%" 
      height="250"
      className="overflow-visible"
    />
  );
}
