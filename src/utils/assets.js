import { pb } from "../store";

const MODEL_EXTENSIONS = [".glb", ".gltf", ".fbx"];
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"];

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
  "modelPath",
  "model_path",
  "modelUrl",
  "model_url",
  "asset",
  "assetFile",
  "asset_file",
  "assetPath",
  "asset_path",
  "assetUrl",
  "asset_url",
  "source",
  "path",
  "src",
  "downloadUrl",
  "download_url",
];

const IMAGE_FIELD_KEYS = [
  "thumbnail",
  "thumbnailUrl",
  "thumbnail_url",
  "thumbnailFile",
  "thumbnail_file",
  "thumbnailPath",
  "thumbnail_path",
  "thumb",
  "thumbUrl",
  "thumb_url",
  "thumbFile",
  "thumb_file",
  "image",
  "imageUrl",
  "image_url",
  "imageFile",
  "image_file",
  "imagePath",
  "image_path",
  "icon",
  "iconUrl",
  "icon_url",
  "iconFile",
  "icon_file",
  "cover",
  "coverUrl",
  "cover_url",
  "preview",
  "previewUrl",
  "preview_url",
  "art",
  "artUrl",
  "art_url",
];

const ICON_ACTIVE_CANDIDATES = [
  ["icons", "active"],
  "iconActive",
  "activeIcon",
  "icon_active",
  "active_icon",
  "iconActiveClass",
  "activeIconClass",
];

const ICON_INACTIVE_CANDIDATES = [
  ["icons", "inactive"],
  "iconInactive",
  "inactiveIcon",
  "icon_inactive",
  "inactive_icon",
  "iconInactiveClass",
  "inactiveIconClass",
];

const LABEL_ACTIVE_CANDIDATES = [
  ["labels", "active"],
  "labelActive",
  "activeLabel",
  "label_active",
  "active_label",
];

const LABEL_INACTIVE_CANDIDATES = [
  ["labels", "inactive"],
  "labelInactive",
  "inactiveLabel",
  "label_inactive",
  "inactive_label",
];

const LOCKED_FLAG_FIELDS = [
  "locked",
  "isLocked",
  "pinned",
  "isPinned",
  "bundled",
  "isBundled",
];

const DEFAULT_ACTIVE_ICON = "bi-check2-circle";
const DEFAULT_INACTIVE_ICON = "bi-plus-circle";
const DEFAULT_LOCKED_ICON = "bi-pin-angle-fill";

const DEFAULT_ACTIVE_LABEL = "Equipped";
const DEFAULT_INACTIVE_LABEL = "Tap to equip";
const DEFAULT_LOCKED_LABEL = "Bundled";

const hasPocketBaseMetadata = (asset) =>
  asset &&
  typeof asset === "object" &&
  ("collectionId" in asset || "collectionName" in asset);

const getValueAtPath = (source, path) => {
  if (!source) {
    return undefined;
  }
  if (typeof path === "string") {
    return source[path];
  }
  let current = source;
  for (const segment of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[segment];
  }
  return current;
};

const pickFirstString = (source, candidates) => {
  for (const candidate of candidates) {
    const value = getValueAtPath(source, candidate);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
};

const isAssetLocked = (asset) =>
  LOCKED_FLAG_FIELDS.some((field) => Boolean(getValueAtPath(asset, field)));

const createFileReference = (value, extensions) => {
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

  const extension = extensions.find((candidate) => lower.endsWith(candidate));

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

const resolveFileReference = (
  value,
  contextRecord,
  visited,
  extensions,
  fieldKeys
) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const reference = createFileReference(value, extensions);
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
      const resolved = resolveFileReference(
        entry,
        contextRecord,
        visited,
        extensions,
        fieldKeys
      );
      if (resolved) {
        return resolved;
      }
    }
    return null;
  }

  const nextContext = hasPocketBaseMetadata(value) ? value : contextRecord;

  for (const key of fieldKeys) {
    if (key in value) {
      const resolved = resolveFileReference(
        value[key],
        nextContext,
        visited,
        extensions,
        fieldKeys
      );
      if (resolved) {
        return resolved;
      }
    }
  }

  for (const [key, entry] of Object.entries(value)) {
    if (fieldKeys.includes(key)) {
      continue;
    }

    const resolved = resolveFileReference(
      entry,
      nextContext,
      visited,
      extensions,
      fieldKeys
    );
    if (resolved) {
      return resolved;
    }
  }

  return null;
};

const getFileUrlFromRecord = (record, value, extensions, fieldKeys) => {
  const resolved = resolveFileReference(value, record, new WeakSet(), extensions, fieldKeys);
  if (!resolved) {
    return null;
  }

  const { reference, record: resolvedRecord } = resolved;

  if (reference.type === "url") {
    return reference.value;
  }

  const recordWithMetadata =
    resolvedRecord ?? (hasPocketBaseMetadata(record) ? record : null);

  if (recordWithMetadata) {
    try {
      return pb.files.getUrl(recordWithMetadata, reference.fileName);
    } catch (error) {
      console.warn("Unable to resolve asset URL from PocketBase", {
        record,
        reference,
        error,
      });
    }
  }

  return reference.value || null;
};

export const getModelUrl = (asset) =>
  getFileUrlFromRecord(asset, asset, MODEL_EXTENSIONS, MODEL_FIELD_KEYS);

export const getThumbnailUrl = (asset) => {
  const prioritizedSources = [
    asset?.thumbnail,
    asset?.thumb,
    asset?.image,
    asset?.icons?.inactive,
    asset?.icons?.active,
  ];

  for (const source of prioritizedSources) {
    const url = getFileUrlFromRecord(
      asset,
      source ?? asset,
      IMAGE_EXTENSIONS,
      IMAGE_FIELD_KEYS
    );
    if (url) {
      return url;
    }
  }

  return getFileUrlFromRecord(
    asset,
    asset,
    IMAGE_EXTENSIONS,
    IMAGE_FIELD_KEYS
  );
};

export const getAssetIcon = (asset, { active } = {}) => {
  const icon = pickFirstString(
    asset,
    active ? ICON_ACTIVE_CANDIDATES : ICON_INACTIVE_CANDIDATES
  );

  if (icon) {
    return icon;
  }

  if (isAssetLocked(asset)) {
    return DEFAULT_LOCKED_ICON;
  }

  return active ? DEFAULT_ACTIVE_ICON : DEFAULT_INACTIVE_ICON;
};

export const getAssetLabel = (asset, { active } = {}) => {
  const label = pickFirstString(
    asset,
    active ? LABEL_ACTIVE_CANDIDATES : LABEL_INACTIVE_CANDIDATES
  );

  if (label) {
    return label;
  }

  if (isAssetLocked(asset)) {
    return DEFAULT_LOCKED_LABEL;
  }

  return active ? DEFAULT_ACTIVE_LABEL : DEFAULT_INACTIVE_LABEL;
};

export { isAssetLocked };
