const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md border-2 border-gray-100">
      <div className="h-80 bg-gray-200 skeleton"></div>
      <div className="p-8">
        <div className="h-8 bg-gray-200 skeleton mb-4 w-3/4"></div>
        <div className="h-4 bg-gray-200 skeleton mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-200 skeleton w-2/3"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
