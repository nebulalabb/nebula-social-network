import * as THREE from "three";
import type { FurnitureItemData } from "../ui/ItemInfoPanel";

export interface InteractionOptions {
  camera: THREE.Camera;
  scene: THREE.Scene;
  domElement: HTMLElement;
  onSelect: (item: FurnitureItemData) => void;
  onHoverChange?: (hovered: boolean) => void;
}

export function setupInteraction({
  camera,
  scene,
  domElement,
  onSelect,
  onHoverChange,
}: InteractionOptions): () => void {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let currentHover: THREE.Mesh | null = null;
  let originalEmissive: THREE.Color | null = null;

  function getInteractables(): THREE.Object3D[] {
    const result: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj.userData?.interactable) result.push(obj);
    });
    return result;
  }

  function setMouseFromEvent(e: MouseEvent) {
    const rect = domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function onMouseMove(e: MouseEvent) {
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(getInteractables(), true);

    // Restore previous hover
    if (currentHover) {
      const mat = currentHover.material as THREE.MeshToonMaterial;
      if (mat?.emissive && originalEmissive) {
        mat.emissive.copy(originalEmissive);
        mat.emissiveIntensity = 0;
      }
      currentHover = null;
      originalEmissive = null;
      onHoverChange?.(false);
      domElement.style.cursor = "default";
    }

    if (hits.length > 0) {
      // Walk up to find the interactable ancestor
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && !obj.userData?.interactable) obj = obj.parent;
      if (!obj) return;

      const mesh = obj as THREE.Mesh;
      const mat = mesh.material as THREE.MeshToonMaterial;
      if (mat?.emissive) {
        originalEmissive = mat.emissive.clone();
        mat.emissive.set(0x553366);
        mat.emissiveIntensity = 0.6;
      }
      currentHover = mesh;
      onHoverChange?.(true);
      domElement.style.cursor = "pointer";
    }
  }

  function onClick(e: MouseEvent) {
    setMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(getInteractables(), true);
    if (hits.length === 0) return;

    let obj: THREE.Object3D | null = hits[0].object;
    while (obj && !obj.userData?.interactable) obj = obj.parent;
    if (!obj?.userData?.itemData) return;

    // Click pulse scale
    const mesh = obj as THREE.Mesh;
    const origScale = mesh.scale.clone();
    mesh.scale.multiplyScalar(1.12);
    setTimeout(() => mesh.scale.copy(origScale), 120);

    onSelect(obj.userData.itemData as FurnitureItemData);
  }

  domElement.addEventListener("mousemove", onMouseMove);
  domElement.addEventListener("click", onClick);

  return () => {
    domElement.removeEventListener("mousemove", onMouseMove);
    domElement.removeEventListener("click", onClick);
    domElement.style.cursor = "default";
  };
}
