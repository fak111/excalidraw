import React from "react";
import { sceneCoordsToViewportCoords } from "@excalidraw/common";
import { getElementAbsoluteCoords } from "@excalidraw/element";
import { getCommonBounds } from "@excalidraw/element";
import {
  isTextElement,
  isMagicFrameElement,
  isImageElement,
} from "@excalidraw/element";

import type {
  ElementsMap,
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/element/types";

import { useExcalidrawAppState, useApp } from "../components/App";
import { ElementCanvasButton } from "./MagicButton";
import { MagicIcon } from "./icons";
import { t } from "../i18n";

import "./ElementCanvasButtons.scss";

import type { AppState } from "../types";

const CONTAINER_PADDING = 5;
const BUTTON_SIZE = 32;
const BUTTON_GAP = 4;

const getContainerCoords = (
  elements: readonly NonDeletedExcalidrawElement[],
  appState: AppState,
  elementsMap: ElementsMap,
) => {
  if (elements.length === 1) {
    const element = elements[0];
    const [x1, y1] = getElementAbsoluteCoords(element, elementsMap);
    const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
      { sceneX: x1 + element.width, sceneY: y1 },
      appState,
    );
    const x = viewportX - appState.offsetLeft + 10;
    const y = viewportY - appState.offsetTop;
    return { x, y };
  } else {
    // Multiple elements selected
    const [x1, y1, x2, y2] = getCommonBounds(elements, elementsMap);
    const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
      { sceneX: x2, sceneY: y1 },
      appState,
    );
    const x = viewportX - appState.offsetLeft + 10;
    const y = viewportY - appState.offsetTop;
    return { x, y };
  }
};

const shouldShowAIButtons = (
  elements: readonly NonDeletedExcalidrawElement[],
): boolean => {
  if (elements.length === 0) {
    return false;
  }

  // Don't show if already a magic frame is selected
  if (elements.length === 1 && isMagicFrameElement(elements[0])) {
    return false;
  }

  // Show AI buttons if we have drawable elements (text, shapes, etc.)
  return elements.some(
    (element) =>
      isTextElement(element) ||
      element.type === "rectangle" ||
      element.type === "ellipse" ||
      element.type === "diamond" ||
      element.type === "arrow" ||
      element.type === "line" ||
      element.type === "freedraw" ||
      isImageElement(element),
  );
};

export const AISelectionButtons = ({
  selectedElements,
  elementsMap,
}: {
  selectedElements: readonly NonDeletedExcalidrawElement[];
  elementsMap: ElementsMap;
}) => {
  const appState = useExcalidrawAppState();
  const app = useApp();

  if (
    appState.contextMenu ||
    appState.newElement ||
    appState.resizingElement ||
    appState.isRotating ||
    appState.openMenu ||
    appState.viewModeEnabled ||
    appState.activeTool.type !== "selection" ||
    !shouldShowAIButtons(selectedElements)
  ) {
    return null;
  }

  const { x, y } = getContainerCoords(selectedElements, appState, elementsMap);

  const handleWireframeToCode = () => {
    app.onMagicframeToolSelect();
  };

  return (
    <div
      className="excalidraw-canvas-buttons"
      style={{
        top: `${y}px`,
        left: `${x}px`,
        padding: CONTAINER_PADDING,
        display: "flex",
        flexDirection: "column",
        gap: BUTTON_GAP,
      }}
    >
      <ElementCanvasButton
        title={t("toolBar.magicframe")}
        icon={MagicIcon}
        checked={false}
        onChange={handleWireframeToCode}
      />
      {/* 可以在这里添加更多 AI 功能按钮 */}
    </div>
  );
};