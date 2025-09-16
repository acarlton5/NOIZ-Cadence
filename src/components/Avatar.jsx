import { NodeIO } from "@gltf-transform/core";
import { dedup, draco, prune, quantize } from "@gltf-transform/functions";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { GLTFExporter } from "three-stdlib";
import { pb, useConfiguratorStore } from "../store";
import { Asset } from "./Asset";

const MODEL_EXTENSIONS = [".glb", ".gltf", ".fbx"];

const MODEL_FIELD_KEYS = [
  "url",
  "uri",
  "href",
  "file",
  "fileName",
  "filename",
  "files",
  "model",
  "modelFile",
  "model_file",
  "modelUrl",
  "model_url",
  "asset",
  "assetFile",
  "asset_file",
  "assetUrl",
  "asset_url",
  "source",
  "path",
  "src",
  "downloadUrl",
  "download_url",
];

const createModelReference = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const [withoutFragment] = trimmed.split("#");
  const [withoutQuery] = withoutFragment.split("?");
  const lower = withoutQuery.toLowerCase();

  const extension = MODEL_EXTENSIONS.find((candidate) =>
    lower.endsWith(candidate)
  );

  if (!extension) {
    return null;
  }

  const segments = withoutQuery.split("/");
  const fileName = segments[segments.length - 1];
  if (!fileName) {
    return null;
  }

  const hasDirectorySeparator = trimmed.includes("/");
  const isAbsoluteUrl = /^https?:\/\//.test(trimmed);
  const isProtocolRelative = trimmed.startsWith("//");
  const isRelativeUrl = trimmed.startsWith("/") && !isProtocolRelative;

  if (isAbsoluteUrl || isRelativeUrl || hasDirectorySeparator) {
    return {
      type: "url",
      value: trimmed,
      fileName,
    };
  }

  return {
    type: "file",
    value: trimmed,
    fileName,
  };
};

const resolveModelReference = (value, contextRecord, visited) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const reference = createModelReference(value);
    if (!reference) {
      return null;
    }

    return {
      reference,
      record: hasPocketBaseMetadata(contextRecord) ? contextRecord : null,
    };
  }

  if (typeof value !== "object") {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = resolveModelReference(entry, contextRecord, visited);
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  const nextContext = hasPocketBaseMetadata(value) ? value : contextRecord;

  for (const key of MODEL_FIELD_KEYS) {
    if (key in value) {
      const resolved = resolveModelReference(value[key], nextContext, visited);
      if (resolved) {
        return resolved;
      }
    }
  }

  for (const [key, entry] of Object.entries(value)) {
    if (MODEL_FIELD_KEYS.includes(key)) {
      continue;
    }

    const resolved = resolveModelReference(entry, nextContext, visited);
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

const hasPocketBaseMetadata = (asset) =>
  asset &&
  typeof asset === "object" &&
  ("collectionId" in asset || "collectionName" in asset);

const getAssetUrl = (asset) => {
  const resolved = resolveModelReference(asset, asset, new WeakSet());
  if (!resolved) {
    return null;
  }

  const { reference, record } = resolved;

  if (reference.type === "url") {
    return reference.value;
  }

  const recordWithMetadata = record ?? (hasPocketBaseMetadata(asset) ? asset : null);

  if (recordWithMetadata) {
    try {
      return pb.files.getUrl(recordWithMetadata, reference.fileName);
    } catch (error) {
      console.warn("Unable to resolve asset URL from PocketBase", {
        asset,
        record: recordWithMetadata,
        reference,
        error,
      });
    }
  }

  return reference.value || null;
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
