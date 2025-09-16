import { NodeIO } from "@gltf-transform/core";
import { dedup, draco, prune, quantize } from "@gltf-transform/functions";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { GLTFExporter } from "three-stdlib";
import { pb, useConfiguratorStore } from "../store";
import { Asset } from "./Asset";

const MODEL_EXTENSIONS = [".glb", ".gltf", ".fbx"];

const isModelFile = (value) =>
  typeof value === "string" &&
  MODEL_EXTENSIONS.some((extension) => value.toLowerCase().endsWith(extension));

const resolveFileField = (value) => {
  if (!value) {
    return null;
  }

  if (isModelFile(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveFileField(entry);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    for (const key of ["url", "file", "path", "src"]) {
      if (key in value) {
        const resolved = resolveFileField(value[key]);
        if (resolved) {
          return resolved;
        }
      }
    }
  }

  return null;
};

const getAssetFileName = (asset) => {
  if (!asset || typeof asset !== "object") {
    return null;
  }

  for (const key of ["url", "file", "source", "model", "path", "src"]) {
    if (key in asset) {
      const resolved = resolveFileField(asset[key]);
      if (resolved) {
        return resolved;
      }
    }
  }

  for (const value of Object.values(asset)) {
    const resolved = resolveFileField(value);
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

const getAssetUrl = (asset) => {
  const fileName = getAssetFileName(asset);
  if (!fileName) {
    return null;
  }

  try {
    return pb.files.getUrl(asset, fileName);
  } catch (error) {
    console.warn("Unable to resolve asset URL", { asset, fileName, error });
    return null;
  }
};

export const Avatar = ({ ...props }) => {
  const group = useRef();
  const { nodes } = useGLTF("/models/Armature.glb");
  const { animations } = useGLTF("/models/Poses.glb");
  const customization = useConfiguratorStore((state) => state.customization);
  const { actions } = useAnimations(animations, group);
  const setDownload = useConfiguratorStore((state) => state.setDownload);

  const pose = useConfiguratorStore((state) => state.pose);

  useEffect(() => {
    function download() {
      const exporter = new GLTFExporter();
      exporter.parse(
        group.current,
        async function (result) {
          const io = new NodeIO();

          // Read.
          const document = await io.readBinary(new Uint8Array(result)); // Uint8Array → Document
          await document.transform(
            // Remove unused nodes, textures, or other data.
            prune(),
            // Remove duplicate vertex or texture data, if any.
            dedup(),
            // Compress mesh geometry with Draco.
            draco(),
            // Quantize mesh geometry.
            quantize()
          );

          // Write.
          const glb = await io.writeBinary(document); // Document → Uint8Array

          save(
            new Blob([glb], { type: "application/octet-stream" }),
            `avatar_${+new Date()}.glb`
          );
        },
        function (error) {
          console.error(error);
        },
        { binary: true }
      );
    }

    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link); // Firefox workaround, see #6594

    function save(blob, filename) {
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    }
    setDownload(download);
  }, []);

  useEffect(() => {
    actions[pose]?.fadeIn(0.2).play();
    return () => actions[pose]?.fadeOut(0.2).stop();
  }, [actions, pose]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Scene">
        <group name="Armature" rotation={[Math.PI / 2, 0, 0]} scale={0.01}>
          <primitive object={nodes.mixamorigHips} />
          {Object.entries(customization).map(([categoryName, entry]) => {
            const assetUrl = getAssetUrl(entry?.asset);

            if (!assetUrl) {
              return null;
            }

            return (
              <Suspense key={entry?.asset?.id ?? categoryName}>
                <Asset
                  categoryName={categoryName}
                  url={assetUrl}
                  skeleton={nodes.Plane.skeleton}
                />
              </Suspense>
            );
          })}
        </group>
      </group>
    </group>
  );
};
