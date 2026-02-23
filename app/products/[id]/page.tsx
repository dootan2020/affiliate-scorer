interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Chi Tiết Sản Phẩm
        </h1>
        <p className="text-muted-foreground">ID: {id}</p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Score breakdown và khuyến nghị sẽ hiển thị ở đây.
      </div>
    </div>
  );
}
