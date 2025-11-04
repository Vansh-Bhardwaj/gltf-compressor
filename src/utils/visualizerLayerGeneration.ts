import { Document, Mesh, Node, Scene } from "@gltf-transform/core";

import { VisualizerStep, VisualizerStepMetadata } from "@/types/types";

interface LayerStepGroup {
  nodes: Node[];
}

export interface LayerVisualizerData {
  steps: VisualizerStep[];
  metadataByStep: Map<string, VisualizerStepMetadata>;
  nodeStepMap: Map<Node, string>;
  meshStepMap: Map<Mesh, string>;
}

const formatNodeName = (node: Node, fallbackIndex: number): string => {
  const name = node.getName()?.trim();
  if (name && name.length > 0) {
    return name;
  }

  const meshName = node.getMesh()?.getName()?.trim();
  if (meshName && meshName.length > 0) {
    return meshName;
  }

  return `Layer ${fallbackIndex}`;
};

const collectMeshNodes = (
  node: Node,
  target: Node[],
  allMeshNodes: Node[],
  seenNodes: Set<Node>
): void => {
  if (node.getMesh()) {
    target.push(node);
    if (!seenNodes.has(node)) {
      seenNodes.add(node);
      allMeshNodes.push(node);
    }
  }

  node.listChildren().forEach((child) => {
    collectMeshNodes(child, target, allMeshNodes, seenNodes);
  });
};

const getDefaultScene = (document: Document): Scene | null => {
  const root = document.getRoot();
  const defaultScene = root.getDefaultScene();
  if (defaultScene) {
    return defaultScene;
  }

  const [firstScene] = root.listScenes();
  return firstScene ?? null;
};

const buildStepFromNodes = (
  nodes: Node[],
  stepIndex: number,
  steps: VisualizerStep[],
  metadataByStep: Map<string, VisualizerStepMetadata>,
  nodeStepMap: Map<Node, string>,
  meshStepMap: Map<Mesh, string>
): void => {
  if (nodes.length === 0) {
    return;
  }

  const stepId = `step-${steps.length}`;
  const titleNode = nodes.find((node) => node.getName()?.trim()) ?? nodes[0];
  const title = formatNodeName(titleNode, stepIndex + 1);

  const meshIds = nodes.map((node, index) => {
    const name = node.getName()?.trim();
    if (name && name.length > 0) {
      return name;
    }

    return `layer-${stepIndex + 1}-${index + 1}`;
  });

  const meshCount = nodes.reduce((acc, node) => {
    const mesh = node.getMesh();
    if (!mesh) {
      return acc;
    }

    return acc + mesh.listPrimitives().length;
  }, 0);

  metadataByStep.set(stepId, {
    nodeNames: nodes.map((node, index) => formatNodeName(node, index + 1)),
    meshCount,
    primitiveCount: meshCount,
  });

  steps.push({
    id: stepId,
    title,
    meshIds,
  });

  nodes.forEach((node) => {
    nodeStepMap.set(node, stepId);
    const mesh = node.getMesh();
    if (mesh) {
      meshStepMap.set(mesh, stepId);
    }
  });
};

export const generateLayerVisualizerData = (
  document: Document
): LayerVisualizerData => {
  const steps: VisualizerStep[] = [];
  const metadataByStep = new Map<string, VisualizerStepMetadata>();
  const nodeStepMap = new Map<Node, string>();
  const meshStepMap = new Map<Mesh, string>();

  const scene = getDefaultScene(document);
  if (!scene) {
    return {
      steps,
      metadataByStep,
      nodeStepMap,
      meshStepMap,
    };
  }

  const seenNodes = new Set<Node>();
  const allMeshNodes: Node[] = [];
  const groupedSteps: LayerStepGroup[] = [];

  const hiddenStepId = "step-0";
  steps.push({
    id: hiddenStepId,
    title: "Start",
    description: "All layers hidden",
    meshIds: [],
  });
  metadataByStep.set(hiddenStepId, {
    nodeNames: [],
    meshCount: 0,
    primitiveCount: 0,
  });

  scene.listChildren().forEach((child) => {
    const nodes: Node[] = [];
    collectMeshNodes(child, nodes, allMeshNodes, seenNodes);
    if (nodes.length > 0) {
      groupedSteps.push({ nodes });
    }
  });

  if (groupedSteps.length === 0 && allMeshNodes.length === 0) {
    return {
      steps,
      metadataByStep,
      nodeStepMap,
      meshStepMap,
    };
  }

  const shouldFlatten = groupedSteps.length <= 1 && allMeshNodes.length > 1;

  if (shouldFlatten) {
    allMeshNodes.forEach((node, index) => {
      buildStepFromNodes([node], index, steps, metadataByStep, nodeStepMap, meshStepMap);
    });
  } else {
    groupedSteps.forEach((group, index) => {
      buildStepFromNodes(group.nodes, index, steps, metadataByStep, nodeStepMap, meshStepMap);
    });
  }

  return {
    steps,
    metadataByStep,
    nodeStepMap,
    meshStepMap,
  };
};
