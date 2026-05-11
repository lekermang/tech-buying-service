import PhotosManager from "./catalog/PhotosManager";

export default function CatalogTab({ token }: { token: string }) {
  return (
    <div className="px-4 py-4">
      <PhotosManager token={token} />
    </div>
  );
}